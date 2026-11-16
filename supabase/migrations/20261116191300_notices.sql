-- #13: avisos cuando lo arreglen. Re-runnable.
--
-- El vecino que acepta "¿Te avisamos cuando lo arreglen?" registra su token de Expo (enable_notices).
-- Cuando un reporte pasa a resuelto o vuelve a abierto (evento de vecinos u operador: siempre es un
-- UPDATE de reports.status, ver #8), un trigger avisa a quienes tienen un sumate en el reporte (el
-- creador también, por el trigger de #6) y tienen token. Los avisos quedan en public.notices (cada
-- vecino ve los suyos con my_notices) y se mandan a la API de push de Expo con pg_net, después del commit.
-- Sin Edge Function: no hay nada que desplegar.

create extension if not exists pg_net;

-- Un token por vecino. Que haya fila = aceptó los avisos.
create table if not exists public.push_devices (
  device_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique,
  updated_at timestamptz not null default now()
);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from anon, authenticated;

-- Avisos generados (un registro por vecino y cambio de estado).
create table if not exists public.notices (
  id bigint generated always as identity primary key,
  report_id bigint not null references public.reports (id) on delete cascade,
  device_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);
create index if not exists notices_device_id_idx on public.notices (device_id);
alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;

-- Acepta los avisos (o actualiza el token). Si el token era de otro vecino (el teléfono cambió de
-- sesión), deja de ser suyo: los avisos van a quien usa el teléfono ahora.
create or replace function public.enable_notices(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[^\]]+\]$' then
    raise exception 'invalid_token' using errcode = '22023';
  end if;
  delete from public.push_devices where token = p_token and device_id <> v_uid;
  insert into public.push_devices (device_id, token) values (v_uid, p_token)
  on conflict (device_id) do update set token = excluded.token, updated_at = now();
end;
$$;
revoke all on function public.enable_notices(text) from public, anon;
grant execute on function public.enable_notices(text) to authenticated;

-- Los avisos que recibió el vecino, del más nuevo al más viejo.
create or replace function public.my_notices()
returns table (report_id bigint, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select n.report_id, n.status, n.created_at from public.notices n
  where n.device_id = auth.uid() order by n.id desc;
$$;
revoke all on function public.my_notices() from public, anon;
grant execute on function public.my_notices() to authenticated;

create or replace function public.notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids bigint[];
  v_title text := case new.status when 'resolved' then '¡Lo arreglaron!' else 'Sigue roto' end;
  v_body text := 'El reporte ' || new.id || coalesce(' (' || new.address || ')', '')
    || case new.status when 'resolved' then ' figura como resuelto.' else ' volvió a abierto.' end;
  v_batch jsonb;
begin
  with sent as (
    insert into public.notices (report_id, device_id, status)
    select new.id, d.device_id, new.status
    from public.push_devices d
    where exists (select 1 from public.report_events e
                  where e.report_id = new.id and e.type = 'sumate' and e.device_id = d.device_id)
    returning id
  )
  select array_agg(id) into v_ids from sent;
  if v_ids is null then
    return null;
  end if;

  -- Si falla el envío, el cambio de estado igual vale.
  begin
    for v_batch in
      select jsonb_agg(jsonb_build_object('to', d.token, 'title', v_title, 'body', v_body, 'sound', 'default',
                                          'data', jsonb_build_object('reportId', new.id)))
      from (select n.device_id, (row_number() over (order by n.id) - 1) / 100 as chunk -- Expo: ≤100 por pedido
            from public.notices n where n.id = any (v_ids)) n
      join public.push_devices d on d.device_id = n.device_id
      group by n.chunk
    loop
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        body := v_batch,
        headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
      );
    end loop;
  exception when others then
    raise warning 'notify_status_change: %', sqlerrm;
  end;
  return null;
end;
$$;
revoke all on function public.notify_status_change() from public, anon, authenticated;

-- Solo entre abierto y resuelto: ocultar o restaurar un reporte (operador) no avisa.
drop trigger if exists notify_status_change on public.reports;
create trigger notify_status_change after update of status on public.reports
  for each row when (old.status in ('open', 'resolved') and new.status in ('open', 'resolved')
                     and old.status is distinct from new.status)
  execute function public.notify_status_change();
