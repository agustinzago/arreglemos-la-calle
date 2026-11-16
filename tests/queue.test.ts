import { isAlreadySent, isRejection, sendInOrder } from '@arreglemos/shared';
import { afterAll, expect, test } from 'vitest';
import { cleanup, PLACES, uploadPhoto, vecino } from './helpers';

afterAll(cleanup);

test('envía en orden; un rechazo se marca sin trabar a los demás; un error que se puede reintentar corta', async () => {
  const sent: number[] = [];
  const failed: number[] = [];
  const queue = [1, 2, 3, 4, 5, 6];
  const on = {
    sent: (n: number) => void queue.splice(queue.indexOf(n), 1),
    failed: (n: number) => void failed.push(n), // queda en la cola, marcado
  };
  const outcomes: Record<number, unknown> = {
    2: { code: '23505', message: 'duplicate key' }, // ya había llegado: se saca
    3: { code: '42501', message: 'permission denied' }, // rechazo con SQLSTATE
    4: { name: 'StorageApiError', status: 403, statusCode: '403', code: 'AccessDenied' }, // rechazo de Storage
    5: { code: '', message: 'TypeError: Network request failed' }, // sin red: corta
  };
  const send = async (n: number) => {
    if (outcomes[n]) throw outcomes[n];
    sent.push(n);
  };
  await sendInOrder([...queue], send, on);
  expect(sent).toEqual([1]);
  expect(failed).toEqual([3, 4]);
  expect(queue).toEqual([3, 4, 5, 6]); // el 6 no se intentó: sigue en orden detrás del 5

  // Vuelve la señal: se envían los que no fallaron.
  delete outcomes[5];
  await sendInOrder(queue.filter((n) => !failed.includes(n)), send, on);
  expect(sent).toEqual([1, 5, 6]);
  expect(queue).toEqual([3, 4]);

  expect(isAlreadySent({ code: '23505' })).toBe(true);
  expect(isRejection({ code: '22023' })).toBe(true);
  expect(isRejection({ code: '42501' })).toBe(true);
  expect(isRejection({ status: 400, statusCode: '400' })).toBe(true);
  expect(isRejection({ status: 401 })).toBe(false); // sesión vencida: se reintenta
  expect(isRejection({ status: 503 })).toBe(false);
  expect(isRejection({ code: '28000' })).toBe(false);
  expect(isRejection({ code: 'PGRST301' })).toBe(false);
  expect(isRejection(new Error('timeout'))).toBe(false);
  expect(isRejection(null)).toBe(false);
});

test('un reintento con la misma foto no duplica el reporte (23505)', async () => {
  const v = await vecino();
  const path = await uploadPhoto(v);
  const args = { p_photo_path: path, p_lat: PLACES.laCalera.lat, p_lng: PLACES.laCalera.lng, p_category: 'bache' };
  const first = await v.client.rpc('create_report', args);
  expect(first.error).toBeNull();

  const again = await v.client.rpc('create_report', args);
  expect(again.error?.code).toBe('23505');
  expect(isAlreadySent(again.error)).toBe(true);

  // Subir otra vez la misma ruta tampoco pisa la foto: la app lo toma como "ya subida".
  const upload = await v.client.storage.from('photos').upload(path, new Uint8Array([1]), { contentType: 'image/jpeg' });
  expect(upload.error && 'statusCode' in upload.error && upload.error.statusCode).toBe('409');
});
