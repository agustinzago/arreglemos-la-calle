// Reportes sin enviar (#12): sin señal (o si el servidor falla) el reporte queda guardado en el teléfono
// —datos en localStorage (expo-sqlite), foto ya comprimida en documentos— y se envía solo, en orden,
// al abrir la app, al volver la conexión, al volver a primer plano y cada minuto mientras quede alguno.
import { sendInOrder } from '@arreglemos/shared';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import { AppState } from 'react-native';

import { compressWithoutExif, sendReport, type NewReport } from './reports';

/** `id` es también el nombre de la foto en Storage: reintentar no duplica el reporte. */
export type PendingReport = NewReport & { id: string; createdAt: string };

const KEY = 'pending-reports';
const listeners = new Set<() => void>();

export const isOnline = (s: NetInfoState) => s.isConnected !== false && s.isInternetReachable !== false;

export function pendingReports(): PendingReport[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]');
}

function save(items: PendingReport[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

/** Avisa cuando cambia la lista (se guardó o se envió uno). Devuelve la función para desuscribirse. */
export function onPendingChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Guarda el reporte completo en el teléfono. `id`: el nombre de foto de un envío que pudo haber llegado. */
export async function savePending(input: NewReport, id = String(Date.now())) {
  const dir = new Directory(Paths.document, 'pending');
  if (!dir.exists) dir.create();
  const photo = new File(dir, `${id}.jpg`);
  new File(await compressWithoutExif(input.photoUri)).move(photo);
  save([...pendingReports(), { ...input, photoUri: photo.uri, id, createdAt: new Date().toISOString() }]);
}

function remove(item: PendingReport) {
  save(pendingReports().filter((p) => p.id !== item.id));
  const photo = new File(item.photoUri);
  if (photo.exists) photo.delete();
}

let sending: Promise<void> | null = null;

/** Intenta enviar los pendientes; si ya hay un intento en curso, devuelve ese. */
export function sendPending() {
  const items = pendingReports();
  if (!items.length) return Promise.resolve();
  sending ??= sendInOrder(items, (p) => sendReport(p, p.id), remove).finally(() => (sending = null));
  return sending;
}

/** Arranca los envíos automáticos. Se llama una vez, en el layout raíz; devuelve la limpieza. */
export function startSendingPending() {
  sendPending();
  const net = NetInfo.addEventListener((s) => isOnline(s) && sendPending());
  const app = AppState.addEventListener('change', (s) => s === 'active' && sendPending());
  const timer = setInterval(sendPending, 60_000); // reintenta errores del servidor sin esperar otro evento
  return () => {
    net();
    app.remove();
    clearInterval(timer);
  };
}
