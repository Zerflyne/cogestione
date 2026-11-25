-- Copertine dei corsi: un'immagine per proposta, già compressa dal telefono (WebP o JPEG, max 1 MB).
-- Il bucket è pubblico in lettura: chi ha l'indirizzo vede l'immagine (serve a mostrarla nel
-- programma anche a chi non ha fatto l'accesso). Elencare i file invece non si può.
-- Ognuno scrive solo nella sua cartella: copertine/<id studente>/<nome>.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('copertine', 'copertine', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy copertine_carica on storage.objects for insert to authenticated with check (
  bucket_id = 'copertine'
  and (storage.foldername(name))[1] = public.mio_studente_id()::text
  and public.fase_attuale() = 'proposte'
);

create policy copertine_vedi on storage.objects for select to authenticated using (
  bucket_id = 'copertine'
  and ((storage.foldername(name))[1] = public.mio_studente_id()::text or public.is_admin())
);

create policy copertine_cambia on storage.objects for update to authenticated using (
  bucket_id = 'copertine'
  and ((storage.foldername(name))[1] = public.mio_studente_id()::text or public.is_admin())
);

create policy copertine_togli on storage.objects for delete to authenticated using (
  bucket_id = 'copertine'
  and ((storage.foldername(name))[1] = public.mio_studente_id()::text or public.is_admin())
);

-- Il percorso salvato nel corso deve stare nella cartella di chi propone.
alter table public.corsi add constraint immagine_del_proponente check (
  immagine_path is null or immagine_path like proponente_id::text || '/%'
);
