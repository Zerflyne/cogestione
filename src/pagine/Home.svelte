<script>
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase.js';
  import { app, isAdmin } from '../lib/stato.svelte.js';
  import { FASI, formatoData } from '../lib/etichette.js';
  import { appare, premibile } from '../lib/azioni.js';

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
    if (fase === 'proposte' && imp?.proposte_chiusura) return { quando: imp.proposte_chiusura, testo: 'alla chiusura delle proposte' };
    if (fase === 'chiusa' && imp?.proposte_apertura) return { quando: imp.proposte_apertura, testo: "all'apertura delle proposte" };
    if (fase === 'iscrizioni' && imp?.iscrizioni_chiusura) return { quando: imp.iscrizioni_chiusura, testo: 'alla chiusura delle iscrizioni' };
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
    { id: 'proposte', titolo: 'Proposte', testo: 'Chiunque può proporre un corso, un laboratorio, un torneo.' },
    { id: 'calendario', titolo: 'Calendario', testo: 'Componiamo il programma e lo portiamo al Collegio docenti.' },
    { id: 'iscrizioni', titolo: 'Iscrizioni', testo: 'Scegli cosa seguire in ogni fascia oraria. Posti per tutti.' },
    { id: 'cogestione', titolo: 'Cogestione', testo: 'Cinque giorni interi, costruiti da studenti e docenti.' },
  ];
  const ordine = ['chiusa', 'proposte', 'calendario', 'iscrizioni', 'cogestione'];
  const indice = $derived(ordine.indexOf(fase));
  const statoPasso = (id) => {
    const p = ordine.indexOf(id);
    return p < indice ? 'fatto' : p === indice ? 'ora' : 'poi';
  };
  // Quanta parte della linea del percorso è "piena".
  const avanzamento = $derived(Math.max(0, Math.min(1, (indice - 1) / (passi.length - 1))));
</script>

