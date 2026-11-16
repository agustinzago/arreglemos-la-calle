// Avisos (#13): a quién se le avisa cuando un reporte pasa a resuelto o vuelve a abierto.
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, vecino, type Vecino } from './helpers';

afterAll(cleanup);

const here = { lat: PLACES.laCalera.lat - 0.0023, lng: PLACES.laCalera.lng + 0.0017 };

let creador: Vecino, sumado: Vecino, sinAvisos: Vecino, ajeno: Vecino, otro: Vecino;

// Tokens con formato válido; Expo los rechaza al recibirlos (no existen), sin efecto.
const token = () => `ExponentPushToken[test-${crypto.randomUUID()}]`;
const aceptar = (v: Vecino, t = token()) => v.client.rpc('enable_notices', { p_token: t });
const evento = (v: Vecino, id: number, type: string) =>
  v.client.rpc('register_event', { p_report_id: id, p_type: type }).throwOnError();
const operador = (id: number, status: string) => admin.from('reports').update({ status }).eq('id', id).throwOnError();

/** Los avisos que recibió el vecino para este reporte, del más viejo al más nuevo. */
async function avisos(v: Vecino, id: number) {
  const { data, error } = await v.client.rpc('my_notices');
  expect(error).toBeNull();
  return (data as { report_id: number; status: string }[]).filter((n) => n.report_id === id).map((n) => n.status).reverse();
}

beforeAll(async () => {
  [creador, sumado, sinAvisos, ajeno, otro] = await Promise.all([vecino(), vecino(), vecino(), vecino(), vecino()]);
});

describe('aceptar los avisos', () => {
  test('hace falta sesión y un token de Expo', async () => {
    expect((await anon().rpc('enable_notices', { p_token: token() })).error).toMatchObject({ code: '42501' });
    expect((await aceptar(creador, 'cualquier-cosa')).error).toMatchObject({ code: '22023', message: 'invalid_token' });
    expect((await aceptar(creador)).error).toBeNull();
    expect((await aceptar(creador)).error).toBeNull(); // un token nuevo reemplaza al anterior
  });

  test('my_notices es solo para vecinos con sesión', async () => {
    expect((await anon().rpc('my_notices')).error).toMatchObject({ code: '42501' });
  });
});

describe('cambios de estado', () => {
  test('avisa a quienes lo crearon o se sumaron y aceptaron; nunca a quien no aceptó', async () => {
    const { data, error } = await createReport(creador, { ...here, category: 'luminaria' });
    if (error) throw error;
    const id = data.id as number;
    await aceptar(creador).throwOnError();
    await evento(sumado, id, 'sumate');
    await aceptar(sumado).throwOnError(); // aceptó después de sumarse: igual queda suscripto
    await evento(sinAvisos, id, 'sumate');
    await aceptar(ajeno).throwOnError(); // aceptó, pero no tiene nada que ver con este reporte

    await evento(sinAvisos, id, 'resuelto');
    expect(await avisos(creador, id)).toEqual([]); // un solo arreglado no cambia el estado
    await evento(otro, id, 'resuelto');
    await evento(otro, id, 'sigue_roto');
    await operador(id, 'resolved');
    await operador(id, 'hidden'); // ocultar y restaurar no avisan
    await operador(id, 'resolved');

    for (const v of [creador, sumado]) expect(await avisos(v, id)).toEqual(['resolved', 'open', 'resolved']);
    for (const v of [sinAvisos, ajeno, otro]) expect(await avisos(v, id)).toEqual([]);
  });

  test('si el token pasa a otro vecino, el anterior deja de recibir', async () => {
    const { data, error } = await createReport(otro, { ...here, category: 'cloaca' });
    if (error) throw error;
    const t = token();
    await aceptar(otro, t).throwOnError();
    await aceptar(ajeno, t).throwOnError(); // mismo teléfono, otra sesión
    await operador(data.id, 'resolved');
    expect(await avisos(otro, data.id)).toEqual([]);
  });
});
