-- Piattaforma cogestione · schema iniziale
-- Tabelle, ruoli e permessi per le tre fasi (proposte, iscrizioni, amministrazione).
-- Le regole importanti stanno qui, non nel sito: chi modifica la pagina dal browser non può aggirarle.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────
-- Tipi
-- ─────────────────────────────────────────────

create type public.ruolo as enum ('studente', 'rappr_classe', 'servizio_ordine', 'rappr_istituto');
create type public.tipo_aula as enum ('normale', 'aula_magna', 'lab_informatica', 'lab_fisica', 'lab_chimica', 'palestra');
create type public.stato_proposta as enum ('inviata', 'in_revisione', 'da_modificare', 'approvata', 'respinta', 'pianificata');
create type public.fase as enum ('chiusa', 'proposte', 'calendario', 'iscrizioni', 'cogestione');
create type public.origine_iscrizione as enum ('scelta', 'rappresentante', 'automatica', 'amministrazione');

-- ─────────────────────────────────────────────
-- Impostazioni (una sola riga)
-- ─────────────────────────────────────────────

create table public.impostazioni (
  id                   int primary key default 1 check (id = 1),
  fase                 public.fase not null default 'chiusa',
  proposte_apertura    timestamptz,
  proposte_chiusura    timestamptz,
  iscrizioni_apertura  timestamptz,
  iscrizioni_chiusura  timestamptz,
  soglia_copertura     numeric(4, 2) not null default 1.10 check (soglia_copertura >= 1),
  calendario_bloccato  boolean not null default false,
  dominio_email        text not null default 'istitutotorricelli.edu.it'
);
insert into public.impostazioni default values;

-- ─────────────────────────────────────────────
-- Studenti
-- ─────────────────────────────────────────────

create table public.studenti (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users (id) on delete set null,
  nome       text not null default '',
  cognome    text not null default '',
  classe     text not null default '',
  email      text not null unique check (email = lower(email)),
  codice     text unique check (codice ~ '^[A-Z2-9]{8}$'),
  ruoli      public.ruolo[] not null default '{studente}',
  creato_il  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Funzioni di supporto per i permessi
-- ─────────────────────────────────────────────

create function public.mio_studente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.studenti where user_id = auth.uid()
$$;

create function public.ha_ruolo(r public.ruolo) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.studenti where user_id = auth.uid() and r = any (ruoli))
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.ha_ruolo('rappr_istituto')
$$;

-- Nessun utente collegato = chiamata di servizio (editor SQL di Supabase, funzioni lato server).
-- Anonimi e studenti non arrivano mai qui senza auth.uid(): le policy non lo permettono.
create function public.privilegiato() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.is_admin()
$$;

create function public.fase_attuale() returns public.fase
language sql stable security definer set search_path = public as $$
  select fase from public.impostazioni where id = 1
$$;

-- ─────────────────────────────────────────────
-- Collegamento account → studente
-- Accetta solo l'indirizzo istituzionale. Se lo studente è già nell'elenco
-- caricato dai rappresentanti, collega l'account; altrimenti crea la scheda.
-- ─────────────────────────────────────────────

create function public.collega_utente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  dominio text;
begin
  select dominio_email into dominio from public.impostazioni where id = 1;
  if lower(split_part(new.email, '@', 2)) <> lower(dominio) then
    raise exception 'Serve l''account istituzionale @%', dominio;
  end if;

  update public.studenti set user_id = new.id
   where email = lower(new.email) and user_id is null;

  if not found then
    insert into public.studenti (user_id, email, nome, cognome)
    values (
      new.id,
      lower(new.email),
      coalesce(new.raw_user_meta_data ->> 'given_name', ''),
      coalesce(new.raw_user_meta_data ->> 'family_name', '')
    )
    on conflict (email) do nothing;
  end if;
  return new;
end
$$;

create trigger collega_utente
  after insert on auth.users
  for each row execute function public.collega_utente();

