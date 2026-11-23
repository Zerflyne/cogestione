<script>
  import Intestazione from '../componenti/Intestazione.svelte';
  import Collegamento from '../componenti/Collegamento.svelte';
  import Schizzo from '../componenti/Schizzo.svelte';
  import { supabase } from '../lib/supabase.js';
  import { app, caricaImpostazioni } from '../lib/stato.svelte.js';
  import { FASI, messaggioErrore } from '../lib/etichette.js';

  const imp = app.impostazioni ?? {};
  // datetime-local vuole "AAAA-MM-GGTHH:MM" nell'ora locale.
  const aLocale = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const daLocale = (v) => (v ? new Date(v).toISOString() : null);

  const DESCRIZIONI = {
    chiusa: 'Niente da fare per gli studenti: la home mostra solo le date in arrivo.',
    proposte: 'Gli studenti inviano e modificano le loro proposte.',
    calendario: 'Proposte chiuse: componete il programma per il Collegio docenti.',
    iscrizioni: 'Gli studenti scelgono cosa seguire in ogni fascia oraria.',
    cogestione: 'La cogestione è in corso: si consulta il programma.',
  };

  const partenza = { fase: imp.fase ?? 'chiusa', apertura: aLocale(imp.proposte_apertura), chiusura: aLocale(imp.proposte_chiusura) };
  let iniziale = $state(partenza);
  let fase = $state(partenza.fase);
  let apertura = $state(partenza.apertura);
  let chiusura = $state(partenza.chiusura);
  let errore = $state(null);
  let messaggio = $state(null);
  let inCorso = $state(false);

  const modificato = $derived(fase !== iniziale.fase || apertura !== iniziale.apertura || chiusura !== iniziale.chiusura);
  const bloccato = $derived(Boolean(app.impostazioni?.calendario_bloccato));

  async function salva(e) {
    e.preventDefault();
    errore = messaggio = null;
    if (apertura && chiusura && new Date(chiusura) <= new Date(apertura)) {
      errore = "La chiusura delle proposte deve venire dopo l'apertura.";
      return;
    }
    inCorso = true;
    const { error } = await supabase
      .from('impostazioni')
      .update({ fase, proposte_apertura: daLocale(apertura), proposte_chiusura: daLocale(chiusura) })
      .eq('id', 1);
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    await caricaImpostazioni();
    iniziale = { fase, apertura, chiusura };
    messaggio = 'Impostazioni salvate.';
  }

  async function bloccaCalendario(valore) {
    const testo = valore
      ? "Bloccare il calendario? Da ora giorni, fasce e aule non si potranno più modificare. Fallo solo dopo l'approvazione del Collegio docenti."
      : 'Sbloccare il calendario? Fallo solo se il Collegio docenti ha chiesto una modifica.';
    if (!confirm(testo)) return;
    const { error } = await supabase.from('impostazioni').update({ calendario_bloccato: valore }).eq('id', 1);
    if (error) return (errore = messaggioErrore(error));
    await caricaImpostazioni();
  }
</script>

