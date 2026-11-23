<script>
  // Carta-collegamento con un disegnino: porta a un'altra sezione.
  import Schizzo from './Schizzo.svelte';
  let { href, titolo, testo, disegno } = $props();
</script>

<a class="carta carta-viva collegamento" {href}>
  <span class="icona"><Schizzo nome={disegno} /></span>
  <span class="parole">
    <strong>{titolo}</strong>
    <span>{testo}</span>
  </span>
  <svg class="freccia-voce" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
</a>

<style>
  .collegamento {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) 24px;
    align-items: center;
    gap: var(--s-4);
    color: var(--testo);
  }
  .icona { width: 56px; height: 56px; }
  .icona :global(svg) { width: 100%; height: 100%; }
  .parole { display: grid; gap: 2px; }
  .parole strong { font: 500 18px/1.25 var(--serif); letter-spacing: -0.01em; }
  .parole span { font-size: var(--t-small); line-height: 1.45; color: var(--testo-2); }
  .freccia-voce { width: 22px; height: 22px; color: var(--testo-3); transition: transform var(--m-out) var(--ease), color var(--m-out) var(--ease); }
  .freccia-voce path { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .collegamento:hover .freccia-voce { transform: translateX(3px); color: var(--accento); }
</style>
