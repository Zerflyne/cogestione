# Cogestione · IIS Evangelista Torricelli

Piattaforma per organizzare la cogestione: proposte dei corsi, calendario, iscrizioni e presenze.
Lo stesso codice gira come **sito** (GitHub Pages) e come **app** (Tauri) per i rappresentanti e il servizio d'ordine.

Costo: 0 €. Le specifiche complete sono nel documento "Piattaforma cogestione — specifiche".

## Cosa c'è in questa versione

| Parte | Stato |
| --- | --- |
| Accesso con l'account Google della scuola | ✓ |
| Accesso con codice personale (piano B) | ✓ (serve la funzione `login-codice`) |
| Profilo: nome, cognome, classe | ✓ |
| Modulo di proposta, con regole per la palestra e la preferenza oraria | ✓ |
| Le mie proposte: stato, note dei rappresentanti, modifica e ritiro | ✓ |
| Revisione per i rappresentanti: filtri, approvazione, richiesta di modifiche, parere del dipartimento | ✓ |
| Impostazioni: fase, date, blocco del calendario, generazione dei codici | ✓ |
| Caricamento dell'elenco studenti, invio dei codici, fogli da stampare | prossima versione |
| Immagini dei corsi | prossima versione |
| Calendario, iscrizioni, assegnazione automatica | fase 2 |
| Servizio d'ordine, notifiche | fase 3 |

## Struttura

```
src/                 sito (Svelte 5 + Vite)
  pagine/            una pagina per schermata
  lib/               collegamento a Supabase, stato, etichette
supabase/
  migrations/        schema del database, permessi e regole
  functions/         login-codice (accesso con codice personale)
src-tauri/           app Tauri 2 (Android, iOS, desktop)
```

Le regole importanti (chi può fare cosa, la palestra che richiede il parere del dipartimento, il calendario
bloccato dopo il Collegio docenti) stanno **nel database**, non nel sito: anche chi modifica la pagina dal
browser non può aggirarle.

## Configurazione, una volta sola

### 1. Supabase

1. Crea un progetto gratuito su [supabase.com](https://supabase.com) (regione: Europa).
2. **SQL Editor** → incolla ed esegui `supabase/migrations/20261101000000_iniziale.sql`.
3. **Authentication → Providers → Google**: attivalo con Client ID e Secret (vedi punto 2).
4. **Authentication → URL Configuration**: in *Site URL* e *Redirect URLs* metti l'indirizzo del sito
   (es. `https://zerflyne.github.io/cogestione/`) e `http://localhost:5173/` per le prove.
5. Funzione per l'accesso con codice, dal computer:
   ```sh
   npx supabase login
   npx supabase link --project-ref <id-del-progetto>
   npx supabase functions deploy login-codice --no-verify-jwt
   ```
6. Nomina i rappresentanti d'istituto. Dopo che hanno fatto il primo accesso, nel SQL Editor:
   ```sql
   update studenti set ruoli = '{studente,rappr_istituto}'
   where email in ('nome.cognome@istitutotorricelli.edu.it');
   ```

> Un progetto Supabase gratuito va in pausa dopo circa una settimana senza attività. Si riattiva dal pannello:
> controllalo prima dell'apertura delle proposte e delle iscrizioni.

### 2. Google (accesso con l'account della scuola)

1. [Google Cloud Console](https://console.cloud.google.com) → nuovo progetto → *API e servizi → Schermata di consenso OAuth* (tipo "Esterno").
2. *Credenziali → Crea credenziali → ID client OAuth → Applicazione web*.
   Come *URI di reindirizzamento autorizzato* metti `https://<id-del-progetto>.supabase.co/auth/v1/callback`.
3. Copia Client ID e Secret in Supabase (punto 1.3).
4. **Da chiedere all'amministratore della Google Workspace della scuola**: gli account dei minorenni spesso
   non possono accedere ad app esterne. L'amministratore deve autorizzare l'app (Console di amministrazione →
   Sicurezza → Controllo delle API → App di terze parti) usando il Client ID del punto 2. Finché non lo fa,
   resta l'accesso con codice.

### 3. Sito su GitHub Pages

1. *Settings → Secrets and variables → Actions → Variables*: crea `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API). La chiave *anon* è pubblica per natura.
2. *Settings → Pages → Source*: **GitHub Actions**.
3. Ogni push su `main` pubblica il sito.

> GitHub Pages su un repository **privato** richiede GitHub Pro, gratuito per gli studenti con il
> [GitHub Student Developer Pack](https://education.github.com/pack). In alternativa si rende pubblico il
> repository: dentro non ci sono segreti.

## Sviluppo

```sh
cp .env.example .env.local   # inserisci URL e chiave anon
npm install
npm run dev                   # http://localhost:5173
npm run check                 # controlli
npm run build                 # versione da pubblicare in dist/
```

### App (Tauri)

Serve [Rust](https://rustup.rs) e i prerequisiti di Tauri per il proprio sistema
([guida](https://v2.tauri.app/start/prerequisites/)).

```sh
npm run tauri dev                 # app desktop in prova
npm run tauri android init        # una volta, serve Android Studio
npm run tauri android build       # APK per Android
```

- Nell'app si entra con il **codice personale**: Google non permette l'accesso dalle webview.
- iOS richiede un Mac e l'account sviluppatore Apple (99 € l'anno).
- Le notifiche push arriveranno con Firebase Cloud Messaging (gratuito) nella fase del servizio d'ordine.
