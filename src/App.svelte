<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
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
  import Studenti from './pagine/Studenti.svelte';

  onMount(avvia);
  const riduci = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const serveAccesso = ['profilo', 'proponi', 'proposte', 'revisione', 'impostazioni', 'studenti'];
  const soloAdmin = ['revisione', 'impostazioni', 'studenti'];

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
    <div class="giro" role="status" aria-label="Caricamento"></div>
  </main>
{:else}
  {#if app.irraggiungibile}
    <div class="avviso avviso-attenzione fuori-linea" role="alert">
      Il sito non riesce a raggiungere il database. Riprova tra qualche minuto; se continua, avvisa i rappresentanti.
    </div>
  {/if}
  <main>
    {#key pagina + (app.rotta.param ?? '')}
    <div class="vista" in:fade={{ duration: riduci ? 0 : 180 }}>
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
    {:else if pagina === 'studenti'}
      <Studenti />
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
  .fuori-linea {
    position: fixed;
    top: calc(var(--nav-h) + 8px);
    left: 12px;
    right: 12px;
    z-index: 11;
    max-width: 720px;
    margin: 0 auto;
  }
  .caricamento {
    display: grid;
    place-items: center;
    min-height: 70vh;
  }
  .giro {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--linea-forte);
    border-top-color: var(--accento);
    animation: giro 1s linear infinite;
  }
  @keyframes giro { to { transform: rotate(360deg); } }
</style>
