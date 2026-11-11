// Lettura dell'elenco studenti da CSV o da testo incollato (Excel, Fogli Google, registro elettronico).
// Righe attese: email, cognome, nome, classe, in qualunque ordine, con o senza intestazione.

const SEPARATORI = [';', '\t', ','];
const CLASSE = /^[1-5]\s*[a-z]{1,5}$/i;

function separatore(righe) {
  const prima = righe.find((r) => r.trim()) ?? '';
  return SEPARATORI.find((s) => prima.includes(s)) ?? ',';
}

// Divide una riga CSV rispettando le virgolette ("De Santis, Marco").
function celle(riga, sep) {
  const out = [];
  let cur = '';
  let tra = false;
  for (let i = 0; i < riga.length; i++) {
    const c = riga[i];
    if (c === '"') {
      if (tra && riga[i + 1] === '"') (cur += '"'), i++;
      else tra = !tra;
    } else if (c === sep && !tra) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

const maiuscola = (s) =>
  s
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
    .trim();

// Come nome_da_email nel database: cognome.nome@… → Nome, Cognome.
export function nomeDaEmail(email) {
  const parti = email.split('@')[0].replace(/[0-9]/g, '').split('.').filter(Boolean);
  if (parti.length < 2) return { nome: '', cognome: '' };
  return { nome: maiuscola(parti.at(-1)), cognome: maiuscola(parti.slice(0, -1).join(' ')) };
}

const CAMPI = {
  email: ['email', 'e-mail', 'mail', 'indirizzo'],
  cognome: ['cognome', 'surname'],
  nome: ['nome', 'name'],
  classe: ['classe', 'class', 'sezione'],
};

function leggiIntestazione(c) {
  const mappa = {};
  c.forEach((testo, i) => {
    const t = testo.toLowerCase();
    for (const [campo, nomi] of Object.entries(CAMPI)) {
      if (mappa[campo] === undefined && nomi.some((n) => t === n || t.startsWith(n + ' '))) mappa[campo] = i;
    }
  });
  return mappa.email !== undefined ? mappa : null;
}

// Senza intestazione: la cella con @ è l'email, quella tipo "3A" la classe, le altre cognome e nome.
function indovina(c) {
  const r = { email: '', cognome: '', nome: '', classe: '' };
  const altre = [];
  for (const x of c) {
    if (!x) continue;
    if (!r.email && x.includes('@')) r.email = x;
    else if (!r.classe && CLASSE.test(x)) r.classe = x;
    else altre.push(x);
  }
  // Con una sola cella ("Bianchi Luca") non si sa cosa sia il cognome: meglio ricavarli dall'email.
  if (altre.length >= 2) [r.cognome, r.nome] = altre;
  return r;
}

/**
 * @returns {{ righe: {email,nome,cognome,classe,riga,dedotto}[], scarti: {riga:number, testo:string, motivo:string}[] }}
 */
export function leggiElenco(testo, dominio) {
  const linee = testo.replace(/^﻿/, '').split(/\r?\n/);
  const sep = separatore(linee);
  const visti = new Map();
  const scarti = [];
  let mappa = null;

  linee.forEach((linea, i) => {
    if (!linea.trim()) return;
    const c = celle(linea, sep);
    if (i === 0 || (!mappa && !c.some((x) => x.includes('@')))) {
      const m = leggiIntestazione(c);
      if (m) return void (mappa = m);
    }
    const grezzo = mappa
      ? { email: c[mappa.email] ?? '', cognome: c[mappa.cognome] ?? '', nome: c[mappa.nome] ?? '', classe: c[mappa.classe] ?? '' }
      : indovina(c);

    const email = grezzo.email.toLowerCase().trim();
    const classe = grezzo.classe.toUpperCase().replace(/\s+/g, '');
    const scarta = (motivo) => scarti.push({ riga: i + 1, testo: linea, motivo });

    if (!/^[^@\s]+@[^@\s]+$/.test(email)) return scarta('email mancante o non valida');
    if (email.split('@')[1] !== dominio) return scarta(`non è un indirizzo @${dominio}`);
    if (classe && !CLASSE.test(classe)) return scarta(`classe "${grezzo.classe}" non riconosciuta`);
    if (visti.has(email)) return scarta(`ripetuto (già alla riga ${visti.get(email).riga})`);

    const dedotto = nomeDaEmail(email);
    visti.set(email, {
      email,
      nome: grezzo.nome ? maiuscola(grezzo.nome) : dedotto.nome,
      cognome: grezzo.cognome ? maiuscola(grezzo.cognome) : dedotto.cognome,
      classe,
      riga: i + 1,
      dedotto: !grezzo.nome && !grezzo.cognome,
    });
  });

  return { righe: [...visti.values()], scarti };
}

// Ordina le classi come a scuola: 1A, 1B, … 2A, …, 5Z.
export const perClasse = (a, b) =>
  (a.classe || '~').localeCompare(b.classe || '~', 'it', { numeric: true }) ||
  a.cognome.localeCompare(b.cognome, 'it') ||
  a.nome.localeCompare(b.nome, 'it');

// CSV da aprire con Excel o da usare per una stampa unione in Gmail/Fogli.
export function inCsv(righe, colonne) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [colonne.join(';'), ...righe.map((r) => colonne.map((c) => esc(r[c])).join(';'))].join('\r\n');
}
