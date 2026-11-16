// Paso "¿Ya lo reportaron?", entre la categoría y la revisión: hasta 3 reportes abiertos de la
// misma categoría cerca del pin. El vecino decide (ADR-0003): sumarse a uno o crear uno nuevo.
// Sin cercanos (o si la búsqueda falla) se reemplaza por la revisión, así no queda en el historial.
import { categoryShortLabel, type CategoryCode, type NearbyReport } from '@arreglemos/shared';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Circle, CircleDot, Ellipsis, Navigation, UserPlus, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, useWindowDimensions, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS } from '@/lib/categories';
import { joinReport, nearbyReports, photoUrl } from '@/lib/reports';
import { cn } from '@/lib/utils';

type Params = { photoUri: string; lat: string; lng: string; address?: string; category: CategoryCode; other: string };

const title = { title: '¿Ya lo reportaron?' };

export default function NearbyScreen() {
  const params = useLocalSearchParams<Params>();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const [reports, setReports] = useState<NearbyReport[]>();
  const [selected, setSelected] = useState(0); // el más cercano, como en el diseño
  const [joining, setJoining] = useState(false);
  const small = 18 * Math.min(fontScale, 1.5);

  const createNew = () => router.replace({ pathname: '/detalles', params });

  useEffect(() => {
    nearbyReports(Number(params.lat), Number(params.lng), params.category)
      .then((found) => (found.length ? setReports(found) : createNew()))
      // ponytail: si la búsqueda falla, se sigue a la revisión en vez de trabar el reporte.
      .catch(createNew);
  }, []); // una sola búsqueda al entrar

  async function join() {
    const id = reports![selected].id;
    setJoining(true);
    try {
      await joinReport(id);
    } catch (e) {
      // duplicate_event: ya estaba sumado (o es su reporte); igual va al detalle.
      if (!(e && typeof e === 'object' && 'message' in e && e.message === 'duplicate_event')) {
        setJoining(false);
        return Alert.alert('No pudimos sumarte', 'Revisá tu conexión y probá de nuevo.');
      }
    }
    // Como al enviar un reporte: volver desde el detalle lleva a la cámara.
    router.dismissAll();
    router.push(`/reporte/${id}`);
  }

  if (!reports) {
    return (
      <View className="flex-1 gap-3 bg-background px-screen py-5">
        <Stack.Screen options={title} />
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator color={theme.mutedForeground} />
          <Text className="font-sans-semibold text-muted-foreground">Buscando reportes cerca…</Text>
        </View>
        <View className="h-[124px] rounded-xl bg-muted" />
        <View className="h-[124px] rounded-xl bg-muted" />
      </View>
    );
  }

  return (
    <FormScreen
      footer={
        <>
          <Button onPress={join} disabled={joining}>
            {joining ? <ActivityIndicator color={theme.primaryForeground} /> : <UserPlus color={theme.primaryForeground} size={24} />}
            <Text>Es este, me sumo</Text>
          </Button>
          <Button variant="outline" onPress={createNew} disabled={joining}>
            <Text>Es otro, crear nuevo</Text>
          </Button>
        </>
      }
    >
      <Stack.Screen options={title} />
      <Text className="text-muted-foreground">
        {reports.length === 1 ? 'Hay 1 reporte cerca.' : `Hay ${reports.length} reportes cerca.`} Si es el mismo, sumate:
        cuantos más vecinos, más peso tiene.
      </Text>
      <View role="radiogroup" className="gap-2.5">
        {reports.map((r, i) => {
          const on = i === selected;
          const Icon = CATEGORY_ICONS[r.category] ?? Ellipsis;
          const Radio = on ? CircleDot : Circle;
          const distance = `a ${Math.max(1, Math.round(r.distance_m))} m`;
          const vecinos = `${r.vecinos_count} ${r.vecinos_count === 1 ? 'vecino' : 'vecinos'}`;
          return (
            <Pressable
              key={r.id}
              role="radio"
              aria-checked={on}
              accessibilityLabel={`${categoryShortLabel(r.category)}, ${r.address ?? 'sin dirección'}, ${distance}, ${vecinos}`}
              onPress={() => setSelected(i)}
              className={cn(
                'flex-row items-center gap-3 rounded-xl border-2 p-2.5',
                on ? 'border-primary bg-primary-soft' : 'border-border bg-card',
              )}
            >
              <View className="h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[12px] bg-muted">
                <Icon size={32} color={theme.mutedForeground} />
                <Image source={photoUrl(r.photo_path)} style={{ position: 'absolute', width: 100, height: 100 }} contentFit="cover" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-sans-bold">{categoryShortLabel(r.category)}</Text>
                <Text variant="muted">{r.address ?? 'Sin dirección'}</Text>
                <View className="flex-row flex-wrap gap-x-3 gap-y-0.5">
                  <View className="flex-row items-center gap-1">
                    <Navigation size={small} color={theme.foreground} />
                    <Text className="text-xs font-sans-bold">{distance}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Users size={small} color={theme.foreground} />
                    <Text className="text-xs font-sans-bold">{vecinos}</Text>
                  </View>
                </View>
              </View>
              <Radio size={28} color={on ? theme.primary : theme.mutedForeground} />
            </Pressable>
          );
        })}
      </View>
    </FormScreen>
  );
}
