// Aviso de sin señal (#12): banner warning-soft del diseño, con ícono y texto.
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/components/report';
import { Text } from '@/components/ui/text';
import { isOnline } from '@/lib/unsent';

export const OFFLINE_TEXT = 'Sin señal, lo enviamos apenas vuelva.';

export function useOffline() {
  return !isOnline(useNetInfo());
}

export function OfflineBanner({ text = OFFLINE_TEXT }: { text?: string }) {
  const theme = useTheme();
  return (
    <View role="note" className="flex-row items-start gap-2.5 rounded-md bg-warning-soft px-3.5 py-3">
      <WifiOff size={24} color={theme.warningInk} />
      <Text className="shrink font-sans-semibold text-warning-ink">{text}</Text>
    </View>
  );
}
