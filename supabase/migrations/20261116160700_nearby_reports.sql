-- #7: operación "reportes cercanos" del contrato. Antes de crear un reporte, la app muestra hasta
-- 3 reportes abiertos de la misma categoría dentro del radio de duplicado (ADR-0003: el vecino
-- decide, nunca se unen solos). Los radios viven acá para que app y web no los dupliquen.
-- Definer porque lee reports.point (la tabla no tiene grants); solo devuelve columnas públicas.
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
  order by extensions.st_distance(r.point, h.point)
  limit 3;
$$;

revoke all on function public.nearby_reports(double precision, double precision, text) from public, anon;
grant execute on function public.nearby_reports(double precision, double precision, text) to authenticated;
