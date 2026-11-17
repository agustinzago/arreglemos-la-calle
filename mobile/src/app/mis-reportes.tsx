// Mis reportes: los que el vecino creó y a los que se sumó, cada uno abre su detalle.
// Se abre desde la cámara; el pie vuelve a ella. Arriba, los reportes sin enviar (#12), guardados en el
// teléfono: "No se pudieron enviar" (rechazados) y "Esperando señal"; se ven aunque no haya red, y al
// enviarse pasan a "Los que creaste". Al pie, vincular la cuenta (o borrarla, si ya está vinculada).
import { categoryShortLabel } from '@arreglemos/shared';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Camera, CircleAlert, CloudOff, RotateCcw, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountCard } from '@/components/account-card';
import { OfflineBanner, useOffline } from '@/components/offline-banner';
import { ReportRow, useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { myReports, WEB_URL, type MyReport } from '@/lib/reports';
import { discardUnsent, onUnsentChange, retryUnsent, unsentReports, type UnsentReport } from '@/lib/unsent';

export default function MyReportsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<MyReport[] | null>(null); // null = cargando
  const [failed, setFailed] = useState(false);
  const [unsent, setUnsent] = useState(unsentReports);
  const offline = useOffline();

  const load = useCallback(() => {
    setFailed(false);
    myReports()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  // Al volver del detalle (por ejemplo, después de sumarse) la lista se actualiza; también cuando se
  // envía (o falla) uno sin enviar mientras se está mirando.
  useFocusEffect(
    useCallback(() => {
      load();
      setUnsent(unsentReports());
      return onUnsentChange(() => {
        setUnsent(unsentReports());
        load();
      });
    }, [load]),
  );

  const sections = [
    { title: 'No se pudieron enviar', data: unsent.filter((u) => u.failed) as (UnsentReport | MyReport)[] },
    { title: 'Esperando señal', data: unsent.filter((u) => !u.failed) as (UnsentReport | MyReport)[] },
    { title: 'Los que creaste', data: failed ? [] : (items?.filter((i) => i.created) ?? []) },
    { title: 'A los que te sumaste', data: failed ? [] : (items?.filter((i) => !i.created) ?? []) },
  ].filter((s) => s.data.length > 0);
  const empty = items !== null && items.length === 0 && unsent.length === 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Mis reportes' }} />
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          offline ? (
            <View className="pt-3">
              <OfflineBanner />
            </View>
          ) : undefined
        }
        sections={sections}
        keyExtractor={(i) => ('report' in i ? String(i.report.id) : `sin-enviar-${i.id}`)}
        renderItem={({ item }) =>
          'report' in item ? (
            <ReportRow report={item.report} className="bg-card" onPress={() => router.push(`/reporte/${item.report.id}`)} />
          ) : (
            <UnsentRow item={item} />
          )
        }
        renderSectionHeader={({ section }) => (
          <Text variant="h2" className="bg-background pb-1 pt-4">
            {section.title}
          </Text>
        )}
        ListFooterComponent={
          <>
            <AccountCard onChange={load} />
            <View className="flex-row justify-center gap-6 pt-4">
              <Text className="text-muted-foreground underline" role="link" onPress={() => Linking.openURL(`${WEB_URL}/privacidad`)}>
                Privacidad
              </Text>
              <Text className="text-muted-foreground underline" role="link" onPress={() => Linking.openURL(`${WEB_URL}/soporte`)}>
                Soporte
              </Text>
            </View>
          </>
        }
        contentContainerClassName="flex-grow gap-2 px-screen pb-5"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3 py-10">
            {failed ? (
              <>
                <CloudOff size={56} color={theme.destructiveInk} />
                <Text variant="h2" className="text-center">
                  No pudimos cargar tus reportes
                </Text>
                <Text className="text-center text-muted-foreground">Revisá tu conexión y probá de nuevo.</Text>
                <Button variant="outline" onPress={load}>
                  <Text>Probar de nuevo</Text>
                </Button>
              </>
            ) : empty ? (
              <>
                <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
                  <Camera size={44} color={theme.primaryInk} />
                </View>
                <Text variant="h2" className="text-center">
                  Todavía no reportaste nada.
                </Text>
                <Text className="text-center text-muted-foreground">¡Sacá la primera foto!</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text className="font-sans-semibold text-muted-foreground">Cargando tus reportes…</Text>
              </>
            )}
          </View>
        }
      />
      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background">
        <View className="px-screen py-3">
          {/* Se llega desde la cámara: volver a ella en vez de apilar otra. */}
          <Button onPress={() => router.dismissTo('/')}>
            <Camera size={24} color={theme.primaryForeground} />
            <Text>{empty ? 'Sacar la primera foto' : 'Sacar otra foto'}</Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Fila de un reporte sin enviar: como ReportRow, con la foto local, sin abrir detalle (todavía no tiene
 * número). Si la base lo rechazó (`failed`) lo dice y deja descartarlo o probar de nuevo.
 */
function UnsentRow({ item }: { item: UnsentReport }) {
  const theme = useTheme();
  const title = categoryShortLabel(item.category);
  const meta = item.failed ? 'No lo pudimos enviar. Probá de nuevo o descartalo.' : 'Se envía cuando vuelva la señal';

  function discard() {
    Alert.alert('¿Descartar este reporte?', 'Se borra del teléfono y no se envía.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => discardUnsent(item.id) },
    ]);
  }

  return (
    <View className="gap-2 rounded-xl border border-border bg-card p-2.5">
      <View
        accessible
        accessibilityLabel={`${title}, ${item.failed ? 'no se envió' : 'sin enviar'}, ${item.address ?? 'sin dirección'}. ${meta}`}
        className="flex-row items-center gap-3"
      >
        <Image source={item.photoUri} style={{ width: 92, height: 92, borderRadius: 12 }} contentFit="cover" />
        <View className="flex-1 gap-1">
          <Text className="font-sans-bold">{title}</Text>
          <Text variant="muted">{item.address ?? 'Sin dirección'}</Text>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <View
              className={`flex-row items-center gap-1 self-start rounded-full py-[3px] pl-1.5 pr-2.5 ${item.failed ? 'bg-destructive-soft' : 'bg-muted'}`}
            >
              {item.failed ? (
                <CircleAlert size={18} color={theme.destructiveInk} />
              ) : (
                <CloudOff size={18} color={theme.foreground} />
              )}
              <Text className={`text-xs font-sans-bold ${item.failed ? 'text-destructive-ink' : ''}`}>
                {item.failed ? 'No se envió' : 'Sin enviar'}
              </Text>
            </View>
            <Text className="text-xs font-sans-semibold text-muted-foreground">{meta}</Text>
          </View>
        </View>
      </View>
      {item.failed && (
        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1" onPress={() => retryUnsent(item.id)}>
            <RotateCcw size={20} color={theme.primaryInk} />
            <Text>Probar de nuevo</Text>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onPress={discard}>
            <Trash2 size={20} color={theme.foreground} />
            <Text>Descartar</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