<div class="pagina pila-l">
  <Intestazione titolo="Impostazioni" disegno="ingranaggio" indietro={{ href: '#/profilo', testo: 'Profilo' }}>
    <p>Solo per i rappresentanti d'istituto. Ogni modifica resta nel registro.</p>
  </Intestazione>

  {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}
  {#if messaggio}<div class="avviso avviso-ok" role="status">{messaggio}</div>{/if}

  <form class="pila-l" onsubmit={salva}>
    <section class="carta pila">
      <h2 class="titolo-sezione">Fase della cogestione</h2>
      <p class="attenuato piccolo">Decide cosa vedono e possono fare gli studenti.</p>
      <div class="fasi" role="radiogroup" aria-label="Fase attiva">
        {#each Object.entries(FASI) as [valore, testo], i (valore)}
          <label class="fase" class:scelta={fase === valore}>
            <input type="radio" name="fase" value={valore} bind:group={fase} />
            <span class="numero">{i + 1}</span>
            <span class="testo-fase">
              <strong>{testo}</strong>
              <span>{DESCRIZIONI[valore]}</span>
            </span>
            {#if fase === valore}
              <span class="segno"><Schizzo nome="spunta" durata={450} /></span>
            {/if}
          </label>
        {/each}
      </div>
    </section>

    <section class="carta pila">
      <h2 class="titolo-sezione">Date delle proposte</h2>
      <div class="date">
        <div class="campo">
          <label for="apertura">Apertura</label>
          <input id="apertura" type="datetime-local" bind:value={apertura} />
        </div>
        <div class="campo">
          <label for="chiusura">Chiusura</label>
          <input id="chiusura" type="datetime-local" bind:value={chiusura} />
        </div>
      </div>
      <p class="aiuto attenuato">
        Si vedono in home con il conto alla rovescia. Quando arrivano le date del Consiglio d'istituto e dei Collegi,
        aggiornale qui.
      </p>
    </section>

    <div class="barra-salva" class:attiva={modificato}>
      <span class="piccolo">{modificato ? 'Hai modifiche non salvate' : 'Tutto salvato'}</span>
      <button class="btn btn-primario" disabled={inCorso || !modificato}>{inCorso ? 'Salvataggio…' : 'Salva le modifiche'}</button>
    </div>
  </form>

  <section class="carta calendario" class:bloccato>
    <span class="icona"><Schizzo nome="lucchetto" /></span>
    <div class="pila">
      <h2 class="titolo-sezione">Calendario {bloccato ? 'bloccato' : 'modificabile'}</h2>
      <p class="attenuato piccolo">
        {bloccato
          ? 'Giorni, fasce e aule non si possono più cambiare. Sbloccalo solo se il Collegio docenti chiede una modifica.'
          : "Dopo l'approvazione del Collegio docenti va bloccato, così nessuno lo cambia per sbaglio."}
      </p>
      <button class="btn btn-secondario" onclick={() => bloccaCalendario(!bloccato)}>
        {bloccato ? 'Sblocca il calendario' : 'Blocca il calendario'}
      </button>
    </div>
  </section>

  <Collegamento
    href="#/studenti"
    titolo="Studenti e codici"
    testo="Carica l'elenco della scuola, genera i codici personali, stampa i foglietti per classe."
    disegno="persone"
  />
</div>

<style>
  .titolo-sezione { margin: 0; font-size: 20px; }
  .carta > p { margin: 0; }

  .fasi { display: grid; gap: var(--s-2); margin-top: var(--s-2); }
  .fase {
    position: relative;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 36px;
    align-items: center;
    gap: var(--s-3);
    padding: var(--s-3) var(--s-4);
    border-radius: var(--raggio);
    border: 1px solid var(--linea);
    cursor: pointer;
    transition: border-color var(--m-out) var(--ease), background-color var(--m-out) var(--ease);
  }
  .fase:hover { border-color: var(--linea-forte); }
  .fase input { position: absolute; opacity: 0; pointer-events: none; }
  .fase:has(input:focus-visible) { outline: 2px solid var(--accento); outline-offset: 2px; }
  .fase.scelta { border-color: var(--accento); background: color-mix(in oklab, var(--accento-tinta) 60%, transparent); }
  .numero {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--linea-forte);
    font: 500 var(--t-label) / 1 var(--mono);
    color: var(--testo-2);
  }
  .scelta .numero { background: var(--accento); border-color: var(--accento); color: var(--accento-su); }
  .testo-fase { display: grid; gap: 2px; }
  .testo-fase strong { font-size: 16px; }
  .testo-fase span { font-size: var(--t-small); line-height: 1.45; color: var(--testo-2); }
  .segno { width: 32px; height: 32px; color: var(--testo); }
  .segno :global(svg) { width: 100%; height: 100%; }

  .date { display: grid; gap: var(--s-3); }
  @media (min-width: 560px) {
    .date { grid-template-columns: 1fr 1fr; }
  }

  /* Barra del salvataggio: resta in vista sopra il dock finché ci sono modifiche. */
  .barra-salva {
    position: sticky;
    bottom: calc(var(--barra-h) + var(--s-4));
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    padding: var(--s-2) var(--s-2) var(--s-2) var(--s-4);
    border-radius: 16px;
    background: var(--vetro);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid var(--vetro-bordo);
    color: var(--testo-2);
  }
  .barra-salva.attiva { color: var(--testo); box-shadow: var(--ombra-su); }
  .barra-salva.attiva span::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 50%;
    background: var(--rosso);
  }
  @media (min-width: 640px) {
    .barra-salva { bottom: var(--s-4); }
  }

  .calendario { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: var(--s-4); align-items: start; }
  .calendario .icona { width: 64px; height: 64px; }
  .calendario .icona :global(svg) { width: 100%; height: 100%; }
  .calendario .btn { justify-self: start; }
  .calendario.bloccato { border-color: color-mix(in oklab, var(--rosso) 40%, transparent); }
</style>
