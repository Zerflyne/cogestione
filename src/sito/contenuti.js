// Testi del sito dei rappresentanti. Per cambiare nomi, contatti o attività basta modificare qui.

// I rappresentanti d'istituto in carica. `classe` è facoltativa.
// DA COMPLETARE: nomi veri dei quattro rappresentanti.
export const rappresentanti = [
  { nome: 'Federico', classe: '' },
  { nome: 'Rappresentante 2', classe: '' },
  { nome: 'Rappresentante 3', classe: '' },
  { nome: 'Rappresentante 4', classe: '' },
];

// Come raggiungerci. Le voci senza valore non compaiono sul sito.
// DA COMPLETARE: email e profilo Instagram, se ci sono.
export const contatti = {
  email: '',
  instagram: '', // solo il nome utente, senza @
};

// Cosa fanno i rappresentanti. `disegno` è uno dei disegnini di Schizzo.svelte.
export const attivita = [
  {
    disegno: 'persone',
    titolo: 'Assemblee d’istituto',
    testo: 'Le organizziamo insieme a voi: temi, ospiti, spazi. E portiamo al Consiglio quello che ne esce.',
  },
  {
    disegno: 'griglia',
    titolo: 'Cogestione',
    testo: 'Cinque giorni di corsi proposti dagli studenti. Ha una sezione tutta sua su questo sito.',
    href: './cogestione/',
  },
  {
    disegno: 'lista',
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
