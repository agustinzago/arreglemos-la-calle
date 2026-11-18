-- Límites de texto (ADDRESS_MAX y DESCRIPTION_MAX en shared/src/reports.ts). Sin ellos, un pegado de miles
-- de caracteres llega tal cual a cada pantalla que muestra el reporte. La app corta antes de enviar, así que
-- create_report no los rechaza. `not valid`: valen para lo nuevo sin revisar los reportes que ya están.
alter table public.reports
  add constraint reports_address_length check (char_length(address) <= 200) not valid,
  add constraint reports_description_length check (char_length(description) <= 1000) not valid;
