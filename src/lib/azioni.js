// Fa comparire un elemento con una piccola animazione quando entra nello schermo.
// Uso: <div use:appare> oppure <div use:appare={{ ritardo: 80 }}>
export function appare(nodo, { ritardo = 0 } = {}) {
  if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {};
  }
  nodo.classList.add('appare');
  nodo.style.setProperty('--ritardo', `${ritardo}ms`);
  const osservatore = new IntersectionObserver(
    (voci) => {
      for (const v of voci) {
        if (v.isIntersecting) {
          nodo.classList.add('visibile');
          osservatore.disconnect();
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  osservatore.observe(nodo);
  return { destroy: () => osservatore.disconnect() };
}

// Leggero effetto "pressione" al tocco, anche su elementi che non sono pulsanti.
export function premibile(nodo) {
  const giu = () => nodo.classList.add('premuto');
  const su = () => nodo.classList.remove('premuto');
  nodo.addEventListener('pointerdown', giu);
  for (const e of ['pointerup', 'pointerleave', 'pointercancel']) nodo.addEventListener(e, su);
  return {
    destroy() {
      nodo.removeEventListener('pointerdown', giu);
      for (const e of ['pointerup', 'pointerleave', 'pointercancel']) nodo.removeEventListener(e, su);
    },
  };
}
