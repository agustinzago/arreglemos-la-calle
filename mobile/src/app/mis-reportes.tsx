// Mis reportes: los que el vecino creó y a los que se sumó, cada uno abre su detalle.
// Se abre desde la cámara; el pie vuelve a ella. #12 agrega arriba una sección "Esperando señal"
// con los pendientes del teléfono: alcanza con anteponerla a `sections`.
import { router, Stack, useFocusEffect } from 'expo-router';
import { Camera, CloudOff } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportRow, useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { myReports, type MyReport } from '@/lib/reports';

export default function MyReportsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<MyReport[] | null>(null); // null = cargando
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    myReports()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  // Al volver del detalle (por ejemplo, después de sumarse) la lista se actualiza.
  useFocusEffect(load);

  const sections = [
    { title: 'Los que creaste', data: items?.filter((i) => i.created) ?? [] },
    { title: 'A los que te sumaste', data: items?.filter((i) => !i.created) ?? [] },
  ].filter((s) => s.data.length > 0);
  const empty = items !== null && items.length === 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Mis reportes' }} />
      <SectionList
        sections={failed ? [] : sections}
        keyExtractor={(i) => String(i.report.id)}
        renderItem={({ item }) => (
          <ReportRow report={item.report} className="bg-card" onPress={() => router.push(`/reporte/${item.report.id}`)} />
        )}
        renderSectionHeader={({ section }) => (
          <Text variant="h2" className="bg-background pb-1 pt-4">
            {section.title}
          </Text>
        )}
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
