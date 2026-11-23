<script>
  import { app, isAdmin } from '../lib/stato.svelte.js';

  let { attiva } = $props();

  // Icone a tratto, 24×24.
  const icone = {
    home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
    proposte: 'M8 6h11M8 12h11M8 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    revisione: 'M9 12.5l2 2 4-4.5M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z',
    profilo: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  };

  let voci = $derived(
    app.sessione
      ? [
          { id: 'home', testo: 'Home', breve: 'Home' },
          { id: 'proposte', testo: 'Le mie proposte', breve: 'Proposte' },
          ...(isAdmin() ? [{ id: 'revisione', testo: 'Revisione', breve: 'Revisione' }] : []),
          { id: 'profilo', testo: 'Profilo', breve: 'Profilo' },
        ]
      : [],
  );
  // Le pagine dei rappresentanti stanno sotto "Profilo".
  const corrente = (id) => attiva === id || (id === 'profilo' && ['impostazioni', 'studenti'].includes(attiva));
  const href = (id) => (id === 'home' ? '#/' : `#/${id}`);
</script>

<header class="barra">
  <div class="wrap">
    <a class="logo" href="#/" aria-label="Cogestione, home">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <rect width="64" height="64" rx="14" class="logo-fondo" />
        <path d="M18 20h28M32 20v26" class="logo-t" />
      </svg>
      <span>Cogestione</span>
    </a>

    {#if voci.length}
      <nav class="parole" aria-label="Navigazione principale">
        <ul>
          {#each voci as v (v.id)}
            <li>
              <a href={href(v.id)} aria-current={corrente(v.id) ? 'page' : undefined}>{v.testo}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}

    <div class="azione" class:nascondi-telefono={attiva === 'home'}>
      {#if app.sessione}
        {#if attiva !== 'proponi'}
          <a class="btn btn-primario" href="#/proponi">
            <span class="solo-largo">Proponi un corso</span><span class="solo-stretto">Proponi</span>
          </a>
        {/if}
      {:else if attiva !== 'accesso'}
        <a class="btn btn-primario" href="#/accesso">Accedi</a>
      {/if}
    </div>
  </div>
</header>

{#if voci.length}
  <nav class="tab" aria-label="Navigazione principale">
    <ul>
      {#each voci as v (v.id)}
        <li>
          <a href={href(v.id)} aria-current={corrente(v.id) ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={icone[v.id]} /></svg>
            <span>{v.breve}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  /* Barra in alto: fissa, opaca, un filo sotto. Uguale a ogni punto dello scorrimento. */
  .barra {
    position: fixed;
    inset: 0 0 auto;
    z-index: 10;
    height: var(--nav-h);
    background: var(--bg);
    border-bottom: 1px solid var(--linea);
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
  @media (min-width: 640px) {
    .wrap { padding: 0 var(--s-5); }
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--testo);
    font: 500 20px/1 var(--serif);
    letter-spacing: -0.02em;
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
  /* La parola si scurisce e sotto si disegna una linea; la pagina corrente ha la barra di 2px. */
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
  .parole a:hover { color: var(--testo); transition-duration: var(--m-in); }
  .parole a:hover::after { transform: scaleX(1); transform-origin: left; transition-duration: var(--m-in); }
  .parole a[aria-current='page'] { color: var(--testo); }
  .parole a[aria-current='page']::after { height: 2px; bottom: 7px; transform: none; }

  .azione { margin-left: auto; display: flex; }
  .solo-largo { display: none; }
  @media (max-width: 639px) {
    .nascondi-telefono { display: none; }
  }

  @media (min-width: 640px) {
    .parole { display: block; }
    .solo-largo { display: inline; }
    .solo-stretto { display: none; }
  }

  /* Telefono: barra delle schede in basso, a tutta larghezza, opaca, filo sopra. */
  .tab {
    position: fixed;
    inset: auto 0 0;
    z-index: 10;
    height: var(--barra-h);
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--bg);
    border-top: 1px solid var(--linea);
  }
  .tab ul {
    height: 64px;
    display: flex;
    margin: 0;
    padding: 0 var(--s-2);
    list-style: none;
  }
  .tab li { flex: 1; }
  .tab a {
    position: relative;
    height: 100%;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 4px;
    color: var(--testo-3);
    font: 500 13px/1 var(--sans);
    transition: color var(--m-out) var(--ease);
  }
  .tab a::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 28%;
    right: 28%;
    height: 2px;
    border-radius: 0 0 2px 2px;
    background: var(--accento);
    transform: scaleX(0);
    transition: transform 240ms var(--ease);
  }
  .tab a[aria-current='page'] { color: var(--testo); }
  .tab a[aria-current='page']::before { transform: scaleX(1); }
  .tab a[aria-current='page'] svg { color: var(--accento); }
  .tab a:active svg { transform: scale(0.92); }
  .tab svg { transition: transform var(--m-press) var(--ease); }
  .tab path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (min-width: 640px) {
    .tab { display: none; }
  }
</style>
