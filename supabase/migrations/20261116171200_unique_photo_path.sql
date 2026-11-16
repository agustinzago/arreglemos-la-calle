-- #12 Reportar sin conexión: cada reporte tiene su propia foto. La app reintenta un pendiente con la
-- misma ruta de foto, así que si un envío anterior llegó a la base (y se cortó la respuesta), el
-- reintento falla con 23505 en vez de duplicar el reporte, y la app lo da por enviado.
create unique index if not exists reports_photo_path_key on public.reports (photo_path);
