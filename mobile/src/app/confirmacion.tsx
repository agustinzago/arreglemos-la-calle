// Confirmación con el número de reporte, "Enviar a la Muni por WhatsApp" (ADR-0001) y el aviso de
// emergencias (ADR-0006). La app solo abre el link de wa.me: no registra si el mensaje se envió.
// "¿Te avisamos cuando lo arreglen?" (#13): el permiso de notificaciones se pide solo si acepta.
import { municipalityMessage, reportUrl, whatsappLink, type PublicMunicipality } from '@arreglemos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Map, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { NoticesCard } from '@/components/notices-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getMunicipality, WEB_URL } from '@/lib/reports';
import { THEME } from '@/lib/theme';

type Params = {
  id: string;
  lat: string;
  lng: string;
  category: string;
  address: string;
  description: string;
  municipalityId: string;
};

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<Params>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  // undefined = cargando, null = sin municipio, 'error' = no se pudo leer
  const [municipality, setMunicipality] = useState<PublicMunicipality | null | 'error'>();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const id = Number(params.municipalityId);
    if (!id) return setMunicipality(null);
    getMunicipality(id).then(setMunicipality, () => setMunicipality('error'));
  }, [params.municipalityId]);

  const canSend = municipality && municipality !== 'error' && !!municipality.whatsapp;
  const showMap = () => router.push({ pathname: '/mapa', params });

  function sendToMuni() {
    if (!canSend) return;
    const report = {
      id: Number(params.id),
      category: params.category,
      address: params.address || null,
      description: params.description || null,
    };
    const text = municipalityMessage(report, municipality.name, reportUrl(WEB_URL, report.id));
    Linking.openURL(whatsappLink(municipality.whatsapp!, text)).then(
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
        {municipality === undefined ? (
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
              {municipality === 'error'
                ? 'No pudimos ver a qué municipio mandárselo. Revisá tu conexión: lo vas a poder mandar desde el detalle del reporte.'
                : municipality
                  ? `Todavía no tenemos el WhatsApp de ${municipality.name} para mandárselo.`
                  : 'Este lugar no está dentro de un municipio que tengamos cargado, así que no hay a quién mandárselo.'}
            </Text>
          </View>
        )}
        <NoticesCard />
        <EmergencyNotice />
        {/* Las acciones secundarias van al final del contenido: con letra grande, tres botones fijos
            ocupaban casi toda la pantalla. */}
        <View className="gap-2">
          {canSend && (
            <Button variant="outline" onPress={showMap}>
              <Map color={theme.primaryInk} size={24} />
              <Text>Ver en el mapa</Text>
            </Button>
          )}
          <Button variant="ghost" size="sm" onPress={() => router.dismissAll()}>
            <Text className="underline">{canSend && !opened ? 'Ahora no, volver a la cámara' : 'Volver a la cámara'}</Text>
          </Button>
        </View>
      </ScrollView>
      {/* Fija abajo, solo la acción principal: mandárselo a la Muni o, si no hay WhatsApp, ver el mapa. */}
      <View className="border-t border-border px-screen pb-2 pt-3">
        {canSend ? (
          <Button variant="success" onPress={sendToMuni}>
            <MessageCircle color={theme.successForeground} size={24} />
            <Text>Enviar a la Muni por WhatsApp</Text>
          </Button>
        ) : (
          <Button onPress={showMap}>
            <Map color={theme.primaryForeground} size={24} />
            <Text>Ver en el mapa</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
