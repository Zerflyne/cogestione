<script>
  // Il sito dei rappresentanti degli studenti: una pagina sola, con la cogestione come sezione a parte.
  import { onMount } from 'svelte';
  import Schizzo from '../componenti/Schizzo.svelte';
  import { appare, siAccende } from '../lib/azioni.js';
  import { FASI, formatoData } from '../lib/etichette.js';
  import { rappresentanti, contatti, attivita } from './contenuti.js';

  // La fase della cogestione, letta da Supabase senza caricare tutta l'app.
  // Se il database non risponde, la carta mostra solo il collegamento.
  let fase = $state(null);
  onMount(async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const chiave = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !chiave) return;
    try {
      const r = await fetch(`${url}/rest/v1/impostazioni?id=eq.1&select=fase,proposte_apertura,proposte_chiusura,iscrizioni_chiusura`, {
        headers: { apikey: chiave, Authorization: `Bearer ${chiave}` },
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) fase = (await r.json())[0] ?? null;
    } catch {}
  });

  const notaFase = $derived.by(() => {
    if (!fase) return null;
    if (fase.fase === 'proposte' && fase.proposte_chiusura) return `Le proposte chiudono il ${formatoData(fase.proposte_chiusura)}`;
    if (fase.fase === 'chiusa' && fase.proposte_apertura) return `Le proposte aprono il ${formatoData(fase.proposte_apertura)}`;
    if (fase.fase === 'iscrizioni' && fase.iscrizioni_chiusura) return `Le iscrizioni chiudono il ${formatoData(fase.iscrizioni_chiusura)}`;
    return null;
  });

  const iniziali = (nome) =>
    nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');

  const voci = [
    { href: '#cosa', testo: 'Cosa facciamo' },
    { href: '#chi', testo: 'Chi siamo' },
    { href: '#contatti', testo: 'Contatti' },
  ];
</script>

