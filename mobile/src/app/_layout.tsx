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
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
