<script>
  import { app } from '../lib/stato.svelte.js';
  import { FASI, formatoData } from '../lib/etichette.js';

  let imp = $derived(app.impostazioni);
  let fase = $derived(imp?.fase ?? 'chiusa');
  let nome = $derived(app.studente?.nome);

  const passi = [
    { id: 'proposte', titolo: 'Proposte', testo: 'Proponi un corso: nome, descrizione, ore e aula.' },
    { id: 'calendario', titolo: 'Calendario', testo: 'I rappresentanti compongono il programma e lo portano al Collegio docenti.' },
    { id: 'iscrizioni', titolo: 'Iscrizioni', testo: 'Scegli un corso per ogni fascia oraria. Posti per tutti.' },
    { id: 'cogestione', titolo: 'Cogestione', testo: 'Cinque giorni interi, organizzati da studenti e docenti.' },
  ];
  const ordine = ['chiusa', 'proposte', 'calendario', 'iscrizioni', 'cogestione'];
  const statoPasso = (id) => {
    const a = ordine.indexOf(fase), p = ordine.indexOf(id);
    return p < a ? 'fatto' : p === a ? 'ora' : 'poi';
  };
</script>

<div class="pagina pila-l">
  <header class="testata">
    <p class="etichetta-sezione">IIS Evangelista Torricelli</p>
    <h1>{nome ? `Ciao ${nome}.` : 'Cogestione'}</h1>
    <p class="attenuato">
      Proposte, programma e iscrizioni della cogestione, in un unico posto.
    </p>
  </header>

  <section class="carta pila stato-fase">
    <div class="riga">
      <span class="etichetta-sezione" style="margin:0">Adesso</span>
      <span class="badge badge-in_revisione spinge">{FASI[fase]}</span>
    </div>

    {#if fase === 'proposte'}
      <h2>Le proposte sono aperte</h2>
      <p class="attenuato">
        Hai un'idea per un corso, un laboratorio o un'attività? Proponila: i rappresentanti la valutano e ti rispondono
        qui.
        {#if imp?.proposte_chiusura}<br />Si chiude il <strong>{formatoData(imp.proposte_chiusura)}</strong>.{/if}
      </p>
      <a class="btn btn-primario btn-pieno" href={app.sessione ? '#/proponi' : '#/accesso'}>Proponi un corso</a>
    {:else if fase === 'calendario'}
      <h2>Il programma è in preparazione</h2>
      <p class="attenuato">Le proposte sono chiuse. Stiamo componendo il calendario da presentare al Collegio docenti.</p>
    {:else if fase === 'iscrizioni'}
      <h2>Iscrizioni aperte</h2>
      <p class="attenuato">Le iscrizioni arrivano a breve su questa pagina.</p>
    {:else if fase === 'cogestione'}
      <h2>La cogestione è in corso</h2>
      <p class="attenuato">Buone giornate a tutti.</p>
    {:else}
      <h2>Ancora un po' di pazienza</h2>
      <p class="attenuato">
        Le proposte non sono ancora aperte.
        {#if imp?.proposte_apertura}Si parte il <strong>{formatoData(imp.proposte_apertura)}</strong>.{/if}
      </p>
    {/if}
  </section>

  <section>
    <p class="etichetta-sezione">Come funziona</p>
    <ol class="percorso">
      {#each passi as p, i (p.id)}
        <li class={statoPasso(p.id)}>
          <span class="numero">{i + 1}</span>
          <div>
            <h3>{p.titolo}</h3>
            <p class="attenuato piccolo">{p.testo}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <footer class="attenuato piccolo">Rappresentanti degli studenti · IIS Evangelista Torricelli</footer>
</div>

<style>
  .testata { padding-top: 12px; }
  .testata h1 { margin-bottom: 8px; }
  .stato-fase h2 { margin: 4px 0 0; }
  .stato-fase p { margin: 0; }

  .percorso { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .percorso li {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--linea);
  }
  .percorso li:last-child { border-bottom: 0; }
  .percorso h3 { font-size: 1rem; margin: 4px 0 2px; }
  .percorso p { margin: 0; }
  .numero {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--linea);
    font: 600 0.85rem var(--sans);
    color: var(--testo-3);
  }
  .ora .numero { background: var(--accento); border-color: var(--accento); color: var(--accento-su); }
  .fatto .numero { background: var(--superficie-2); color: var(--testo-2); }
  .poi h3 { color: var(--testo-2); }
  footer { text-align: center; padding-top: 8px; }
</style>
