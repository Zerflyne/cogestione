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
          { id: 'proposte', testo: 'Le mie' },
          { id: 'proponi', testo: 'Proponi', centrale: true },
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
      {@const corrente = attiva === v.id}
      <li>
        <a
          href={v.id === 'home' ? '#/' : `#/${v.id}`}
          class:corrente
          class:centrale={v.centrale}
          aria-current={corrente ? 'page' : undefined}
          aria-label={v.testo}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={icone[v.id]} /></svg>
          {#if !v.centrale}
            <span class="etichetta"><span>{v.testo}</span></span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  nav {
    position: fixed;
    left: 50%;
    bottom: calc(14px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 20;
    animation: entra 0.6s var(--molla) both;
  }
  @keyframes entra {
    from { transform: translate(-50%, 24px); opacity: 0; }
  }
  ul {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    padding: 6px;
    list-style: none;
    border-radius: 999px;
    background: color-mix(in srgb, var(--superficie) 78%, transparent);
    backdrop-filter: saturate(1.6) blur(18px);
    -webkit-backdrop-filter: saturate(1.6) blur(18px);
    border: 1px solid color-mix(in srgb, var(--linea) 80%, transparent);
    box-shadow:
      0 1px 0 rgb(255 255 255 / 0.06) inset,
      0 12px 32px -12px rgb(20 20 19 / 0.28);
  }

  a {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 13px;
    border-radius: 999px;
    color: var(--testo-2);
    text-decoration: none;
    font: 500 0.875rem/1 var(--sans);
    transition: background 0.35s var(--morbida), color 0.35s var(--morbida), transform 0.25s var(--molla);
  }
  a:active { transform: scale(0.92); }
  a:hover:not(.corrente):not(.centrale) { color: var(--testo); }

  /* L'etichetta si apre solo per la voce attiva. */
  .etichetta {
    display: grid;
    grid-template-columns: 0fr;
    transition: grid-template-columns 0.4s var(--morbida), margin 0.4s var(--morbida);
  }
  .etichetta > span {
    overflow: hidden;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.25s;
  }
  .corrente {
    background: var(--accento-tinta);
    color: var(--accento);
  }
  .corrente .etichetta { grid-template-columns: 1fr; margin-left: 8px; }
  .corrente .etichetta > span { opacity: 1; transition-delay: 0.08s; }

  /* Il "+" centrale è il gesto principale: sempre in evidenza. */
  .centrale {
    width: 48px;
    padding: 0;
    justify-content: center;
    background: var(--accento);
    color: var(--accento-su);
    box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--accento) 70%, transparent);
  }
  .centrale svg { transition: transform 0.4s var(--molla); }
  .centrale:hover svg,
  .centrale.corrente svg { transform: rotate(90deg); }

  svg { flex: none; }
  svg path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .centrale svg path { stroke-width: 2.2; }

  /* Su schermi larghi il dock sale in alto. */
  @media (min-width: 900px) {
    nav { top: 16px; bottom: auto; }
    @keyframes entra {
      from { transform: translate(-50%, -24px); opacity: 0; }
    }
    :global(.pagina) { padding-top: 104px !important; padding-bottom: 48px !important; }
  }
</style>
