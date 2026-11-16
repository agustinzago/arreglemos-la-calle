import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

let ana: Vecino;
let beto: Vecino;
const ids = { deAna: 0, deBeto: 0, ocultoDeAna: 0, ajeno: 0 };

beforeAll(async () => {
  [ana, beto] = [await vecino(), await vecino()];
  const make = async (v: Vecino) => {
    const { data, error } = await createReport(v, PLACES.laCalera);
    if (error) throw error;
    return data.id as number;
  };
  ids.deAna = await make(ana);
  ids.ocultoDeAna = await make(ana);
  ids.deBeto = await make(beto);
  ids.ajeno = await make(beto);
  const { error } = await ana.client.rpc('register_event', { p_report_id: ids.deBeto, p_type: 'sumate' });
  if (error) throw error;
  await admin.from('reports').update({ status: 'hidden' }).eq('id', ids.ocultoDeAna);
});

const mis = async (v: Vecino) => {
  const { data, error } = await v.client.rpc('my_reports');
  expect(error).toBeNull();
  return data as { report: Record<string, unknown>; created: boolean }[];
};

describe('mis reportes', () => {
  test('devuelve los que creó y a los que se sumó, distinguiéndolos, del más reciente al más viejo', async () => {
    const rows = await mis(ana);
    expect(rows.map((r) => [r.report.id, r.created])).toEqual([
      [ids.deBeto, false],
      [ids.deAna, true],
    ]);
    expect(rows[0].report).toMatchObject({ category: 'bache', status: 'open', vecinos_count: 2 });
  });

  test('cada vecino ve solo los suyos', async () => {
    const rows = await mis(beto);
    expect(rows.map((r) => [r.report.id, r.created])).toEqual([
      [ids.ajeno, true],
      [ids.deBeto, true],
    ]);
  });

  test('no incluye ocultos ni columnas privadas', async () => {
    const rows = await mis(ana);
    expect(rows.map((r) => r.report.id)).not.toContain(ids.ocultoDeAna);
    expect(rows[0].report).not.toHaveProperty('device_id');
    expect(rows[0].report).not.toHaveProperty('user_id');
  });

  test('sin sesión no se puede llamar', async () => {
    const { error } = await anon().rpc('my_reports');
    expect(error?.code).toBe('42501');
  });
});
