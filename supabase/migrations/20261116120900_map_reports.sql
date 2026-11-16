-- Operación "mapa" del contrato: reportes no ocultos dentro del área visible, con filtros
-- opcionales de categoría y estado (null = todos). Lee de reports_public, así que nunca ve ocultos
-- ni columnas privadas; por eso alcanza con security invoker.
-- ponytail: filtra por lat/lng de la vista (sin índice espacial) y corta en 500 filas, las de más
-- vecinos. Si el mapa crece, pasar a un definer con st_intersects sobre reports.point + índice gist.
create or replace function public.map_reports(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_category text default null,
  p_status text default null
)
returns setof public.reports_public
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.reports_public r
  where r.lat between p_south and p_north
    and r.lng between p_west and p_east
    and (p_category is null or r.category = p_category)
    and (p_status is null or r.status = p_status)
  order by r.vecinos_count desc, r.created_at desc
  limit 500;
$$;

revoke all on function public.map_reports(double precision, double precision, double precision, double precision, text, text) from public;
grant execute on function public.map_reports(double precision, double precision, double precision, double precision, text, text) to anon, authenticated;
