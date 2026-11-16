-- #14: operación "ranking semanal" del contrato y vista compatible con GeoReport v2 (Open311).
-- Las dos leen de reports_public, así que nunca ven ocultos ni device_id/user_id. Re-runnable.

-- Ranking semanal de un municipio: los abiertos con más vecinos sumados y, aparte, los que llevan
-- más días abiertos (created_at más viejo), más los números de arriba de la página.
-- Devuelve {by_vecinos: [reports_public…], by_days: [reports_public…], open_count, resolved_week, vecinos}.
create or replace function public.weekly_ranking(p_municipality_id bigint, p_limit int default 5)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with open_reports as (
    select * from public.reports_public r
    where r.municipality_id = p_municipality_id and r.status = 'open'
  ),
  lim as (select least(greatest(coalesce(p_limit, 5), 1), 100) as n)
  select json_build_object(
    'by_vecinos', coalesce((
      select json_agg(x) from (
        select * from open_reports order by vecinos_count desc, created_at, id limit (select n from lim)
      ) x), '[]'),
    'by_days', coalesce((
      select json_agg(x) from (
        select * from open_reports order by created_at, vecinos_count desc, id limit (select n from lim)
      ) x), '[]'),
    'open_count', (select count(*) from open_reports),
    'resolved_week', (
      select count(*) from public.reports_public r
      where r.municipality_id = p_municipality_id and r.status = 'resolved'
        and r.resolved_at >= now() - interval '7 days'),
    'vecinos', (select coalesce(sum(vecinos_count), 0) from open_reports)
  );
$$;

revoke all on function public.weekly_ranking(bigint, int) from public;
grant execute on function public.weekly_ranking(bigint, int) to anon, authenticated;

-- Vista GeoReport v2: los reportes no ocultos con los nombres de Open311. No es una API Open311
-- completa (spec #1), solo para que un municipio los lea con herramientas estándar vía PostgREST.
-- ponytail: media_url es relativa al host de la API de Supabase (la base no conoce su URL pública);
-- un cliente que la lee desde /rest/v1 la resuelve bien. Absoluta si algún municipio lo pide.
create or replace view public.reports_open311 with (security_invoker = false) as
select
  r.id as service_request_id,
  case r.status when 'resolved' then 'closed' else 'open' end as status,
  r.category as service_code,
  r.description,
  m.name as agency_responsible,
  r.address,
  r.created_at as requested_datetime,
  r.updated_at as updated_datetime,
  r.lat,
  r.lng as long,
  '/storage/v1/object/public/photos/' || r.photo_path as media_url
from public.reports_public r
left join public.municipalities m on m.id = r.municipality_id;

revoke all on table public.reports_open311 from anon, authenticated;
grant select on table public.reports_open311 to anon, authenticated;
