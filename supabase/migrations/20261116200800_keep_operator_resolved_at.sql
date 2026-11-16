-- #8 (revisión): si el operador pone resolved_at en el mismo UPDATE que pasa a resuelto, se respeta
-- (por ejemplo, cargar un arreglo de días atrás). Si no lo toca, now() como antes.
create or replace function public.report_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.resolved_at := case
    when new.status <> 'resolved' then null
    when new.resolved_at is distinct from old.resolved_at then new.resolved_at
    else now()
  end;
  if current_setting('arreglemos.status_by_event', true) is distinct from 'on' then
    new.operator_event_id := coalesce(
      (select max(e.id) from public.report_events e where e.report_id = new.id), 0);
  end if;
  return new;
end;
$$;
revoke all on function public.report_status_changed() from public, anon, authenticated;
