// Paso "¿Qué problema es?": chips grandes con ícono y texto. "Otro" pide un texto obligatorio, que
// pasa a ser la descripción del reporte (la base también lo exige). La sugerencia de IA es #11.
import { CATEGORIES, type CategoryCode } from '@arreglemos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS } from '@/lib/categories';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function CategoryScreen() {
  // Lo que traen los pasos anteriores (foto, punto, dirección…) sigue de largo hasta la revisión.
  const params = useLocalSearchParams<{ photoUri: string; lat: string; lng: string; address?: string }>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  const [category, setCategory] = useState<CategoryCode>();
  const [other, setOther] = useState('');
  const [missingOther, setMissingOther] = useState(false);
  const iconSize = 28 * Math.min(fontScale, 1.5);

  function next() {
    if (!category) return;
    if (category === 'otro' && !other.trim()) return setMissingOther(true);
    router.push({
      pathname: '/cercanos',
      params: { ...params, category, other: category === 'otro' ? other.trim() : '' },
    });
  }

  return (
    <FormScreen
      footer={
        <Button onPress={next} disabled={!category}>
          <Text>Continuar</Text>
          <ArrowRight color={theme.primaryForeground} size={24} />
        </Button>
      }
    >
      <View role="radiogroup" className="flex-row flex-wrap gap-2.5">
        {CATEGORIES.map((c) => {
          const selected = category === c.code;
          const Icon = CATEGORY_ICONS[c.code];
          return (
            <Pressable
              key={c.code}
              role="radio"
              aria-checked={selected}
              onPress={() => {
                setCategory(c.code);
                setMissingOther(false);
              }}
              className={cn(
                'min-h-[92px] gap-2 rounded-lg border-2 p-3',
                // Dos columnas; con la letra grande, una sola.
                fontScale >= 1.5 ? 'basis-full' : 'grow basis-[40%]',
                selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
              )}
            >
              <View className="flex-row flex-wrap items-start justify-between gap-1">
                <Icon color={selected ? theme.primaryInk : theme.foreground} size={iconSize} />
                {selected && (
                  <View className="flex-row items-center gap-1">
                    <CircleCheck color={theme.primaryInk} size={18 * Math.min(fontScale, 1.5)} />
                    <Text className="text-xs font-sans-bold text-primary-ink">Elegido</Text>
                  </View>
                )}
              </View>
              <Text className={cn('font-sans-semibold', selected && 'text-primary-ink')}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {category === 'otro' && (
        <View className="gap-2">
          <Text nativeID="otro-label" className="font-sans-bold">
            Contanos qué problema es <Text className="text-muted-foreground">(obligatorio)</Text>
          </Text>
          <Input
            aria-labelledby="otro-label"
            invalid={missingOther}
            value={other}
            onChangeText={(text) => {
              setOther(text);
              if (text.trim()) setMissingOther(false);
            }}
            placeholder="Por ejemplo: cartel caído"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={next}
          />
          {missingOther && (
            <View role="alert" className="flex-row items-center gap-2">
              <CircleAlert color={theme.destructiveInk} size={24} />
              <Text className="shrink text-sm font-sans-semibold text-destructive-ink">
                Escribí qué problema es para poder seguir.
              </Text>
            </View>
          )}
        </View>
      )}
    </FormScreen>
  );
}
