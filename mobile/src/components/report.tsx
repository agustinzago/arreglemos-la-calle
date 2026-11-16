// Piezas de reporte que se repiten entre pantallas: insignia de estado y la fila de lista
// (hoja del mapa, Mis reportes). El estado siempre va con ícono y texto, nunca solo con color.
import { categoryShortLabel, STATUS_LABEL, type PublicReport } from '@arreglemos/shared';
import { Image } from 'expo-image';
import { ChevronRight, CircleCheck, Clock, Ellipsis } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS } from '@/lib/categories';
import { photoUrl } from '@/lib/reports';
import { THEME } from '@/lib/theme';

export function useTheme() {
  return THEME[useColorScheme().colorScheme ?? 'light'];
}

export function StatusBadge({ status }: { status: PublicReport['status'] }) {
  const theme = useTheme();
  const resolved = status === 'resolved';
  const Icon = resolved ? CircleCheck : Clock;
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full py-[3px] pl-1.5 pr-2.5 ${resolved ? 'bg-success-soft' : 'bg-warning-soft'}`}>
      <Icon size={18} color={resolved ? theme.successInk : theme.warningInk} />
      <Text className={`text-xs font-sans-bold ${resolved ? 'text-success-ink' : 'text-warning-ink'}`}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const DAY = 24 * 60 * 60 * 1000;

/** "12 vecinos · 23 días" / "· 1 día" / "· hoy" / "· arreglado" */
export function reportMeta(r: Pick<PublicReport, 'vecinos_count' | 'status' | 'created_at'>, now = Date.now()) {
  const vecinos = `${r.vecinos_count} ${r.vecinos_count === 1 ? 'vecino' : 'vecinos'}`;
  if (r.status === 'resolved') return `${vecinos} · arreglado`;
  const days = Math.floor((now - new Date(r.created_at).getTime()) / DAY);
  return `${vecinos} · ${days < 1 ? 'hoy' : days === 1 ? '1 día' : `${days} días`}`;
}

export function ReportRow({ report, onPress, className }: { report: PublicReport; onPress: () => void; className?: string }) {
  const theme = useTheme();
  const Icon = CATEGORY_ICONS[report.category] ?? Ellipsis;
  const title = categoryShortLabel(report.category);
  return (
    <Pressable
      onPress={onPress}
      role="button"
      accessibilityLabel={`${title}, ${STATUS_LABEL[report.status]}, ${report.address ?? 'sin dirección'}, ${reportMeta(report)}`}
      className={`flex-row items-center gap-3 rounded-xl border border-border p-2.5 active:opacity-80 ${className ?? 'bg-background'}`}
    >
      <View className="h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-[12px] bg-muted">
        <Icon size={32} color={theme.mutedForeground} />
        <Image source={photoUrl(report.photo_path)} style={{ position: 'absolute', width: 92, height: 92 }} contentFit="cover" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-sans-bold">{title}</Text>
        <Text variant="muted">{report.address ?? 'Sin dirección'}</Text>
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={report.status} />
          <Text className="text-xs font-sans-semibold text-muted-foreground">{reportMeta(report)}</Text>
        </View>
      </View>
      <ChevronRight size={24} color={theme.mutedForeground} />
    </Pressable>
  );
}
