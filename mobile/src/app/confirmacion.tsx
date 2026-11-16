// Confirmación con el número de reporte, "Enviar a la Muni por WhatsApp" (ADR-0001) y el aviso de
// emergencias (ADR-0006). La app solo abre el link de wa.me: no registra si el mensaje se envió.
// "¿Te avisamos cuando lo arreglen?" es #13.
import { muniMessage, reportUrl, whatsappLink, type PublicMunicipality } from '@arreglemos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Map, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getMunicipality, WEB_URL } from '@/lib/reports';
import { THEME } from '@/lib/theme';

type Params = { id: string; lat: string; lng: string; category: string; address: string; municipalityId: string };

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<Params>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  // undefined = cargando, null = sin municipio, 'error' = no se pudo leer
  const [muni, setMuni] = useState<PublicMunicipality | null | 'error'>();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const id = Number(params.municipalityId);
    if (!id) return setMuni(null);
    getMunicipality(id).then(setMuni, () => setMuni('error'));
  }, [params.municipalityId]);

  const canSend = muni && muni !== 'error' && !!muni.whatsapp;

  function sendToMuni() {
    if (!canSend) return;
    const report = { id: Number(params.id), category: params.category, address: params.address || null };
    const text = muniMessage(report, muni.name, reportUrl(WEB_URL, report.id));
    Linking.openURL(whatsappLink(muni.whatsapp!, text)).then(
      () => setOpened(true),
      () => Alert.alert('No pudimos abrir WhatsApp', '¿Está instalado en este teléfono?'),
    );
  }

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
        {muni === undefined ? (
          <ActivityIndicator color={theme.primary} />
        ) : canSend ? (
          opened ? (
            <View role="status" className="rounded-md bg-success-soft px-3.5 py-3">
              <Text className="font-sans-semibold text-success-ink">Se abrió WhatsApp con el mensaje listo.</Text>
            </View>
          ) : (
            <Text>
              Falta un paso: <Text className="font-sans-bold">mandáselo a la Muni</Text> para que quede registrado.
            </Text>
          )
        ) : (
          <View role="note" className="rounded-md bg-muted px-3.5 py-3">
            <Text>
              {muni === 'error'
                ? 'No pudimos ver a qué municipio mandárselo. Revisá tu conexión: lo vas a poder mandar desde el detalle del reporte.'
                : muni
                  ? `Todavía no tenemos el WhatsApp de ${muni.name} para mandárselo.`
                  : 'Este lugar no está dentro de un municipio que tengamos cargado, así que no hay a quién mandárselo.'}
            </Text>
          </View>
        )}
        <EmergencyNotice />
      </ScrollView>
      <View className="gap-2 border-t border-border px-screen pb-2 pt-3">
        {canSend && (
          <Button variant="success" onPress={sendToMuni}>
            <MessageCircle color={theme.successForeground} size={24} />
            <Text>Enviar a la Muni por WhatsApp</Text>
          </Button>
        )}
        <Button variant={canSend ? 'outline' : 'default'} onPress={() => router.push({ pathname: '/mapa', params })}>
          <Map color={canSend ? theme.primaryInk : theme.primaryForeground} size={24} />
          <Text>Ver en el mapa</Text>
        </Button>
        <Button variant="ghost" size="sm" onPress={() => router.dismissAll()}>
          <Text className="underline">{canSend && !opened ? 'Ahora no, volver a la cámara' : 'Volver a la cámara'}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
