<script>
  import { supabase } from '../lib/supabase.js';
  import { app, caricaStudente, esci, profiloCompleto, impostaTema, temaAttuale, isAdmin } from '../lib/stato.svelte.js';
  import { messaggioErrore } from '../lib/etichette.js';

  const s = app.studente;
  let nome = $state(s?.nome ?? '');
  let cognome = $state(s?.cognome ?? '');
  let classe = $state(s?.classe ?? '');
  let errore = $state(null);
  let salvato = $state(false);
  let inCorso = $state(false);
  let tema = $state(temaAttuale());

  const completo = $derived(profiloCompleto());
  const classeBloccata = Boolean(s?.classe);
  const classePulita = $derived(classe.toUpperCase().replace(/[^0-9A-Z]/g, ''));
  const classeValida = $derived(/^[1-5][A-Z]{1,3}$/.test(classePulita));

  async function salva(e) {
    e.preventDefault();
    errore = null;
    salvato = false;
    if (!nome.trim() || !cognome.trim()) return (errore = 'Inserisci nome e cognome.');
    if (!classeValida) return (errore = 'Scrivi la classe come 4D o 1LA.');
    inCorso = true;
    const { error } = await supabase
      .from('studenti')
      .update({ nome: nome.trim(), cognome: cognome.trim(), classe: classePulita })
      .eq('id', s.id);
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    await caricaStudente();
    salvato = true;
  }

  function cambiaTema(t) {
    tema = t;
    impostaTema(t);
  }
</script>

<div class="pagina pila-l">
  <header>
    <h1>{completo ? 'Profilo' : 'Un ultimo passo'}</h1>
    {#if !completo}
      <p class="attenuato">Completa i tuoi dati: servono ai rappresentanti per organizzare corsi e presenze.</p>
    {:else}
      <p class="attenuato">{app.studente?.email}</p>
    {/if}
  </header>

  <form class="carta pila" onsubmit={salva}>
    <div class="due">
      <div class="campo">
        <label for="nome">Nome</label>
        <input id="nome" type="text" autocomplete="given-name" bind:value={nome} />
      </div>
      <div class="campo">
        <label for="cognome">Cognome</label>
        <input id="cognome" type="text" autocomplete="family-name" bind:value={cognome} />
      </div>
    </div>
    <div class="campo">
      <label for="classe">Classe</label>
      <input
        id="classe"
        type="text"
        autocapitalize="characters"
        placeholder="es. 4D o 1LA"
        bind:value={classe}
        disabled={classeBloccata}
      />
      <span class="aiuto">
        {classeBloccata ? 'Per cambiarla scrivi ai rappresentanti d\'istituto.' : 'Si sceglie una volta sola: controlla bene.'}
      </span>
    </div>
    {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}
    {#if salvato}<div class="avviso avviso-ok">Salvato.</div>{/if}
    <button class="btn btn-primario btn-pieno" disabled={inCorso}>{completo ? 'Salva' : 'Continua'}</button>
  </form>

  {#if completo}
    <section class="carta pila">
      <p class="etichetta-sezione" style="margin:0">Aspetto</p>
      <div class="schede" role="group" aria-label="Tema">
        <button class="scheda" aria-pressed={tema === 'auto'} onclick={() => cambiaTema('auto')}>Automatico</button>
        <button class="scheda" aria-pressed={tema === 'light'} onclick={() => cambiaTema('light')}>Chiaro</button>
        <button class="scheda" aria-pressed={tema === 'dark'} onclick={() => cambiaTema('dark')}>Scuro</button>
      </div>
    </section>

    {#if isAdmin()}
      <a class="btn btn-secondario btn-pieno" href="#/impostazioni">Impostazioni della cogestione</a>
      <a class="btn btn-tenue btn-pieno" href="#/studenti">Studenti e codici</a>
    {/if}
  {/if}

  <button class="btn btn-pericolo btn-pieno" onclick={esci}>Esci</button>
</div>

<style>
  .due { display: grid; gap: 12px; }
  @media (min-width: 520px) {
    .due { grid-template-columns: 1fr 1fr; }
  }
  .schede { margin: 0; padding: 0; }
</style>
