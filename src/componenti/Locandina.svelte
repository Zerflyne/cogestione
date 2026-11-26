<script>
  // La locandina di un corso: copertina (foto, oppure colore + icona disegnata), titolo e dettagli.
  // Si usa nell'anteprima della proposta, in Le mie proposte e in Revisione.
  import Schizzo from './Schizzo.svelte';
  import { urlCopertina } from '../lib/copertine.js';
  import { ICONA_AULA } from '../lib/locandina.js';

  let { corso, ritardo = 0, bassa = false, children } = $props();
  const icona = $derived(corso.icona || ICONA_AULA[corso.aula_richiesta] || 'lampadina');
</script>

<div class="testa tinta-{corso.colore || 'inchiostro'}" class:con-foto={corso.immagine_path} class:bassa>
  {#if corso.immagine_path}
    <img src={urlCopertina(corso.immagine_path)} alt="" loading="lazy" />
    <span class="bollino" aria-hidden="true"><Schizzo nome={icona} {ritardo} /></span>
  {:else}
    {#key icona}
      <span class="icona" aria-hidden="true"><Schizzo nome={icona} {ritardo} /></span>
    {/key}
  {/if}
  {#if children}<div class="sopra">{@render children()}</div>{/if}
</div>

<style>
  .testa {
    position: relative;
    aspect-ratio: 16 / 7;
    display: grid;
    place-items: center;
    overflow: hidden;
    color: var(--tinta);
    background:
      radial-gradient(color-mix(in oklab, var(--tinta) 22%, transparent) 1.1px, transparent 1.4px) 0 0 / 14px 14px,
      radial-gradient(120% 90% at 80% 0%, color-mix(in oklab, var(--tinta) 22%, transparent), transparent 60%),
      color-mix(in oklab, var(--tinta) 10%, var(--superficie));
    transition: background-color 300ms var(--ease), color 300ms var(--ease);
  }
  .testa.con-foto { aspect-ratio: 16 / 9; }
  .testa.bassa { aspect-ratio: 3 / 1; }
  .testa.bassa .icona { width: 22%; max-width: 72px; }
  .testa.bassa .bollino { width: 40px; height: 40px; padding: 6px; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .icona { width: 38%; max-width: 120px; aspect-ratio: 1; animation: galleggia 5s ease-in-out infinite; }
  .icona :global(svg), .bollino :global(svg) { width: 100%; height: 100%; }
  /* Nella locandina il disegnino prende tutto il colore scelto (anche i tratti rossi). */
  .testa :global(.schizzo .rosso),
  .testa :global(.schizzo path.rosso) { stroke: var(--tinta); color: var(--tinta); }
  .testa :global(.schizzo .pieno) { fill: var(--tinta); }
  @keyframes galleggia { 50% { transform: translateY(-6px) rotate(-3deg); } }
  .bollino {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 52px;
    height: 52px;
    padding: 8px;
    border-radius: 50%;
    background: color-mix(in oklab, var(--superficie) 88%, transparent);
    box-shadow: var(--ombra-su);
    transform: rotate(-8deg);
  }
  .sopra { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; gap: 6px; }
</style>
