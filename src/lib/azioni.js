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

const ridotto = () => typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches;

// Esegue `fatto` quando il nodo entra nello schermo (una volta sola).
function quandoVisibile(nodo, fatto, margine = '0px 0px -10% 0px') {
  if (typeof IntersectionObserver === 'undefined') {
    fatto();
    return () => {};
  }
  const o = new IntersectionObserver(
    (voci) => {
      if (voci.some((v) => v.isIntersecting)) {
        fatto();
        o.disconnect();
      }
    },
    { rootMargin: margine },
  );
  o.observe(nodo);
  return () => o.disconnect();
}

// Comparsa morbida (sale, si mette a fuoco) quando l'elemento entra nello schermo.
// Uso: <div use:appare> oppure <div use:appare={{ ritardo: 80 }}>
export function appare(nodo, { ritardo = 0 } = {}) {
  if (ridotto()) return {};
  nodo.classList.add('appare');
  nodo.style.setProperty('--ritardo', `${ritardo}ms`);
  const stop = quandoVisibile(nodo, () => requestAnimationFrame(() => nodo.classList.add('visibile')));
  return { destroy: stop };
}

// Disegnino a mano che si traccia da solo: ogni elemento con data-tratto si disegna,
// uno dopo l'altro, quando l'SVG entra nello schermo.
// Uso: <svg class="schizzo" use:disegna={{ ritardo: 300, passo: 160 }}>…<path data-tratto d="…"/></svg>
export function disegna(nodo, { ritardo = 0, passo = 140, durata = 900 } = {}) {
  if (ridotto()) return {};
  const tratti = [...nodo.querySelectorAll('[data-tratto]')];
  tratti.forEach((t, i) => {
    const l = Math.ceil(t.getTotalLength?.() ?? 1000) + 2;
    t.style.setProperty('--l', l);
    t.style.setProperty('--d', `${ritardo + i * passo}ms`);
    t.style.setProperty('--durata', `${t.dataset.durata ?? durata}ms`);
  });
  nodo.classList.add('da-disegnare');
  const stop = quandoVisibile(nodo, () => requestAnimationFrame(() => nodo.classList.add('disegnato')), '0px');
  return { destroy: stop };
}
