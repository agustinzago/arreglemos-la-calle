import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

// Un rincón de La Calera que no usa ningún otro test.
const here = { lat: PLACES.laCalera.lat + 0.0021, lng: PLACES.laCalera.lng - 0.0019 };
const area = { p_west: here.lng - 0.0005, p_south: here.lat - 0.0005, p_east: here.lng + 0.0005, p_north: here.lat + 0.0005 };

let autor: Vecino, bloquea: Vecino, otro: Vecino;
let suyo = 0, ajeno = 0;

beforeAll(async () => {
  [autor, bloquea, otro] = await Promise.all([vecino(), vecino(), vecino()]);
  const a = await createReport(autor, { ...here, category: 'bache' });
  const b = await createReport(otro, { ...here, category: 'bache' });
  if (a.error || b.error) throw a.error ?? b.error;
  suyo = a.data.id;
  ajeno = b.data.id;
  // El autor también se suma al reporte de otro: ese movimiento tiene que desaparecer para quien lo bloquea.
  const { error } = await autor.client.rpc('register_event', { p_report_id: ajeno, p_type: 'sumate' });
  if (error) throw error;
  const block = await bloquea.client.rpc('block_report_author', { p_report_id: suyo });
  if (block.error) throw block.error;
});

const mapa = async (v: Vecino | null) => {
  const { data, error } = await (v ? v.client : anon()).rpc('map_reports', area);
  expect(error).toBeNull();
  return (data as { id: number }[]).map((r) => r.id);
};

describe('bloquear a quien publicó', () => {
  test('quien bloquea deja de ver sus reportes: mapa, detalle y cercanos', async () => {
    expect(await mapa(bloquea)).not.toContain(suyo);
    expect(await mapa(bloquea)).toContain(ajeno);
    const detalle = await bloquea.client.from('reports_public').select('id').eq('id', suyo);
    expect(detalle.data).toEqual([]);
    const cerca = await bloquea.client.rpc('nearby_reports', { p_lat: here.lat, p_lng: here.lng, p_category: 'bache' });
    expect((cerca.data as { id: number }[]).map((r) => r.id)).toEqual([ajeno]);
  });

  test('y sus movimientos en reportes de otros', async () => {
    const ver = async (v: Vecino) =>
      (await v.client.from('report_events_public').select('type').eq('report_id', ajeno)).data!.length;
    expect(await ver(bloquea)).toBe(1); // solo el sumate del creador
    expect(await ver(otro)).toBe(2);
  });

  test('los demás y la web lo siguen viendo', async () => {
    expect(await mapa(otro)).toContain(suyo);
    expect(await mapa(null)).toContain(suyo);
  });

  test('no se puede bloquear uno mismo, ni sin sesión', async () => {
    expect((await autor.client.rpc('block_report_author', { p_report_id: suyo })).error?.message).toBe('own_report');
    expect((await anon().rpc('block_report_author', { p_report_id: suyo })).error?.code).toBe('42501');
  });

  test('bloquear dos veces no falla', async () => {
    expect((await bloquea.client.rpc('block_report_author', { p_report_id: suyo })).error).toBeNull();
  });
});
