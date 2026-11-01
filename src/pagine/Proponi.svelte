<script>
  import { supabase } from '../lib/supabase.js';
  import { app, vai } from '../lib/stato.svelte.js';
  import { AULE, messaggioErrore, formatoData } from '../lib/etichette.js';

  let { id = null } = $props();

  let f = $state({
    titolo: '',
    descrizione: '',
    fasce_necessarie: 1,
    posti_max: 25,
    aula_richiesta: 'normale',
    attivita_palestra: '',
    docente_referente: '',
    preferenza_oraria: '',
    co_conduttori: '',
    materiale: '',
  });
  let originale = $state(null);
  let caricamento = $state(true);
  let inCorso = $state(false);
  let errore = $state(null);

  const fase = $derived(app.impostazioni?.fase);
  const aperte = $derived(fase === 'proposte');
  const modificabile = $derived(!originale || ['inviata', 'da_modificare'].includes(originale.stato));
  const semplice = $derived(f.aula_richiesta === 'normale' && !f.docente_referente.trim());
  const palestra = $derived(f.aula_richiesta === 'palestra');

  $effect(() => {
    if (!id) {
      caricamento = false;
      return;
    }
    supabase
      .from('corsi')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          originale = data;
          for (const k of Object.keys(f)) f[k] = data[k] ?? (typeof f[k] === 'number' ? 1 : '');
        }
        caricamento = false;
      });
  });

  const vuotoANull = (v) => (typeof v === 'string' ? v.trim() || null : v);

  function controlla() {
    const t = f.titolo.trim(), d = f.descrizione.trim();
    if (t.length < 3 || t.length > 60) return 'Il nome deve avere tra 3 e 60 caratteri.';
    if (d.length < 20) return 'Descrivi il corso in almeno 20 caratteri.';
    if (d.length > 500) return 'La descrizione supera i 500 caratteri.';
    if (!(f.fasce_necessarie >= 1 && f.fasce_necessarie <= 6)) return 'Le fasce orarie vanno da 1 a 6.';
    if (!(f.posti_max >= 5 && f.posti_max <= 300)) return 'I posti vanno da 5 a 300.';
    if (palestra && f.attivita_palestra.trim().length < 20)
      return "Per la palestra descrivi l'attività in almeno 20 caratteri.";
    return null;
  }

  async function invia(e) {
    e.preventDefault();
    errore = controlla();
    if (errore) return;
    inCorso = true;
    const dati = {
      titolo: f.titolo.trim(),
      descrizione: f.descrizione.trim(),
      fasce_necessarie: Number(f.fasce_necessarie),
      posti_max: Number(f.posti_max),
      aula_richiesta: f.aula_richiesta,
      attivita_palestra: palestra ? vuotoANull(f.attivita_palestra) : null,
      docente_referente: vuotoANull(f.docente_referente),
      preferenza_oraria: semplice ? vuotoANull(f.preferenza_oraria) : null,
      co_conduttori: vuotoANull(f.co_conduttori),
      materiale: vuotoANull(f.materiale),
    };
    const { error } = originale
      ? await supabase.from('corsi').update(dati).eq('id', originale.id)
      : await supabase.from('corsi').insert({ ...dati, proponente_id: app.studente.id });
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    vai('proposte/inviata');
  }
</script>

