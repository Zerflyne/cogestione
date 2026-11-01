export const STATI = {
  inviata: 'Inviata',
  in_revisione: 'In revisione',
  da_modificare: 'Da modificare',
  approvata: 'Approvata',
  respinta: 'Respinta',
  pianificata: 'Pianificata',
};

export const AULE = {
  normale: 'Aula normale',
  aula_magna: 'Aula magna',
  lab_informatica: 'Laboratorio di informatica',
  lab_fisica: 'Laboratorio di fisica',
  lab_chimica: 'Laboratorio di chimica',
  palestra: 'Palestra',
};

export const FASI = {
  chiusa: 'Chiusa',
  proposte: 'Proposte aperte',
  calendario: 'Calendario in preparazione',
  iscrizioni: 'Iscrizioni aperte',
  cogestione: 'Cogestione in corso',
};

export const formatoData = (iso) =>
  iso
    ? new Date(iso).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';

// Messaggi d'errore del database resi leggibili.
export function messaggioErrore(e) {
  const m = e?.message ?? String(e ?? '');
  if (m.includes('row-level security')) return 'Operazione non permessa in questa fase.';
  if (m.includes('palestra_descritta')) return "Per la palestra descrivi l'attività (almeno 20 caratteri).";
  if (m.includes('preferenza_solo_semplici')) return "La preferenza oraria vale solo per l'aula normale senza docente specifico.";
  if (m.includes('palestra_approvata')) return 'Serve prima il sì del dipartimento di scienze motorie.';
  if (m.includes('calendario è bloccato')) return 'Il calendario è bloccato dopo l\'approvazione del Collegio docenti.';
  return m || 'Qualcosa è andato storto. Riprova.';
}
