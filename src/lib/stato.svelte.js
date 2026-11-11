import { supabase, configurato } from './supabase.js';

// Stato condiviso dell'app: sessione, scheda dello studente, impostazioni e pagina corrente.
export const app = $state({
  pronto: false,
  sessione: null,
  studente: null,
  impostazioni: null,
  rotta: leggiRotta(),
  erroreAccesso: leggiErroreAccesso(),
});

function leggiRotta() {
  const h = location.hash.replace(/^#\/?/, '');
  const [nome, ...resto] = h.split('/');
  return { nome: nome || 'home', param: resto.join('/') || null };
}

// Se l'accesso con Google fallisce (per esempio account non istituzionale), Supabase
// rimanda indietro con l'errore nell'indirizzo.
function leggiErroreAccesso() {
  const cerca = new URLSearchParams(location.search);
  const desc = cerca.get('error_description');
  if (!desc) return null;
  history.replaceState(null, '', location.pathname + location.hash);
  if (desc.includes('istituzionale') || desc.includes('Database error')) {
    return "Serve l'account istituzionale della scuola. Se non riesci a entrare, usa il codice personale.";
  }
  return desc;
}

window.addEventListener('hashchange', () => {
  app.rotta = leggiRotta();
  window.scrollTo(0, 0);
});

export function vai(percorso) {
  location.hash = '#/' + percorso;
}

export const isAdmin = () => Boolean(app.studente?.ruoli?.includes('rappr_istituto'));
export const profiloCompleto = () => Boolean(app.studente && app.studente.classe && app.studente.nome && app.studente.cognome);

export async function caricaStudente() {
  if (!app.sessione) {
    app.studente = null;
    return;
  }
  const { data } = await supabase.from('studenti').select('*').eq('user_id', app.sessione.user.id).maybeSingle();
  app.studente = data;
}

export async function caricaImpostazioni() {
  const { data } = await supabase.from('impostazioni').select('*').eq('id', 1).single();
  app.impostazioni = data;
}

export async function avvia() {
  if (!configurato) {
    app.pronto = true;
    return;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  app.sessione = session;
  await Promise.all([caricaStudente(), caricaImpostazioni()]);
  app.pronto = true;

  supabase.auth.onAuthStateChange((_evento, s) => {
    app.sessione = s;
    // Fuori dalla callback: chiamare Supabase qui dentro può bloccare il client.
    setTimeout(caricaStudente, 0);
  });
}

export async function esci() {
  await supabase.auth.signOut();
  app.studente = null;
  vai('');
}

// Tema chiaro / scuro / automatico, ricordato su questo dispositivo.
export function impostaTema(t) {
  try {
    if (t === 'auto') localStorage.removeItem('tema');
    else localStorage.setItem('tema', t);
  } catch {}
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function temaAttuale() {
  return document.documentElement.dataset.theme ?? 'auto';
}
