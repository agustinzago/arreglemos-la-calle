// Paso "Revisá y enviá": resumen de foto, lugar y problema (cada uno con "Cambiar"), una
// descripción opcional y "Enviar reporte". Al enviar, la confirmación queda sobre la cámara.
import { categoryLabel, DETAILS_MAX, isRejection, type CategoryCode } from '@arreglemos/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Send } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Alert, useWindowDimensions, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { OfflineBanner, useOffline } from '@/components/offline-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { categoryIcon } from '@/lib/categories';
import { saveUnsent } from '@/lib/unsent';
import { createReport } from '@/lib/reports';
import { THEME } from '@/lib/theme';

type Params = { photoUri: string; lat: string; lng: string; address?: string; category: CategoryCode; other: string };

export default function DetailsScreen() {
  const params = useLocalSearchParams<Params>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  const [extra, setExtra] = useState('');
  const [sending, setSending] = useState(false);
  const offline = useOffline();
  const iconSize = 30 * Math.min(fontScale, 1.5);
  const CategoryIcon = categoryIcon(params.category);

  const rows = [
    {
      label: 'Foto',
      value: '1 foto lista',
      icon: <Image source={{ uri: params.photoUri }} style={{ width: 60, height: 60, borderRadius: 10 }} />,
      change: () => router.dismissTo('/'),
    },
    {
      label: 'Lugar',
      value: params.address || 'Donde sacaste la foto',
      icon: <MapPin color={theme.primaryInk} size={iconSize} />,
      // Vuelve al paso anterior a la categoría (la ubicación, #3).
      change: () => router.dismiss(2),
    },
    {
      label: 'Problema',
      value: params.category === 'otro' ? `Otro: ${params.other}` : categoryLabel(params.category),
      icon: <CategoryIcon color={theme.primaryInk} size={iconSize} />,
      change: () => router.back(),
    },
  ];

  async function send() {
    setSending(true);
    const description = [params.other, extra.trim()].filter(Boolean).join('\n');
    const input = {
      photoUri: params.photoUri,
      lat: Number(params.lat),
      lng: Number(params.lng),
      category: params.category,
      description: description || undefined,
      address: params.address || undefined,
    };
    // Sin señal (o si el servidor falla) se guarda en el teléfono y se envía solo después (#12).
    const keep = async (reason: 'offline' | 'error', photoName?: string) => {
      await saveUnsent(input, photoName);
      router.dismissAll();
      router.push({ pathname: '/guardado', params: { reason } });
    };
    if (offline) return keep('offline').catch(failed);
    // Mismo nombre de foto si queda pendiente: si este envío llegó y se cortó la respuesta, no se duplica.
    const photoName = String(Date.now());
    try {
      const report = await createReport(input, photoName);
      router.dismissAll();
      router.push({
        pathname: '/confirmacion',
        params: {
          id: report.id,
          lat: report.lat,
          lng: report.lng,
          category: report.category,
          address: report.address ?? '',
          // Para "Otro", el mensaje a la Muni dice qué es (la primera línea de la descripción).
          description: report.description ?? '',
          municipalityId: report.municipality_id ?? '',
        },
      });
    } catch (e) {
      if (isRejection(e)) return failed(e);
      await keep('error', photoName).catch(failed);
    }
  }

  function failed(e: unknown) {
    Alert.alert('No pudimos enviarlo', e instanceof Error ? e.message : String(e));
    setSending(false);
  }

  return (
    <FormScreen
      footer={
        <Button onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator color={theme.primaryForeground} /> : <Send color={theme.primaryForeground} size={24} />}
          <Text>{sending ? 'Enviando…' : 'Enviar reporte'}</Text>
        </Button>
      }
    >
      {offline && <OfflineBanner />}
      <View className="rounded-xl border border-border bg-card">
        {rows.map((row, i) => (
          <View
            key={row.label}
            className={`flex-row flex-wrap items-start gap-3 p-3.5 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <View className="min-w-[60px] items-center">{row.icon}</View>
            <View className="min-w-[140px] flex-1">
              <Text variant="muted">{row.label}</Text>
              <Text className="font-sans-bold">{row.value}</Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onPress={row.change}
              disabled={sending}
              accessibilityLabel={`Cambiar ${row.label.toLowerCase()}`}
            >
              <Text className="text-primary-ink underline">Cambiar</Text>
            </Button>
          </View>
        ))}
      </View>

      <View className="gap-2">
        <Text nativeID="extra-label" className="font-sans-bold">
          ¿Querés agregar algo? <Text className="text-muted-foreground">(opcional)</Text>
        </Text>
        <Input
          aria-labelledby="extra-label"
          value={extra}
          onChangeText={setExtra}
          placeholder="Por ejemplo: está frente a la escuela"
          multiline
          maxLength={DETAILS_MAX}
          editable={!sending}
        />
      </View>
    </FormScreen>
  );
}
