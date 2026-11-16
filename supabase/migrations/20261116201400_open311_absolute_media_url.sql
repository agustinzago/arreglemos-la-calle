-- #14 (revisión): media_url de Open311 absoluta. La base no conoce su URL pública, así que va en una
-- tabla de configuración por entorno, que se carga una vez a mano en cada proyecto:
--   insert into public.app_settings values ('api_url', 'https://<ref>.supabase.co')
--   on conflict (key) do update set value = excluded.value;
-- Sin esa fila, media_url es null (mejor que una URL que no abre).
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from anon, authenticated;

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
  rtrim((select s.value from public.app_settings s where s.key = 'api_url'), '/')
    || '/storage/v1/object/public/photos/' || r.photo_path as media_url
from public.reports_public r
left join public.municipalities m on m.id = r.municipality_id;

revoke all on table public.reports_open311 from anon, authenticated;
grant select on table public.reports_open311 to anon, authenticated;
