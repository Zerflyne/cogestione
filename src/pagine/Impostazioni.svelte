<script>
  import { supabase } from '../lib/supabase.js';
  import { app, caricaImpostazioni } from '../lib/stato.svelte.js';
  import { FASI, messaggioErrore } from '../lib/etichette.js';

  const imp = app.impostazioni;
  // datetime-local vuole "AAAA-MM-GGTHH:MM" nell'ora locale.
  const aLocale = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const daLocale = (v) => (v ? new Date(v).toISOString() : null);

  let fase = $state(imp.fase);
  let apertura = $state(aLocale(imp.proposte_apertura));
  let chiusura = $state(aLocale(imp.proposte_chiusura));
  let errore = $state(null);
  let messaggio = $state(null);
  let inCorso = $state(false);

  async function salva(e) {
    e.preventDefault();
    errore = messaggio = null;
    inCorso = true;
    const { error } = await supabase
      .from('impostazioni')
      .update({ fase, proposte_apertura: daLocale(apertura), proposte_chiusura: daLocale(chiusura) })
      .eq('id', 1);
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    await caricaImpostazioni();
    messaggio = 'Impostazioni salvate.';
  }

  async function bloccaCalendario(valore) {
    const testo = valore
      ? 'Bloccare il calendario? Da ora giorni, fasce e aule non si potranno più modificare. Fallo solo dopo l\'approvazione del Collegio docenti.'
      : 'Sbloccare il calendario? Fallo solo se il Collegio docenti ha chiesto una modifica.';
    if (!confirm(testo)) return;
    const { error } = await supabase.from('impostazioni').update({ calendario_bloccato: valore }).eq('id', 1);
    if (error) return (errore = messaggioErrore(error));
    await caricaImpostazioni();
  }

  async function generaCodici() {
    errore = messaggio = null;
    const { data, error } = await supabase.rpc('genera_codici');
    if (error) return (errore = messaggioErrore(error));
    messaggio = data === 0 ? 'Tutti gli studenti hanno già un codice.' : `Generati ${data} codici.`;
  }
</script>

<div class="pagina pila-l">
  <header>
    <a href="#/profilo" class="piccolo">← Profilo</a>
    <h1>Impostazioni</h1>
    <p class="attenuato">Solo per i rappresentanti d'istituto. Ogni modifica resta nel registro.</p>
  </header>

  {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}
  {#if messaggio}<div class="avviso avviso-ok">{messaggio}</div>{/if}

  <form class="carta pila" onsubmit={salva}>
    <p class="etichetta-sezione" style="margin:0">Fase</p>
    <div class="campo">
      <label for="fase">Fase attiva</label>
      <select id="fase" bind:value={fase}>
        {#each Object.entries(FASI) as [v, t] (v)}<option value={v}>{t}</option>{/each}
      </select>
      <span class="aiuto">Decide cosa vedono e possono fare gli studenti. Le proposte si inviano solo nella fase "Proposte aperte".</span>
    </div>
    <div class="campo">
      <label for="apertura">Apertura delle proposte</label>
      <input id="apertura" type="datetime-local" bind:value={apertura} />
    </div>
    <div class="campo">
      <label for="chiusura">Chiusura delle proposte</label>
      <input id="chiusura" type="datetime-local" bind:value={chiusura} />
      <span class="aiuto">Le date si mostrano in home. Le date del Consiglio d'istituto e dei Collegi si aggiornano qui quando arrivano.</span>
    </div>
    <button class="btn btn-primario btn-pieno" disabled={inCorso}>Salva</button>
  </form>

  <section class="carta pila">
    <p class="etichetta-sezione" style="margin:0">Calendario</p>
    <p class="attenuato piccolo" style="margin:0">
      Stato: <strong>{app.impostazioni.calendario_bloccato ? 'bloccato' : 'modificabile'}</strong>.
      Dopo l'approvazione del Collegio docenti il calendario va bloccato.
    </p>
    {#if app.impostazioni.calendario_bloccato}
      <button class="btn btn-secondario btn-pieno" onclick={() => bloccaCalendario(false)}>Sblocca il calendario</button>
    {:else}
      <button class="btn btn-secondario btn-pieno" onclick={() => bloccaCalendario(true)}>Blocca il calendario</button>
    {/if}
  </section>

  <section class="carta pila">
    <p class="etichetta-sezione" style="margin:0">Codici personali</p>
    <p class="attenuato piccolo" style="margin:0">
      Genera un codice di accesso per ogni studente dell'elenco che non ne ha ancora uno. Caricamento dell'elenco,
      invio per email e fogli da stampare arrivano nella prossima versione.
    </p>
    <button class="btn btn-secondario btn-pieno" onclick={generaCodici}>Genera i codici mancanti</button>
  </section>
</div>
