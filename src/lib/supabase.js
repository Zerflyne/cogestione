import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const chiave = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configurato = Boolean(url && chiave);

// Ogni richiesta si arrende dopo 10 secondi: se Supabase non risponde (per esempio perché
// il progetto gratuito è in pausa) il sito mostra un errore invece di restare bloccato.
const ATTESA_MASSIMA = 10000;
function fetchConLimite(risorsa, opzioni = {}) {
  const limite = AbortSignal.timeout(ATTESA_MASSIMA);
  const signal = opzioni.signal && AbortSignal.any ? AbortSignal.any([opzioni.signal, limite]) : (opzioni.signal ?? limite);
  return fetch(risorsa, { ...opzioni, signal });
}

export const supabase = configurato
  ? createClient(url, chiave, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
      global: { fetch: fetchConLimite },
      // Niente nuovi tentativi automatici: con il database fermo trasformavano ogni
      // cambio di schermata in un'attesa lunghissima (fino a 4 tentativi con pause).
      db: { retry: false },
    })
  : null;

// Dentro l'app Tauri Google non permette l'accesso dalla webview: lì si entra con il codice.
export const inApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
