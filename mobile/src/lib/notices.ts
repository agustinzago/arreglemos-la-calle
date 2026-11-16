// Avisos cuando lo arreglen (#13). El vecino acepta en la confirmación; recién ahí se pide el permiso.
// El token de Expo se guarda con enable_notices y la base avisa sola cuando el reporte cambia de estado.
// Sin projectId de EAS (falta `eas init`, ver scripts/push-setup.sh) o en un simulador no hay token:
// la confirmación no ofrece los avisos.
import 'expo-sqlite/localStorage/install';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ensureSession, supabase } from './supabase';

const KEY = 'notices-enabled';
const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export const noticesAvailable = Device.isDevice && !!projectId;
export const noticesEnabled = () => localStorage.getItem(KEY) === '1';
/** Al borrar la cuenta el token se borra con ella: la confirmación vuelve a ofrecer los avisos. */
export const forgetNotices = () => localStorage.removeItem(KEY);

// Con la app abierta, el aviso también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function register() {
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await ensureSession();
  const { error } = await supabase.rpc('enable_notices', { p_token: token });
  if (error) throw error;
  localStorage.setItem(KEY, '1');
}

/** El vecino aceptó: pide el permiso y registra el token. 'denied' si no dio el permiso. */
export async function enableNotices(): Promise<'on' | 'denied'> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de tus reportes',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return 'denied';
  await register();
  return 'on';
}

/** Al abrir la app: si ya aceptó, vuelve a mandar el token (Expo puede cambiarlo). Nunca pide permiso. */
export async function refreshNoticesToken() {
  if (!noticesAvailable || !noticesEnabled()) return;
  if ((await Notifications.getPermissionsAsync()).granted) await register();
}

/**
 * Tocar un aviso abre el detalle del reporte, también si la app estaba cerrada. `ready`: el Stack ya
 * está montado (antes no se puede navegar).
 */
export function useNoticeTaps(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    function open(response: Notifications.NotificationResponse | null) {
      const id = Number(response?.notification.request.content.data?.reportId);
      if (!(id > 0)) return;
      Notifications.clearLastNotificationResponse();
      router.push({ pathname: '/reporte/[id]', params: { id: String(id) } });
    }
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready]);
}