-- Lo studente può completare nome, cognome e classe, ma non cambiare ruoli, email o codice.
-- La classe si sceglie una volta sola: dopo la cambiano solo i rappresentanti d'istituto.
create function public.proteggi_studente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.privilegiato() then
    return new;
  end if;
  new.user_id := old.user_id;
  new.email   := old.email;
  new.codice  := old.codice;
  new.ruoli   := old.ruoli;
  if old.classe <> '' then
    new.classe := old.classe;
  end if;
  return new;
end
$$;

create trigger proteggi_studente
  before update on public.studenti
  for each row execute function public.proteggi_studente();

-- ─────────────────────────────────────────────
-- Corsi (proposte)
-- ─────────────────────────────────────────────

create table public.corsi (
  id                   uuid primary key default gen_random_uuid(),
  proponente_id        uuid not null references public.studenti (id) on delete cascade,
  titolo               text not null check (char_length(titolo) between 3 and 60),
  descrizione          text not null check (char_length(descrizione) between 20 and 500),
  immagine_path        text,
  fasce_necessarie     int  not null check (fasce_necessarie between 1 and 6),
  posti_max            int  not null check (posti_max between 5 and 300),
  aula_richiesta       public.tipo_aula not null,
  attivita_palestra    text check (char_length(attivita_palestra) <= 1000),
  docente_referente    text check (char_length(docente_referente) <= 80),
  preferenza_oraria    text check (char_length(preferenza_oraria) <= 200),
  co_conduttori        text check (char_length(co_conduttori) <= 200),
  materiale            text check (char_length(materiale) <= 300),
  stato                public.stato_proposta not null default 'inviata',
  nota_revisione       text,
  parere_dipartimento  boolean,          -- solo palestra: null = in attesa, true = sì, false = no
  creato_il            timestamptz not null default now(),
  aggiornato_il        timestamptz not null default now(),

  -- La palestra richiede la descrizione dell'attività per il capo dipartimento di scienze motorie.
  constraint palestra_descritta check (
    aula_richiesta <> 'palestra' or char_length(coalesce(attivita_palestra, '')) >= 20
  ),
  -- La preferenza oraria vale solo per le richieste semplici: aula normale e nessun docente specifico.
  constraint preferenza_solo_semplici check (
    preferenza_oraria is null or (aula_richiesta = 'normale' and docente_referente is null)
  ),
  -- Un corso in palestra entra in calendario solo dopo il sì del dipartimento.
  constraint palestra_approvata check (
    aula_richiesta <> 'palestra' or stato not in ('approvata', 'pianificata') or parere_dipartimento is true
  )
);

create index corsi_proponente on public.corsi (proponente_id);
create index corsi_stato on public.corsi (stato);

-- Chi non è rappresentante d'istituto non può cambiare stato, note o parere.
-- L'unico passaggio permesso al proponente è "da modificare" → "inviata" quando corregge.
create function public.proteggi_corso() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.aggiornato_il := now();
  if public.privilegiato() then
    return new;
  end if;
  new.proponente_id       := old.proponente_id;
  new.nota_revisione      := old.nota_revisione;
  new.parere_dipartimento := old.parere_dipartimento;
  new.stato := case when old.stato = 'da_modificare' then 'inviata'::public.stato_proposta else old.stato end;
  return new;
end
$$;

create trigger proteggi_corso
  before update on public.corsi
  for each row execute function public.proteggi_corso();

-- ─────────────────────────────────────────────
-- Calendario: aule, fasce, sessioni
-- ─────────────────────────────────────────────

create table public.aule (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null unique,
  tipo      public.tipo_aula not null,
  capienza  int not null check (capienza > 0)
);

create table public.fasce (
  id          uuid primary key default gen_random_uuid(),
  giorno      date not null,
  ora_inizio  time not null,
  ora_fine    time not null check (ora_fine > ora_inizio),
  unique (giorno, ora_inizio)
);

-- Una sessione è un corso collocato in una fascia e in un'aula.
-- Un corso di più fasce ha una sessione per ogni fascia, legate dallo stesso "blocco".
create table public.sessioni (
  id         uuid primary key default gen_random_uuid(),
  corso_id   uuid not null references public.corsi (id) on delete cascade,
  fascia_id  uuid not null references public.fasce (id) on delete restrict,
  aula_id    uuid not null references public.aule (id) on delete restrict,
  blocco     uuid not null default gen_random_uuid(),
  posti      int not null check (posti > 0),
  unique (aula_id, fascia_id)          -- un'aula non ospita due corsi nella stessa fascia
);

