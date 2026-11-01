-- Restringe le funzioni che non devono essere chiamabili dal sito (avvisi di sicurezza di Supabase).
-- Le funzioni dei trigger girano comunque: PostgreSQL non controlla EXECUTE quando scatta un trigger.

alter function public.nome_da_email(text) set search_path = '';

revoke execute on function public.collega_utente()      from public, anon, authenticated;
revoke execute on function public.proteggi_studente()   from public, anon, authenticated;
revoke execute on function public.proteggi_corso()      from public, anon, authenticated;
revoke execute on function public.blocca_calendario()   from public, anon, authenticated;
revoke execute on function public.registra_revisione()  from public, anon, authenticated;
revoke execute on function public.privilegiato()        from public, anon, authenticated;
revoke execute on function public.nome_da_email(text)   from public, anon, authenticated;

-- Restano chiamabili, di proposito:
--   mio_studente_id, is_admin, ha_ruolo, fase_attuale → servono alle policy (anche per chi non ha
--     fatto l'accesso, che legge i corsi pianificati) e dicono solo qualcosa su chi le chiama;
--   genera_codici → controlla da sola che sia un rappresentante d'istituto.
