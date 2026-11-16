import { isRejection, sendInOrder } from '@arreglemos/shared';
import { afterAll, expect, test } from 'vitest';
import { cleanup, PLACES, uploadPhoto, vecino } from './helpers';

afterAll(cleanup);

test('envía en orden, corta ante un error que se puede reintentar y descarta los rechazos', async () => {
  const sent: number[] = [];
  const queue = [1, 2, 3, 4];
  const remove = (n: number) => queue.splice(queue.indexOf(n), 1);
  const outcomes: Record<number, unknown> = {
    2: { code: '23505', message: 'duplicate key' }, // ya había llegado: se saca
    3: { code: '', message: 'TypeError: Network request failed' }, // sin red: queda
  };
  await sendInOrder([...queue], async (n) => {
    if (outcomes[n]) throw outcomes[n];
    sent.push(n);
  }, remove);
  expect(sent).toEqual([1]);
  expect(queue).toEqual([3, 4]); // el 4 no se intentó: sigue en orden detrás del 3

  delete outcomes[3];
  await sendInOrder([...queue], async (n) => void sent.push(n), remove);
  expect(sent).toEqual([1, 3, 4]);
  expect(queue).toEqual([]);

  expect(isRejection({ code: '22023' })).toBe(true);
  expect(isRejection({ code: '28000' })).toBe(false); // sin sesión: se reintenta
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
  expect(isRejection(again.error)).toBe(true);

  // Subir otra vez la misma ruta tampoco pisa la foto: la app lo toma como "ya subida".
  const upload = await v.client.storage.from('photos').upload(path, new Uint8Array([1]), { contentType: 'image/jpeg' });
  expect(upload.error && 'statusCode' in upload.error && upload.error.statusCode).toBe('409');
});
