// Paso "¿Ya lo reportaron?", entre la categoría y la revisión: hasta 3 reportes abiertos de la
// misma categoría cerca del pin. El vecino decide (ADR-0003): sumarse a uno o crear uno nuevo.
// La búsqueda la hace la categoría: acá solo se llega si hay alguno (llegan en el parámetro nearby).
import { categoryShortLabel, reportTitle, type CategoryCode, type NearbyReport } from '@arreglemos/shared';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Circle, CircleDot, Navigation, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, useWindowDimensions, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { categoryIcon } from '@/lib/categories';
import { joinReport, photoUrl } from '@/lib/reports';
import { cn } from '@/lib/utils';

type Params = { photoUri: string; lat: string; lng: string; address?: string; category: CategoryCode; other: string; nearby: string };

const title = { title: '¿Ya lo reportaron?' };

export default function NearbyScreen() {
  const { nearby, ...params } = useLocalSearchParams<Params>();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const [reports] = useState<NearbyReport[]>(() => JSON.parse(nearby));
  const [selected, setSelected] = useState(0); // el más cercano, como en el diseño
  const [joining, setJoining] = useState(false);
  const small = 18 * Math.min(fontScale, 1.5);

  // Reemplaza este paso, así volver desde la revisión lleva a la categoría.
  const createNew = () => router.replace({ pathname: '/detalles', params });

  async function join() {
    const id = reports[selected].id;
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
          const Icon = categoryIcon(r.category);
          const name = reportTitle(r, categoryShortLabel);
          const Radio = on ? CircleDot : Circle;
          const distance = `a ${Math.max(1, Math.round(r.distance_m))} m`;
          const vecinos = `${r.vecinos_count.toLocaleString('es-AR')} ${r.vecinos_count === 1 ? 'vecino' : 'vecinos'}`;
          return (
            <Pressable
              key={r.id}
              role="radio"
              aria-checked={on}
              accessibilityLabel={`${name}, ${r.address ?? 'sin dirección'}, ${distance}, ${vecinos}`}
              onPress={() => setSelected(i)}
              className={cn(
                'flex-row items-start gap-3 rounded-xl border-2 p-2.5',
                on ? 'border-primary bg-primary-soft' : 'border-border bg-card',
              )}
            >
              <View className="h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[12px] bg-muted">
                <Icon size={32} color={theme.mutedForeground} />
                <Image source={photoUrl(r.photo_path)} style={{ position: 'absolute', width: 100, height: 100 }} contentFit="cover" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-sans-bold">{name}</Text>
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
