// Una frase che si accende parola per parola mentre attraversa lo schermo
// (il "word-highlight" di taste-skill). Torna indietro se si scorre verso l'alto.
// Senza script o con movimento ridotto la frase è già tutta accesa.
// Uso: <p use:siAccende>Testo con una parola <strong>forte</strong>.</p>
export function siAccende(nodo, { da = 0.85, a = 0.45 } = {}) {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

  // Avvolge ogni parola in uno <span class="parola">, lasciando intatti gli elementi (es. <strong>).
  const parole = [];
  const avvolgi = (el) => {
    for (const figlio of [...el.childNodes]) {
      if (figlio.nodeType === Node.TEXT_NODE) {
        const pezzi = figlio.textContent.split(/(\s+)/);
        const frammento = document.createDocumentFragment();
        for (const p of pezzi) {
          if (!p) continue;
          if (/^\s+$/.test(p)) frammento.append(p);
          else {
            const s = document.createElement('span');
            s.className = 'parola';
            s.textContent = p;
            parole.push(s);
            frammento.append(s);
          }
        }
        figlio.replaceWith(frammento);
      } else if (figlio.nodeType === Node.ELEMENT_NODE) avvolgi(figlio);
    }
  };
  avvolgi(nodo);
  nodo.classList.add('si-accende');

  let accese = -1;
  let richiesta = 0;
  const aggiorna = () => {
    richiesta = 0;
    const r = nodo.getBoundingClientRect();
    const vh = innerHeight;
    const inizio = vh * da;
    const fine = vh * a;
    const t = Math.min(1, Math.max(0, (inizio - r.top) / Math.max(1, inizio - fine + r.height)));
    const inFondo = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    const k = inFondo ? parole.length : Math.round(t * parole.length);
    if (k === accese) return;
    accese = k;
    parole.forEach((p, i) => p.classList.toggle('accesa', i < k));
  };
  const allaProssima = () => {
    if (!richiesta) richiesta = requestAnimationFrame(aggiorna);
  };
  addEventListener('scroll', allaProssima, { passive: true });
  addEventListener('resize', allaProssima, { passive: true });
  aggiorna();

  return {
    destroy() {
      removeEventListener('scroll', allaProssima);
      removeEventListener('resize', allaProssima);
      cancelAnimationFrame(richiesta);
    },
  };
}
