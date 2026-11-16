-- #8: estados que deciden los vecinos (ADR-0005). register_event suma resuelto (con foto opcional),
-- sigue_roto y denuncia, y recalcula el estado. Re-runnable.
--
-- Recálculo: cada evento aplica su regla sobre el estado actual, contando solo los eventos que
-- vinieron después del último cambio manual del operador:
--   resuelto   → resolved con 2 resuelto de vecinos distintos desde el último sigue_roto;
--   sigue_roto → open (solo si estaba resolved);
--   denuncia   → hidden con 3 denuncias de vecinos distintos;
--   sumate     → no cambia el estado.
-- El operador cambia `status` a mano desde el panel de Supabase. El trigger guarda en
-- operator_event_id el último evento de ese momento: lo que pasó antes ya no cuenta, así que su
-- cambio vale hasta el siguiente evento (p. ej. si restaura un reporte denunciado, hacen falta 3
-- denuncias nuevas; si reabre uno resuelto, 2 arreglado nuevos).

alter table public.reports add column if not exists operator_event_id bigint;

-- Único lugar donde se reacciona a un cambio de estado (evento u operador): fechas y, si lo cambió
-- el operador, la línea de base del recálculo. #13 (avisos): colgarse con un AFTER UPDATE trigger
-- `when (old.status is distinct from new.status)` en public.reports.
create or replace function public.report_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.resolved_at := case when new.status = 'resolved' then now() end;
  if current_setting('arreglemos.status_by_event', true) is distinct from 'on' then
    new.operator_event_id := coalesce(
      (select max(e.id) from public.report_events e where e.report_id = new.id), 0);
  end if;
  return new;
end;
$$;
revoke all on function public.report_status_changed() from public, anon, authenticated;

drop trigger if exists report_status_changed on public.reports;
create trigger report_status_changed before update of status on public.reports
  for each row when (old.status is distinct from new.status)
  execute function public.report_status_changed();

-- Misma firma que #6. Devuelve el reporte actualizado (con status 'hidden' si la denuncia lo ocultó).
create or replace function public.register_event(
  p_report_id bigint,
  p_type text,
  p_photo_path text default null
)
returns public.reports_public
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
  v_since bigint; -- los eventos con id mayor son los que cuentan
  v_new text;
  v_row public.reports_public;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_type is null or p_type not in ('sumate', 'resuelto', 'sigue_roto', 'denuncia') then
    raise exception 'invalid_event' using errcode = '22023';
  end if;
  if p_photo_path is not null and p_type <> 'resuelto' then
    raise exception 'photo_not_allowed' using errcode = '22023';
  end if;

  -- Bloquea la fila: dos eventos a la vez no pierden la cuenta ni el estado.
  select r.status, coalesce(r.operator_event_id, 0) into v_status, v_since
  from public.reports r where r.id = p_report_id and r.status <> 'hidden' for update;
  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;

  if p_type = 'sigue_roto' and v_status <> 'resolved' then
    raise exception 'not_resolved' using errcode = '55000';
  end if;
  if p_type = 'resuelto' then
    if v_status <> 'open' then
      raise exception 'not_open' using errcode = '55000';
    end if;
    v_since := greatest(v_since, coalesce((select max(e.id) from public.report_events e
      where e.report_id = p_report_id and e.type = 'sigue_roto'), 0));
    -- Un vecino marca arreglado una vez por vuelta (después de un sigue_roto puede de nuevo).
    if exists (select 1 from public.report_events e where e.report_id = p_report_id and e.type = 'resuelto'
               and e.device_id = v_uid and e.id > v_since) then
      raise exception 'duplicate_event' using errcode = '23505';
    end if;
    if p_photo_path is not null and (split_part(p_photo_path, '/', 1) <> v_uid::text
       or not exists (select 1 from storage.objects o where o.bucket_id = 'photos' and o.name = p_photo_path)) then
      raise exception 'photo_not_found' using errcode = '22023';
    end if;
  end if;

  begin
    insert into public.report_events (report_id, device_id, type, photo_path)
    values (p_report_id, v_uid, p_type, p_photo_path);
  exception when unique_violation then
    raise exception 'duplicate_event' using errcode = '23505';
  end;

  v_new := case p_type
    when 'sigue_roto' then 'open'
    when 'resuelto' then case when (select count(distinct e.device_id) from public.report_events e
      where e.report_id = p_report_id and e.type = 'resuelto' and e.id > v_since) >= 2 then 'resolved' end
    when 'denuncia' then case when (select count(distinct e.device_id) from public.report_events e
      where e.report_id = p_report_id and e.type = 'denuncia' and e.id > v_since) >= 3 then 'hidden' end
  end;

  -- Fila pública de antes: si este evento lo oculta, la vista ya no lo va a mostrar.
  select * into v_row from public.reports_public where id = p_report_id;

  perform set_config('arreglemos.status_by_event', 'on', true);
  update public.reports r
  set vecinos_count = (select count(*) from public.report_events e where e.report_id = r.id and e.type = 'sumate'),
      status = coalesce(v_new, r.status),
      updated_at = now()
  where r.id = p_report_id;
  perform set_config('arreglemos.status_by_event', '', true);

  if v_new = 'hidden' then
    v_row.status := v_new;
    return v_row;
  end if;
  select * into v_row from public.reports_public where id = p_report_id;
  return v_row;
end;
$$;

revoke all on function public.register_event(bigint, text, text) from public, anon;
grant execute on function public.register_event(bigint, text, text) to authenticated;
