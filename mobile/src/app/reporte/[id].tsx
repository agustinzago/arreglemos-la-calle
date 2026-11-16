// Detalle del reporte: foto, datos, historia, "Me sumo", "Enviar a la Muni" y "Compartir".
// "Ya está arreglado", "Sigue roto" y "Denunciar" son #8; el ícono de la categoría llega con #4.
import {
  categoryLabel,
  muniMessage,
  reportUrl,
  whatsappLink,
  type PublicMunicipality,
  type PublicReport,
  type PublicReportEvent,
} from '@arreglemos/shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Clock,
  CloudOff,
  MapPin,
  MessageCircle,
  Share2,
  Siren,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getMunicipality, getReport, joinReport, listEvents, photoUrl, WEB_URL } from '@/lib/reports';
import { THEME } from '@/lib/theme';

const DAY = 86_400_000;

type Data = { report: PublicReport; events: PublicReportEvent[]; municipality: PublicMunicipality | null };

export default function ReportScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const icon = Math.min(useWindowDimensions().fontScale, 1.5) * 24;
  const [data, setData] = useState<Data | null | undefined>(); // undefined = cargando, null = no disponible
  const [failed, setFailed] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const report = await getReport(id);
      if (!report) return setData(null);
      const [events, municipality] = await Promise.all([
        listEvents(id),
        report.municipality_id ? getMunicipality(report.municipality_id) : null,
      ]);
      setData({ report, events, municipality });
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (failed || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-screen">
        <BackButton />
        {failed ? (
          <>
            <CloudOff color={theme.destructiveInk} size={56} />
            <Text variant="h2" className="text-center">
              No pudimos abrir este reporte
            </Text>
            <Text className="text-center text-muted-foreground">Revisá tu conexión y probá de nuevo.</Text>
            <Button onPress={load}>
              <Text>Probar de nuevo</Text>
            </Button>
          </>
        ) : data === null ? (
          <Text variant="h2" className="text-center">
            Este reporte no está disponible
          </Text>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className="font-sans-semibold text-muted-foreground">Cargando el reporte…</Text>
          </>
        )}
      </View>
    );
  }

  const { report, events, municipality } = data;
  const resolved = report.status === 'resolved';
  const days = Math.floor(
    ((resolved && report.resolved_at ? Date.parse(report.resolved_at) : Date.now()) - Date.parse(report.created_at)) /
      DAY,
  );
  const isMine = events[0]?.mine ?? false; // el primer evento es el sumate del creador
  const joined = events.some((e) => e.type === 'sumate' && e.mine);
  const url = reportUrl(WEB_URL, report.id);
  const title = categoryLabel(report.category);

  async function join() {
    setJoining(true);
    try {
      await joinReport(report.id);
    } catch (e) {
      // duplicate_event: ya estaba sumado (desde otro lado); recargar alcanza.
      if (!(e && typeof e === 'object' && 'message' in e && e.message === 'duplicate_event')) {
        Alert.alert('No pudimos sumarte', 'Revisá tu conexión y probá de nuevo.');
      }
    }
    await load();
    setJoining(false);
  }

  function sendToMuni() {
    Linking.openURL(whatsappLink(municipality!.whatsapp!, muniMessage(report, municipality!.name, url))).catch(() =>
      Alert.alert('No pudimos abrir WhatsApp', '¿Está instalado en este teléfono?'),
    );
  }

  function share() {
    // Android ignora `url`: el link va dentro del mensaje.
    Share.share({ message: `${title}${report.address ? ` en ${report.address}` : ''}: ${url}` });
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="pb-6">
        <View>
          <Image
            source={photoUrl(report.photo_path)}
            style={{ height: 310 }}
            contentFit="cover"
            accessibilityLabel={`Foto: ${title}`}
          />
          <View
            className={`absolute bottom-3 left-3 flex-row items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3.5 ${resolved ? 'bg-success-soft' : 'bg-warning-soft'}`}
          >
            {resolved ? (
              <CircleCheck color={theme.successInk} size={icon} />
            ) : (
              <Clock color={theme.warningInk} size={icon} />
            )}
            <Text className={`font-sans-bold text-sm ${resolved ? 'text-success-ink' : 'text-warning-ink'}`}>
              {resolved ? 'Resuelto' : 'Abierto'}
            </Text>
          </View>
          <BackButton />
        </View>

        <View className="gap-4 px-screen pt-4">
          <View className="gap-1.5">
            <Text variant="h1">{title}</Text>
            <View className="flex-row items-start gap-1.5">
              <MapPin color={theme.mutedForeground} size={icon * 0.8} />
              <Text className="flex-1 text-muted-foreground">
                {report.address ? `${report.address} · ` : ''}Reporte {report.id}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <Stat
              value={!resolved && days === 0 ? 'Hoy' : String(days)}
              label={
                resolved
                  ? 'días hasta el arreglo'
                  : days === 0
                    ? 'lo reportaron'
                    : days === 1
                      ? 'día abierto'
                      : 'días abierto'
              }
            />
            <Stat
              value={String(report.vecinos_count)}
              label={report.vecinos_count === 1 ? 'vecino sumado' : 'vecinos sumados'}
            />
          </View>

          {report.description && <Text>{report.description}</Text>}

          {municipality?.whatsapp ? (
            <Button variant="success" onPress={sendToMuni}>
              <MessageCircle color={theme.successForeground} size={icon} />
              <Text>Enviar a la Muni por WhatsApp</Text>
            </Button>
          ) : (
            <View role="note" className="rounded-md bg-muted px-3.5 py-3">
              <Text>
                {municipality
                  ? `Todavía no tenemos el WhatsApp de ${municipality.name} para mandárselo.`
                  : 'Este lugar no está dentro de un municipio que tengamos cargado, así que no hay a quién mandárselo.'}
              </Text>
            </View>
          )}
          <Button variant="outline" onPress={share}>
            <Share2 color={theme.primaryInk} size={icon} />
            <Text>Compartir</Text>
          </Button>

          <Text variant="h2" className="pt-2">
            Qué pasó hasta ahora
          </Text>
          <Timeline events={events} />

          <View role="note" className="flex-row items-center gap-2.5 rounded-md bg-warning-soft px-3.5 py-3">
            <Siren color={theme.warningInk} size={icon} />
            <Text className="flex-1 text-sm text-warning-ink">
              ¿Hay riesgo para personas?{' '}
              <Text className="font-sans-bold text-sm text-warning-ink">Llamá al 911 o al 103</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background px-screen pt-3">
        {isMine || joined ? (
          <View className="min-h-button flex-row items-center justify-center gap-2.5 rounded-lg bg-success-soft px-5 py-3.5">
            <Check color={theme.successInk} size={icon} />
            <Text className="font-sans-bold text-lg text-success-ink">
              {isMine ? 'Es tu reporte' : 'Ya te sumaste'}
            </Text>
          </View>
        ) : (
          <Button onPress={join} disabled={joining}>
            {joining ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <UserPlus color={theme.primaryForeground} size={icon} />
            )}
            <Text>Me sumo</Text>
          </Button>
        )}
      </SafeAreaView>
    </View>
  );
}

