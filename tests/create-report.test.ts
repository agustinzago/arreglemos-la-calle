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

  // Un punto en el centro de cada municipio cargado, verificado contra los polígonos de IDECOR.
  const CENTROS: Record<string, { lat: number; lng: number }> = {
    Córdoba: PLACES.cordoba,
    'La Calera': PLACES.laCalera,
    'Villa Allende': PLACES.villaAllende,
    Unquillo: { lat: -31.2306, lng: -64.3164 },
    Mendiolaza: { lat: -31.2667, lng: -64.3 },
    'Río Ceballos': { lat: -31.165, lng: -64.322 },
    Saldán: { lat: -31.3105, lng: -64.3125 },
    Salsipuedes: { lat: -31.137, lng: -64.295 },
    'Agua de Oro': { lat: -31.067, lng: -64.3 },
    'Estación Juárez Celman': { lat: -31.26, lng: -64.168 },
    'Malvinas Argentinas': { lat: -31.373, lng: -64.053 },
    Malagueño: { lat: -31.465, lng: -64.358 },
    'Villa Carlos Paz': { lat: -31.424, lng: -64.4978 },
    'Alta Gracia': { lat: -31.656, lng: -64.429 },
    'Jesús María': { lat: -30.9817, lng: -64.0942 },
    'Colonia Caroya': { lat: -31.016, lng: -64.095 },
  };

  test('cada municipio cargado tiene su punto de prueba', () => {
    expect(Object.keys(municipalityIds).sort()).toEqual(Object.keys(CENTROS).sort());
  });

  test.each(Object.entries(CENTROS))('un reporte en %s queda con ese municipio', async (name, place) => {
    const { data, error } = await createReport(v, place);
    expect(error).toBeNull();
    expect(data.municipality_id).toBe(municipalityIds[name]);
  });

  test('un reporte apenas afuera del radio urbano queda con el municipio más cercano', async () => {
    // Reporte real, a ~200 m al sur del radio urbano de La Calera en IDECOR.
    const { data, error } = await createReport(v, { lat: -31.362944, lng: -64.345474 });
    expect(error).toBeNull();
    expect(data.municipality_id).toBe(municipalityIds['La Calera']);
  });

  test('un reporte lejos de todo polígono queda sin municipio', async () => {
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

  test('"Otro" exige una descripción', async () => {
    for (const description of [undefined, '   ']) {
      const { data, error } = await createReport(v, { ...PLACES.laCalera, category: 'otro', description });
      expect(data).toBeNull();
      expect(error?.code).toBe('23514');
      expect(error?.message).toContain('reports_otro_needs_description');
    }
    const { data, error } = await createReport(v, { ...PLACES.laCalera, category: 'otro', description: 'Cartel caído' });
    expect(error).toBeNull();
    expect(data.description).toBe('Cartel caído');
  });

  test('las demás categorías no exigen descripción', async () => {
    const { data, error } = await createReport(v, { ...PLACES.laCalera, category: 'bache' });
    expect(error).toBeNull();
    expect(data.description).toBeNull();
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
