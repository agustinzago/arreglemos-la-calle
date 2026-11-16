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

import { ensureSession } from '@/lib/supabase';
import { NAV_THEME } from '@/lib/theme';

export default function RootLayout() {
  // NativeWind sigue el modo claro/oscuro del sistema (app.json: userInterfaceStyle "automatic").
  const { colorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({ Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold, Rubik_800ExtraBold });

  // Crea la sesión anónima apenas abre la app. Si falla (sin red), createReport la reintenta y muestra el error.
  useEffect(() => {
    ensureSession().catch(() => {});
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <Stack screenOptions={{ headerTitleStyle: { fontFamily: 'Rubik_700Bold' }, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="categoria" options={{ title: '¿Qué problema es?' }} />
        <Stack.Screen name="mapa" options={{ title: 'Mapa' }} />
        <Stack.Screen name="reporte/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
