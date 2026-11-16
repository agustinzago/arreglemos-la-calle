-- Historias 55–56 de #1: vincular Apple o Google conserva el mismo auth.uid() (Supabase identity
-- linking sobre el usuario anónimo), así que lo hecho como anónimo sigue siendo del vecino sin migrar
-- nada. Lo que agrega esta migración es lo que Apple exige cuando hay una cuenta real: borrarla desde
-- la app. Re-runnable.
--
-- Orden en la app: primero borra sus fotos con la API de Storage (la base no deja borrar
-- storage.objects con SQL), después llama delete_my_account.

-- El vecino lista y borra solo lo de su carpeta (las fotos se siguen leyendo por URL pública).
drop policy if exists "vecinos ven su carpeta" on storage.objects;
create policy "vecinos ven su carpeta" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "vecinos borran su carpeta" on storage.objects;
create policy "vecinos borran su carpeta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Borrar la cuenta: los reportes que creó (con sus eventos y avisos), sus avisos y su token, y el
-- usuario de auth. Sus eventos en reportes ajenos (sumate, arreglado, sigue roto, denuncias) quedan
-- anónimos bajo un id nuevo y sin foto: los cuentan el estado y vecinos_count de los demás, y un id
-- por cuenta borrada mantiene "vecinos distintos" igual.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ghost uuid := gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from public.reports where device_id = v_uid;
  update public.report_events set device_id = v_ghost, photo_path = null where device_id = v_uid;
  -- push_devices, notices, identidades y sesiones se van en cascada.
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