create index sessioni_fascia on public.sessioni (fascia_id);

-- Dopo l'approvazione del Collegio docenti il calendario non si modifica più.
create function public.blocca_calendario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select calendario_bloccato from public.impostazioni where id = 1) then
    raise exception 'Il calendario è bloccato: è stato approvato dal Collegio docenti';
  end if;
  return coalesce(new, old);
end
$$;

create trigger blocca_calendario
  before insert or update or delete on public.sessioni
  for each row execute function public.blocca_calendario();

-- ─────────────────────────────────────────────
-- Iscrizioni e presenze (fase 2, logica completa in una migrazione successiva)
-- ─────────────────────────────────────────────

create table public.iscrizioni (
  id           uuid primary key default gen_random_uuid(),
  studente_id  uuid not null references public.studenti (id) on delete cascade,
  sessione_id  uuid not null references public.sessioni (id) on delete cascade,
  fascia_id    uuid not null references public.fasce (id) on delete cascade,
  origine      public.origine_iscrizione not null default 'scelta',
  creata_il    timestamptz not null default now(),
  unique (studente_id, fascia_id)      -- una sola attività per fascia
);

create index iscrizioni_sessione on public.iscrizioni (sessione_id);

create table public.presenze (
  iscrizione_id  uuid primary key references public.iscrizioni (id) on delete cascade,
  presente       boolean not null,
  segnata_da     uuid references public.studenti (id) on delete set null,
  segnata_il     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Registro delle azioni dei rappresentanti
-- ─────────────────────────────────────────────

create table public.registro (
  id        bigint generated always as identity primary key,
  autore    uuid references public.studenti (id) on delete set null,
  azione    text not null,
  dettagli  jsonb,
  il        timestamptz not null default now()
);

create function public.registra_revisione() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() and (
       new.stato is distinct from old.stato
    or new.nota_revisione is distinct from old.nota_revisione
    or new.parere_dipartimento is distinct from old.parere_dipartimento
  ) then
    insert into public.registro (autore, azione, dettagli)
    values (public.mio_studente_id(), 'revisione_corso', jsonb_build_object(
      'corso', new.id, 'titolo', new.titolo,
      'da', old.stato, 'a', new.stato,
      'nota', new.nota_revisione, 'parere_dipartimento', new.parere_dipartimento
    ));
  end if;
  return new;
end
$$;

create trigger registra_revisione
  after update on public.corsi
  for each row execute function public.registra_revisione();

-- ─────────────────────────────────────────────
-- Codici personali di accesso (piano B)
-- 8 caratteri senza simboli ambigui (niente 0/O, 1/I).
-- ─────────────────────────────────────────────

create function public.nuovo_codice() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := gen_random_bytes(8);
  r text := '';
begin
  for i in 0..7 loop
    r := r || substr(alfabeto, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return r;
end
$$;

-- Genera un codice per chi non lo ha ancora. Solo rappresentanti d'istituto.
create function public.genera_codici() returns int
language plpgsql security definer set search_path = public as $$
declare
  n int := 0;
  s record;
begin
  if not public.is_admin() then
    raise exception 'Solo i rappresentanti d''istituto possono generare i codici';
  end if;
  for s in select id from public.studenti where codice is null loop
    loop
      begin
        update public.studenti set codice = public.nuovo_codice() where id = s.id;
        exit;
      exception when unique_violation then
        -- collisione rarissima: si riprova
      end;
    end loop;
    n := n + 1;
  end loop;
  insert into public.registro (autore, azione, dettagli)
  values (public.mio_studente_id(), 'genera_codici', jsonb_build_object('quanti', n));
  return n;
end
$$;

-- ─────────────────────────────────────────────
-- Permessi (Row Level Security)
-- ─────────────────────────────────────────────

alter table public.impostazioni enable row level security;
alter table public.studenti     enable row level security;
alter table public.corsi        enable row level security;
alter table public.aule         enable row level security;
alter table public.fasce        enable row level security;
alter table public.sessioni     enable row level security;
alter table public.iscrizioni   enable row level security;
alter table public.presenze     enable row level security;
alter table public.registro     enable row level security;

-- Impostazioni: le leggono tutti (servono per sapere quale fase è aperta), le cambiano i rappresentanti.
create policy impostazioni_lettura on public.impostazioni for select using (true);
create policy impostazioni_admin   on public.impostazioni for update using (public.is_admin()) with check (public.is_admin());

-- Studenti: ognuno vede e completa la propria scheda; i rappresentanti vedono e gestiscono tutto.
create policy studenti_propri       on public.studenti for select using (user_id = auth.uid() or public.is_admin());
create policy studenti_aggiorna     on public.studenti for update using (user_id = auth.uid() or public.is_admin())
                                                              with check (user_id = auth.uid() or public.is_admin());
create policy studenti_admin_ins    on public.studenti for insert with check (public.is_admin());
create policy studenti_admin_del    on public.studenti for delete using (public.is_admin());

-- Corsi
create policy corsi_lettura on public.corsi for select using (
  proponente_id = public.mio_studente_id()
  or public.is_admin()
  or stato = 'pianificata'
);
create policy corsi_proponi on public.corsi for insert with check (
  proponente_id = public.mio_studente_id()
  and stato = 'inviata'
  and nota_revisione is null
  and parere_dipartimento is null
  and public.fase_attuale() = 'proposte'
  and exists (select 1 from public.studenti where id = proponente_id and classe <> '')
);
create policy corsi_modifica on public.corsi for update using (
  public.is_admin()
  or (proponente_id = public.mio_studente_id()
      and stato in ('inviata', 'da_modificare')
      and public.fase_attuale() = 'proposte')
);
create policy corsi_ritira on public.corsi for delete using (
  public.is_admin()
  or (proponente_id = public.mio_studente_id() and stato in ('inviata', 'da_modificare'))
);

-- Aule e fasce: pubbliche in lettura, gestite dai rappresentanti.
create policy aule_lettura  on public.aule  for select using (true);
create policy aule_admin    on public.aule  for all using (public.is_admin()) with check (public.is_admin());
create policy fasce_lettura on public.fasce for select using (true);
create policy fasce_admin   on public.fasce for all using (public.is_admin()) with check (public.is_admin());

-- Sessioni: pubbliche in lettura, gestite dai rappresentanti (e bloccate dopo il Collegio).
create policy sessioni_lettura on public.sessioni for select using (true);
create policy sessioni_admin   on public.sessioni for all using (public.is_admin()) with check (public.is_admin());

-- Iscrizioni: ognuno vede le proprie; i rappresentanti e il servizio d'ordine le vedono tutte.
-- La scrittura passa da funzioni dedicate (fase 2), non da accesso diretto.
create policy iscrizioni_lettura on public.iscrizioni for select using (
  studente_id = public.mio_studente_id() or public.is_admin() or public.ha_ruolo('servizio_ordine')
);
create policy iscrizioni_admin on public.iscrizioni for all using (public.is_admin()) with check (public.is_admin());

-- Presenze: servizio d'ordine e rappresentanti.
create policy presenze_lettura on public.presenze for select using (public.is_admin() or public.ha_ruolo('servizio_ordine'));
create policy presenze_scrivi  on public.presenze for all using (public.is_admin() or public.ha_ruolo('servizio_ordine'))
                                                  with check (public.is_admin() or public.ha_ruolo('servizio_ordine'));

-- Registro: solo i rappresentanti lo leggono; si scrive solo tramite le funzioni.
create policy registro_lettura on public.registro for select using (public.is_admin());

-- Chi non ha fatto l'accesso non può chiamare le funzioni amministrative.
revoke execute on function public.genera_codici() from public, anon;
grant  execute on function public.genera_codici() to authenticated;  -- la funzione stessa controlla che sia un rappresentante d'istituto
revoke execute on function public.nuovo_codice() from public, anon, authenticated;
