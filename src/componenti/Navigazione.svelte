<script>
  import { app, isAdmin } from '../lib/stato.svelte.js';

  let { attiva } = $props();

  // Icone a tratto, 24×24.
  const icone = {
    home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
    proponi: 'M12 5v14M5 12h14',
    proposte: 'M8 6h11M8 12h11M8 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    revisione: 'M9 12.5l2 2 4-4.5M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z',
    profilo: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
    accesso: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4',
  };

  let voci = $derived(
    app.sessione
      ? [
          { id: 'home', testo: 'Home' },
          { id: 'proponi', testo: 'Proponi' },
          { id: 'proposte', testo: 'Le mie' },
          ...(isAdmin() ? [{ id: 'revisione', testo: 'Revisione' }] : []),
          { id: 'profilo', testo: 'Profilo' },
        ]
      : [
          { id: 'home', testo: 'Home' },
          { id: 'accesso', testo: 'Accedi' },
        ],
  );
</script>

<nav aria-label="Navigazione principale">
  <ul>
    {#each voci as v (v.id)}
      <li>
        <a href={v.id === 'home' ? '#/' : `#/${v.id}`} aria-current={attiva === v.id ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d={icone[v.id]} />
          </svg>
          <span>{v.testo}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 10;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(14px);
    -webkit-backdrop-filter: saturate(1.4) blur(14px);
    border-top: 1px solid var(--linea);
    padding-bottom: env(safe-area-inset-bottom);
  }
  ul {
    display: flex;
    max-width: var(--larghezza);
    margin: 0 auto;
    padding: 0 4px;
    list-style: none;
  }
  li { flex: 1; }
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: var(--nav-h);
    color: var(--testo-3);
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: 500;
  }
  a[aria-current='page'] { color: var(--accento); }
  svg path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Su schermi larghi la barra sale in alto. */
  @media (min-width: 900px) {
    nav {
      inset: 0 0 auto 0;
      border-top: 0;
      border-bottom: 1px solid var(--linea);
      padding-bottom: 0;
    }
    ul { justify-content: center; gap: 8px; }
    li { flex: none; }
    a {
      flex-direction: row;
      gap: 8px;
      height: 56px;
      padding: 0 14px;
      font-size: 0.9rem;
    }
    :global(.pagina) { padding-top: 88px !important; padding-bottom: 48px !important; }
  }
</style>
