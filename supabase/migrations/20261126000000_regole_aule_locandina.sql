-- Regole delle aule e locandina del corso (richieste di Federico, 26/11/2026).
--
-- 1. Posti massimi per tipo di aula, modificabili dalle Impostazioni. Un tipo senza valore
--    (oggi aula magna e palestra) non ha limite oltre ai 300 generali.
-- 2. Nota su come distribuire le ore (es. "3 giorni da 2 ore" oppure "tutte insieme").
-- 3. Docente referente obbligatorio nei laboratori di informatica, fisica e chimica.
-- 4. Locandina: un colore e un'icona scelti da liste fisse.

alter table public.impostazioni
  add column posti_max_aula jsonb not null
    default '{"normale": 20, "lab_informatica": 20, "lab_fisica": 20, "lab_chimica": 20}'::jsonb;

alter table public.corsi
  add column distribuzione_ore text check (char_length(distribuzione_ore) <= 200),
  add column colore text not null default 'inchiostro'
    check (colore in ('inchiostro', 'porpora', 'rosso', 'blu', 'verde', 'ocra')),
  add column icona text
    check (icona in ('atomo', 'beuta', 'compasso', 'molecola', 'provetta', 'grafico',
                     'lampadina', 'computer', 'pallone', 'megafono', 'stella', 'persone')),
  add constraint docente_nei_laboratori check (
    aula_richiesta not in ('lab_informatica', 'lab_fisica', 'lab_chimica')
    or char_length(btrim(coalesce(docente_referente, ''))) >= 3
  );

-- Il limite di posti si controlla con un trigger perché dipende dalle impostazioni.
-- I rappresentanti d'istituto possono superarlo (casi particolari decisi da loro).
create function public.controlla_posti() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  limite int;
begin
  select (posti_max_aula ->> new.aula_richiesta::text)::int into limite
  from public.impostazioni where id = 1;
  if limite is not null and new.posti_max > limite and not public.privilegiato() then
    raise exception 'posti_oltre_limite: al massimo % posti in quest''aula', limite using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger controlla_posti
  before insert or update of posti_max, aula_richiesta on public.corsi
  for each row execute function public.controlla_posti();

revoke execute on function public.controlla_posti() from public, anon, authenticated;
