import * as Location from 'expo-location';
import type { LatLng } from 'react-native-maps';

/**
 * Dónde está el teléfono, para centrar un mapa. Nunca pide permiso (lo pide la cámara al empezar): sin
 * permiso o sin señal, null. Primero la última posición conocida, que es instantánea.
 */
export async function whereAmI(): Promise<LatLng | null> {
  if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
  const position =
    (await Location.getLastKnownPositionAsync().catch(() => null)) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
  return position && { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
