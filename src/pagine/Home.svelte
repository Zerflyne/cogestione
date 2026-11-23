<script module>
  // L'ingresso della home si vede una volta per visita, non a ogni ritorno sulla pagina.
  let giaEntrato = false;
</script>

<script>
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase.js';
  import { app, isAdmin } from '../lib/stato.svelte.js';
  import { FASI, formatoData } from '../lib/etichette.js';
  import { siAccende } from '../lib/azioni.js';

  const entra = !giaEntrato;
  giaEntrato = true;

  const imp = $derived(app.impostazioni);
  const fase = $derived(imp?.fase ?? 'chiusa');
  const nome = $derived(app.studente?.nome);

  // Conto alla rovescia verso la prossima scadenza utile.
  let adesso = $state(Date.now());
  onMount(() => {
    const t = setInterval(() => (adesso = Date.now()), 1000);
    return () => clearInterval(t);
  });
  const traguardo = $derived.by(() => {
    if (fase === 'proposte' && imp?.proposte_chiusura) return { quando: imp.proposte_chiusura, testo: 'Le proposte chiudono' };
    if (fase === 'chiusa' && imp?.proposte_apertura) return { quando: imp.proposte_apertura, testo: 'Le proposte aprono' };
    if (fase === 'iscrizioni' && imp?.iscrizioni_chiusura) return { quando: imp.iscrizioni_chiusura, testo: 'Le iscrizioni chiudono' };
    return null;
  });
  const mancano = $derived.by(() => {
    if (!traguardo) return null;
    const ms = new Date(traguardo.quando).getTime() - adesso;
    if (ms <= 0) return null;
    const s = Math.floor(ms / 1000);
    return { giorni: Math.floor(s / 86400), ore: Math.floor((s % 86400) / 3600), minuti: Math.floor((s % 3600) / 60), secondi: s % 60 };
  });
  const due = (n) => String(n).padStart(2, '0');

  // Numeri rapidi: le proprie proposte, e per i rappresentanti quelle da valutare.
  let mie = $state(null);
  let daValutare = $state(null);
  $effect(() => {
    if (!app.studente) return;
    supabase
      .from('corsi')
      .select('id', { count: 'exact', head: true })
      .eq('proponente_id', app.studente.id)
      .then(({ count }) => (mie = count ?? 0));
    if (isAdmin()) {
      supabase
        .from('corsi')
        .select('id', { count: 'exact', head: true })
        .in('stato', ['inviata', 'in_revisione'])
        .then(({ count }) => (daValutare = count ?? 0));
    }
  });

  const passi = [
    { id: 'proposte', titolo: 'Proposte', testo: 'Chiunque può proporre un corso, un laboratorio o un torneo.' },
    { id: 'calendario', titolo: 'Calendario', testo: 'I rappresentanti compongono il programma e lo portano al Collegio docenti.' },
    { id: 'iscrizioni', titolo: 'Iscrizioni', testo: 'Scegli cosa seguire in ogni fascia oraria, dal telefono.' },
    { id: 'cogestione', titolo: 'Cogestione', testo: 'Cinque giorni interi, costruiti da studenti e docenti.' },
  ];
  const ordine = ['chiusa', 'proposte', 'calendario', 'iscrizioni', 'cogestione'];
  const indice = $derived(ordine.indexOf(fase));
  const statoPasso = (id) => {
    const p = ordine.indexOf(id);
    return p < indice ? 'fatto' : p === indice ? 'ora' : 'poi';
  };

  // Testo dell'eroe secondo la fase.
  const sotto = $derived(
    {
      chiusa: 'Le proposte non sono ancora aperte. Intanto pensa a cosa ti piacerebbe insegnare o imparare.',
      proposte: 'Proponi un corso, un laboratorio o un torneo. I rappresentanti lo leggono, ti rispondono qui e lo mettono in calendario.',
      calendario: 'Le proposte sono chiuse. I rappresentanti stanno componendo il calendario da portare al Collegio docenti.',
      iscrizioni: 'Il programma è pronto: scegli cosa seguire in ogni fascia oraria. Le iscrizioni arrivano a breve su questa pagina.',
      cogestione: 'La cogestione è in corso. Buone giornate a tutti.',
    }[fase],
  );
