import '../global.css';

import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { refreshNoticesToken, useNoticeTaps } from '@/lib/notices';
import { startSendingUnsent } from '@/lib/unsent';
import { ensureSession } from '@/lib/supabase';
import { NAV_THEME } from '@/lib/theme';

// Solo desarrollo: el selector de datos de break-ui (src/dev).
const DataToggle: (() => React.JSX.Element) | null = __DEV__ ? require('@/dev/data-toggle').DataToggle : null;

export default function RootLayout() {
  // NativeWind sigue el modo claro/oscuro del sistema (app.json: userInterfaceStyle "automatic").
  const { colorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({ Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold, Rubik_800ExtraBold });

  // Crea la sesión anónima apenas abre la app. Si falla (sin red), createReport la reintenta y muestra el error.
  useEffect(() => {
    ensureSession().catch(() => {});
  }, []);

  // Los reportes guardados sin señal se envían solos (#12), aunque la app se haya cerrado mientras tanto.
  useEffect(startSendingUnsent, []);

  // Avisos (#13): token al día y tocar un aviso abre el reporte.
  useEffect(() => {
    refreshNoticesToken().catch(() => {});
  }, []);
  useNoticeTaps(fontsLoaded);

  if (!fontsLoaded) return null;

  return (
    // La hoja fija del mapa (@gorhom/bottom-sheet) necesita el root de gestos.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <Stack screenOptions={{ headerTitleStyle: { fontFamily: 'Rubik_700Bold' }, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="categoria" options={{ title: '¿Qué problema es?' }} />
          <Stack.Screen name="detalles" options={{ title: 'Revisá y enviá' }} />
          <Stack.Screen name="confirmacion" options={{ headerShown: false }} />
          <Stack.Screen name="mapa" options={{ title: 'Mapa', headerShown: false }} />
          <Stack.Screen name="reporte/[id]" options={{ headerShown: false }} />
        </Stack>
        {DataToggle && <DataToggle />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
