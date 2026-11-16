// Aviso fijo de ADR-0006: la app no atiende emergencias. "solid" va sobre la cámara, "soft" en el cuerpo.
import { Siren } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function EmergencyNotice({ tone = 'soft' }: { tone?: 'solid' | 'soft' }) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  const solid = tone === 'solid';
  const ink = solid ? 'text-warning-foreground' : 'text-warning-ink';
  return (
    <View role="note" className={cn('flex-row items-center gap-2.5 rounded-md px-3.5 py-3', solid ? 'bg-warning' : 'bg-warning-soft')}>
      <Siren size={24 * Math.min(fontScale, 1.5)} color={solid ? theme.warningForeground : theme.warningInk} />
      <Text className={cn('shrink text-sm font-sans-semibold', ink)}>
        ¿Hay riesgo para personas? <Text className={cn('text-sm font-sans-bold', ink)}>Llamá al 911 o al 103</Text>
      </Text>
    </View>
  );
}
