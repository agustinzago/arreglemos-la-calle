// Confirmación de un reporte que quedó guardado en el teléfono (#12): sin señal, o porque el servidor
// falló. Se envía solo (lib/unsent); mientras tanto aparece en Mis reportes como "Esperando señal".
// También ofrece los avisos (#13): cuando llegue, el vecino ya va a estar sumado.
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Camera, Clock } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { NoticesCard } from '@/components/notices-card';
import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function SavedScreen() {
  const { reason } = useLocalSearchParams<{ reason: 'offline' | 'error' }>();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="gap-5 px-screen py-6">
        <View className="flex-row flex-wrap items-center gap-3">
          <Clock color={theme.primaryInk} size={56 * Math.min(fontScale, 1.5)} />
          <Text variant="h1" className="shrink">
            Guardado en tu teléfono
          </Text>
        </View>
        <OfflineBanner
          text={reason === 'error' ? 'No pudimos enviarlo. Lo volvemos a intentar solos en un rato.' : undefined}
        />
        <Text>
          No hace falta que hagas nada. Lo vas a ver en Mis reportes y, cuando se envíe, desde su detalle se lo podés
          mandar a la Muni por WhatsApp.
        </Text>
        <NoticesCard />
        <EmergencyNotice />
      </ScrollView>
      <View className="border-t border-border px-screen pb-2 pt-3">
        <Button onPress={() => router.dismissAll()}>
          <Camera color={theme.primaryForeground} size={24} />
          <Text>Volver a la cámara</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
