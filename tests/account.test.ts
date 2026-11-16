// Historias 55–56 de #1: vincular una cuenta conserva lo hecho como anónimo, y la cuenta se puede borrar.
//
// Un test no puede conseguir un id token de Apple o Google, así que vincula un email con la clave
// secreta. Para GoTrue es lo mismo: linkIdentity / updateUser agregan una identidad al mismo usuario
// (mismo auth.uid()), que es lo que el contrato necesita. Después "otro teléfono" entra con esa
// identidad y ve sus reportes.
import { deleteAccount } from '@arreglemos/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, anon, cleanup, createReport, PLACES, uploadPhoto, vecino, type Vecino } from './helpers';

afterAll(cleanup);

let ana: Vecino;
let beto: Vecino;
const ids = { deAna: 0, deBeto: 0 };

const mis = async (v: Pick<Vecino, 'client'>) => {
  const { data, error } = await v.client.rpc('my_reports');
  expect(error).toBeNull();
  return (data as { report: { id: number; vecinos_count: number }; created: boolean }[]).map((r) => [
    r.report.id,
    r.created,
  ]);
};

beforeAll(async () => {
  [ana, beto] = [await vecino(), await vecino()];
  const make = async (v: Vecino) => ((await createReport(v, PLACES.laCalera)).data as { id: number }).id;
  ids.deAna = await make(ana);
  ids.deBeto = await make(beto);
  await ana.client.rpc('register_event', { p_report_id: ids.deBeto, p_type: 'sumate' }).throwOnError();
});

describe('vincular una cuenta', () => {
  test('conserva el mismo vecino y, desde otro teléfono, sus reportes', async () => {
    const antes = await mis(ana);
    expect(antes).toEqual([
      [ids.deBeto, false],
      [ids.deAna, true],
    ]);

    const email = `vecino-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomUUID();
    const { data: linked, error } = await admin.auth.admin.updateUserById(ana.id, { email, password, email_confirm: true });
    expect(error).toBeNull();
    expect(linked.user).toMatchObject({ id: ana.id, is_anonymous: false });
    expect(await mis(ana)).toEqual(antes); // la sesión del teléfono sigue andando

    const otroTelefono = anon();
    const { data: signIn } = await otroTelefono.auth.signInWithPassword({ email, password });
    expect(signIn.user?.id).toBe(ana.id);
    expect(await mis({ client: otroTelefono })).toEqual(antes);
  });
});

describe('borrar la cuenta', () => {
  test('borra sus reportes, sus fotos y el usuario; lo que hizo en reportes ajenos sigue contando', async () => {
    const eventPhoto = await uploadPhoto(beto);
    await beto.client.rpc('register_event', { p_report_id: ids.deAna, p_type: 'sumate' }).throwOnError();
    await beto.client
      .rpc('register_event', { p_report_id: ids.deAna, p_type: 'resuelto', p_photo_path: eventPhoto })
      .throwOnError();

    await deleteAccount(beto.client, beto.id);

    const { data: deAna } = await anon().from('reports_public').select('id, vecinos_count').eq('id', ids.deAna).single();
    expect(deAna).toEqual({ id: ids.deAna, vecinos_count: 2 }); // el sumate de beto sigue contando
    const { data: history } = await anon().from('report_events_public').select('type, photo_path').eq('report_id', ids.deAna);
    expect(history).toContainEqual({ type: 'resuelto', photo_path: null });

    const { data: deBeto } = await anon().from('reports_public').select('id').eq('id', ids.deBeto);
    expect(deBeto).toEqual([]);
    expect(await mis(ana)).toEqual([[ids.deAna, true]]);

    const { data: files } = await admin.storage.from('photos').list(beto.id);
    expect(files).toEqual([]);
    const { data: user } = await admin.auth.admin.getUserById(beto.id);
    expect(user.user).toBeNull();
  });

  test('sin sesión no se puede llamar', async () => {
    expect((await anon().rpc('delete_my_account')).error?.code).toBe('42501');
  });
});
