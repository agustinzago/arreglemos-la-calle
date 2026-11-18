-- Los radios urbanos de IDECOR son los aprobados por la provincia (el de La Calera es de 1990) y dejan afuera
-- barrios que el municipio ya atiende: un reporte a 200 m del límite de La Calera quedaba sin municipio.
-- Ahora, si el punto no cae en ningún polígono, gana el municipio activo más cercano dentro de 2 km.
-- ponytail: tolerancia fija para todos; si un municipio vecino se lleva reportes ajenos, pasarla a una columna.
create or replace function public.municipality_at(p_point extensions.geography)
returns bigint
language sql
stable
set search_path = ''
as $$
  -- Dentro de un polígono la distancia es 0; si el punto cae en un borde, gana el municipio más chico.
  select m.id
  from public.municipalities m
  where m.active and extensions.st_dwithin(m.geom, p_point, 2000)
  order by extensions.st_distance(m.geom, p_point), extensions.st_area(m.geom)
  limit 1;
$$;

revoke all on function public.municipality_at(extensions.geography) from public, anon, authenticated;

create or replace function public.create_report(
  p_photo_path text,
  p_lat double precision,
  p_lng double precision,
  p_category text,
  p_description text default null,
  p_address text default null
)
returns public.reports_public
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_point extensions.geography;
  v_id bigint;
  v_row public.reports_public;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;
  if split_part(p_photo_path, '/', 1) <> v_uid::text
     or not exists (select 1 from storage.objects o where o.bucket_id = 'photos' and o.name = p_photo_path) then
    raise exception 'photo_not_found' using errcode = '22023';
  end if;

  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  insert into public.reports (device_id, category, point, address, photo_path, description, municipality_id)
  values (v_uid, p_category, v_point, nullif(trim(p_address), ''), p_photo_path, nullif(trim(p_description), ''),
          public.municipality_at(v_point))
  returning id into v_id;

  select * into v_row from public.reports_public where id = v_id;
  return v_row;
end;
$$;

revoke all on function public.create_report(text, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.create_report(text, double precision, double precision, text, text, text) to authenticated;

-- Los reportes que ya quedaron sin municipio por estar cerca de un límite.
update public.reports set municipality_id = public.municipality_at(point) where municipality_id is null;
