// Ranking semanal (por municipio) y vista Open311, leídos sin sesión como la web.
// La base es compartida: se mira el orden relativo de los reportes de este archivo, no el total.
import { afterAll, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino } from './helpers';

afterAll(cleanup);

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

async function report(vecinosSumados: number, diasAbierto: number) {
  const v = await vecino();
  const { data, error } = await createReport(v, PLACES.villaAllende);
  expect(error).toBeNull();
  for (let i = 1; i < vecinosSumados; i++) {
    const { error } = await (await vecino()).client.rpc('register_event', { p_report_id: data.id, p_type: 'sumate' });
    expect(error).toBeNull();
  }
  // Preparación: no hay operación para envejecer un reporte.
  await admin.from('reports').update({ created_at: daysAgo(diasAbierto) }).eq('id', data.id).throwOnError();
  return data as { id: number; municipality_id: number };
}

const ranking = async (municipalityId: number) => {
  const { data, error } = await anon().rpc('weekly_ranking', { p_municipality_id: municipalityId, p_limit: 100 });
  expect(error).toBeNull();
  return data as { by_vecinos: { id: number }[]; by_days: { id: number }[]; open_count: number };
};

test('ordena los abiertos por vecinos sumados y, aparte, por días abiertos; sin resueltos ni ocultos', async () => {
  const a = await report(3, 2); // más vecinos, el más nuevo
  const b = await report(2, 20); // el más viejo
  const c = await report(1, 10);
  const resolved = await report(4, 30);
  const hidden = await report(5, 40);
  await admin.from('reports').update({ status: 'resolved', resolved_at: daysAgo(1) }).eq('id', resolved.id).throwOnError();
  await admin.from('reports').update({ status: 'hidden' }).eq('id', hidden.id).throwOnError();

  const r = await ranking(a.municipality_id);
  const mine = (list: { id: number }[]) => list.map((x) => x.id).filter((id) => [a, b, c, resolved, hidden].some((m) => m.id === id));
  expect(mine(r.by_vecinos)).toEqual([a.id, b.id, c.id]);
  expect(mine(r.by_days)).toEqual([b.id, c.id, a.id]);
  expect(r.open_count).toBeGreaterThanOrEqual(3);
  expect(r.by_vecinos[0]).not.toHaveProperty('device_id');

  // Por defecto, los cinco de la página.
  const { data } = await anon().rpc('weekly_ranking', { p_municipality_id: a.municipality_id });
  expect(data.by_vecinos.length).toBeLessThanOrEqual(5);
});

test('la vista Open311 usa los nombres de GeoReport v2 y no muestra ocultos', async () => {
  const open = await report(1, 0);
  const resolved = await report(1, 0);
  const hidden = await report(1, 0);
  await admin.from('reports').update({ status: 'resolved' }).eq('id', resolved.id).throwOnError();
  await admin.from('reports').update({ status: 'hidden' }).eq('id', hidden.id).throwOnError();

  const { data, error } = await anon()
    .from('reports_open311')
    .select('*')
    .in('service_request_id', [open.id, resolved.id, hidden.id])
    .order('service_request_id');
  expect(error).toBeNull();
  expect(data!.map((x) => [x.service_request_id, x.status])).toEqual([
    [open.id, 'open'],
    [resolved.id, 'closed'],
  ]);
  expect(data![0]).toMatchObject({
    service_code: 'bache',
    agency_responsible: 'Villa Allende',
    lat: PLACES.villaAllende.lat,
    long: PLACES.villaAllende.lng,
  });
  expect(Date.parse(data![0].requested_datetime)).not.toBeNaN();
  expect(data![0].media_url).toMatch(/^\/storage\/v1\/object\/public\/photos\/.+\.jpg$/);
  expect(data![0]).not.toHaveProperty('device_id');

  // Es de solo lectura.
  const { error: write } = await anon().from('reports_open311').update({ status: 'closed' }).eq('service_request_id', open.id);
  expect(write).not.toBeNull();
});
