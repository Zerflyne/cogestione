// Locandina del corso: un colore e un'icona scelti da liste fisse (le stesse del database).

export const COLORI = {
  inchiostro: 'Inchiostro',
  porpora: 'Porpora',
  rosso: 'Rosso',
  blu: 'Blu',
  verde: 'Verde',
  ocra: 'Ocra',
};

export const ICONE = {
  atomo: 'Atomo',
  beuta: 'Beuta',
  provetta: 'Provetta',
  molecola: 'Molecola',
  compasso: 'Compasso',
  grafico: 'Grafico',
  lampadina: 'Lampadina',
  computer: 'Computer',
  pallone: 'Pallone',
  megafono: 'Megafono',
  stella: 'Stella',
  persone: 'Persone',
};

// Icona proposta in base all'aula, finché non se ne sceglie una.
export const ICONA_AULA = {
  normale: 'lampadina',
  aula_magna: 'megafono',
  lab_informatica: 'computer',
  lab_fisica: 'atomo',
  lab_chimica: 'beuta',
  palestra: 'pallone',
};
