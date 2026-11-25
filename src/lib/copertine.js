// Copertine dei corsi: l'immagine si rimpicciolisce e si comprime sul telefono prima di partire,
// così il caricamento è veloce anche con poca rete e lo spazio gratuito di Supabase basta.
import { supabase } from './supabase.js';

const BUCKET = 'copertine';
const LATO_MAX = 1280;
const PESO_MAX = 900 * 1024; // sotto il limite di 1 MB del bucket

export const urlCopertina = (path) => (path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null);

function inBlob(canvas, tipo, qualita) {
  return new Promise((ok) => canvas.toBlob(ok, tipo, qualita));
}

async function apri(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {}
  }
  // Ripiego per i browser vecchi.
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Restituisce un Blob WebP (o JPEG dove WebP non c'è) con il lato lungo al massimo di 1280px.
export async function comprimi(file) {
  if (!file.type.startsWith('image/')) throw new Error('Scegli un file immagine (JPG, PNG, WebP, HEIC…).');
  let img;
  try {
    img = await apri(file);
  } catch {
    throw new Error("Questa immagine non si riesce ad aprire. Prova con un'altra o fai uno screenshot.");
  }
  const w0 = img.width, h0 = img.height;
  const k = Math.min(1, LATO_MAX / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w0 * k);
  canvas.height = Math.round(h0 * k);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // i PNG trasparenti diventano su fondo bianco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close?.();

  let tipo = 'image/webp';
  let blob = await inBlob(canvas, tipo, 0.82);
  if (!blob || blob.type !== tipo) {
    tipo = 'image/jpeg';
    blob = await inBlob(canvas, tipo, 0.82);
  }
  for (const q of [0.7, 0.58, 0.45]) {
    if (blob.size <= PESO_MAX) break;
    blob = await inBlob(canvas, tipo, q);
  }
  if (blob.size > PESO_MAX) throw new Error("L'immagine resta troppo pesante anche compressa. Prova con un'altra.");
  return blob;
}

// Carica nella cartella dello studente e restituisce il percorso da salvare nel corso.
export async function carica(file, studenteId) {
  const blob = await comprimi(file);
  const est = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${studenteId}/${crypto.randomUUID()}.${est}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) throw new Error('Caricamento non riuscito. Controlla la connessione e riprova.');
  return path;
}

// Toglie un'immagine non più usata. Se non riesce pazienza: non blocca niente.
export async function togli(path) {
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {}
}
