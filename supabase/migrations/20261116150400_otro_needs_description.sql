-- "Otro" exige una descripción (#4, CONTEXT.md). create_report ya guarda la descripción con
-- nullif(trim(...)), así que una en blanco llega como null y el check la rechaza (23514).
-- Es un check y no un if en create_report para no pisar los cambios de otros tickets a esa función.
-- not valid: no revisa filas viejas de la base de test compartida, sí todas las nuevas.
alter table public.reports drop constraint if exists reports_otro_needs_description;
alter table public.reports add constraint reports_otro_needs_description
  check (category <> 'otro' or description is not null) not valid;
