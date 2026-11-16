import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

let creador: Vecino;
let otro: Vecino;

beforeAll(async () => {
  [creador, otro] = [await vecino(), await vecino()];
});

async function nuevoReporte() {
  const { data, error } = await createReport(creador, PLACES.laCalera);
  if (error) throw error;
  return data.id as number;
}

const sumarse = (v: Vecino, id: number) => v.client.rpc('register_event', { p_report_id: id, p_type: 'sumate' });

const historia = async (client: Vecino['client'], id: number) => {
  const { data, error } = await client.from('report_events_public').select('*').eq('report_id', id).order('id');
  if (error) throw error;
  return data;
};

describe('sumarse', () => {
  test('al crear un reporte el creador queda sumado: la historia arranca con su sumate', async () => {
    const id = await nuevoReporte();
    const events = await historia(creador.client, id);
    expect(events).toMatchObject([{ type: 'sumate', mine: true }]);
    expect((await historia(otro.client, id))[0].mine).toBe(false);
  });

  test('otro vecino se suma una vez: el contador sube; el segundo intento se rechaza y no cambia', async () => {
    const id = await nuevoReporte();

    const first = await sumarse(otro, id);
    expect(first.error).toBeNull();
    expect(first.data).toMatchObject({ id, vecinos_count: 2, status: 'open' });

    const second = await sumarse(otro, id);
    expect(second.data).toBeNull();
    expect(second.error).toMatchObject({ code: '23505', message: 'duplicate_event' });

    const { data } = await anon().from('reports_public').select('vecinos_count').eq('id', id).single();
    expect(data?.vecinos_count).toBe(2);
  });

  test('el creador no se puede volver a sumar', async () => {
    const id = await nuevoReporte();
    const { error } = await sumarse(creador, id);
    expect(error?.message).toBe('duplicate_event');
  });

  test('la historia es pública y nunca dice quién hizo cada cosa', async () => {
    const id = await nuevoReporte();
    await sumarse(otro, id);
    const events = await historia(anon(), id);
    expect(events.map((e) => [e.type, e.mine])).toEqual([
      ['sumate', false],
      ['sumate', false],
    ]);
    for (const e of events) {
      expect(e).not.toHaveProperty('device_id');
      expect(e).not.toHaveProperty('user_id');
    }
    const direct = await otro.client.from('report_events').select('id').limit(1);
    expect(direct.error?.code).toBe('42501');
  });

  test('rechaza tipos de evento desconocidos, un reporte inexistente u oculto, y sin sesión', async () => {
    const id = await nuevoReporte();
    expect((await otro.client.rpc('register_event', { p_report_id: id, p_type: 'votar' })).error?.message).toBe(
      'invalid_event',
    );
    expect((await sumarse(otro, -1)).error?.message).toBe('report_not_found');
    expect((await anon().rpc('register_event', { p_report_id: id, p_type: 'sumate' })).error?.code).toBe('42501');

    await admin.from('reports').update({ status: 'hidden' }).eq('id', id);
    expect((await sumarse(otro, id)).error?.message).toBe('report_not_found');
    expect(await historia(anon(), id)).toEqual([]);
  });
});

describe('municipios públicos', () => {
  test('se leen sin sesión, solo nombre y WhatsApp', async () => {
    const { data, error } = await anon().from('municipalities_public').select('*');
    expect(error).toBeNull();
    expect(data?.map((m) => m.name)).toEqual(expect.arrayContaining(['La Calera', 'Córdoba', 'Villa Allende']));
    expect(Object.keys(data![0]).sort()).toEqual(['id', 'name', 'whatsapp']);
  });
});
