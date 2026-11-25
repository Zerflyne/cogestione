// Testi del sito dei rappresentanti. Per cambiare contatti, numeri o attività basta modificare qui.

// Come raggiungerci. Le voci senza valore non compaiono sul sito.
// DA COMPLETARE: email e profilo Instagram, se ci sono.
export const contatti = {
  email: '',
  instagram: '', // solo il nome utente, senza @
};

// I numeri di "Chi siamo". Niente nomi sul sito.
export const numeri = [
  { valore: 4, testo: 'rappresentanti d’istituto, eletti dagli studenti ogni anno' },
  { valore: 500, testo: 'studenti circa, da ascoltare e rappresentare' },
  { valore: 5, testo: 'giorni di cogestione, costruiti insieme' },
];

// Formule che scorrono nel nastro: siamo pur sempre uno scientifico.
export const formule = ['E = mc²', 'F = ma', 'a² + b² = c²', 'PV = nRT', '∫ f(x) dx', 'e^iπ + 1 = 0', 'H₂O', 'Δx · Δp ≥ ħ/2', 'sin²x + cos²x = 1', 'C₆H₁₂O₆', 'v = λf', 'lim x→0 sin x / x = 1'];

// Cosa fanno i rappresentanti. `disegno` è uno dei disegnini di Schizzo.svelte.
export const attivita = [
  {
    disegno: 'megafono',
    titolo: 'Assemblee d’istituto',
    testo: 'Le organizziamo insieme a voi: temi, ospiti, spazi. E portiamo al Consiglio quello che ne esce.',
  },
  {
    disegno: 'beuta',
    titolo: 'Cogestione',
    testo: 'Cinque giorni di corsi proposti dagli studenti. Ha una sezione tutta sua su questo sito.',
    href: './cogestione/',
  },
  {
    disegno: 'compasso',
    titolo: 'Consiglio d’istituto',
    testo: 'Sediamo nel Consiglio con docenti, genitori e preside, e votiamo per conto degli studenti.',
  },
  {
    disegno: 'lampadina',
    titolo: 'Idee e segnalazioni',
    testo: 'Un problema in un’aula, un’idea per un evento, una proposta per la scuola: diccelo.',
    href: '#contatti',
  },
];
