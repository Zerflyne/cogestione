<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { configurato } from './lib/supabase.js';
  import { app, avvia, isAdmin, profiloCompleto } from './lib/stato.svelte.js';
  import Navigazione from './componenti/Navigazione.svelte';
  import Home from './pagine/Home.svelte';
  import Accesso from './pagine/Accesso.svelte';
  import Profilo from './pagine/Profilo.svelte';
  import Proponi from './pagine/Proponi.svelte';
  import MieProposte from './pagine/MieProposte.svelte';
  import Revisione from './pagine/Revisione.svelte';
  import Impostazioni from './pagine/Impostazioni.svelte';

  onMount(avvia);
  const riduci = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const serveAccesso = ['profilo', 'proponi', 'proposte', 'revisione', 'impostazioni'];
  const soloAdmin = ['revisione', 'impostazioni'];

  // Decide quale pagina mostrare, con i controlli di accesso.
  let pagina = $derived.by(() => {
    const nome = app.rotta.nome;
    if (serveAccesso.includes(nome) && !app.sessione) return 'accesso';
    if (app.sessione && app.studente && !profiloCompleto() && nome !== 'home') return 'profilo';
    if (soloAdmin.includes(nome) && !isAdmin()) return 'home';
    if (nome === 'accesso' && app.sessione) return 'home';
    return nome;
  });
</script>

{#if !configurato}
  <main class="pagina">
    <div class="carta pila">
      <h1>Da configurare</h1>
      <p class="attenuato">
        Manca il collegamento a Supabase: controlla URL e chiave nel file <code>.env</code>. Le istruzioni
        complete sono nel README.
      </p>
    </div>
  </main>
{:else if !app.pronto}
  <main class="pagina caricamento" aria-busy="true">
    <div class="puntino"></div>
  </main>
{:else}
  <main>
    {#key pagina + (app.rotta.param ?? '')}
    <div class="vista" in:fly={{ y: 14, duration: riduci ? 0 : 420, easing: cubicOut }}>
    {#if pagina === 'accesso'}
      <Accesso />
    {:else if pagina === 'profilo'}
      <Profilo />
    {:else if pagina === 'proponi'}
      <Proponi id={app.rotta.param} />
    {:else if pagina === 'proposte'}
      <MieProposte />
    {:else if pagina === 'revisione'}
      <Revisione />
    {:else if pagina === 'impostazioni'}
      <Impostazioni />
    {:else}
      <Home />
    {/if}
    </div>
    {/key}
  </main>
  <Navigazione attiva={pagina} />
{/if}

<style>
  .vista { position: relative; isolation: isolate; }
  .caricamento {
    display: grid;
    place-items: center;
    min-height: 70vh;
  }
  .puntino {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accento);
    animation: pulsa 1s ease-in-out infinite alternate;
  }
  @keyframes pulsa {
    from { opacity: 0.25; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1.1); }
  }
</style>
