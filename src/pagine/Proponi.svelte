<script>
  // Proponi un corso, a passi: l'idea, la durata, il posto, chi e cosa serve, il riepilogo.
  // Ogni passo si controlla prima di andare avanti; la bozza resta su questo dispositivo
  // finché non la invii, così chi esce a metà ritrova tutto.
  import Intestazione from '../componenti/Intestazione.svelte';
  import Schizzo from '../componenti/Schizzo.svelte';
  import Scheletro from '../componenti/Scheletro.svelte';
  import { supabase } from '../lib/supabase.js';
  import { app, vai } from '../lib/stato.svelte.js';
  import { AULE, messaggioErrore, formatoData } from '../lib/etichette.js';
  import { slide, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { tick, untrack } from 'svelte';
  import { carica, togli, urlCopertina } from '../lib/copertine.js';

  let { id = null } = $props();

  const VUOTO = {
    titolo: '',
    descrizione: '',
    fasce_necessarie: 1,
    posti_max: 25,
    aula_richiesta: 'normale',
    attivita_palestra: '',
    docente_referente: '',
    preferenza_oraria: '',
    co_conduttori: '',
    materiale: '',
    immagine_path: '',
  };

  const PASSI = [
    { titolo: "L'idea", sotto: 'Come si chiama e di cosa parla.', disegno: 'lampadina' },
    { titolo: 'Immagine', sotto: 'Una foto o un disegno che faccia venire voglia di iscriversi.', disegno: 'stella' },
    { titolo: 'Durata e posti', sotto: 'Quanto tempo serve e quante persone possono venire.', disegno: 'clessidra' },
    { titolo: 'Dove', sotto: "Scegli l'aula che ti serve.", disegno: 'compasso' },
    { titolo: 'Chi e cosa serve', sotto: 'Docenti, compagni che conducono con te, materiale.', disegno: 'persone' },
    { titolo: 'Riepilogo', sotto: 'Controlla e invia: potrai modificarla finché non viene approvata.', disegno: 'lente' },
  ];
  const ULTIMO = PASSI.length - 1;

  const DISEGNI_AULA = {
    normale: 'griglia',
    aula_magna: 'megafono',
    lab_informatica: 'computer',
    lab_fisica: 'atomo',
    lab_chimica: 'beuta',
    palestra: 'pallone',
  };
  const NOTE_AULA = {
    normale: 'Banchi, lavagna, proiettore',
    aula_magna: 'Per tanti, con palco',
    lab_informatica: 'Computer per tutti',
    lab_fisica: 'Strumenti e esperimenti',
    lab_chimica: 'Banconi e reagenti',
    palestra: 'Sport e movimento',
  };

  let f = $state({ ...VUOTO });
  let originale = $state(null);
  let caricamento = $state(true);
  let inCorso = $state(false);
  let errore = $state(null);
  let errori = $state({});
  let passo = $state(0);
  let arrivato = $state(0); // il passo più avanti raggiunto: si può tornare a ogni passo già fatto
  let verso = $state(1);
  let bozzaRitrovata = $state(false);
  let titoloPasso = $state();

  const fase = $derived(app.impostazioni?.fase);
  const aperte = $derived(fase === 'proposte');
  const modificabile = $derived(!originale || ['inviata', 'da_modificare'].includes(originale.stato));
  const semplice = $derived(f.aula_richiesta === 'normale' && !f.docente_referente.trim());
  const palestra = $derived(f.aula_richiesta === 'palestra');

  // ── Bozza su questo dispositivo ────────────
  const chiave = $derived(`bozza-proposta:${id ?? 'nuova'}`);
  function leggiBozza() {
    try {
      const b = JSON.parse(localStorage.getItem(chiave) ?? 'null');
      return b && typeof b === 'object' && b.f ? b : null;
    } catch {
      return null;
    }
  }
  function dimenticaBozza() {
    try {
      localStorage.removeItem(chiave);
    } catch {}
  }

  $effect(() => {
    const finito = (dati) => untrack(() => {
      if (dati) {
        originale = dati;
        for (const k of Object.keys(f)) f[k] = dati[k] ?? VUOTO[k];
      }
      const b = leggiBozza();
      // Per una proposta già inviata la bozza vale solo se è più recente dell'ultima modifica.
      if (b && (!dati || new Date(b.salvata) > new Date(dati.aggiornato_il))) {
        for (const k of Object.keys(f)) if (k in b.f) f[k] = b.f[k];
        passo = arrivato = Math.min(Math.max(0, b.passo | 0), ULTIMO);
        bozzaRitrovata = true;
      } else if (dati) {
        arrivato = ULTIMO; // correggendo, tutti i passi sono già compilati
      }
      base = JSON.stringify($state.snapshot(f));
      caricamento = false;
    });
    if (!id) return finito(null);
    supabase
      .from('corsi')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => finito(data));
  });

  // Salva la bozza a ogni modifica, con un attimo di respiro.
  // Finché non tocchi niente non c'è nessuna bozza da ricordare.
  let attesa;
  let base = '';
  $effect(() => {
    const campi = JSON.stringify($state.snapshot(f));
    const istantanea = JSON.stringify({ f: JSON.parse(campi), passo, salvata: new Date().toISOString() });
    if (caricamento || inCorso) return;
    if (campi === base && passo === 0) return;
    clearTimeout(attesa);
    attesa = setTimeout(() => {
      try {
        localStorage.setItem(chiave, istantanea);
      } catch {}
    }, 400);
    return () => clearTimeout(attesa);
  });

  function ricomincia() {
    dimenticaBozza();
    bozzaRitrovata = false;
    if (originale) for (const k of Object.keys(f)) f[k] = originale[k] ?? VUOTO[k];
    else Object.assign(f, VUOTO);
    base = JSON.stringify($state.snapshot(f));
    errori = {};
    vaiAlPasso(0);
  }

  // ── Controlli, passo per passo ─────────────
  function controllaPasso(n) {
    const e = {};
    if (n === 0) {
      const t = f.titolo.trim(), d = f.descrizione.trim();
      if (t.length < 3) e.titolo = 'Dagli un nome di almeno 3 caratteri.';
      else if (t.length > 60) e.titolo = 'Il nome può avere al massimo 60 caratteri.';
      if (d.length < 20) e.descrizione = `Racconta ancora un po': mancano ${20 - d.length} caratteri.`;
      else if (d.length > 500) e.descrizione = 'La descrizione supera i 500 caratteri.';
    }
    if (n === 1 && caricando) e.immagine = 'Aspetta che finisca il caricamento.';
    if (n === 2) {
      if (!(f.fasce_necessarie >= 1 && f.fasce_necessarie <= 6)) e.fasce = 'Le fasce orarie vanno da 1 a 6.';
      if (!(f.posti_max >= 5 && f.posti_max <= 300)) e.posti = 'I posti vanno da 5 a 300.';
    }
    if (n === 3) {
      if (!AULE[f.aula_richiesta]) e.aula = "Scegli un'aula.";
      if (palestra && f.attivita_palestra.trim().length < 20)
        e.palestra = "Descrivi l'attività in palestra in almeno 20 caratteri.";
    }
    return e;
  }

  async function vaiAlPasso(n, { fuoco = true } = {}) {
    verso = n >= passo ? 1 : -1;
    passo = n;
    arrivato = Math.max(arrivato, n);
    errore = null;
    await tick();
    // Porta in alto l'avanzamento, così il nuovo passo si legge dall'inizio.
    const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.passi')?.scrollIntoView({ block: 'start', behavior: ridotto ? 'auto' : 'smooth' });
    if (fuoco) titoloPasso?.focus({ preventScroll: true });
  }

  async function avanti() {
    errori = controllaPasso(passo);
    if (Object.keys(errori).length) {
      await tick();
      const primo = document.querySelector('[aria-invalid="true"]');
      primo?.focus({ preventScroll: true });
      primo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    vaiAlPasso(passo + 1);
  }

  function indietro() {
    errori = {};
    if (passo > 0) vaiAlPasso(passo - 1);
  }

  // Dal cerchietto del passo: indietro sempre, avanti solo se i passi in mezzo sono a posto.
  function salta(n) {
    if (n === passo) return;
    if (n < passo) return vaiAlPasso(n);
    for (let i = passo; i < n; i++) {
      const e = controllaPasso(i);
      if (Object.keys(e).length) {
        errori = e;
        if (i !== passo) vaiAlPasso(i);
        return;
      }
    }
    vaiAlPasso(n);
  }

  // ── Numeri: fasce e posti ──────────────────
  const limita = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || min)));
  const cambiaPosti = (d) => (f.posti_max = limita(Number(f.posti_max) + d, 5, 300));

  // ── Invio ──────────────────────────────────
  const vuotoANull = (v) => (typeof v === 'string' ? v.trim() || null : v);

  async function invia() {
    for (let i = 0; i < ULTIMO; i++) {
      const e = controllaPasso(i);
      if (Object.keys(e).length) {
        errori = e;
        return vaiAlPasso(i);
      }
    }
    inCorso = true;
    errore = null;
    const dati = {
      titolo: f.titolo.trim(),
      descrizione: f.descrizione.trim(),
      fasce_necessarie: Number(f.fasce_necessarie),
      posti_max: Number(f.posti_max),
      aula_richiesta: f.aula_richiesta,
      attivita_palestra: palestra ? vuotoANull(f.attivita_palestra) : null,
      docente_referente: vuotoANull(f.docente_referente),
      preferenza_oraria: semplice ? vuotoANull(f.preferenza_oraria) : null,
      co_conduttori: vuotoANull(f.co_conduttori),
      materiale: vuotoANull(f.materiale),
      immagine_path: vuotoANull(f.immagine_path),
    };
    const { error } = originale
      ? await supabase.from('corsi').update(dati).eq('id', originale.id)
      : await supabase.from('corsi').insert({ ...dati, proponente_id: app.studente.id });
    if (error) {
      inCorso = false;
      return (errore = messaggioErrore(error));
    }
    dimenticaBozza();
    // L'immagine vecchia, se è stata cambiata, non serve più.
    if (originale?.immagine_path && originale.immagine_path !== dati.immagine_path) togli(originale.immagine_path);
    vai('proposte/inviata');
  }

  function invio(e) {
    e.preventDefault();
    if (passo < ULTIMO) avanti();
    else invia();
  }

  // ── Copertina ──────────────────────────
  let caricando = $state(false);
  async function scegliImmagine(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    delete errori.immagine;
    caricando = true;
    try {
      const prima = f.immagine_path;
      f.immagine_path = await carica(file, app.studente.id);
      // Una copertina caricata in questa sessione e poi sostituita si butta subito.
      if (prima && prima !== originale?.immagine_path) togli(prima);
    } catch (err) {
      errori.immagine = err.message;
    }
    caricando = false;
  }
  function togliImmagine() {
    if (f.immagine_path !== originale?.immagine_path) togli(f.immagine_path);
    f.immagine_path = '';
  }

  const fasceTesto = (n) => (n === 1 ? '1 fascia oraria' : `${n} fasce orarie`);
