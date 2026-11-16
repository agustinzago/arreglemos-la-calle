-- Primer recorrido (#2): municipios, reportes, fotos y la operación "crear reporte".
-- Re-runnable: se aplica con psql sobre la base de test compartida (ver README).

create extension if not exists postgis with schema extensions;

-- Municipios: polígonos de idecor:radios_urbanos (datos en la migración siguiente).
create table if not exists public.municipalities (
  id bigint generated always as identity primary key,
  idecor_key text not null unique,
  name text not null,
  geom extensions.geography(MultiPolygon, 4326) not null,
  whatsapp text,
  active boolean not null default true
);
create index if not exists municipalities_geom_idx on public.municipalities using gist (geom);

-- Reportes. device_id = auth.uid() de la sesión anónima (ADR-0004); vincular Apple/Google
-- conserva el mismo uid, así que user_id queda para cuando haga falta distinguirlos.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  user_id uuid,
  category text not null check (category in (
    'bache', 'calle_tierra', 'anegamiento', 'luminaria', 'basural',
    'arbol_caido', 'semaforo_senal', 'vereda_rota', 'cloaca', 'otro')),
  point extensions.geography(Point, 4326) not null,
  address text,
  photo_path text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'resolved', 'hidden')),
  municipality_id bigint references public.municipalities (id),
  vecinos_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists reports_point_idx on public.reports using gist (point);
create index if not exists reports_device_id_idx on public.reports (device_id);

-- Nadie lee ni escribe las tablas directo: lecturas por reports_public, escrituras por RPC.
alter table public.municipalities enable row level security;
alter table public.reports enable row level security;
revoke all on table public.municipalities, public.reports from anon, authenticated;

-- Lectura pública: solo columnas seguras (nunca device_id ni user_id) y sin ocultos.
-- Es security definer a propósito (el linter de Supabase lo marca): las tablas no tienen grants.
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
where r.status <> 'hidden';
-- La vista es auto-actualizable: sin este revoke, anon podría escribir reports como postgres.
revoke all on table public.reports_public from anon, authenticated;
grant select on table public.reports_public to anon, authenticated;

-- Fotos: bucket público, cada vecino sube solo a la carpeta de su uid.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "vecinos suben fotos a su carpeta" on storage.objects;
create policy "vecinos suben fotos a su carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Crear reporte: valida la foto subida, asigna el municipio por polígono y devuelve la fila pública.
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
  v_municipality_id bigint;
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

  -- Los límites se tocan: si el punto cae en un borde, gana el municipio más chico.
  select m.id into v_municipality_id
  from public.municipalities m
  where m.active and extensions.st_covers(m.geom, v_point)
  order by extensions.st_area(m.geom)
  limit 1;

  insert into public.reports (device_id, category, point, address, photo_path, description, municipality_id)
  values (v_uid, p_category, v_point, nullif(trim(p_address), ''), p_photo_path, nullif(trim(p_description), ''), v_municipality_id)
  returning id into v_id;

  select * into v_row from public.reports_public where id = v_id;
  return v_row;
end;
$$;

revoke all on function public.create_report(text, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.create_report(text, double precision, double precision, text, text, text) to authenticated;
