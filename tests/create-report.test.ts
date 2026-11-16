import { CATEGORIES } from '@arreglemos/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, uploadPhoto, vecino, type Vecino } from './helpers';

afterAll(cleanup);

let v: Vecino;
const municipalityIds: Record<string, number> = {};

beforeAll(async () => {
  v = await vecino();
  const { data, error } = await admin.from('municipalities').select('id, name');
  if (error) throw error;
  for (const m of data) municipalityIds[m.name] = m.id;
});

describe('crear reporte', () => {
  test('devuelve el reporte abierto, con su número y el creador como primer vecino sumado', async () => {
    const { data, error } = await createReport(v, { ...PLACES.laCalera, category: 'bache', address: 'Av. San Martín 425' });
    expect(error).toBeNull();
    expect(data).toMatchObject({
      category: 'bache',
      status: 'open',
      vecinos_count: 1,
      address: 'Av. San Martín 425',
    });
    expect(data.id).toEqual(expect.any(Number));
    expect(data.lat).toBeCloseTo(PLACES.laCalera.lat, 6);
    expect(data.lng).toBeCloseTo(PLACES.laCalera.lng, 6);
  });

  test('un reporte dentro de un polígono queda con ese municipio', async () => {
    for (const [place, name] of [
      [PLACES.laCalera, 'La Calera'],
      [PLACES.cordoba, 'Córdoba'],
      [PLACES.villaAllende, 'Villa Allende'],
    ] as const) {
      const { data, error } = await createReport(v, place);
      expect(error).toBeNull();
      expect(data.municipality_id).toBe(municipalityIds[name]);
    }
  });

  test('un reporte fuera de todo polígono queda sin municipio', async () => {
    const { data, error } = await createReport(v, PLACES.sierras);
    expect(error).toBeNull();
    expect(data.municipality_id).toBeNull();
  });

  test('acepta todas las categorías de la lista fija', async () => {
    for (const { code } of CATEGORIES) {
      const { data, error } = await createReport(v, { ...PLACES.laCalera, category: code, description: 'cartel caído' });
      expect(error, code).toBeNull();
      expect(data.category).toBe(code);
    }
  });

  test('rechaza una categoría que no está en la lista', async () => {
    const { data, error } = await createReport(v, { ...PLACES.laCalera, category: 'pozo' });
    expect(data).toBeNull();
    expect(error?.code).toBe('23514');
  });

  test('rechaza una foto que no está en la carpeta del vecino', async () => {
    const otro = await vecino();
    const { error } = await v.client.rpc('create_report', {
      p_photo_path: await uploadPhoto(otro),
      p_lat: PLACES.laCalera.lat,
      p_lng: PLACES.laCalera.lng,
      p_category: 'bache',
    });
    expect(error?.message).toBe('photo_not_found');
  });

  test('rechaza una foto que no se subió', async () => {
    const { error } = await v.client.rpc('create_report', {
      p_photo_path: `${v.id}/no-existe.jpg`,
      p_lat: PLACES.laCalera.lat,
      p_lng: PLACES.laCalera.lng,
      p_category: 'bache',
    });
    expect(error?.message).toBe('photo_not_found');
  });

  test('sin sesión no se puede crear', async () => {
    const { error } = await anon().rpc('create_report', {
      p_photo_path: 'x/y.jpg',
      p_lat: PLACES.laCalera.lat,
      p_lng: PLACES.laCalera.lng,
      p_category: 'bache',
    });
    expect(error?.code).toBe('42501');
  });
});