</script>

<div class="pagina pila-l">
  <Intestazione titolo={originale ? 'Modifica proposta' : 'Proponi un corso'}>
    <p>Sei passi brevi. I rappresentanti leggono ogni proposta e ti rispondono qui.</p>
  </Intestazione>

  {#if caricamento}
    <Scheletro righe={2} />
  {:else if !aperte}
    <div class="avviso avviso-attenzione">
      Le proposte non sono aperte in questo momento.
      {#if app.impostazioni?.proposte_apertura}Aprono il {formatoData(app.impostazioni.proposte_apertura)}.{/if}
    </div>
  {:else if !modificabile}
    <div class="avviso">Questa proposta è già stata valutata e non si può più modificare.</div>
  {:else}
    {#if originale?.stato === 'da_modificare' && originale.nota_revisione}
      <div class="avviso avviso-attenzione">
        <strong>Cosa ti chiedono i rappresentanti:</strong><br />{originale.nota_revisione}
      </div>
    {/if}

    {#if bozzaRitrovata}
      <div class="avviso avviso-accento riga bozza" transition:slide={{ duration: 260, easing: cubicOut }}>
        <span>Abbiamo ritrovato la tua bozza: riprendi da dove avevi lasciato.</span>
        <button type="button" class="link spinge" onclick={ricomincia}>Ricomincia da capo</button>
      </div>
    {/if}

    <!-- Avanzamento: cinque cerchietti uniti da un filo che si riempie. -->
    <nav class="passi" aria-label="Passi della proposta" style="--fatto: {passo / ULTIMO}">
      <div class="filo" aria-hidden="true"><span></span></div>
      <ol>
        {#each PASSI as p, i (i)}
          <li>
            <button
              type="button"
              class="tappa"
              class:fatta={i < passo}
              class:attuale={i === passo}
              disabled={i > arrivato}
              aria-current={i === passo ? 'step' : undefined}
              aria-label="Passo {i + 1}: {p.titolo}{i < passo ? ', completato' : ''}"
              onclick={() => salta(i)}
            >
              {#if i < passo}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5 L10.5 17 L18 7.5" /></svg>
              {:else}
                {i + 1}
              {/if}
            </button>
            <span class="nome-tappa" class:attuale={i === passo}>{p.titolo}</span>
          </li>
        {/each}
      </ol>
    </nav>

    <form class="pila-l" onsubmit={invio} novalidate>
      {#key passo}
        <section class="carta passo" style="--verso: {verso}" aria-labelledby="titolo-passo">
          <header class="testa-passo">
            <div>
              <p class="contapassi">Passo {passo + 1} di {PASSI.length}</p>
              <h2 id="titolo-passo" tabindex="-1" bind:this={titoloPasso}>{PASSI[passo].titolo}</h2>
              <p class="attenuato piccolo">{PASSI[passo].sotto}</p>
            </div>
            <span class="disegno-passo"><Schizzo nome={PASSI[passo].disegno} ritardo={120} /></span>
          </header>

          {#if passo === 0}
            <div class="campo">
              <label for="titolo">Nome del corso</label>
              <input
                id="titolo"
                type="text"
                maxlength="60"
                bind:value={f.titolo}
                placeholder="es. Introduzione agli scacchi"
                aria-invalid={Boolean(errori.titolo)}
                aria-describedby={errori.titolo ? 'e-titolo' : undefined}
                oninput={() => delete errori.titolo}
              />
              <div class="sotto-campo">
                {#if errori.titolo}<span class="errore-campo" id="e-titolo" transition:fade={{ duration: 150 }}>{errori.titolo}</span>{/if}
                <span class="contatore spinge">{f.titolo.length}/60</span>
              </div>
            </div>
            <div class="campo">
              <label for="descrizione">Descrizione</label>
              <textarea
                id="descrizione"
                maxlength="500"
                rows="6"
                bind:value={f.descrizione}
                placeholder="Cosa si fa, a chi è rivolto, cosa si porta a casa."
                aria-invalid={Boolean(errori.descrizione)}
                aria-describedby={errori.descrizione ? 'e-descrizione' : 'a-descrizione'}
                oninput={() => delete errori.descrizione}
              ></textarea>
              <div class="misura" aria-hidden="true">
                <span style="width: {Math.min(100, (f.descrizione.trim().length / 20) * 100)}%" class:pronta={f.descrizione.trim().length >= 20}></span>
              </div>
              <div class="sotto-campo">
                {#if errori.descrizione}
                  <span class="errore-campo" id="e-descrizione" transition:fade={{ duration: 150 }}>{errori.descrizione}</span>
                {:else}
                  <span class="aiuto" id="a-descrizione">È quello che leggeranno gli studenti.</span>
                {/if}
                <span class="contatore spinge">{f.descrizione.length}/500</span>
              </div>
            </div>
          {:else if passo === 1}
            <div class="campo">
              <span class="titolo-campo">Copertina <span class="facoltativo">· facoltativa</span></span>
              <label class="copertina" class:piena={f.immagine_path} class:carica={caricando}>
                {#if f.immagine_path}
                  <img src={urlCopertina(f.immagine_path)} alt="Copertina del corso" />
                {:else}
                  <span class="disegno-copertina"><Schizzo nome="beuta" ritardo={150} /></span>
                  <span class="invito">{caricando ? 'Comprimo e carico…' : "Tocca per scegliere un'immagine"}</span>
                  <span class="aiuto">JPG, PNG o foto del telefono: la rimpiccioliamo noi.</span>
                {/if}
                {#if caricando}<span class="barra-carica" aria-hidden="true"></span>{/if}
                <input type="file" accept="image/*" onchange={scegliImmagine} disabled={caricando} class="nascosto" />
              </label>
              {#if f.immagine_path}
                <div class="riga">
                  <label class="btn btn-tenue btn-s">
                    Cambia
                    <input type="file" accept="image/*" onchange={scegliImmagine} disabled={caricando} class="nascosto" />
                  </label>
                  <button type="button" class="btn btn-pericolo btn-s" onclick={togliImmagine} disabled={caricando}>Togli</button>
                </div>
              {/if}
              {#if errori.immagine}<span class="errore-campo" role="alert">{errori.immagine}</span>{/if}
              <span class="aiuto">Niente foto di persone senza il loro permesso. Se non la metti va bene lo stesso.</span>
            </div>
          {:else if passo === 2}
            <div class="campo">
              <span class="titolo-campo" id="l-fasce">Quante fasce orarie dura</span>
              <div class="fasce" role="radiogroup" aria-labelledby="l-fasce">
                {#each [1, 2, 3, 4, 5, 6] as n (n)}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={f.fasce_necessarie === n}
                    aria-label={fasceTesto(n)}
                    class="fascia"
                    class:piena={n <= f.fasce_necessarie}
                    style="--i: {n}"
                    onclick={() => (f.fasce_necessarie = n)}
                  >
                    <span>{n}</span>
                  </button>
                {/each}
              </div>
              <span class="aiuto">
                <strong>{fasceTesto(f.fasce_necessarie)}</strong>. Se il corso è lungo lo mettiamo in fasce consecutive.
              </span>
              {#if errori.fasce}<span class="errore-campo">{errori.fasce}</span>{/if}
            </div>

            <div class="campo">
              <label for="posti">Quanti posti al massimo</label>
              <div class="contatore-grande">
                <button type="button" class="btn btn-tenue tondo" aria-label="5 posti in meno" disabled={f.posti_max <= 5} onclick={() => cambiaPosti(-5)}>−</button>
                <input
                  id="posti"
                  type="number"
                  inputmode="numeric"
                  min="5"
                  max="300"
                  bind:value={f.posti_max}
                  onblur={() => (f.posti_max = limita(f.posti_max, 5, 300))}
                  aria-invalid={Boolean(errori.posti)}
                />
                <button type="button" class="btn btn-tenue tondo" aria-label="5 posti in più" disabled={f.posti_max >= 300} onclick={() => cambiaPosti(5)}>+</button>
              </div>
              <div class="riga scorciatoie">
                {#each [15, 25, 40, 60, 100] as n (n)}
                  <button type="button" class="scheda piccola" aria-pressed={Number(f.posti_max) === n} onclick={() => (f.posti_max = n)}>{n}</button>
                {/each}
              </div>
              <span class="aiuto">Una classe intera è circa 25. Pensa a quante persone puoi seguire davvero.</span>
              {#if errori.posti}<span class="errore-campo">{errori.posti}</span>{/if}
            </div>
          {:else if passo === 3}
            <div class="campo">
              <span class="titolo-campo" id="l-aula">Aula richiesta</span>
              <div class="aule" role="radiogroup" aria-labelledby="l-aula">
                {#each Object.entries(AULE) as [valore, testo], i (valore)}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={f.aula_richiesta === valore}
                    class="aula"
                    style="--i: {i}"
                    onclick={() => (f.aula_richiesta = valore)}
                  >
                    <span class="disegno-aula"><Schizzo nome={DISEGNI_AULA[valore]} ritardo={80 + i * 70} /></span>
                    <span class="nome-aula">{testo}</span>
                    <span class="nota-aula">{NOTE_AULA[valore]}</span>
                  </button>
                {/each}
              </div>
            </div>

            {#if palestra}
              <div class="campo" transition:slide={{ duration: 300, easing: cubicOut }}>
                <label for="palestra">Descrivi l'attività in palestra</label>
                <textarea
                  id="palestra"
                  maxlength="1000"
                  rows="4"
                  bind:value={f.attivita_palestra}
                  placeholder="Che sport o attività, quante persone, che attrezzatura serve."
                  aria-invalid={Boolean(errori.palestra)}
                  oninput={() => delete errori.palestra}
                ></textarea>
                {#if errori.palestra}<span class="errore-campo">{errori.palestra}</span>{/if}
                <span class="aiuto">
                  La palestra dipende dal dipartimento di scienze motorie: presentiamo noi la tua attività al capo
                  dipartimento prima di inserirla nel calendario.
                </span>
              </div>
            {:else if f.aula_richiesta !== 'normale'}
              <p class="aiuto attenuato" style="margin:0" transition:slide={{ duration: 260, easing: cubicOut }}>
                Con un'aula speciale l'orario lo decidono i rappresentanti, perché va coordinato con docenti e
                assistenti tecnici.
              </p>
            {/if}
          {:else if passo === 4}
            <div class="campo">
              <label for="docente">Docente referente <span class="facoltativo">· facoltativo</span></label>
              <input id="docente" type="text" maxlength="80" bind:value={f.docente_referente} placeholder="Solo se serve un docente specifico" />
            </div>

            {#if semplice}
              <div class="campo" transition:slide={{ duration: 300, easing: cubicOut }}>
                <label for="preferenza">Preferenza oraria <span class="facoltativo">· facoltativo</span></label>
                <input id="preferenza" type="text" maxlength="200" bind:value={f.preferenza_oraria} placeholder="es. mattina del primo giorno" />
                <span class="aiuto">È una preferenza, non una garanzia: il calendario lo compongono i rappresentanti.</span>
              </div>
            {:else}
              <p class="aiuto attenuato" style="margin:0" transition:slide={{ duration: 260, easing: cubicOut }}>
                Con un'aula speciale o un docente specifico l'orario lo decidono i rappresentanti.
              </p>
            {/if}

            <div class="campo">
              <label for="co">Altri conduttori <span class="facoltativo">· facoltativo</span></label>
              <input id="co" type="text" maxlength="200" bind:value={f.co_conduttori} placeholder="Nome, cognome e classe" />
            </div>
            <div class="campo">
              <label for="materiale">Materiale necessario <span class="facoltativo">· facoltativo</span></label>
              <input id="materiale" type="text" maxlength="300" bind:value={f.materiale} placeholder="Proiettore, computer, materiale di laboratorio…" />
            </div>
          {:else}
            <!-- Anteprima: la proposta come la vedranno gli studenti. -->
            <article class="anteprima">
              {#if f.immagine_path}
                <img class="copertina-anteprima" src={urlCopertina(f.immagine_path)} alt="" />
              {/if}
              <span class="sticker" class:su-foto={f.immagine_path} aria-hidden="true"><Schizzo nome={DISEGNI_AULA[f.aula_richiesta]} ritardo={200} /></span>
              <p class="etichetta-sezione">Come la vedranno gli studenti</p>
              <h3>{f.titolo.trim()}</h3>
              <Schizzo nome="sottolinea" class="tratto-anteprima" ritardo={350} durata={600} spessore={2.4} />
              <p class="descr">{f.descrizione.trim()}</p>
              <div class="riga">
                <span class="pillola">{AULE[f.aula_richiesta]}</span>
                <span class="pillola">{fasceTesto(f.fasce_necessarie)}</span>
                <span class="pillola">{f.posti_max} posti</span>
              </div>
            </article>

            <dl class="riepilogo">
              {#each [
                { nome: 'Durata e posti', valore: `${fasceTesto(f.fasce_necessarie)}, ${f.posti_max} posti`, passo: 2 },
                { nome: 'Aula', valore: AULE[f.aula_richiesta], passo: 3 },
                ...(palestra ? [{ nome: 'Attività in palestra', valore: f.attivita_palestra.trim(), passo: 3 }] : []),
                { nome: 'Docente referente', valore: f.docente_referente.trim(), passo: 4 },
                ...(semplice ? [{ nome: 'Preferenza oraria', valore: f.preferenza_oraria.trim(), passo: 4 }] : []),
                { nome: 'Altri conduttori', valore: f.co_conduttori.trim(), passo: 4 },
                { nome: 'Materiale', valore: f.materiale.trim(), passo: 4 },
              ] as r (r.nome)}
                <div class="voce">
                  <dt>{r.nome}</dt>
                  <dd class:vuota={!r.valore}>{r.valore || 'Nessuno'}</dd>
                  <button type="button" class="link" onclick={() => vaiAlPasso(r.passo)} aria-label="Modifica {r.nome.toLowerCase()}">Modifica</button>
                </div>
              {/each}
            </dl>
          {/if}
        </section>
      {/key}

      {#if errore}<div class="avviso avviso-errore" role="alert">{errore}</div>{/if}

      <div class="comandi">
        {#if passo > 0}
          <button type="button" class="btn btn-secondario" onclick={indietro} disabled={inCorso}>Indietro</button>
        {/if}
        <button class="btn btn-primario spinge" class:invia={passo === ULTIMO} disabled={inCorso}>
          {#if passo < ULTIMO}
            Avanti
            <svg class="freccia" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          {:else}
            {inCorso ? 'Invio…' : originale ? 'Salva e reinvia' : 'Invia la proposta'}
          {/if}
        </button>
      </div>
      <p class="salvata" aria-live="polite">La bozza si salva da sola su questo dispositivo.</p>
    </form>
  {/if}
</div>

<style>
  /* ── Avanzamento ─────────────────────── */
  .passi { position: relative; padding: 0 4px; scroll-margin-top: calc(var(--nav-h) + var(--s-4)); }
  .passi ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    position: relative;
  }
  .passi li { display: grid; justify-items: center; gap: 6px; }
  .filo {
    position: absolute;
    top: 21px;
    left: calc(100% / 12);
    right: calc(100% / 12);
    height: 2px;
    border-radius: 2px;
    background: var(--linea-forte);
    overflow: hidden;
  }
  .filo span {
    display: block;
    height: 100%;
    background: var(--testo);
    transform-origin: left;
    transform: scaleX(var(--fatto));
    transition: transform 520ms var(--ease-entra);
  }
  .tappa {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1.5px solid var(--linea-forte);
    background: var(--bg);
    color: var(--testo-2);
    font: 500 15px/1 var(--mono);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: background-color 200ms var(--ease), color 200ms var(--ease), border-color 200ms var(--ease), transform 200ms var(--ease);
  }
  .tappa:disabled { cursor: default; opacity: 0.55; }
  .tappa.fatta { background: var(--testo); border-color: var(--testo); color: var(--bg); }
  .tappa.attuale {
    border-color: var(--accento);
    color: var(--testo);
    background: var(--superficie);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--accento) 16%, transparent);
    transform: scale(1.06);
  }
  .tappa.attuale::after {
    /* Un anello a mano rosso che gira piano attorno al passo attuale. */
    content: '';
    position: absolute;
    inset: -7px;
    border-radius: 50%;
    border: 1.5px dashed color-mix(in oklab, var(--rosso) 70%, transparent);
    animation: gira 9s linear infinite;
  }
  @keyframes gira { to { transform: rotate(360deg); } }
  .tappa svg { width: 18px; height: 18px; }
  .tappa svg path { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 20; animation: spunta 380ms var(--ease-entra) both; }
  @keyframes spunta { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
  .nome-tappa {
    font-size: 12px;
    line-height: 1.2;
    text-align: center;
    color: var(--testo-3);
    transition: color 200ms var(--ease);
  }
  .nome-tappa.attuale { color: var(--testo); font-weight: 500; }
  @media (max-width: 420px) {
    .nome-tappa { display: none; }
    .nome-tappa.attuale { display: none; }
  }

  /* ── Passo ───────────────────────────── */
  .passo {
    display: grid;
    gap: var(--s-5);
    animation: entra-passo 460ms var(--ease-entra) both;
  }
  @keyframes entra-passo {
    from { opacity: 0; transform: translateX(calc(var(--verso) * 28px)); filter: blur(4px); }
  }
  .testa-passo { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-4); align-items: start; }
  .testa-passo p { margin: 0; }
  .contapassi { font: 500 12px/1 var(--mono); color: var(--rosso); letter-spacing: 0.02em; margin-bottom: 8px !important; }
  .testa-passo h2 { font-size: var(--t-h3); margin: 0 0 4px; outline: none; }
  .disegno-passo { width: 64px; height: 64px; color: var(--testo); margin-top: -4px; }
  .disegno-passo :global(svg) { width: 100%; height: 100%; }

  .sotto-campo { display: flex; gap: var(--s-3); align-items: baseline; min-height: 20px; }
  .errore-campo { font-size: var(--t-small); line-height: 1.4; color: var(--errore); }
  .campo :global([aria-invalid='true']) {
    border-color: var(--errore);
    animation: scuoti 360ms var(--ease);
  }
  @keyframes scuoti {
    20% { transform: translateX(-5px); }
    45% { transform: translateX(4px); }
    70% { transform: translateX(-2px); }
  }

  /* Il filo sotto la descrizione: si riempie fino ai 20 caratteri minimi. */
  .misura { height: 3px; border-radius: 3px; background: var(--superficie-2); overflow: hidden; margin-top: -2px; }
  .misura span {
    display: block;
    height: 100%;
    background: var(--testo-3);
    border-radius: inherit;
    transition: width 240ms var(--ease), background-color 240ms var(--ease);
  }
  .misura span.pronta { background: var(--ok); }

  /* Fasce: sei blocchi in fila, si riempiono fino a quello toccato. */
  .fasce { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .fascia {
    height: 56px;
    border-radius: var(--raggio-s);
    border: 1px solid var(--linea-forte);
    background: var(--superficie);
    color: var(--testo-3);
    font: 500 15px/1 var(--mono);
    cursor: pointer;
    transition: background-color 220ms var(--ease) calc(var(--i) * 25ms), color 220ms var(--ease) calc(var(--i) * 25ms), border-color 220ms var(--ease), transform 120ms var(--ease);
  }
  .fascia.piena { background: var(--testo); border-color: var(--testo); color: var(--bg); }
  .fascia[aria-checked='true'] { box-shadow: 0 0 0 3px color-mix(in oklab, var(--accento) 22%, transparent); }
  .fascia:active { transform: scale(0.94); }

  .contatore-grande { display: grid; grid-template-columns: 52px 1fr 52px; gap: var(--s-2); align-items: center; }
  .contatore-grande input {
    text-align: center;
    font: 500 26px/1 var(--serif);
    height: 56px;
    appearance: textfield;
  }
  .contatore-grande input::-webkit-inner-spin-button,
  .contatore-grande input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .tondo { width: 52px; height: 52px; padding: 0; font-size: 22px; border-radius: 50%; }
  .scorciatoie { gap: 6px; }
  .scheda.piccola { min-height: 36px; padding: 0 14px; font: 500 14px/1 var(--mono); }

  /* Aule: carte da toccare, ognuna col suo disegnino. */
  .aule { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--s-2); }
  @media (min-width: 640px) { .aule { grid-template-columns: repeat(3, 1fr); } }
  .aula {
    position: relative;
    display: grid;
    justify-items: start;
    gap: 2px;
    padding: 12px 12px 14px;
    border-radius: var(--raggio);
    border: 1px solid var(--linea-forte);
    background: var(--superficie);
    color: var(--testo);
    text-align: left;
    font: inherit;
    cursor: pointer;
    animation: compare 420ms var(--ease-entra) both;
    animation-delay: calc(var(--i) * 45ms);
    transition: border-color 160ms var(--ease), box-shadow 160ms var(--ease), transform 120ms var(--ease), background-color 160ms var(--ease);
  }
  @keyframes compare { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
  .aula:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .aula:hover { border-color: color-mix(in oklab, var(--testo) 40%, transparent); }
  }
  .aula[aria-checked='true'] {
    border-color: var(--testo);
    box-shadow: inset 0 0 0 1px var(--testo), var(--ombra-su);
  }
  .aula[aria-checked='true']::after {
    content: '';
    position: absolute;
    top: 10px;
    right: 10px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accento);
    animation: punto 260ms var(--ease-entra) both;
  }
  @keyframes punto { from { transform: scale(0); } }
  .disegno-aula { width: 40px; height: 40px; margin-bottom: 6px; color: var(--testo); }
  .disegno-aula :global(svg) { width: 100%; height: 100%; }
  .nome-aula { font-weight: 500; font-size: 15px; line-height: 1.25; }
  .nota-aula { font-size: 12.5px; line-height: 1.35; color: var(--testo-3); }

  /* ── Copertina ───────────────────────── */
  .nascosto { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .copertina {
    position: relative;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 6px;
    aspect-ratio: 16 / 9;
    border-radius: var(--raggio);
    border: 1.5px dashed var(--linea-forte);
    background: radial-gradient(var(--puntini) 1px, transparent 1.2px) 0 0 / 14px 14px, var(--bg);
    text-align: center;
    padding: var(--s-4);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 160ms var(--ease), transform 120ms var(--ease);
  }
  .copertina:active { transform: scale(0.99); }
  .copertina:focus-within { border-color: var(--accento); }
  @media (hover: hover) and (pointer: fine) { .copertina:hover { border-color: var(--testo); } }
  .copertina.piena { padding: 0; border-style: solid; border-color: var(--vetro-bordo); }
  .copertina img { width: 100%; height: 100%; object-fit: cover; animation: compare 500ms var(--ease-entra) both; }
  .disegno-copertina { width: 64px; height: 64px; color: var(--testo); }
  .disegno-copertina :global(svg) { width: 100%; height: 100%; }
  .invito { font-weight: 500; }
  .copertina.carica .disegno-copertina { animation: dondola 1.2s var(--ease) infinite alternate; }
  @keyframes dondola { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
  .barra-carica {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 40%;
    background: var(--rosso);
    animation: scorre 1.1s var(--ease) infinite;
  }
  @keyframes scorre { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
  .copertina-anteprima {
    width: calc(100% + 2 * var(--s-4));
    margin: calc(-1 * var(--s-4)) calc(-1 * var(--s-4)) var(--s-2);
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
  .sticker.su-foto { display: none; }

  /* ── Riepilogo ───────────────────────── */
  .anteprima {
    position: relative;
    display: grid;
    gap: var(--s-2);
    padding: var(--s-4);
    border-radius: var(--raggio);
    background:
      radial-gradient(var(--puntini) 1px, transparent 1.2px) 0 0 / 14px 14px,
      var(--bg);
    border: 1px dashed var(--linea-forte);
    overflow: hidden;
  }
  .anteprima .etichetta-sezione { margin: 0; }
  .anteprima h3 { font-size: 22px; margin: 0; padding-right: 56px; overflow-wrap: anywhere; }
  .anteprima :global(.tratto-anteprima) { width: 72px; height: 10px; color: var(--rosso); margin-top: -4px; }
  .anteprima .descr { margin: 0; color: var(--testo-2); font-size: 15px; white-space: pre-line; overflow-wrap: anywhere; }
  .sticker { position: absolute; top: 12px; right: 12px; width: 48px; height: 48px; color: var(--testo); transform: rotate(8deg); }
  .sticker :global(svg) { width: 100%; height: 100%; }
  .pillola {
    font-size: 12.5px;
    line-height: 1;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--superficie);
    border: 1px solid var(--linea);
    color: var(--testo-2);
  }

  .riepilogo { margin: 0; display: grid; }
  .voce {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px var(--s-3);
    padding: 12px 0;
    border-top: 1px solid var(--linea);
  }
  .voce dt { font-size: var(--t-label); color: var(--testo-3); grid-column: 1; }
  .voce dd { margin: 0; grid-column: 1; overflow-wrap: anywhere; font-size: 15px; }
  .voce dd.vuota { color: var(--testo-3); }
  .voce .link { grid-column: 2; grid-row: 1 / span 2; align-self: center; }

  .link {
    background: none;
    border: 0;
    padding: 6px 0;
    min-height: 32px;
    font: 500 var(--t-small) / 1 var(--sans);
    color: var(--testo);
    text-decoration: underline;
    text-decoration-color: color-mix(in oklab, var(--accento) 55%, transparent);
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .link:hover { color: var(--accento); }
  .bozza { font-size: var(--t-small); }

  /* ── Comandi ─────────────────────────── */
  .comandi { display: flex; gap: var(--s-2); align-items: center; }
  .comandi .btn { min-height: 52px; }
  .comandi .btn-primario { min-width: 140px; }
  .comandi .btn-primario:only-child { width: 100%; }
  .comandi .invia { flex: 1; }
  .salvata { margin: calc(-1 * var(--s-3)) 0 0; text-align: center; font-size: 12.5px; color: var(--testo-3); }
</style>
