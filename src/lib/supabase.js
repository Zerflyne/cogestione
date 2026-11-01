import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const chiave = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configurato = Boolean(url && chiave);

export const supabase = configurato
  ? createClient(url, chiave, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })
  : null;

// Dentro l'app Tauri Google non permette l'accesso dalla webview: lì si entra con il codice.
export const inApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
