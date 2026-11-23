<script>
  // Intestazione delle pagine interne: titolo, un tratto rosso a mano e un disegnino.
  import Schizzo from './Schizzo.svelte';

  let { titolo, disegno = null, indietro = null, children } = $props();
</script>

<header class="intestazione-pagina testa">
  <div class="parole">
    {#if indietro}<a href={indietro.href} class="piccolo indietro">← {indietro.testo}</a>{/if}
    <h1>{titolo}</h1>
    <Schizzo nome="sottolinea" class="tratto" ritardo={250} durata={600} spessore={2.4} />
    {#if children}<div class="sotto">{@render children()}</div>{/if}
  </div>
  {#if disegno}
    <div class="disegno"><Schizzo nome={disegno} ritardo={150} /></div>
  {/if}
</header>

<style>
  .testa {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--s-4);
    animation: entra 600ms var(--ease-entra) both;
  }
  @keyframes entra { from { opacity: 0; transform: translateY(10px); } }
  .parole { display: grid; gap: var(--s-2); }
  .parole :global(.tratto) { width: 88px; height: 12px; color: var(--rosso); margin: -4px 0 var(--s-1); }
  .sotto :global(p) { margin: 0; color: var(--testo-2); font-size: var(--t-lead); line-height: 1.5; }
  .sotto :global(p.piccolo) { font-size: var(--t-small); }
  .disegno { width: 76px; height: 76px; color: var(--testo); margin-bottom: var(--s-2); }
  .disegno :global(svg) { width: 100%; height: 100%; }
  @media (min-width: 640px) {
    .disegno { width: 112px; height: 112px; }
  }
</style>
