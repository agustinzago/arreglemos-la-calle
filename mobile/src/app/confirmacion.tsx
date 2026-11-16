// Confirmación con el número de reporte y el aviso de emergencias (ADR-0006).
// "Enviar a la Muni por WhatsApp" es #5 y "¿Te avisamos cuando lo arreglen?" es #13.
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Map } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{ id: string; lat: string; lng: string }>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-screen py-6">
        <View className="flex-row flex-wrap items-center gap-3">
          <CircleCheck fill={theme.success} color={theme.successForeground} size={56 * Math.min(fontScale, 1.5)} />
          <Text variant="h1" className="shrink">
            ¡Listo! Ya está en el mapa
          </Text>
        </View>
        <View className="gap-1 rounded-xl border border-border bg-card p-4">
          <Text variant="muted" className="font-sans-semibold">
            Tu número de reporte
          </Text>
          <Text className="font-display text-3xl tracking-wide" maxFontSizeMultiplier={1.5}>
            {params.id}
          </Text>
        </View>
        <EmergencyNotice />
      </ScrollView>
      <View className="gap-2 border-t border-border px-screen pb-2 pt-3">
        <Button onPress={() => router.push({ pathname: '/mapa', params })}>
          <Map color={theme.primaryForeground} size={24} />
          <Text>Ver en el mapa</Text>
        </Button>
        <Button variant="ghost" size="sm" onPress={() => router.dismissAll()}>
          <Text className="underline">Volver a la cámara</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
