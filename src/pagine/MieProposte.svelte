<script>
  import { supabase } from '../lib/supabase.js';
  import { app } from '../lib/stato.svelte.js';
  import { STATI, AULE, messaggioErrore } from '../lib/etichette.js';

  let corsi = $state([]);
  let caricamento = $state(true);
  let errore = $state(null);
  const appenaInviata = app.rotta.param === 'inviata';
  const aperte = $derived(app.impostazioni?.fase === 'proposte');

  async function carica() {
    const { data, error } = await supabase
      .from('corsi')
      .select('*')
      .eq('proponente_id', app.studente.id)
      .order('creato_il', { ascending: false });
    if (error) errore = messaggioErrore(error);
    corsi = data ?? [];
    caricamento = false;
  }

  async function ritira(c) {
    if (!confirm(`Ritirare la proposta "${c.titolo}"? Non si può annullare.`)) return;
    const { error } = await supabase.from('corsi').delete().eq('id', c.id);
    if (error) return (errore = messaggioErrore(error));
    corsi = corsi.filter((x) => x.id !== c.id);
  }

  $effect(() => {
    if (app.studente) carica();
  });

  const modificabile = (c) => aperte && ['inviata', 'da_modificare'].includes(c.stato);
</script>

<div class="pagina pila-l">
  <header class="riga">
    <h1 style="margin:0">Le mie proposte</h1>
    {#if aperte}<a class="btn btn-primario btn-s spinge" href="#/proponi">Nuova</a>{/if}
  </header>

  {#if appenaInviata}
    <div class="avviso avviso-ok">Proposta inviata. Ti rispondiamo qui appena la valutiamo.</div>
  {/if}
  {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}

  {#if caricamento}
    <p class="attenuato">Caricamento…</p>
  {:else if corsi.length === 0}
    <div class="vuoto carta">
      <p>Non hai ancora proposto nessun corso.</p>
      {#if aperte}<a class="btn btn-primario" href="#/proponi">Proponi un corso</a>{/if}
    </div>
  {:else}
    <ul class="elenco">
      {#each corsi as c (c.id)}
        <li class="carta pila">
          <div class="riga">
            <span class="badge badge-{c.stato}">{STATI[c.stato]}</span>
            <span class="attenuato piccolo spinge">{AULE[c.aula_richiesta]}</span>
          </div>
          <h2>{c.titolo}</h2>
          <p class="attenuato piccolo descr">{c.descrizione}</p>

          {#if c.nota_revisione && ['da_modificare', 'respinta'].includes(c.stato)}
            <div class="avviso {c.stato === 'respinta' ? 'avviso-errore' : 'avviso-attenzione'} piccolo">
              <strong>Nota dei rappresentanti:</strong> {c.nota_revisione}
            </div>
          {/if}
          {#if c.aula_richiesta === 'palestra' && c.parere_dipartimento === null && !['respinta'].includes(c.stato)}
            <p class="attenuato piccolo" style="margin:0">In attesa del parere del dipartimento di scienze motorie.</p>
          {/if}

          {#if modificabile(c)}
            <div class="riga">
              <a class="btn btn-tenue btn-s" href="#/proponi/{c.id}">
                {c.stato === 'da_modificare' ? 'Correggi e reinvia' : 'Modifica'}
              </a>
              <button class="btn btn-pericolo btn-s spinge" onclick={() => ritira(c)}>Ritira</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .elenco { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  h2 { font-size: 1.15rem; margin: 2px 0 0; }
  .descr {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
