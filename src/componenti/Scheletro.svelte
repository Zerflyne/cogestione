<script>
  // Segnaposto animato mentre i dati arrivano.
  let { righe = 3 } = $props();
</script>

<div class="pila" aria-busy="true" aria-label="Caricamento">
  {#each Array(righe) as _, i (i)}
    <div class="carta scheletro-carta">
      <div class="osso" style="width: 34%"></div>
      <div class="osso osso-titolo" style="width: {70 - i * 8}%"></div>
      <div class="osso" style="width: 88%"></div>
    </div>
  {/each}
</div>

<style>
  .scheletro-carta { display: grid; gap: 10px; }
  .osso {
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--superficie-2) 0%, var(--linea) 50%, var(--superficie-2) 100%);
    background-size: 200% 100%;
    animation: luccica 1.4s ease-in-out infinite;
  }
  .osso-titolo { height: 20px; }
  @keyframes luccica {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
  }
</style>
