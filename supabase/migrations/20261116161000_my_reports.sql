-- #10: operación "mis reportes" del contrato. Los reportes que el vecino creó y aquellos a los que
-- se sumó, cada uno con `created` para distinguirlos. Sale de sus `sumate` (el creador tiene el suyo
-- por el trigger report_created), del más reciente al más viejo. Lee de reports_public: los ocultos
-- no aparecen y nunca se exponen device_id ni user_id. Definer porque report_events no es legible.
-- Re-runnable.
create or replace function public.my_reports()
returns table (report public.reports_public, created boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select rp, r.device_id = (select auth.uid())
  from public.report_events e
  join public.reports r on r.id = e.report_id
  join public.reports_public rp on rp.id = e.report_id
  where e.device_id = (select auth.uid()) and e.type = 'sumate'
  order by e.id desc;
$$;

revoke all on function public.my_reports() from public, anon;
grant execute on function public.my_reports() to authenticated;