function BackButton() {
  const top = useSafeAreaInsets().top;
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  return (
    <Pressable
      role="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={{ top: top + 8 }}
      className="absolute left-3 min-h-touch flex-row items-center gap-1.5 rounded-md bg-card px-3 shadow"
    >
      <ArrowLeft color={theme.foreground} size={22} />
      <Text className="font-sans-bold text-sm">Volver</Text>
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="min-w-[140px] flex-1 rounded-lg border border-border bg-card px-3.5 py-3">
      <Text className="font-display text-3xl" maxFontSizeMultiplier={1.5}>
        {value}
      </Text>
      <Text className="font-sans-semibold text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}

const LABELS: Record<PublicReportEvent['type'], [mine: string, other: string]> = {
  sumate: ['Te sumaste vos', 'Se sumó un vecino'],
  resuelto: ['Avisaste que está arreglado', 'Un vecino avisó que está arreglado'],
  sigue_roto: ['Avisaste que sigue roto', 'Un vecino avisó que sigue roto'],
  denuncia: ['', ''], // nunca llega: la vista pública no muestra denuncias
};

/** Arma la historia, más nueva primero. Los sumate seguidos de otros vecinos van juntos. */
function timeline(events: PublicReportEvent[]) {
  type Item = { key: number; kind: 'creado' | PublicReportEvent['type']; text: string; at: string; others: number };
  const items: Item[] = [];
  events.forEach((e, i) => {
    const last = items[items.length - 1];
    if (i === 0)
      items.push({
        key: e.id,
        kind: 'creado',
        text: e.mine ? 'Lo reportaste vos' : 'Un vecino lo reportó',
        at: e.created_at,
        others: 0,
      });
    else if (e.type === 'sumate' && !e.mine && last.others > 0) {
      last.others += 1;
      last.text = `Se sumaron ${last.others} vecinos`;
      last.at = e.created_at;
    } else {
      const others = e.type === 'sumate' && !e.mine ? 1 : 0;
      items.push({ key: e.id, kind: e.type, text: LABELS[e.type][e.mine ? 0 : 1], at: e.created_at, others });
    }
  });
  return items.reverse();
}

const ICONS = { creado: MapPin, sumate: Users, resuelto: CircleCheck, sigue_roto: TriangleAlert, denuncia: Users };

function when(iso: string) {
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function Timeline({ events }: { events: PublicReportEvent[] }) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const items = timeline(events);
  return (
    <View>
      {items.map((item, i) => {
        const Icon = ICONS[item.kind];
        const fixed = item.kind === 'resuelto';
        return (
          <View key={item.key} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={`size-10 items-center justify-center rounded-full ${fixed ? 'bg-success-soft' : 'bg-muted'}`}
              >
                <Icon color={fixed ? theme.successInk : theme.foreground} size={22} />
              </View>
              {i < items.length - 1 && <View className="w-0.5 flex-1 bg-border" />}
            </View>
            <View className="flex-1 pb-4 pt-1.5">
              <Text className="font-sans-semibold">{item.text}</Text>
              <Text variant="muted">{when(item.at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
