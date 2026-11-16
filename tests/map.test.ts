import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino } from './helpers';

afterAll(cleanup);

// Un rincón de La Calera que no usa ningún otro test, con un área visible chica alrededor.
const here = { lat: PLACES.laCalera.lat + 0.0007, lng: PLACES.laCalera.lng + 0.0007 };
const area = { p_west: here.lng - 0.0005, p_south: here.lat - 0.0005, p_east: here.lng + 0.0005, p_north: here.lat + 0.0005 };

const ids = { bache: 0, luminaria: 0, resuelto: 0, oculto: 0, lejos: 0 };

beforeAll(async () => {
  const v = await vecino();
  const make = async (input: Parameters<typeof createReport>[1]) => {
    const { data, error } = await createReport(v, input);
    if (error) throw error;
    return data.id as number;
  };
  ids.bache = await make({ ...here, category: 'bache' });
  ids.luminaria = await make({ ...here, category: 'luminaria' });
  ids.resuelto = await make({ ...here, category: 'bache' });
  ids.oculto = await make({ ...here, category: 'bache' });
  ids.lejos = await make({ ...PLACES.cordoba, category: 'bache' });
  // Resolver y ocultar todavía no tienen operación propia (#8, denuncias): se preparan con la clave secreta.
  await admin.from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ids.resuelto);
  await admin.from('reports').update({ status: 'hidden' }).eq('id', ids.oculto);
});

async function mapa(filters: { p_category?: string; p_status?: string } = {}) {
  const { data, error } = await anon().rpc('map_reports', { ...area, ...filters });
  expect(error).toBeNull();
  return (data as { id: number }[]).map((r) => r.id);
}

describe('mapa', () => {
  test('devuelve los reportes del área visible sin sesión, sin ocultos ni los de afuera', async () => {
    const found = await mapa();
    expect(found).toEqual(expect.arrayContaining([ids.bache, ids.luminaria, ids.resuelto]));
    expect(found).not.toContain(ids.oculto);
    expect(found).not.toContain(ids.lejos);
  });

  test('no devuelve columnas privadas', async () => {
    const { data } = await anon().rpc('map_reports', area);
    expect(data[0]).not.toHaveProperty('device_id');
    expect(data[0]).not.toHaveProperty('user_id');
  });

  test('filtra por categoría', async () => {
    const found = await mapa({ p_category: 'luminaria' });
    expect(found).toContain(ids.luminaria);
    expect(found).not.toContain(ids.bache);
  });

  test('filtra por estado', async () => {
    const open = await mapa({ p_status: 'open' });
    expect(open).toEqual(expect.arrayContaining([ids.bache, ids.luminaria]));
    expect(open).not.toContain(ids.resuelto);

    const resolved = await mapa({ p_status: 'resolved' });
    expect(resolved).toContain(ids.resuelto);
    expect(resolved).not.toContain(ids.bache);
  });

  test('pedir los ocultos no los muestra', async () => {
    expect(await mapa({ p_status: 'hidden' })).toEqual([]);
  });

  test('combina categoría y estado', async () => {
    const found = await mapa({ p_category: 'bache', p_status: 'resolved' });
    expect(found).toContain(ids.resuelto);
    expect(found).not.toContain(ids.bache);
    expect(found).not.toContain(ids.luminaria);
  });
});