<div class="pagina pila-l">
  <header>
    <h1>{originale ? 'Modifica proposta' : 'Proponi un corso'}</h1>
    <p class="attenuato">
      I rappresentanti leggono ogni proposta e ti rispondono qui. Puoi modificarla finché non viene approvata.
    </p>
  </header>

  {#if caricamento}
    <p class="attenuato">Caricamento…</p>
  {:else if !aperte}
    <div class="avviso avviso-attenzione">
      Le proposte non sono aperte in questo momento.
      {#if app.impostazioni?.proposte_apertura}Aprono il {formatoData(app.impostazioni.proposte_apertura)}.{/if}
    </div>
  {:else if !modificabile}
    <div class="avviso">Questa proposta è già stata valutata e non si può più modificare.</div>
  {:else}
    {#if originale?.stato === 'da_modificare' && originale.nota_revisione}
      <div class="avviso avviso-attenzione">
        <strong>Cosa ti chiedono i rappresentanti:</strong><br />{originale.nota_revisione}
      </div>
    {/if}

    <form class="pila-l" onsubmit={invia} novalidate>
      <section class="carta pila">
        <p class="etichetta-sezione">Il corso</p>
        <div class="campo">
          <label for="titolo">Nome del corso</label>
          <input id="titolo" type="text" maxlength="60" bind:value={f.titolo} placeholder="es. Introduzione agli scacchi" />
          <span class="contatore">{f.titolo.length}/60</span>
        </div>
        <div class="campo">
          <label for="descrizione">Descrizione</label>
          <textarea
            id="descrizione"
            maxlength="500"
            rows="5"
            bind:value={f.descrizione}
            placeholder="Cosa si fa, a chi è rivolto, cosa si porta a casa."
          ></textarea>
          <span class="contatore">{f.descrizione.length}/500 · è quello che leggeranno gli studenti</span>
        </div>
        <div class="due">
          <div class="campo">
            <label for="fasce">Fasce orarie</label>
            <input id="fasce" type="number" inputmode="numeric" min="1" max="6" bind:value={f.fasce_necessarie} />
          </div>
          <div class="campo">
            <label for="posti">Posti massimi</label>
            <input id="posti" type="number" inputmode="numeric" min="5" max="300" bind:value={f.posti_max} />
          </div>
        </div>
      </section>

      <section class="carta pila">
        <p class="etichetta-sezione">Dove e con chi</p>
        <div class="campo">
          <label for="aula">Aula richiesta</label>
          <select id="aula" bind:value={f.aula_richiesta}>
            {#each Object.entries(AULE) as [valore, testo] (valore)}
              <option value={valore}>{testo}</option>
            {/each}
          </select>
        </div>

        {#if palestra}
          <div class="campo">
            <label for="palestra">Descrivi l'attività in palestra</label>
            <textarea
              id="palestra"
              maxlength="1000"
              rows="4"
              bind:value={f.attivita_palestra}
              placeholder="Che sport o attività, quante persone, che attrezzatura serve."
            ></textarea>
            <span class="aiuto">
              La palestra dipende dal dipartimento di scienze motorie: presentiamo noi la tua attività al capo
              dipartimento prima di inserirla nel calendario.
            </span>
          </div>
        {/if}

        <div class="campo">
          <label for="docente">Docente referente <span class="facoltativo">· facoltativo</span></label>
          <input id="docente" type="text" maxlength="80" bind:value={f.docente_referente} placeholder="Solo se serve un docente specifico" />
        </div>

        {#if semplice}
          <div class="campo">
            <label for="preferenza">Preferenza oraria <span class="facoltativo">· facoltativo</span></label>
            <input id="preferenza" type="text" maxlength="200" bind:value={f.preferenza_oraria} placeholder="es. mattina del primo giorno" />
            <span class="aiuto">È una preferenza, non una garanzia: il calendario lo compongono i rappresentanti.</span>
          </div>
        {:else}
          <p class="aiuto attenuato piccolo" style="margin:0">
            Con un'aula speciale o un docente specifico l'orario lo decidono i rappresentanti, perché va coordinato con
            docenti e assistenti tecnici.
          </p>
        {/if}

        <div class="campo">
          <label for="co">Altri conduttori <span class="facoltativo">· facoltativo</span></label>
          <input id="co" type="text" maxlength="200" bind:value={f.co_conduttori} placeholder="Nome, cognome e classe" />
        </div>
        <div class="campo">
          <label for="materiale">Materiale necessario <span class="facoltativo">· facoltativo</span></label>
          <input id="materiale" type="text" maxlength="300" bind:value={f.materiale} placeholder="Proiettore, computer, materiale di laboratorio…" />
        </div>
      </section>

      {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}

      <button class="btn btn-primario btn-pieno" disabled={inCorso}>
        {inCorso ? 'Invio…' : originale ? 'Salva e reinvia' : 'Invia la proposta'}
      </button>
    </form>
  {/if}
</div>

<style>
  .due { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .carta .etichetta-sezione { margin: 0; }
</style>
