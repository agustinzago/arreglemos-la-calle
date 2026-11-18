// Solo desarrollo (break-ui): qué datos muestra la app. 'off' = los de verdad (Supabase); el resto son
// fixtures de src/dev/fixtures que entran por las mismas funciones de src/lib. Nunca llega a producción:
// src/lib lo carga con `__DEV__ ? require(...)` y Metro saca ese require del build de release.
import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

export const DATA_MODES = ['off', 'demo', 'worst', 'empty', 'one', 'huge'] as const;
export type DataMode = (typeof DATA_MODES)[number];
export const DATA_MODE_LABEL: Record<DataMode, string> = {
  off: 'Off',
  demo: 'Demo',
  worst: 'Worst case',
  empty: 'Empty',
  one: 'One',
  huge: '1,000',
};

const KEY = 'dev-data-mode';
const listeners = new Set<() => void>();

export const dataMode = (): DataMode => (localStorage.getItem(KEY) as DataMode | null) ?? 'off';

export function setDataMode(mode: DataMode) {
  localStorage.setItem(KEY, mode);
  listeners.forEach((l) => l());
}

export const useDataMode = () =>
  useSyncExternalStore((l) => (listeners.add(l), () => void listeners.delete(l)), dataMode);

/**
 * En un modo de prueba nada se escribe en Supabase: los ids y usuarios de los fixtures pueden coincidir
 * con datos reales (sumarse, denunciar o bloquear a otro vecino, borrar la cuenta).
 */
export function assertLiveData() {
  if (dataMode() !== 'off') throw new Error('Datos de prueba (dev): no se envía nada. Pasá el selector a Off.');
}

/**
 * El fixture del modo actual. undefined = usar el backend de verdad (modo 'off', o un modo que este
 * fixture no define). Los valores son thunks para no armar 1.000 filas si nadie las pide.
 */
export function pick<T>(fixtures: Partial<Record<Exclude<DataMode, 'off'>, () => T>>): T | undefined {
  const mode = dataMode();
  return mode === 'off' ? undefined : fixtures[mode]?.();
}
