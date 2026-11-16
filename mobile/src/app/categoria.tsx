// Elegir la categoría y crear el reporte. Los chips con íconos, "Otro", la revisión y la
// confirmación son #4; la sugerencia de IA es #11.
import { CATEGORIES, type CategoryCode } from '@arreglemos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { createReport } from '@/lib/reports';

// "Otro" necesita un campo de descripción (#4); hasta entonces no se ofrece.
const CHOICES = CATEGORIES.filter((c) => c.code !== 'otro');

export default function CategoryScreen() {
  const params = useLocalSearchParams<{ photoUri: string; lat: string; lng: string; address?: string }>();
  const [category, setCategory] = useState<CategoryCode>();
  const [sending, setSending] = useState(false);

  async function send() {
    if (!category) return;
    setSending(true);
    try {
      const report = await createReport({
        photoUri: params.photoUri,
        lat: Number(params.lat),
        lng: Number(params.lng),
        category,
        address: params.address || undefined,
      });
      router.replace({ pathname: '/mapa', params: { id: report.id, lat: report.lat, lng: report.lng } });
    } catch (e) {
      Alert.alert('No pudimos enviarlo', e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 px-screen py-4">
        {CHOICES.map((c) => (
          <Button
            key={c.code}
            variant={category === c.code ? 'default' : 'outline'}
            onPress={() => setCategory(c.code)}
            aria-selected={category === c.code}
          >
            <Text>{c.label}</Text>
          </Button>
        ))}
      </ScrollView>
      <View className="border-t border-border px-screen pt-3">
        <Button onPress={send} disabled={!category || sending}>
          {sending && <ActivityIndicator />}
          <Text>{sending ? 'Enviando…' : 'Enviar reporte'}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
