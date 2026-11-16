import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

let v: Vecino;
let reportId: number;

beforeAll(async () => {
  v = await vecino();
  const { data, error } = await createReport(v, PLACES.laCalera);
  if (error) throw error;
  reportId = data.id;
});

describe('lecturas públicas', () => {
  test('el reporte recién creado se lee sin sesión y sin device_id ni user_id', async () => {
    const { data, error } = await anon().from('reports_public').select('*').eq('id', reportId).single();
    expect(error).toBeNull();
    expect(data).not.toHaveProperty('device_id');
    expect(data).not.toHaveProperty('user_id');
  });

  test('crear reporte no devuelve device_id ni user_id', async () => {
    const { data } = await createReport(v, PLACES.laCalera);
    expect(data).not.toHaveProperty('device_id');
    expect(data).not.toHaveProperty('user_id');
  });

  test('la tabla de reportes no se lee directo, ni con sesión ni sin ella', async () => {
    for (const client of [anon(), v.client]) {
      const { error } = await client.from('reports').select('id').limit(1);
      expect(error?.code).toBe('42501');
    }
  });

  test('un vecino no puede cambiar el estado ni los contadores directamente', async () => {
    const update = await v.client.from('reports_public').update({ status: 'resolved', vecinos_count: 99 }).eq('id', reportId);
    expect(update.error?.code).toBe('42501');
    const insert = await v.client.from('reports').insert({ category: 'bache' });
    expect(insert.error?.code).toBe('42501');

    const { data } = await anon().from('reports_public').select('status, vecinos_count').eq('id', reportId).single();
    expect(data).toEqual({ status: 'open', vecinos_count: 1 });
  });

  test('un reporte oculto no aparece', async () => {
    await admin.from('reports').update({ status: 'hidden' }).eq('id', reportId);
    const { data } = await anon().from('reports_public').select('id').eq('id', reportId);
    expect(data).toEqual([]);
  });
});
