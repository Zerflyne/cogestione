// Accesso con codice personale (piano B per chi non riesce a entrare con Google).
// Riceve il codice, trova lo studente e restituisce un token monouso che il sito
// scambia con una sessione tramite supabase.auth.verifyOtp({ token_hash, type: 'email' }).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const risposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const attendi = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return risposta({ errore: 'Metodo non consentito' }, 405);

  let codice = '';
  try {
    const corpo = await req.json();
    codice = String(corpo?.codice ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  } catch {
    return risposta({ errore: 'Richiesta non valida' }, 400);
  }
  if (!/^[A-Z2-9]{8}$/.test(codice)) {
    return risposta({ errore: 'Il codice è di 8 caratteri, lettere e numeri' }, 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: studente, error } = await admin
    .from('studenti')
    .select('email')
    .eq('codice', codice)
    .maybeSingle();

  if (error) return risposta({ errore: 'Errore del server, riprova tra poco' }, 500);
  if (!studente) {
    await attendi(800); // rallenta chi prova codici a caso
    return risposta({ errore: 'Codice non valido' }, 401);
  }

  // Crea l'account la prima volta (se esiste già, l'errore si ignora).
  await admin.auth.admin.createUser({ email: studente.email, email_confirm: true });

  const { data: link, error: errLink } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: studente.email,
  });
  if (errLink || !link?.properties?.hashed_token) {
    return risposta({ errore: 'Impossibile completare l\'accesso, riprova' }, 500);
  }

  return risposta({ token_hash: link.properties.hashed_token });
});
