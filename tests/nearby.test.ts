import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

/** Un punto `m` metros al norte de `p` (1° de latitud ≈ 111 km). */
const north = (p: { lat: number; lng: number }, m: number) => ({ lat: p.lat + m / 111_000, lng: p.lng });

// Dos rincones de La Calera que no usa ningún otro test, a ~45 m entre sí.
const a = { lat: PLACES.laCalera.lat - 0.0013, lng: PLACES.laCalera.lng + 0.0011 };
const b = { lat: PLACES.laCalera.lat - 0.0017, lng: PLACES.laCalera.lng + 0.0011 };

let v: Vecino;
const ids = { bache: 0, luminaria: 0, resuelto: 0, oculto: 0, b1: 0, b3: 0, b5: 0, b7: 0 };

async function make(input: Parameters<typeof createReport>[1]) {
  const { data, error } = await createReport(v, input);
  if (error) throw error;
  return data.id as number;
}

beforeAll(async () => {
  v = await vecino();
  ids.bache = await make({ ...a, category: 'bache' });
  ids.luminaria = await make({ ...a, category: 'luminaria' });
  ids.resuelto = await make({ ...a, category: 'bache' });
  ids.oculto = await make({ ...a, category: 'bache' });
  // Resolver y ocultar todavía no tienen operación propia (#8, denuncias): se preparan con la clave secreta.
  await admin.from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ids.resuelto);
  await admin.from('reports').update({ status: 'hidden' }).eq('id', ids.oculto);
  // Cuatro baches a 1, 3, 5 y 7 m de b.
  ids.b5 = await make({ ...north(b, 5), category: 'bache' });
  ids.b1 = await make({ ...north(b, 1), category: 'bache' });
  ids.b7 = await make({ ...north(b, 7), category: 'bache' });
  ids.b3 = await make({ ...north(b, 3), category: 'bache' });
});

type Nearby = { id: number; distance_m: number; vecinos_count: number; photo_path: string };

async function nearby(point: { lat: number; lng: number }, category: string) {
  const { data, error } = await v.client.rpc('nearby_reports', { p_lat: point.lat, p_lng: point.lng, p_category: category });
  expect(error).toBeNull();
  return data as Nearby[];
}

describe('reportes cercanos', () => {
  test('un reporte a 8 m es cercano para un bache pero no para una luminaria', async () => {
    const at8 = north(a, 8);
    const baches = await nearby(at8, 'bache');
    expect(baches.map((r) => r.id)).toContain(ids.bache);
    expect(baches.find((r) => r.id === ids.bache)!.distance_m).toBeCloseTo(8, 0);

    expect((await nearby(at8, 'luminaria')).map((r) => r.id)).not.toContain(ids.luminaria);
    expect((await nearby(north(a, 3), 'luminaria')).map((r) => r.id)).toContain(ids.luminaria);
  });

  test('no muestra otra categoría, ni resueltos ni ocultos', async () => {
    const found = (await nearby(a, 'bache')).map((r) => r.id);
    expect(found).not.toContain(ids.luminaria);
    expect(found).not.toContain(ids.resuelto);
    expect(found).not.toContain(ids.oculto);
    expect(await nearby(a, 'basural')).toEqual([]);
  });

  test('devuelve hasta 3, ordenados por distancia, con distancia, vecinos y foto', async () => {
    const found = await nearby(b, 'bache');
    expect(found.map((r) => r.id)).toEqual([ids.b1, ids.b3, ids.b5]);
    expect(found[0].distance_m).toBeCloseTo(1, 0);
    expect(found[0].vecinos_count).toBe(1);
    expect(found[0].photo_path).toMatch(/\.jpg$/);
    expect(found[0]).not.toHaveProperty('device_id');
  });

  test('sin sesión no se puede consultar', async () => {
    const { error } = await anon().rpc('nearby_reports', { p_lat: a.lat, p_lng: a.lng, p_category: 'bache' });
    expect(error?.code).toBe('42501');
  });
});
