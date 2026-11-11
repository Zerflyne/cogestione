<script>
  import { supabase } from '../lib/supabase.js';
  import { STATI, AULE, messaggioErrore, formatoData } from '../lib/etichette.js';
  import { flip } from 'svelte/animate';
  import { fade, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Scheletro from '../componenti/Scheletro.svelte';

  let corsi = $state([]);
  let caricamento = $state(true);
  let errore = $state(null);
  let filtro = $state('da_valutare');
  let aperto = $state(null);
  let nota = $state('');
  let inCorso = $state(false);

  const filtri = [
    { id: 'da_valutare', testo: 'Da valutare', vale: (c) => ['inviata', 'in_revisione'].includes(c.stato) },
    { id: 'palestra', testo: 'Palestra in attesa', vale: (c) => c.aula_richiesta === 'palestra' && c.parere_dipartimento === null && c.stato !== 'respinta' },
    { id: 'da_modificare', testo: 'Da modificare', vale: (c) => c.stato === 'da_modificare' },
    { id: 'approvate', testo: 'Approvate', vale: (c) => ['approvata', 'pianificata'].includes(c.stato) },
    { id: 'respinte', testo: 'Respinte', vale: (c) => c.stato === 'respinta' },
    { id: 'tutte', testo: 'Tutte', vale: () => true },
  ];

  const visibili = $derived(corsi.filter(filtri.find((x) => x.id === filtro).vale));
  const conta = (id) => corsi.filter(filtri.find((x) => x.id === id).vale).length;

  // Posti già offerti dalle proposte approvate, per avere un'idea della copertura.
  const postiApprovati = $derived(
    corsi.filter((c) => ['approvata', 'pianificata'].includes(c.stato)).reduce((t, c) => t + c.posti_max * c.fasce_necessarie, 0),
  );

  async function carica() {
    const { data, error } = await supabase
      .from('corsi')
      .select('*, proponente:studenti(nome, cognome, classe, email)')
      .order('creato_il', { ascending: true });
    if (error) errore = messaggioErrore(error);
    corsi = data ?? [];
    caricamento = false;
  }
  $effect(() => {
    carica();
  });

  function apri(c) {
    aperto = aperto === c.id ? null : c.id;
    nota = c.nota_revisione ?? '';
    errore = null;
  }

  async function aggiorna(c, campi) {
    errore = null;
    inCorso = true;
    const { data, error } = await supabase
      .from('corsi')
      .update(campi)
      .eq('id', c.id)
      .select('*, proponente:studenti(nome, cognome, classe, email)')
      .single();
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    corsi = corsi.map((x) => (x.id === c.id ? data : x));
  }

  const conNota = (c, stato) => {
    if (!nota.trim()) return (errore = 'Scrivi una nota per il proponente: deve sapere cosa cambiare o perché.');
    aggiorna(c, { stato, nota_revisione: nota.trim() });
  };
</script>

<div class="pagina pila-l">
  <header>
    <h1>Revisione proposte</h1>
    <p class="attenuato piccolo">
      {corsi.length} proposte · {postiApprovati} posti-fascia approvati
    </p>
  </header>

  <div class="schede" role="group" aria-label="Filtra">
    {#each filtri as x (x.id)}
      <button class="scheda" aria-pressed={filtro === x.id} onclick={() => (filtro = x.id)}>
        {x.testo} · {conta(x.id)}
      </button>
    {/each}
  </div>

  {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}

  {#if caricamento}
    <Scheletro righe={3} />
  {:else if visibili.length === 0}
    <div class="vuoto carta">Niente qui.</div>
  {:else}
    <ul class="elenco">
      {#each visibili as c (c.id)}
        <li class="carta carta-viva pila" animate:flip={{ duration: 350, easing: cubicOut }} in:fade={{ duration: 220 }}>
          <button class="intestazione" onclick={() => apri(c)} aria-expanded={aperto === c.id}>
            <div class="riga">
              <span class="badge badge-{c.stato}" class:pulsa={c.stato === 'in_revisione'}>{STATI[c.stato]}</span>
              <span class="attenuato piccolo spinge">{AULE[c.aula_richiesta]}</span>
            </div>
            <h2>{c.titolo}</h2>
            <span class="attenuato piccolo">
              {c.proponente?.nome} {c.proponente?.cognome} · {c.proponente?.classe} · {c.fasce_necessarie}
              {c.fasce_necessarie === 1 ? 'fascia' : 'fasce'} · {c.posti_max} posti
            </span>
          </button>

          {#if aperto === c.id}
            <div class="pila dettaglio" transition:slide={{ duration: 320, easing: cubicOut }}>
              <p>{c.descrizione}</p>
              <dl class="dati">
                {#if c.attivita_palestra}<dt>Attività</dt><dd>{c.attivita_palestra}</dd>{/if}
                {#if c.docente_referente}<dt>Docente</dt><dd>{c.docente_referente}</dd>{/if}
                {#if c.preferenza_oraria}<dt>Preferenza</dt><dd>{c.preferenza_oraria}</dd>{/if}
                {#if c.co_conduttori}<dt>Con</dt><dd>{c.co_conduttori}</dd>{/if}
                {#if c.materiale}<dt>Materiale</dt><dd>{c.materiale}</dd>{/if}
                <dt>Email</dt><dd>{c.proponente?.email}</dd>
                <dt>Inviata</dt><dd>{formatoData(c.creato_il)}</dd>
                {#if c.aggiornato_il !== c.creato_il}<dt>Modificata</dt><dd>{formatoData(c.aggiornato_il)}</dd>{/if}
              </dl>

              {#if c.aula_richiesta === 'palestra'}
                <div class="avviso avviso-accento pila">
                  <span class="piccolo"><strong>Dipartimento di scienze motorie:</strong>
                    {c.parere_dipartimento === null ? 'in attesa' : c.parere_dipartimento ? 'sì' : 'no'}</span>
                  <div class="riga">
                    <button class="btn btn-secondario btn-s" disabled={inCorso} onclick={() => aggiorna(c, { parere_dipartimento: true })}>Ha detto sì</button>
                    <button class="btn btn-secondario btn-s" disabled={inCorso} onclick={() => aggiorna(c, { parere_dipartimento: false })}>Ha detto no</button>
                  </div>
                </div>
              {/if}

              <div class="campo">
                <label for="nota-{c.id}">Nota per il proponente</label>
                <textarea id="nota-{c.id}" rows="3" bind:value={nota} placeholder="Obbligatoria per chiedere modifiche o respingere"></textarea>
              </div>

              <div class="azioni">
                {#if c.stato === 'inviata'}
                  <button class="btn btn-tenue btn-s" disabled={inCorso} onclick={() => aggiorna(c, { stato: 'in_revisione' })}>Prendo in carico</button>
                {/if}
                {#if !['approvata', 'pianificata'].includes(c.stato)}
                  <button
                    class="btn btn-primario btn-s"
                    disabled={inCorso || (c.aula_richiesta === 'palestra' && c.parere_dipartimento !== true)}
                    onclick={() => aggiorna(c, { stato: 'approvata', nota_revisione: nota.trim() || null })}
                  >Approva</button>
                {/if}
                <button class="btn btn-secondario btn-s" disabled={inCorso} onclick={() => conNota(c, 'da_modificare')}>Chiedi modifiche</button>
                {#if c.stato !== 'respinta'}
                  <button class="btn btn-pericolo btn-s" disabled={inCorso} onclick={() => conNota(c, 'respinta')}>Respingi</button>
                {/if}
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .elenco { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .intestazione {
    all: unset;
    display: grid;
    gap: 6px;
    cursor: pointer;
  }
  .intestazione:focus-visible { outline: 2px solid var(--accento); outline-offset: 4px; }
  h2 { font-size: 1.15rem; margin: 2px 0 0; }
  .dettaglio { border-top: 1px solid var(--linea); padding-top: 14px; }
  .dettaglio p { margin: 0; white-space: pre-line; }
  .azioni { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
