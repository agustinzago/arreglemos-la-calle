-- #6: eventos del reporte, la operación "registrar evento" (por ahora solo sumarse) y la
-- lectura pública de municipios para "Enviar a la Muni". Re-runnable.

create table if not exists public.report_events (
  id bigint generated always as identity primary key,
  report_id bigint not null references public.reports (id) on delete cascade,
  device_id uuid not null,
  type text not null check (type in ('sumate', 'resuelto', 'sigue_roto', 'denuncia')),
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists report_events_report_id_idx on public.report_events (report_id);
-- Un vecino se suma y denuncia una sola vez por reporte; resuelto/sigue_roto se repiten.
create unique index if not exists report_events_once_idx on public.report_events (report_id, device_id, type)
  where type in ('sumate', 'denuncia');

alter table public.report_events enable row level security;
revoke all on table public.report_events from anon, authenticated;

-- El creador queda sumado al crear el reporte (vecinos_count ya arranca en 1). Trigger y no
-- create_report, así los tickets que tocan create_report no chocan con este.
create or replace function public.report_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.report_events (report_id, device_id, type, created_at)
  values (new.id, new.device_id, 'sumate', new.created_at);
  return new;
end;
$$;
revoke all on function public.report_created() from public, anon, authenticated;

drop trigger if exists report_created on public.reports;
create trigger report_created after insert on public.reports
  for each row execute function public.report_created();

-- Reportes creados antes de esta migración.
insert into public.report_events (report_id, device_id, type, created_at)
select r.id, r.device_id, 'sumate', r.created_at
from public.reports r
where not exists (select 1 from public.report_events e where e.report_id = r.id and e.type = 'sumate');

-- Historia pública: nunca device_id; `mine` dice solo si el evento es del vecino que pregunta.
-- Las denuncias no son parte de la historia, y los reportes ocultos no tienen historia pública.
create or replace view public.report_events_public with (security_invoker = false) as
select
  e.id,
  e.report_id,
  e.type,
  e.photo_path,
  e.created_at,
  coalesce(e.device_id = (select auth.uid()), false) as mine
from public.report_events e
join public.reports r on r.id = e.report_id
where r.status <> 'hidden' and e.type <> 'denuncia';
revoke all on table public.report_events_public from anon, authenticated;
grant select on table public.report_events_public to anon, authenticated;

-- Municipios: solo nombre y WhatsApp, para "Enviar a la Muni" (app y web).
create or replace view public.municipalities_public with (security_invoker = false) as
select m.id, m.name, m.whatsapp from public.municipalities m where m.active;
revoke all on table public.municipalities_public from anon, authenticated;
grant select on table public.municipalities_public to anon, authenticated;

-- Registrar evento. La firma ya es la final: #8 agrega resuelto (con foto), sigue_roto,
-- denuncia y el recálculo de estado sin cambiarla.
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
  v_row public.reports_public;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_type is distinct from 'sumate' then
    raise exception 'invalid_event' using errcode = '22023';
  end if;
  if p_photo_path is not null then
    raise exception 'photo_not_allowed' using errcode = '22023';
  end if;

  -- Bloquea la fila: dos vecinos sumándose a la vez no pierden la cuenta.
  perform 1 from public.reports r where r.id = p_report_id and r.status <> 'hidden' for update;
  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;

  begin
    insert into public.report_events (report_id, device_id, type) values (p_report_id, v_uid, p_type);
  exception when unique_violation then
    raise exception 'duplicate_event' using errcode = '23505';
  end;

  update public.reports r
  set vecinos_count = (select count(*) from public.report_events e where e.report_id = r.id and e.type = 'sumate'),
      updated_at = now()
  where r.id = p_report_id;

  select * into v_row from public.reports_public where id = p_report_id;
  return v_row;
end;
$$;

revoke all on function public.register_event(bigint, text, text) from public, anon;
grant execute on function public.register_event(bigint, text, text) to authenticated;
