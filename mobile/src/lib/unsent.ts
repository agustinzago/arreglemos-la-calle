// Reportes sin enviar (#12): sin señal (o si el servidor falla) el reporte queda guardado en el teléfono
// —datos en localStorage (expo-sqlite), foto ya comprimida en documentos— y se envía solo, en orden,
// al abrir la app, al volver la conexión, al volver a primer plano y cada minuto mientras quede alguno.
// Si la base lo rechaza, queda marcado `failed` (no se reintenta solo) y Mis reportes deja descartarlo
// o probar de nuevo.
import 'expo-sqlite/localStorage/install';
import { sendInOrder } from '@arreglemos/shared';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import { AppState } from 'react-native';

import { compressWithoutExif, sendReport, type NewReport } from './reports';

/** `id` es también el nombre de la foto en Storage: reintentar no duplica el reporte. */
export type UnsentReport = NewReport & { id: string; createdAt: string; failed?: boolean };

const KEY = 'pending-reports'; // nombre viejo: cambiarlo perdería los guardados en los teléfonos
const listeners = new Set<() => void>();

export const isOnline = (s: NetInfoState) => s.isConnected !== false && s.isInternetReachable !== false;

export function unsentReports(): UnsentReport[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]');
}

function save(items: UnsentReport[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

/** Avisa cuando cambia la lista (se guardó, se envió o falló uno). Devuelve la función para desuscribirse. */
export function onUnsentChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Guarda el reporte completo en el teléfono. `id`: el nombre de foto de un envío que pudo haber llegado. */
export async function saveUnsent(input: NewReport, id = String(Date.now())) {
  const dir = new Directory(Paths.document, 'pending');
  if (!dir.exists) dir.create();
  const photo = new File(dir, `${id}.jpg`);
  new File(await compressWithoutExif(input.photoUri)).move(photo);
  save([...unsentReports(), { ...input, photoUri: photo.uri, id, createdAt: new Date().toISOString() }]);
}

/** Lo saca del teléfono (se envió, o el vecino lo descartó), con su foto. */
export function discardUnsent(id: string) {
  const item = unsentReports().find((p) => p.id === id);
  save(unsentReports().filter((p) => p.id !== id));
  const photo = item && new File(item.photoUri);
  if (photo?.exists) photo.delete();
}

function setFailed(id: string, failed: boolean) {
  save(unsentReports().map((p) => (p.id === id ? { ...p, failed } : p)));
}

let sending: Promise<void> | null = null;

/** Intenta enviar los que no fallaron; si ya hay un intento en curso, devuelve ese. */
export function sendUnsent() {
  const items = unsentReports().filter((p) => !p.failed);
  if (!items.length) return Promise.resolve();
  sending ??= sendInOrder(items, (p) => sendReport(p, p.id), {
    sent: (p) => discardUnsent(p.id),
    failed: (p) => setFailed(p.id, true),
  }).finally(() => (sending = null));
  return sending;
}

/** El vecino pide probar de nuevo uno que falló. */
export function retryUnsent(id: string) {
  setFailed(id, false);
  return sendUnsent();
}

/** Arranca los envíos automáticos. Se llama una vez, en el layout raíz; devuelve la limpieza. */
export function startSendingUnsent() {
  sendUnsent();
  const net = NetInfo.addEventListener((s) => isOnline(s) && sendUnsent());
  const app = AppState.addEventListener('change', (s) => s === 'active' && sendUnsent());
  const timer = setInterval(sendUnsent, 60_000); // reintenta errores del servidor sin esperar otro evento
  return () => {
    net();
    app.remove();
    clearInterval(timer);
  };
}
