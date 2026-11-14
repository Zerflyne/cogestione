<script>
  import { supabase } from '../lib/supabase.js';
  import { app } from '../lib/stato.svelte.js';
  import { messaggioErrore } from '../lib/etichette.js';
  import { leggiElenco, perClasse, inCsv } from '../lib/elenco.js';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Scheletro from '../componenti/Scheletro.svelte';

  const dominio = app.impostazioni.dominio_email;
  const indirizzoSito = location.origin + location.pathname.replace(/index\.html$/, '');

  let studenti = $state([]);
  let caricamento = $state(true);
  let errore = $state(null);
  let messaggio = $state(null);
  let inCorso = $state(false);

  async function carica() {
    const tutti = [];
    for (let da = 0; ; da += 1000) {
      const { data, error } = await supabase
        .from('studenti')
        .select('id, email, nome, cognome, classe, codice, user_id, ruoli')
        .range(da, da + 999);
      if (error) {
        errore = messaggioErrore(error);
        break;
      }
      tutti.push(...data);
      if (data.length < 1000) break;
    }
    studenti = tutti.sort(perClasse);
    caricamento = false;
  }
  $effect(() => {
    carica();
  });

  const classi = $derived([...new Set(studenti.map((s) => s.classe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it', { numeric: true })));
  const senzaCodice = $derived(studenti.filter((s) => !s.codice).length);
  const entrati = $derived(studenti.filter((s) => s.user_id).length);

  // ── Importazione ───────────────────────────────
  let testo = $state('');
  let anteprima = $state(null);

  async function daFile(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) {
      errore = 'Salva prima il foglio come CSV (File → Salva con nome → CSV) e carica quello.';
      return;
    }
    testo = await file.text();
    controlla();
  }

  function controlla() {
    errore = messaggio = null;
    const { righe, scarti } = leggiElenco(testo, dominio);
    const esistenti = new Map(studenti.map((s) => [s.email, s]));
    const nuovi = righe.filter((r) => !esistenti.has(r.email));
    const cambiati = righe.filter((r) => {
      const s = esistenti.get(r.email);
      if (!s) return false;
      return (r.classe && r.classe !== s.classe) || (!r.dedotto && (r.nome !== s.nome || r.cognome !== s.cognome));
    });
    anteprima = { righe, scarti, nuovi, cambiati, esistenti };
  }

  async function importa() {
    const { nuovi, cambiati, esistenti } = anteprima;
    // Per chi c'è già non si cancella nulla: una classe vuota o un nome ricavato dall'email non sovrascrivono.
    const dati = [...nuovi, ...cambiati].map((r) => {
      const s = esistenti.get(r.email);
      return {
        email: r.email,
        classe: r.classe || s?.classe || '',
        nome: r.dedotto && s?.nome ? s.nome : r.nome,
        cognome: r.dedotto && s?.cognome ? s.cognome : r.cognome,
      };
    });
    errore = messaggio = null;
    inCorso = true;
    for (let i = 0; i < dati.length; i += 200) {
      const { error } = await supabase.from('studenti').upsert(dati.slice(i, i + 200), { onConflict: 'email' });
      if (error) {
        inCorso = false;
        errore = messaggioErrore(error);
        await carica();
        return;
      }
    }
    inCorso = false;
    messaggio = `Elenco importato: ${nuovi.length} nuovi, ${cambiati.length} aggiornati.`;
    anteprima = null;
    testo = '';
    await carica();
  }

  // ── Codici ─────────────────────────────────────
  async function generaCodici() {
    errore = messaggio = null;
    inCorso = true;
    const { data, error } = await supabase.rpc('genera_codici');
    inCorso = false;
    if (error) return (errore = messaggioErrore(error));
    messaggio = data === 0 ? 'Tutti hanno già un codice.' : `Generati ${data} codici.`;
    await carica();
  }

  const aGruppi = (c) => (c ? `${c.slice(0, 4)}-${c.slice(4)}` : '');

  // ── Stampa ed esportazione ─────────────────────
  let classeStampa = $state('');
  let soloNonEntrati = $state(true);
  const daStampare = $derived(
    studenti.filter((s) => s.codice && (!classeStampa || s.classe === classeStampa) && (!soloNonEntrati || !s.user_id)),
  );
  const gruppiStampa = $derived.by(() => {
    const g = new Map();
    for (const s of daStampare) {
      const k = s.classe || 'Senza classe';
      g.set(k, [...(g.get(k) ?? []), s]);
    }
    return [...g];
  });

  function scarica() {
    const righe = studenti.filter((s) => s.codice).map((s) => ({ ...s, codice: aGruppi(s.codice), sito: indirizzoSito }));
    const blob = new Blob([inCsv(righe, ['email', 'cognome', 'nome', 'classe', 'codice', 'sito'])], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'codici-cogestione.csv' });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Elenco ─────────────────────────────────────
  let cerca = $state('');
  let classeFiltro = $state('');
  const visibili = $derived.by(() => {
    const q = cerca.trim().toLowerCase();
    return studenti.filter(
      (s) =>
        (!classeFiltro || s.classe === classeFiltro) &&
        (!q || `${s.cognome} ${s.nome} ${s.email}`.toLowerCase().includes(q)),
    );
  });
</script>

<div class="pagina pila-l non-stampa">
  <header>
    <a href="#/impostazioni" class="piccolo">← Impostazioni</a>
    <h1>Studenti</h1>
    {#if !caricamento}
      <p class="attenuato piccolo">
        {studenti.length} studenti · {classi.length} classi · {entrati} hanno già fatto l'accesso · {senzaCodice} senza codice
      </p>
    {/if}
  </header>

  {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}
  {#if messaggio}<div class="avviso avviso-ok">{messaggio}</div>{/if}

  <section class="carta pila">
    <p class="etichetta-sezione">1 · Carica l'elenco</p>
    <p class="attenuato piccolo">
      Un CSV esportato da Excel, Fogli Google o dal registro, oppure righe incollate qui sotto. Servono email
      istituzionale e classe; nome e cognome, se mancano, si ricavano dall'email. Puoi ricaricarlo quando vuoi:
      chi c'è già viene aggiornato, nessuno viene cancellato.
    </p>
    <input type="file" accept=".csv,text/csv,text/plain" onchange={daFile} />
    <textarea
      rows="5"
      bind:value={testo}
      oninput={() => (anteprima = null)}
      placeholder={'email;cognome;nome;classe\nrossi.mario@' + dominio + ';Rossi;Mario;3A'}
    ></textarea>
    <button class="btn btn-secondario btn-pieno" disabled={!testo.trim()} onclick={controlla}>Controlla l'elenco</button>

    {#if anteprima}
      <div class="pila anteprima" transition:slide={{ duration: 300, easing: cubicOut }}>
        <div class="numeri-import">
          <div><strong>{anteprima.nuovi.length}</strong><span>nuovi</span></div>
          <div><strong>{anteprima.cambiati.length}</strong><span>da aggiornare</span></div>
          <div class:scarti={anteprima.scarti.length}><strong>{anteprima.scarti.length}</strong><span>scartati</span></div>
        </div>
        {#if anteprima.scarti.length}
          <details>
            <summary class="piccolo">Righe scartate</summary>
            <ul class="piccolo scartate">
              {#each anteprima.scarti.slice(0, 50) as s (s.riga)}
                <li><strong>Riga {s.riga}</strong>: {s.motivo} <span class="attenuato">· {s.testo}</span></li>
              {/each}
            </ul>
          </details>
        {/if}
        {#if anteprima.nuovi.length + anteprima.cambiati.length}
          <button class="btn btn-primario btn-pieno" disabled={inCorso} onclick={importa}>
            {inCorso ? 'Importazione…' : `Importa ${anteprima.nuovi.length + anteprima.cambiati.length} studenti`}
          </button>
        {:else}
          <p class="attenuato piccolo" style="margin:0">Niente da importare: l'elenco è già aggiornato.</p>
        {/if}
      </div>
    {/if}
  </section>

  <section class="carta pila">
    <p class="etichetta-sezione">2 · Genera i codici</p>
    <p class="attenuato piccolo">
      Ogni studente riceve un codice personale di 8 caratteri per entrare senza Google. Chi ha già un codice lo tiene.
    </p>
    <button class="btn btn-secondario btn-pieno" disabled={inCorso || !senzaCodice} onclick={generaCodici}>
      {senzaCodice === 1 ? 'Genera 1 codice' : senzaCodice ? `Genera ${senzaCodice} codici` : 'Tutti hanno un codice'}
    </button>
  </section>

  <section class="carta pila">
    <p class="etichetta-sezione">3 · Distribuisci i codici</p>
    <div class="due">
      <div class="campo">
        <label for="classe-stampa">Classe</label>
        <select id="classe-stampa" bind:value={classeStampa}>
          <option value="">Tutte</option>
          {#each classi as c (c)}<option value={c}>{c}</option>{/each}
        </select>
      </div>
      <label class="spunta">
        <input type="checkbox" bind:checked={soloNonEntrati} />
        <span class="piccolo">Solo chi non è ancora entrato</span>
      </label>
    </div>
    <button class="btn btn-primario btn-pieno" disabled={!daStampare.length} onclick={() => print()}>
      Stampa {daStampare.length} foglietti
    </button>
    <p class="aiuto attenuato piccolo" style="margin:0">
      Un foglio per classe, da tagliare e consegnare ai rappresentanti di classe.
    </p>
    <button class="btn btn-tenue btn-pieno" disabled={!studenti.some((s) => s.codice)} onclick={scarica}>Scarica CSV per l'invio via email</button>
    <p class="aiuto attenuato piccolo" style="margin:0">
      Con colonne email, nome e codice: si apre in Fogli Google e si invia con una stampa unione dall'account della
      cogestione.
    </p>
  </section>

  <section class="pila">
    <p class="etichetta-sezione">Elenco</p>
    <div class="due">
      <input type="search" bind:value={cerca} placeholder="Cerca nome o email" aria-label="Cerca" />
      <select bind:value={classeFiltro} aria-label="Filtra per classe">
        <option value="">Tutte le classi</option>
        {#each classi as c (c)}<option value={c}>{c}</option>{/each}
      </select>
    </div>
    {#if caricamento}
      <Scheletro righe={3} />
    {:else if !visibili.length}
      <div class="vuoto carta">{studenti.length ? 'Nessuno corrisponde.' : "Carica l'elenco per iniziare."}</div>
    {:else}
      <ul class="elenco carta">
        {#each visibili.slice(0, 300) as s (s.id)}
          <li>
            <div>
              <strong>{s.cognome} {s.nome}</strong>
              <span class="attenuato piccolo">{s.classe || 'senza classe'} · {s.email}</span>
            </div>
            <div class="stato">
              {#if s.user_id}<span class="badge badge-approvata">entrato</span>{/if}
              <code class:manca={!s.codice}>{s.codice ? aGruppi(s.codice) : 'nessun codice'}</code>
            </div>
          </li>
        {/each}
      </ul>
      {#if visibili.length > 300}<p class="attenuato piccolo">Mostrati 300 su {visibili.length}: usa la ricerca.</p>{/if}
    {/if}
  </section>
</div>

<!-- Fogli da stampare: invisibili a schermo. -->
<div class="solo-stampa" aria-hidden="true">
  {#each gruppiStampa as [classe, lista] (classe)}
    <section class="foglio">
      <h2>Classe {classe} · codici per la cogestione</h2>
      <div class="foglietti">
        {#each lista as s (s.id)}
          <article class="foglietto">
            <p class="chi"><strong>{s.cognome} {s.nome}</strong> · {s.classe}</p>
            <p class="cod">{aGruppi(s.codice)}</p>
            <p class="come">
              Vai su <strong>{indirizzoSito.replace(/^https?:\/\//, '')}</strong>, tocca Accedi e scegli "Codice personale".
              Se puoi, entra con l'account della scuola. Il codice è solo tuo: non darlo a nessuno.
            </p>
          </article>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .carta .etichetta-sezione { margin: 0; }
  .carta > p { margin: 0; }
  .due { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
  .spunta { display: flex; gap: 8px; align-items: center; min-height: 44px; }
  .spunta input { width: 18px; height: 18px; accent-color: var(--accento); }
  input[type='file'] { font: inherit; font-size: 0.9rem; color: var(--testo-2); }

  .anteprima { border-top: 1px solid var(--linea); padding-top: 14px; }
  .numeri-import { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .numeri-import div { display: grid; justify-items: center; padding: 10px 0; border-radius: 12px; background: var(--superficie-2); }
  .numeri-import strong { font: 600 1.5rem/1.1 var(--serif); }
  .numeri-import span { font-size: 0.75rem; color: var(--testo-3); }
  .numeri-import .scarti strong { color: var(--attenzione); }
  .scartate { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; }
  summary { cursor: pointer; color: var(--testo-2); }

  .elenco { list-style: none; margin: 0; padding: 0; }
  .elenco li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--linea);
  }
  .elenco li:first-child { border-top: none; }
  .elenco li > div:first-child { display: grid; min-width: 0; }
  .elenco li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .stato { display: flex; gap: 8px; align-items: center; flex: none; }
  code { font: 500 0.85rem ui-monospace, 'SF Mono', Menlo, monospace; letter-spacing: 0.04em; }
  code.manca { color: var(--testo-3); font-family: var(--sans); letter-spacing: 0; }

  .solo-stampa { display: none; }
  @media print {
    .non-stampa { display: none !important; }
    .solo-stampa { display: block; color: #000; font-family: var(--sans); }
    .foglio { break-after: page; }
    .foglio h2 { font: 600 13pt var(--serif); margin: 0 0 6mm; }
    .foglietti { display: grid; grid-template-columns: 1fr 1fr; }
    .foglietto {
      break-inside: avoid;
      border: 1px dashed #999;
      margin: -0.5px;
      padding: 5mm 6mm;
      display: grid;
      gap: 2mm;
    }
    .foglietto p { margin: 0; }
    .chi { font-size: 10.5pt; }
    .cod { font: 700 17pt ui-monospace, Menlo, monospace; letter-spacing: 0.12em; }
    .come { font-size: 8pt; line-height: 1.35; color: #333; }
  }
</style>