<header class="barra">
  <div class="wrap">
    <a class="logo" href="./" aria-label="Studenti Torricelli, inizio">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <rect width="64" height="64" rx="14" class="logo-fondo" />
        <path d="M18 20h28M32 20v26" class="logo-t" />
      </svg>
      <span>Studenti Torricelli</span>
    </a>
    <nav class="parole" aria-label="Sezioni della pagina">
      <ul>
        {#each voci as v (v.href)}
          <li><a href={v.href}>{v.testo}</a></li>
        {/each}
      </ul>
    </nav>
    <a class="btn btn-primario btn-s spinge" href="./cogestione/">
      Cogestione
      <svg class="freccia" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
    </a>
  </div>
</header>

<main class="sito">
  <section class="eroe" aria-labelledby="eroe-titolo">
    <div class="parole-eroe">
      <p class="sopra dopo" style="--i: 0">Rappresentanti d'istituto · IIS Evangelista Torricelli</p>
      <h1 id="eroe-titolo">
        <span class="riga-h" style="--i: 0"><span>La scuola la facciamo</span></span>
        <span class="riga-h" style="--i: 1"><span><span class="segnato">anche noi<Schizzo nome="sottolinea" class="sotto-segno" ritardo={900} durata={700} spessore={2.4} /></span>.</span></span>
      </h1>
      <p class="lead dopo" style="--i: 1">
        Siamo i rappresentanti degli studenti. Portiamo le vostre idee al Consiglio d'istituto, organizziamo assemblee e
        cogestione, e qui mettiamo tutto quello che serve sapere.
      </p>
      <div class="pulsanti dopo" style="--i: 2">
        <a class="btn btn-primario btn-pieno-telefono" href="./cogestione/">
          Vai alla cogestione
          <svg class="freccia" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </a>
        <a class="btn btn-secondario btn-pieno-telefono" href="#contatti">Scrivici</a>
      </div>
    </div>

    <div class="scena">
      <Schizzo nome="scuola" class="disegno" ritardo={500} />
      <a class="pannello carta" href="./cogestione/" aria-label="Apri la sezione cogestione">
        <span class="pannello-testa">
          <span class="etichetta">In evidenza</span>
          {#if fase}<span class="badge badge-in_revisione">{FASI[fase.fase] ?? fase.fase}</span>{/if}
        </span>
        <span class="pannello-titolo">Cogestione</span>
        <span class="pannello-testo">
          {notaFase ?? 'Proposte dei corsi, programma e iscrizioni: tutto nella sua sezione.'}
        </span>
        <span class="pannello-vai">
          Apri la sezione
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
        </span>
      </a>
    </div>
  </section>

  <section class="sezione" id="cosa" aria-labelledby="cosa-titolo">
    <h2 id="cosa-titolo" use:appare>Cosa facciamo</h2>
    <ul class="attivita">
      {#each attivita as a, i (a.titolo)}
        <li use:appare={{ ritardo: i * 90 }}>
          <svelte:element this={a.href ? 'a' : 'div'} class="voce" class:carta-viva={a.href} href={a.href}>
            <span class="icona"><Schizzo nome={a.disegno} ritardo={200 + i * 150} /></span>
            <h3>{a.titolo}</h3>
            <p>{a.testo}</p>
            {#if a.href}
              <span class="vai">{a.href.startsWith('#') ? 'Scrivici' : 'Apri'} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>
            {/if}
          </svelte:element>
        </li>
      {/each}
    </ul>
  </section>

  <section class="sezione frase" aria-label="Il nostro motto">
    <p use:siAccende>
      <em>Ad meliorem scholam</em>: verso una scuola migliore, costruita <strong class="cerchiato">insieme<Schizzo nome="cerchio" class="cerchio" durata={900} spessore={2.4} /></strong>, una proposta alla volta.
    </p>
  </section>

  <section class="sezione" id="chi" aria-labelledby="chi-titolo">
    <div class="testa-sezione">
      <h2 id="chi-titolo" use:appare>Chi siamo</h2>
      <p class="attenuato" use:appare>Eletti dagli studenti, restiamo in carica un anno. Fermaci quando vuoi.</p>
    </div>
    <ul class="persone">
      {#each rappresentanti as r, i (r.nome + i)}
        <li class="carta persona" use:appare={{ ritardo: i * 80 }}>
          <span class="avatar" aria-hidden="true">{iniziali(r.nome)}</span>
          <span class="chi">
            <strong>{r.nome}</strong>
            <span>{r.classe ? `Classe ${r.classe}` : "Rappresentante d'istituto"}</span>
          </span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="sezione" id="contatti" aria-labelledby="contatti-titolo">
    <div class="contatti">
      <div class="contatti-parole">
        <h2 id="contatti-titolo" use:appare>Scrivici</h2>
        <p class="lead-piccolo" use:appare>
          Idee, problemi, proposte per un'assemblea: leggiamo tutto. Puoi anche passare dal rappresentante della tua classe,
          che ce lo fa arrivare.
        </p>
        <div class="contatti-vie" use:appare>
          {#if contatti.email}
            <a class="btn btn-primario btn-pieno-telefono" href="mailto:{contatti.email}">{contatti.email}</a>
          {/if}
          {#if contatti.instagram}
            <a class="btn btn-secondario btn-pieno-telefono" href="https://www.instagram.com/{contatti.instagram}/" rel="noopener">@{contatti.instagram}</a>
          {/if}
          {#if !contatti.email && !contatti.instagram}
            <p class="attenuato piccolo">Email e Instagram arrivano presto qui.</p>
          {/if}
        </div>
      </div>
      <div class="contatti-disegno"><Schizzo nome="busta" ritardo={150} /></div>
    </div>
  </section>

  <footer class="piede">
    <span>Rappresentanti degli studenti · IIS Evangelista Torricelli</span>
    <span class="piede-link">
      <a href="./cogestione/">Cogestione</a>
      <a href="./privacy.html">Privacy</a>
    </span>
  </footer>
</main>

<style>
  /* ── Barra in alto: come quella della cogestione, senza dock sul telefono ── */
  .barra {
    position: fixed;
    inset: 0 0 auto;
    z-index: 10;
    height: var(--nav-h);
    background: color-mix(in oklab, var(--bg) 72%, transparent);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    backdrop-filter: blur(18px) saturate(1.4);
    border-bottom: 1px solid var(--vetro-bordo);
  }
  .wrap {
    height: 100%;
    max-width: var(--larga);
    margin: 0 auto;
    padding: 0 var(--s-4);
    display: flex;
    align-items: center;
    gap: var(--s-6);
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--testo);
    font: 500 20px/1 var(--serif);
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .logo-fondo { fill: var(--accento); }
  .logo-t { stroke: var(--accento-su); stroke-width: 7; stroke-linecap: round; fill: none; }
  .parole { display: none; }
  .parole ul { display: flex; gap: var(--s-5); margin: 0; padding: 0; list-style: none; }
  .parole a {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--testo-2);
    font: 500 15px/1 var(--sans);
    white-space: nowrap;
    transition: color var(--m-out) var(--ease);
  }
  .parole a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform var(--m-out) var(--ease);
  }
  .parole a:hover { color: var(--testo); }
  .parole a:hover::after { transform: scaleX(1); transform-origin: left; }
  @media (min-width: 720px) {
    .parole { display: block; }
  }
  @media (min-width: 640px) {
    .wrap { padding: 0 var(--s-5); }
  }

  /* ── Pagina ── */
  .sito {
    max-width: var(--larga);
    margin: 0 auto;
    padding: calc(var(--nav-h) + var(--s-6)) var(--s-4) var(--s-6);
  }
  @media (min-width: 640px) {
    .sito { padding-left: var(--s-5); padding-right: var(--s-5); }
  }
  /* La barra fissa non deve coprire il titolo quando si salta a una sezione. */
  .sezione { scroll-margin-top: calc(var(--nav-h) + var(--s-4)); }

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
  .sopra { margin: 0 0 var(--s-4); font-size: var(--t-small); font-weight: 500; color: var(--testo-2); }
  h1 { font-size: var(--t-h1); line-height: 1.02; letter-spacing: -0.04em; margin: 0 0 var(--s-5); }
  .riga-h { display: block; overflow: hidden; padding-bottom: 0.3em; margin-bottom: -0.3em; }
  .riga-h > span { display: block; }
  .lead { max-width: 34em; margin: 0 0 var(--s-6); font-size: var(--t-lead); line-height: 1.55; color: var(--testo-2); }
  .pulsanti { display: flex; flex-wrap: wrap; gap: var(--s-3); }

  .riga-h > span { animation: sale-riga 700ms var(--ease-entra) both; animation-delay: calc(var(--i) * 80ms); }
  .dopo { animation: sale-dopo 520ms var(--ease-entra) both; animation-delay: calc(350ms + var(--i) * 60ms); }
  .sopra { animation-delay: 0ms; }
  .pannello { animation: si-posa 900ms var(--ease-entra) both 120ms; }
  @keyframes sale-riga { from { transform: translateY(105%); } }
  @keyframes sale-dopo { from { opacity: 0; transform: translateY(12px); } }
  @keyframes si-posa { from { opacity: 0; transform: scale(0.98); } }
  @media (prefers-reduced-motion: reduce) {
    .riga-h > span, .dopo, .pannello { animation: none; }
  }

  .segnato { position: relative; white-space: nowrap; }
  .segnato :global(.sotto-segno) {
    position: absolute;
    left: -2%;
    width: 104%;
    bottom: -0.2em;
    height: 0.3em;
    color: var(--rosso);
  }

  .scena { position: relative; display: grid; }
  .scena :global(.disegno) { width: 100%; max-width: 440px; height: auto; justify-self: end; opacity: 0.9; }
  .pannello {
    position: relative;
    margin-top: -16%;
    margin-right: 8%;
    display: grid;
    gap: var(--s-2);
    padding: var(--s-5);
    color: var(--testo);
    box-shadow: var(--ombra-su);
    background: var(--vetro);
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
    backdrop-filter: blur(14px) saturate(1.3);
    transition: transform var(--m-out) var(--ease), border-color var(--m-out) var(--ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .pannello:hover { transform: translateY(-2px); border-color: var(--linea-forte); }
    .pannello:hover .pannello-vai svg { transform: translateX(3px); }
  }
  @media (max-width: 899px) {
    .scena :global(.disegno) { max-width: 360px; justify-self: center; }
    .pannello { margin: -14% 0 0; }
  }
  .pannello-testa { display: flex; align-items: center; justify-content: space-between; gap: var(--s-2); margin-bottom: var(--s-1); }
  .etichetta { font-size: var(--t-label); font-weight: 500; color: var(--testo-3); }
  .pannello-titolo { font: 500 var(--t-h3) / 1.2 var(--serif); letter-spacing: -0.02em; }
  .pannello-testo { font-size: var(--t-small); color: var(--testo-2); line-height: 1.5; }
  .pannello-vai {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    margin-top: var(--s-2);
    padding-top: var(--s-3);
    border-top: 1px solid var(--linea);
    font-weight: 500;
    font-size: 15px;
    color: var(--accento);
  }
  .pannello-vai svg,
  .vai svg { width: 18px; height: 18px; transition: transform var(--m-out) var(--ease); }
  .pannello-vai path,
  .vai path { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

  /* ── Sezioni ── */
  .sezione { padding: var(--s-8) 0; border-top: 1px solid var(--linea); }
  .sezione h2 { font-size: var(--t-h2); letter-spacing: -0.03em; margin: 0 0 var(--s-6); }
  @media (min-width: 640px) {
    .sezione { padding: var(--s-9) 0; }
    .sezione h2 { margin-bottom: var(--s-7); }
  }
  .testa-sezione { display: grid; gap: var(--s-2); margin-bottom: var(--s-6); }
  .testa-sezione h2 { margin: 0; }
  .testa-sezione p { margin: 0; font-size: var(--t-lead); }

  .attivita { display: grid; gap: var(--s-3); margin: 0; padding: 0; list-style: none; }
  @media (min-width: 640px) {
    .attivita { grid-template-columns: repeat(2, 1fr); gap: var(--s-4); }
  }
  @media (min-width: 1000px) {
    .attivita { grid-template-columns: repeat(4, 1fr); }
  }
  .attivita li { display: grid; }
  .voce {
    display: grid;
    align-content: start;
    gap: var(--s-2);
    padding: var(--s-5);
    border-radius: var(--raggio-l);
    border: 1px solid transparent;
    color: var(--testo);
  }
  .voce {
    background: color-mix(in oklab, var(--superficie) 88%, transparent);
    border-color: var(--vetro-bordo);
  }
  .icona { width: 56px; height: 56px; margin-bottom: var(--s-2); }
  .icona :global(svg) { width: 100%; height: 100%; }
  .voce h3 { margin: 0; font-size: 20px; }
  .voce p { margin: 0; color: var(--testo-2); }
  .vai { display: inline-flex; align-items: center; gap: var(--s-2); margin-top: var(--s-2); font-weight: 500; font-size: 15px; color: var(--accento); }
  .voce:hover .vai svg { transform: translateX(3px); }

  /* La frase che si accende scorrendo. */
  .frase p { margin: 0; max-width: 22em; font: 500 var(--t-h2) / 1.16 var(--serif); letter-spacing: -0.03em; text-wrap: pretty; }
  .frase em { font-style: normal; }
  .frase strong { font-weight: inherit; }
  .frase :global(.si-accende .parola) { color: color-mix(in oklab, var(--testo) 45%, var(--bg)); transition: color 160ms ease; }
  .frase :global(.si-accende .parola.accesa) { color: var(--testo); }
  .frase :global(.si-accende strong .parola.accesa) { color: var(--rosso); }
  .cerchiato { position: relative; white-space: nowrap; color: var(--rosso); margin: 0 0.12em; }
  .cerchiato :global(.cerchio) {
    position: absolute;
    left: -14%;
    top: -22%;
    width: 128%;
    height: 144%;
    color: var(--rosso);
    pointer-events: none;
  }
  @media (min-width: 640px) {
    .frase { padding: var(--s-9) 0 calc(var(--s-9) * 1.5); }
    .frase p { font-size: clamp(40px, 3vw + 20px, 56px); }
  }

  /* ── Chi siamo ── */
  .persone { display: grid; gap: var(--s-3); margin: 0; padding: 0; list-style: none; }
  @media (min-width: 640px) {
    .persone { grid-template-columns: repeat(2, 1fr); gap: var(--s-4); }
  }
  @media (min-width: 1000px) {
    .persone { grid-template-columns: repeat(4, 1fr); }
  }
  .persona { display: grid; grid-template-columns: 52px minmax(0, 1fr); align-items: center; gap: var(--s-4); }
  .avatar {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accento-tinta);
    color: var(--accento);
    font: 500 18px/1 var(--serif);
    letter-spacing: 0.02em;
  }
  .chi { display: grid; gap: 2px; }
  .chi strong { font: 500 18px/1.25 var(--serif); letter-spacing: -0.01em; }
  .chi span { font-size: var(--t-small); color: var(--testo-2); }

  /* ── Contatti ── */
  .contatti { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-5); align-items: start; }
  .contatti-parole h2 { margin-bottom: var(--s-4); }
  .lead-piccolo { max-width: 34em; margin: 0 0 var(--s-5); font-size: var(--t-lead); line-height: 1.55; color: var(--testo-2); }
  .contatti-vie { display: flex; flex-wrap: wrap; gap: var(--s-3); }
  .contatti-vie p { margin: 0; }
  .contatti-disegno { width: 84px; height: 84px; }
  .contatti-disegno :global(svg) { width: 100%; height: 100%; }
  @media (min-width: 640px) {
    .contatti-disegno { width: 160px; height: 160px; }
  }

  .piede {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-2) var(--s-5);
    padding: var(--s-6) 0 env(safe-area-inset-bottom);
    border-top: 1px solid var(--linea);
    font-size: var(--t-small);
    color: var(--testo-2);
  }
  .piede-link { display: flex; gap: var(--s-5); }
</style>
