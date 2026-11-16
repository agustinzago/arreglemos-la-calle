// Estados (ADR-0005): arreglado, sigue roto, denuncias y el cambio manual del operador.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, uploadPhoto, vecino, type Vecino } from './helpers';

afterAll(cleanup);

// Un rincón de La Calera que no usa ningún otro test.
const here = { lat: PLACES.laCalera.lat + 0.0021, lng: PLACES.laCalera.lng - 0.0019 };

let creador: Vecino, a: Vecino, b: Vecino, c: Vecino, d: Vecino;

beforeAll(async () => {
  [creador, a, b, c, d] = await Promise.all([vecino(), vecino(), vecino(), vecino(), vecino()]);
});

async function nuevoReporte() {
  const { data, error } = await createReport(creador, { ...here, category: 'basural' });
  if (error) throw error;
  return data.id as number;
}

const evento = (v: Vecino, id: number, type: string, photo?: string) =>
  v.client.rpc('register_event', { p_report_id: id, p_type: type, p_photo_path: photo });

/** Registra un evento que tiene que andar y devuelve el reporte actualizado. */
async function ok(v: Vecino, id: number, type: string, photo?: string) {
  const { data, error } = await evento(v, id, type, photo);
  expect(error).toBeNull();
  return data;
}

const estado = async (id: number) =>
  (await anon().from('reports_public').select('status, resolved_at').eq('id', id).maybeSingle()).data;

/** El operador cambia el estado a mano, como desde el panel de Supabase. */
const operador = (id: number, status: string) => admin.from('reports').update({ status }).eq('id', id).throwOnError();

describe('arreglado', () => {
  test('con un solo arreglado sigue abierto; con dos de vecinos distintos pasa a resuelto con fecha', async () => {
    const id = await nuevoReporte();
    expect(await ok(a, id, 'resuelto')).toMatchObject({ id, status: 'open', resolved_at: null });
    expect((await evento(a, id, 'resuelto')).error).toMatchObject({ code: '23505', message: 'duplicate_event' });
    expect(await estado(id)).toMatchObject({ status: 'open' });

    const resolved = await ok(b, id, 'resuelto');
    expect(resolved).toMatchObject({ id, status: 'resolved', vecinos_count: 1 });
    expect(Date.now() - Date.parse(resolved.resolved_at)).toBeLessThan(60_000);
  });

  test('no se marca arreglado un reporte que ya está resuelto', async () => {
    const id = await nuevoReporte();
    await ok(a, id, 'resuelto');
    await ok(b, id, 'resuelto');
    expect((await evento(c, id, 'resuelto')).error).toMatchObject({ code: '55000', message: 'not_open' });
  });

  test('la foto es opcional, tiene que ser del vecino y queda en la historia', async () => {
    const id = await nuevoReporte();
    expect((await evento(a, id, 'resuelto', await uploadPhoto(b))).error?.message).toBe('photo_not_found');
    expect((await evento(a, id, 'resuelto', `${a.id}/no-existe.jpg`)).error?.message).toBe('photo_not_found');
    expect((await evento(a, id, 'sumate', await uploadPhoto(a))).error?.message).toBe('photo_not_allowed');

    const photo = await uploadPhoto(a);
    await ok(a, id, 'resuelto', photo);
    const { data } = await anon().from('report_events_public').select('type, photo_path').eq('report_id', id).order('id');
    expect(data).toEqual([
      { type: 'sumate', photo_path: null },
      { type: 'resuelto', photo_path: photo },
    ]);
  });
});

describe('sigue roto', () => {
  test('sobre un reporte abierto se rechaza', async () => {
    const id = await nuevoReporte();
    expect((await evento(a, id, 'sigue_roto')).error).toMatchObject({ code: '55000', message: 'not_resolved' });
  });

  test('vuelve a abierto un resuelto; después hacen falta otra vez dos arreglado nuevos', async () => {
    const id = await nuevoReporte();
    await ok(a, id, 'resuelto');
    await ok(b, id, 'resuelto');

    expect(await ok(c, id, 'sigue_roto')).toMatchObject({ status: 'open', resolved_at: null });
    expect((await evento(c, id, 'sigue_roto')).error?.message).toBe('not_resolved');

    // Las marcas viejas no cuentan: a vuelve a marcar y falta otro.
    expect(await ok(a, id, 'resuelto')).toMatchObject({ status: 'open' });
    expect(await ok(c, id, 'resuelto')).toMatchObject({ status: 'resolved' });

    const { data } = await anon().from('report_events_public').select('type').eq('report_id', id).order('id');
    expect(data!.map((e) => e.type)).toEqual(['sumate', 'resuelto', 'resuelto', 'sigue_roto', 'resuelto', 'resuelto']);
  });
});

