-- Bloquear a quien publicó un reporte (App Store, guía 1.2: contenido generado por usuarios). El vecino
-- deja de ver los reportes y los movimientos de esa persona: en el mapa, en el detalle, en los cercanos y
-- en la historia de otros reportes. Quien publicó nunca se entera ni se revela quién es (solo la base
-- conoce el device_id). La web pública no tiene sesión, así que no cambia. Re-runnable.

create table if not exists public.blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
revoke all on table public.blocks from anon, authenticated;

-- Igual que en init, más el filtro de bloqueados (auth.uid() es null sin sesión: no filtra nada).
create or replace view public.reports_public with (security_invoker = false) as
select
  r.id,
  r.category,
  extensions.st_y(r.point::extensions.geometry) as lat,
  extensions.st_x(r.point::extensions.geometry) as lng,
  r.address,
  r.photo_path,
  r.description,
  r.status,
  r.municipality_id,
  r.vecinos_count,
  r.created_at,
  r.updated_at,
  r.resolved_at
from public.reports r
where r.status <> 'hidden'
  and not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = r.device_id);
revoke all on table public.reports_public from anon, authenticated;
grant select on table public.reports_public to anon, authenticated;

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
where r.status <> 'hidden' and e.type <> 'denuncia'
  and not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = e.device_id);
revoke all on table public.report_events_public from anon, authenticated;
grant select on table public.report_events_public to anon, authenticated;

-- nearby_reports lee la tabla directo: mismo cuerpo que en su migración, más el filtro.
create or replace function public.nearby_reports(
  p_lat double precision,
  p_lng double precision,
  p_category text
)
returns table (
  id bigint,
  category text,
  lat double precision,
  lng double precision,
  address text,
  photo_path text,
  description text,
  status text,
  municipality_id bigint,
  vecinos_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  distance_m double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with here as (
    select
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as point,
      -- Radio de duplicado en metros, por categoría.
      case p_category
        when 'luminaria' then 5
        when 'bache' then 10
        when 'basural' then 30
        when 'anegamiento' then 50
        when 'calle_tierra' then 100
        else 20
      end as radius
  )
  select
    r.id,
    r.category,
    extensions.st_y(r.point::extensions.geometry),
    extensions.st_x(r.point::extensions.geometry),
    r.address,
    r.photo_path,
    r.description,
    r.status,
    r.municipality_id,
    r.vecinos_count,
    r.created_at,
    r.updated_at,
    r.resolved_at,
    extensions.st_distance(r.point, h.point)
  from public.reports r, here h
  where r.status = 'open'
    and r.category = p_category
    and extensions.st_dwithin(r.point, h.point, h.radius)
    and not exists (select 1 from public.blocks b where b.blocker = (select auth.uid()) and b.blocked = r.device_id)
  order by extensions.st_distance(r.point, h.point)
  limit 3;
$$;

revoke all on function public.nearby_reports(double precision, double precision, text) from public, anon;
grant execute on function public.nearby_reports(double precision, double precision, text) to authenticated;

-- Bloquear al autor de un reporte. Bloquearse a uno mismo no tiene sentido: error.
create or replace function public.block_report_author(p_report_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_author uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select r.device_id into v_author from public.reports r where r.id = p_report_id;
  if v_author is null then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;
  if v_author = v_uid then
    raise exception 'own_report' using errcode = '22023';
  end if;
  insert into public.blocks (blocker, blocked) values (v_uid, v_author) on conflict do nothing;
end;
$$;

revoke all on function public.block_report_author(bigint) from public, anon;
grant execute on function public.block_report_author(bigint) to authenticated;