<div class="pagina pila-l">
  <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>

  <header class="eroe">
    <p class="etichetta-sezione sale" style="--i: 0">
      {nome ? `Ciao ${nome}` : 'IIS Evangelista Torricelli'}
    </p>
    <h1>
      <span class="sale" style="--i: 1">Cinque giorni.</span>
      <span class="sale accento" style="--i: 2">Li costruiamo insieme.</span>
    </h1>
    <p class="attenuato sale" style="--i: 3">Proponi un corso, scegli cosa seguire, vivi la cogestione.</p>
  </header>

  <section class="carta pila stato-fase sale" style="--i: 4">
    <div class="riga">
      <span class="badge badge-in_revisione pulsa">{FASI[fase]}</span>
      {#if traguardo && mancano}<span class="attenuato piccolo spinge">mancano</span>{/if}
    </div>

    {#if mancano}
      <div class="conto" aria-label="Tempo rimanente {traguardo.testo}">
        <div><strong>{mancano.giorni}</strong><span>giorni</span></div>
        <div><strong>{due(mancano.ore)}</strong><span>ore</span></div>
        <div><strong>{due(mancano.minuti)}</strong><span>min</span></div>
        <div><strong class="secondi">{due(mancano.secondi)}</strong><span>sec</span></div>
      </div>
      <p class="attenuato piccolo" style="margin:0">{traguardo.testo}, il {formatoData(traguardo.quando)}</p>
    {/if}

    {#if fase === 'proposte'}
      <h2>Le proposte sono aperte</h2>
      <p class="attenuato">Hai un'idea per un corso, un laboratorio o un'attività? I rappresentanti la valutano e ti rispondono qui.</p>
      <a class="btn btn-primario btn-pieno" href={app.sessione ? '#/proponi' : '#/accesso'}>
        Proponi un corso <span class="freccia" aria-hidden="true">→</span>
      </a>
    {:else if fase === 'calendario'}
      <h2>Il programma è in preparazione</h2>
      <p class="attenuato">Le proposte sono chiuse. Stiamo componendo il calendario da presentare al Collegio docenti.</p>
    {:else if fase === 'iscrizioni'}
      <h2>Iscrizioni aperte</h2>
      <p class="attenuato">Le iscrizioni arrivano a breve su questa pagina.</p>
    {:else if fase === 'cogestione'}
      <h2>La cogestione è in corso</h2>
      <p class="attenuato">Buone giornate a tutti.</p>
    {:else}
      <h2>Si parte presto</h2>
      <p class="attenuato">Le proposte non sono ancora aperte. Intanto pensa a cosa ti piacerebbe insegnare o imparare.</p>
    {/if}
  </section>

  {#if app.studente}
    <section class="numeri">
      <a class="carta carta-viva numero" href="#/proposte" use:appare use:premibile>
        <strong>{mie ?? '–'}</strong>
        <span>{mie === 1 ? 'proposta tua' : 'proposte tue'}</span>
      </a>
      {#if isAdmin()}
        <a class="carta carta-viva numero evidenza" href="#/revisione" use:appare={{ ritardo: 80 }} use:premibile>
          <strong>{daValutare ?? '–'}</strong>
          <span>da valutare</span>
        </a>
      {:else}
        <a class="carta carta-viva numero" href="#/profilo" use:appare={{ ritardo: 80 }} use:premibile>
          <strong>{app.studente.classe}</strong>
          <span>la tua classe</span>
        </a>
      {/if}
    </section>
  {/if}

  <section>
    <p class="etichetta-sezione" use:appare>Come funziona</p>
    <ol class="percorso" style="--avanzamento: {avanzamento}">
      {#each passi as p, i (p.id)}
        <li class={statoPasso(p.id)} use:appare={{ ritardo: i * 90 }}>
          <span class="numero-passo">
            {#if statoPasso(p.id) === 'fatto'}
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {:else}{i + 1}{/if}
          </span>
          <div>
            <h3>{p.titolo}</h3>
            <p class="attenuato piccolo">{p.testo}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <footer class="attenuato piccolo" use:appare>
    Rappresentanti degli studenti · IIS Evangelista Torricelli<br /><a href="./privacy.html">Privacy</a>
  </footer>
</div>

<style>
  .pagina { position: relative; }

  .eroe { padding-top: 28px; }
  .eroe h1 {
    font-size: clamp(2.3rem, 10vw, 3.4rem);
    line-height: 1.04;
    letter-spacing: -0.025em;
    margin: 6px 0 14px;
  }
  .eroe h1 span { display: block; }
  .accento {
    background: linear-gradient(100deg, var(--accento), color-mix(in srgb, var(--accento) 50%, #d6457f));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .eroe p { margin: 0; font-size: 1.05rem; }

  /* Ingresso a cascata dell'intestazione. */
  .sale {
    animation: sale 0.8s var(--morbida) both;
    animation-delay: calc(var(--i) * 90ms + 60ms);
  }
  @keyframes sale {
    from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
  }

  .stato-fase {
    background: color-mix(in srgb, var(--superficie) 86%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .stato-fase h2 { margin: 4px 0 0; }
  .stato-fase > p { margin: 0; }

  .conto {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .conto div {
    display: grid;
    justify-items: center;
    padding: 10px 0 8px;
    border-radius: 12px;
    background: var(--superficie-2);
  }
  .conto strong {
    font: 600 1.6rem/1.1 var(--serif);
    font-variant-numeric: tabular-nums;
  }
  .conto span { font-size: 0.7rem; color: var(--testo-3); text-transform: uppercase; letter-spacing: 0.06em; }
  .secondi { color: var(--accento); }

  .numeri { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .numero {
    display: grid;
    gap: 2px;
    text-decoration: none;
    color: var(--testo);
  }
  .numero strong { font: 600 2rem/1.1 var(--serif); }
  .numero span { color: var(--testo-2); font-size: 0.85rem; }
  .evidenza { background: var(--accento-tinta); border-color: transparent; }
  .evidenza strong { color: var(--accento); }

  /* Percorso con linea che si riempie fino alla fase attuale. */
  .percorso {
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 22px;
  }
  .percorso::before,
  .percorso::after {
    content: '';
    position: absolute;
    left: 15px;
    top: 16px;
    bottom: 16px;
    width: 2px;
    border-radius: 2px;
    background: var(--linea);
  }
  .percorso::after {
    background: var(--accento);
    transform-origin: top;
    transform: scaleY(var(--avanzamento));
    transition: transform 1.2s var(--morbida) 0.3s;
  }
  .percorso li {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: 14px;
  }
  .percorso h3 { font-size: 1.05rem; margin: 5px 0 2px; }
  .percorso p { margin: 0; }
  .numero-passo {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1.5px solid var(--linea);
    background: var(--bg);
    font: 600 0.85rem var(--sans);
    color: var(--testo-3);
  }
  .numero-passo path { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .ora .numero-passo {
    background: var(--accento);
    border-color: var(--accento);
    color: var(--accento-su);
    box-shadow: 0 0 0 6px var(--accento-tinta);
  }
  .fatto .numero-passo { background: var(--accento-tinta); border-color: transparent; color: var(--accento); }
  .poi h3 { color: var(--testo-2); }

  footer { text-align: center; padding-top: 8px; }
</style>