</script>

<div class="home" class:entra>
  <section class="eroe" aria-labelledby="eroe-titolo">
    <div class="parole">
      <p class="sopra dopo" style="--i: 0">
        {nome ? `Ciao ${nome}` : 'IIS Evangelista Torricelli'} · {FASI[fase]}
      </p>
      <h1 id="eroe-titolo">
        <span class="riga-h" style="--i: 0"><span>Cinque giorni di corsi</span></span>
        <span class="riga-h" style="--i: 1"><span>pensati dagli studenti.</span></span>
      </h1>
      <p class="lead dopo" style="--i: 1">{sotto}</p>
      <div class="pulsanti dopo" style="--i: 2">
        {#if fase === 'proposte'}
          <a class="btn btn-primario btn-pieno-telefono" href={app.sessione ? '#/proponi' : '#/accesso'}>
            Proponi un corso
            <svg class="freccia" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
        {/if}
        {#if app.sessione}
          <a class="btn btn-secondario btn-pieno-telefono" href="#/proposte">Vedi le tue proposte</a>
        {:else}
          <a class="btn {fase === 'proposte' ? 'btn-secondario' : 'btn-primario'} btn-pieno-telefono" href="#/accesso">Entra con il codice</a>
        {/if}
      </div>
    </div>

    <aside class="pannello carta" aria-label="Scadenza">
      <div class="pannello-testa">
        <span class="badge badge-in_revisione">{FASI[fase]}</span>
      </div>
      {#if mancano}
        <p class="pannello-titolo">{traguardo.testo} tra</p>
        <div class="conto" role="timer" aria-label="{traguardo.testo} il {formatoData(traguardo.quando)}">
          <div><strong>{mancano.giorni}</strong><span>giorni</span></div>
          <div><strong>{due(mancano.ore)}</strong><span>ore</span></div>
          <div><strong>{due(mancano.minuti)}</strong><span>minuti</span></div>
          <div><strong class="secondi">{due(mancano.secondi)}</strong><span>secondi</span></div>
        </div>
        <p class="pannello-data">{formatoData(traguardo.quando)}</p>
      {:else}
        <p class="pannello-titolo">
          {fase === 'cogestione' ? 'Buona cogestione' : fase === 'calendario' ? 'Calendario in arrivo' : 'Date in arrivo'}
        </p>
        <p class="pannello-data">Le date esatte arrivano qui appena il Consiglio d'istituto le approva.</p>
      {/if}
      <ol class="mini-percorso" aria-label="Fasi">
        {#each passi as p (p.id)}
          <li class={statoPasso(p.id)}><span></span>{p.titolo}</li>
        {/each}
      </ol>
    </aside>
  </section>

  <section class="sezione" aria-labelledby="come-titolo">
    <h2 id="come-titolo">Come funziona la cogestione</h2>
    <ol class="passi">
      {#each passi as p, i (p.id)}
        <li class="passo {statoPasso(p.id)}">
          <span class="numero-passo">
            {#if statoPasso(p.id) === 'fatto'}
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {:else}{i + 1}{/if}
          </span>
          <h3>{p.titolo}{#if statoPasso(p.id) === 'ora'}<span class="ora-qui">adesso</span>{/if}</h3>
          <p>{p.testo}</p>
        </li>
      {/each}
    </ol>
  </section>

  <section class="sezione frase" aria-label="Posti per tutti">
    <p use:siAccende>
      In ogni fascia oraria ci sono posti per <strong>almeno il 110%</strong> degli studenti, così nessuno resta nei
      corridoi.
    </p>
  </section>

  {#if app.studente}
    <section class="sezione" aria-labelledby="tue-titolo">
      <h2 id="tue-titolo">Le tue cose</h2>
      <div class="numeri">
        <a class="carta carta-viva numero" href="#/proposte">
          <strong>{mie ?? '–'}</strong>
          <span>{mie === 1 ? 'proposta inviata' : 'proposte inviate'}</span>
        </a>
        {#if isAdmin()}
          <a class="carta carta-viva numero evidenza" href="#/revisione">
            <strong>{daValutare ?? '–'}</strong>
            <span>da valutare</span>
          </a>
        {:else}
          <a class="carta carta-viva numero" href="#/profilo">
            <strong>{app.studente.classe ?? '–'}</strong>
            <span>la tua classe</span>
          </a>
        {/if}
      </div>
    </section>
  {/if}

  <footer class="piede">
    <span>Rappresentanti degli studenti · IIS Evangelista Torricelli</span>
    <a href="./privacy.html">Privacy</a>
  </footer>
</div>

<style>
  .home {
    max-width: var(--larga);
    margin: 0 auto;
    padding: calc(var(--nav-h) + var(--s-6)) var(--s-4) var(--dock-spazio);
  }
  @media (min-width: 640px) {
    .home { padding-left: var(--s-5); padding-right: var(--s-5); }
  }

  /* ── Eroe ── */
  .eroe {
    display: grid;
    gap: var(--s-6);
    align-items: center;
    padding-bottom: var(--s-7);
  }
  @media (min-width: 900px) {
    .eroe {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      gap: var(--s-8);
      min-height: calc(100svh - var(--nav-h) - var(--s-9));
      padding-bottom: var(--s-8);
    }
  }
  .sopra {
    margin: 0 0 var(--s-4);
    font-size: var(--t-small);
    font-weight: 500;
    color: var(--testo-2);
  }
  h1 {
    font-size: var(--t-h1);
    line-height: 1.02;
    letter-spacing: -0.04em;
    margin: 0 0 var(--s-5);
  }
  .riga-h { display: block; overflow: hidden; padding-bottom: 0.06em; margin-bottom: -0.06em; }
  .riga-h > span { display: block; }
  .lead {
    max-width: 34em;
    margin: 0 0 var(--s-6);
    font-size: var(--t-lead);
    line-height: 1.55;
    color: var(--testo-2);
  }
  .pulsanti { display: flex; flex-wrap: wrap; gap: var(--s-3); }

  /* Ingresso: le righe del titolo salgono dalle loro maschere, poi il resto. Una volta sola. */
  .entra .riga-h > span {
    animation: sale-riga 700ms var(--ease-entra) both;
    animation-delay: calc(var(--i) * 80ms);
  }
  .entra .dopo {
    animation: sale-dopo 520ms var(--ease-entra) both;
    animation-delay: calc(350ms + var(--i) * 60ms);
  }
  .entra .sopra { animation-delay: 0ms; }
  .entra .pannello { animation: si-posa 900ms var(--ease-entra) both 120ms; }
  @keyframes sale-riga { from { transform: translateY(105%); } }
  @keyframes sale-dopo { from { opacity: 0; transform: translateY(12px); } }
  @keyframes si-posa { from { opacity: 0; transform: scale(0.98); } }

  /* ── Pannello della scadenza: dati veri, non un'illustrazione ── */
  .pannello { display: grid; gap: var(--s-4); padding: var(--s-5); }
  .pannello-testa { display: flex; }
  .pannello-titolo { margin: 0; font: 500 var(--t-h3) / 1.2 var(--serif); letter-spacing: -0.02em; }
  .pannello-data { margin: 0; font-size: var(--t-small); color: var(--testo-2); }
  .conto { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-2); }
  .conto div {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: var(--s-3) 0;
    border-radius: var(--raggio);
    background: var(--superficie-2);
  }
  .conto strong {
    font: 500 clamp(28px, 2vw + 20px, 38px) / 1 var(--serif);
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .conto span { font-size: var(--t-label); color: var(--testo-3); }
  .secondi { color: var(--accento); }

  .mini-percorso {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s-1);
    margin: 0;
    padding: var(--s-4) 0 0;
    list-style: none;
    border-top: 1px solid var(--linea);
    font-size: var(--t-label);
    color: var(--testo-3);
  }
  .mini-percorso li { display: grid; gap: var(--s-2); }
  .mini-percorso span { height: 4px; border-radius: 2px; background: var(--superficie-2); }
  .mini-percorso .fatto span { background: color-mix(in oklab, var(--accento) 45%, var(--superficie-2)); }
  .mini-percorso .ora span { background: var(--accento); }
  .mini-percorso .ora { color: var(--testo); font-weight: 500; }

  /* ── Sezioni ── */
  .sezione {
    padding: var(--s-8) 0;
    border-top: 1px solid var(--linea);
  }
  .sezione h2 { font-size: var(--t-h2); letter-spacing: -0.03em; margin: 0 0 var(--s-6); }
  @media (min-width: 640px) {
    .sezione { padding: var(--s-9) 0; }
    .sezione h2 { margin-bottom: var(--s-7); }
  }

  .passi {
    display: grid;
    gap: var(--s-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 720px) {
    .passi { grid-template-columns: repeat(4, 1fr); gap: var(--s-5); }
  }
  .passo { display: grid; gap: var(--s-2); align-content: start; }
  @media (max-width: 719px) {
    .passo { grid-template-columns: 40px 1fr; column-gap: var(--s-4); }
    .passo .numero-passo { grid-row: span 2; }
  }
  .passo h3 { display: flex; align-items: center; gap: var(--s-2); margin: 0; font-size: 20px; }
  .passo p { margin: 0; color: var(--testo-2); }
  .poi h3 { color: var(--testo-2); }
  .numero-passo {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--linea-forte);
    font: 500 15px var(--sans);
    color: var(--testo-2);
  }
  @media (min-width: 720px) {
    .numero-passo { margin-bottom: var(--s-2); }
  }
  .numero-passo path { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .ora .numero-passo { background: var(--accento); border-color: var(--accento); color: var(--accento-su); }
  .fatto .numero-passo { background: var(--accento-tinta); border-color: transparent; color: var(--accento); }
  .ora-qui {
    font: 500 var(--t-label) / 1 var(--sans);
    color: var(--accento);
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--accento-tinta);
  }

  /* La frase che si accende scorrendo. */
  .frase p {
    margin: 0;
    max-width: 22em;
    font: 500 var(--t-h2) / 1.16 var(--serif);
    letter-spacing: -0.03em;
    text-wrap: pretty;
  }
  .frase strong { font-weight: inherit; }
  .frase :global(.si-accende .parola) {
    color: color-mix(in oklab, var(--testo) 45%, var(--bg));
    transition: color 160ms ease;
  }
  .frase :global(.si-accende .parola.accesa) { color: var(--testo); }
  .frase :global(.si-accende strong .parola.accesa) { color: var(--accento); }
  @media (min-width: 640px) {
    .frase { padding: var(--s-9) 0 calc(var(--s-9) * 1.5); }
    .frase p { font-size: clamp(40px, 3vw + 20px, 56px); }
  }

  .numeri { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); }
  @media (min-width: 720px) {
    .numeri { grid-template-columns: repeat(3, 1fr); gap: var(--s-5); }
  }
  .numero { display: grid; gap: var(--s-1); color: var(--testo); }
  .numero strong { font: 500 clamp(32px, 1.6vw + 26px, 44px) / 1.05 var(--serif); letter-spacing: -0.03em; }
  .numero span { color: var(--testo-2); font-size: 15px; }
  .evidenza { background: var(--accento-tinta); border-color: transparent; }
  .evidenza strong { color: var(--accento); }

  .piede {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-2) var(--s-5);
    padding: var(--s-6) 0 0;
    border-top: 1px solid var(--linea);
    font-size: var(--t-small);
    color: var(--testo-2);
  }
</style>
