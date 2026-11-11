<script>
  import { supabase, inApp } from '../lib/supabase.js';
  import { app } from '../lib/stato.svelte.js';

  let codice = $state('');
  let inCorso = $state(false);
  let errore = $state(app.erroreAccesso);

  const dominio = $derived(app.impostazioni?.dominio_email ?? 'istitutotorricelli.edu.it');
  // Mostra il codice a gruppi di 4 (ABCD-EFGH) mentre si scrive.
  const pulito = $derived(codice.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));

  async function conGoogle() {
    errore = null;
    inCorso = true;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: location.origin + location.pathname,
        queryParams: { hd: dominio, prompt: 'select_account' },
      },
    });
    if (error) {
      errore = 'Accesso con Google non riuscito. Prova con il codice personale.';
      inCorso = false;
    }
  }

  async function conCodice(e) {
    e.preventDefault();
    errore = null;
    if (pulito.length !== 8) {
      errore = 'Il codice è di 8 caratteri.';
      return;
    }
    inCorso = true;
    try {
      const { data, error } = await supabase.functions.invoke('login-codice', { body: { codice: pulito } });
      if (error || !data?.token_hash) {
        let msg = 'Codice non valido.';
        try {
          msg = (await error?.context?.json())?.errore ?? msg;
        } catch {}
        throw new Error(msg);
      }
      const { error: e2 } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' });
      if (e2) throw e2;
    } catch (err) {
      errore = err.message || 'Accesso non riuscito.';
    } finally {
      inCorso = false;
    }
  }
</script>

<div class="pagina pila-l">
  <header>
    <h1>Accedi</h1>
    <p class="attenuato">Serve per proporre un corso e, più avanti, per iscriverti.</p>
  </header>

  {#if errore}
    <div class="avviso avviso-errore" role="alert">{errore}</div>
  {/if}

  {#if !inApp}
    <section class="carta pila">
      <h2>Account della scuola</h2>
      <p class="attenuato piccolo">Usa l'indirizzo che finisce con <strong>@{dominio}</strong>.</p>
      <button class="btn btn-primario btn-pieno" onclick={conGoogle} disabled={inCorso}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.11z"/>
        </svg>
        Accedi con Google
      </button>
    </section>

    <div class="separatore" role="separator"><span>oppure</span></div>
  {/if}

  <form class="carta pila" onsubmit={conCodice}>
    <h2>Codice personale</h2>
    <p class="attenuato piccolo">
      Ti è arrivato per email e su un foglietto in classe. Non serve nessuna password.
    </p>
    <div class="campo">
      <label for="codice">Codice</label>
      <input
        id="codice"
        type="text"
        inputmode="text"
        autocomplete="one-time-code"
        autocapitalize="characters"
        spellcheck="false"
        placeholder="ABCD-EFGH"
        maxlength="9"
        class="codice"
        value={pulito.length > 4 ? `${pulito.slice(0, 4)}-${pulito.slice(4)}` : pulito}
        oninput={(e) => (codice = e.currentTarget.value)}
      />
    </div>
    <button class="btn {inApp ? 'btn-primario' : 'btn-secondario'} btn-pieno" disabled={inCorso || pulito.length !== 8}>
      Entra con il codice
    </button>
  </form>

  <p class="attenuato piccolo centrato">
    Non hai il codice o non riesci a entrare? Scrivi ai rappresentanti d'istituto.<br />
    Entrando accetti l'<a href="./privacy.html">informativa sulla privacy</a>.
  </p>
</div>

<style>
  .separatore {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--testo-3);
    font-size: 0.8rem;
  }
  .separatore::before,
  .separatore::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--linea);
  }
  .codice {
    font: 600 1.35rem/1 ui-monospace, 'SF Mono', Menlo, monospace !important;
    letter-spacing: 0.18em;
    text-align: center;
  }
  .centrato { text-align: center; }
  h2 { margin: 0; }
  .carta p { margin: 0; }
</style>