describe('denuncias', () => {
  test('una por vecino; con tres de vecinos distintos el reporte queda oculto en todos lados', async () => {
    const id = await nuevoReporte();
    expect(await ok(a, id, 'denuncia')).toMatchObject({ status: 'open' });
    expect((await evento(a, id, 'denuncia')).error).toMatchObject({ code: '23505', message: 'duplicate_event' });
    expect(await ok(b, id, 'denuncia')).toMatchObject({ status: 'open' });

    // Las denuncias no son parte de la historia pública.
    const history = await anon().from('report_events_public').select('type').eq('report_id', id);
    expect(history.data).toEqual([{ type: 'sumate' }]);

    expect(await ok(c, id, 'denuncia')).toMatchObject({ id, status: 'hidden' });
    expect(await estado(id)).toBeNull();

    const d1 = 0.0005;
    const map = await anon().rpc('map_reports', {
      p_west: here.lng - d1, p_south: here.lat - d1, p_east: here.lng + d1, p_north: here.lat + d1,
    });
    expect(map.error).toBeNull();
    expect((map.data as { id: number }[]).map((r) => r.id)).not.toContain(id);

    const nearby = await d.client.rpc('nearby_reports', { p_lat: here.lat, p_lng: here.lng, p_category: 'basural' });
    expect(nearby.error).toBeNull();
    expect((nearby.data as { id: number }[]).map((r) => r.id)).not.toContain(id);

    expect((await evento(d, id, 'sumate')).error?.message).toBe('report_not_found');
  });

  test('se puede denunciar un reporte resuelto', async () => {
    const id = await nuevoReporte();
    await ok(a, id, 'resuelto');
    await ok(b, id, 'resuelto');
    expect(await ok(c, id, 'denuncia')).toMatchObject({ status: 'resolved' });
  });
});

describe('seguridad', () => {
  test('la app no puede cambiar el estado ni los contadores escribiendo directo en las tablas', async () => {
    const id = await nuevoReporte();
    const update = await a.client.from('reports').update({ status: 'resolved', vecinos_count: 99 }).eq('id', id);
    expect(update.error?.code).toBe('42501');
    const insert = await a.client.from('report_events').insert({ report_id: id, device_id: a.id, type: 'resuelto' });
    expect(insert.error?.code).toBe('42501');
    const viaView = await a.client.from('report_events_public').insert({ report_id: id, type: 'resuelto' });
    expect(viaView.error).toBeTruthy();
    expect(await estado(id)).toMatchObject({ status: 'open' });
  });
});

describe('operador', () => {
  test('resuelve a mano: vale hasta el siguiente evento que cambie el estado', async () => {
    const id = await nuevoReporte();
    await operador(id, 'resolved');
    expect((await estado(id))?.status).toBe('resolved');
    expect(await ok(a, id, 'sumate')).toMatchObject({ status: 'resolved', vecinos_count: 2 });
    expect(await ok(b, id, 'sigue_roto')).toMatchObject({ status: 'open', resolved_at: null });
  });

  test('reabre a mano un resuelto: los arreglado de antes ya no cuentan', async () => {
    const id = await nuevoReporte();
    await ok(a, id, 'resuelto');
    await ok(b, id, 'resuelto');
    await operador(id, 'open');
    expect(await estado(id)).toEqual({ status: 'open', resolved_at: null });

    expect(await ok(a, id, 'resuelto')).toMatchObject({ status: 'open' });
    expect(await ok(b, id, 'resuelto')).toMatchObject({ status: 'resolved' });
  });

  test('restaura un oculto: las denuncias de antes ya no cuentan', async () => {
    const id = await nuevoReporte();
    for (const v of [a, b, c]) await ok(v, id, 'denuncia');
    await operador(id, 'open');
    expect((await estado(id))?.status).toBe('open');

    expect(await ok(a, id, 'sumate')).toMatchObject({ status: 'open' });
    expect(await ok(d, id, 'denuncia')).toMatchObject({ status: 'open' });
    expect((await evento(a, id, 'denuncia')).error?.message).toBe('duplicate_event');
  });

  test('oculta a mano: nadie puede registrar eventos', async () => {
    const id = await nuevoReporte();
    await operador(id, 'hidden');
    expect((await evento(a, id, 'resuelto')).error?.message).toBe('report_not_found');
  });
});
