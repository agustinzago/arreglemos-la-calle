// Detalle del reporte: foto, datos, historia, "Me sumo", "Enviar a la Muni" y "Compartir".
// Estados (#8): "Ya está arreglado" (con foto opcional), "Sigue roto" (si está resuelto) y "Denunciar".
// "Bloquear a quien lo publicó" (guía 1.2 de Apple): deja de ver sus reportes y vuelve atrás.
import {
  municipalityMessage,
  reportTitle,
  reportUrl,
  whatsappLink,
  type PublicMunicipality,
  type PublicReport,
  type PublicReportEvent,
} from '@arreglemos/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Check,
  CircleCheck,
  CloudOff,
  Flag,
  ImagePlus,
  MapPin,
  MessageCircle,
  Share2,
  Siren,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { categoryIcon } from '@/lib/categories';
import { SHEET_ENTERING } from '@/lib/motion';
import { blockReportAuthor, getMunicipality, getReport, joinReport, listEvents, photoUrl, registerEvent, WEB_URL } from '@/lib/reports';
import { THEME } from '@/lib/theme';

const DAY = 86_400_000;
// El estado cambió desde otro lado (otro vecino, el operador): recargar alcanza.
const STALE = ['duplicate_event', 'not_open', 'not_resolved'];
const errorMessage = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String(e.message) : '');

type Data = { report: PublicReport; events: PublicReportEvent[]; municipality: PublicMunicipality | null };

export default function ReportScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const icon = Math.min(useWindowDimensions().fontScale, 1.5) * 24;
  const [data, setData] = useState<Data | null | undefined>(); // undefined = cargando, null = no disponible
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [denounced, setDenounced] = useState(false);

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
  // max(0): si el reloj del teléfono va atrasado, un reporte recién creado parece del futuro ("-1 días").
  const days = Math.max(
    0,
    Math.floor(
      ((resolved && report.resolved_at ? Date.parse(report.resolved_at) : Date.now()) - Date.parse(report.created_at)) /
        DAY,
    ),
  );
  const isMine = events[0]?.mine ?? false; // el primer evento es el sumate del creador
  const joined = events.some((e) => e.type === 'sumate' && e.mine);
  // Marcó arreglado en esta vuelta (desde el último "sigue roto"): falta que otro vecino lo confirme.
  const reopenedAt = events.map((e) => e.type).lastIndexOf('sigue_roto');
  const markedFixed = !resolved && events.slice(reopenedAt + 1).some((e) => e.type === 'resuelto' && e.mine);
  const url = reportUrl(WEB_URL, report.id);
  const title = reportTitle(report);
  const CategoryIcon = categoryIcon(report.category);

  async function act(run: () => Promise<unknown>, failTitle: string) {
    setBusy(true);
    try {
      await run();
    } catch (e) {
      if (!STALE.includes(errorMessage(e))) Alert.alert(failTitle, 'Revisá tu conexión y probá de nuevo.');
    }
    await load();
    setBusy(false);
  }

  async function markFixed(photoUri?: string) {
    await act(() => registerEvent(report.id, 'resuelto', photoUri), 'No pudimos guardar tu aviso');
    setFixing(false);
  }

  function denounce() {
    Alert.alert('¿Denunciar este reporte?', 'Hacelo si es falso, ofensivo o no es un problema de la calle.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Denunciar',
        style: 'destructive',
        onPress: async () => {
          try {
            await registerEvent(report.id, 'denuncia');
            setDenounced(true);
          } catch (e) {
            if (errorMessage(e) === 'duplicate_event') setDenounced(true);
            else Alert.alert('No pudimos enviar la denuncia', 'Revisá tu conexión y probá de nuevo.');
          }
        },
      },
    ]);
  }

  function block() {
    Alert.alert(
      '¿Bloquear a quien lo publicó?',
      'No vas a ver más sus reportes ni lo que haga en otros. No se entera de que lo bloqueaste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () =>
            blockReportAuthor(report.id).then(
              () => (router.canGoBack() ? router.back() : router.replace('/')),
              () => Alert.alert('No pudimos bloquear', 'Revisá tu conexión y probá de nuevo.'),
            ),
        },
      ],
    );
  }

  function sendToMuni() {
    Linking.openURL(whatsappLink(municipality!.whatsapp!, municipalityMessage(report, municipality!.name, url))).catch(() =>
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
        {/* El ícono queda detrás de la foto: se ve mientras carga o si no carga. */}
        <View className="h-[310px] items-center justify-center bg-muted">
          <CategoryIcon color={theme.mutedForeground} size={56} />
          <Image
            source={photoUrl(report.photo_path)}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={`Foto: ${title}`}
          />
          <View className="absolute bottom-3 left-3">
            <StatusBadge status={report.status} />
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
              value={days === 0 ? (resolved ? '<1' : 'Hoy') : days.toLocaleString('es-AR')}
              label={
                resolved
                  ? days <= 1
                    ? 'día hasta el arreglo'
                    : 'días hasta el arreglo'
                  : days === 0
                    ? 'lo reportaron'
                    : days === 1
                      ? 'día abierto'
                      : 'días abierto'
              }
            />
            <Stat
              value={report.vecinos_count.toLocaleString('es-AR')}
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

          {!resolved &&
            (markedFixed ? (
              <View role="note" className="flex-row items-center gap-2.5 rounded-md bg-success-soft px-3.5 py-3">
                <CircleCheck color={theme.successInk} size={icon} />
                <Text className="flex-1 text-success-ink">
                  Gracias. Falta que otro vecino confirme que está arreglado.
                </Text>
              </View>
            ) : (
              <Button variant="outline" onPress={() => setFixing(true)} disabled={busy}>
                <CircleCheck color={theme.primaryInk} size={icon} />
                <Text>Ya está arreglado</Text>
              </Button>
            ))}

          <View role="note" className="flex-row items-center gap-2.5 rounded-md bg-warning-soft px-3.5 py-3">
            <Siren color={theme.warningInk} size={icon} />
            <Text className="flex-1 text-sm text-warning-ink">
              ¿Hay riesgo para personas?{' '}
              <Text className="font-sans-bold text-sm text-warning-ink">Llamá al 911 o al 103</Text>
            </Text>
          </View>

          {denounced ? (
            <Text role="alert" className="py-3 text-center font-sans-semibold text-muted-foreground">
              Gracias. Vamos a revisar este reporte.
            </Text>
          ) : (
            <Pressable
              role="button"
              onPress={denounce}
              className="min-h-touch flex-row items-center justify-center gap-2 self-center px-3"
            >
              <Flag color={theme.mutedForeground} size={icon * 0.8} />
              <Text className="shrink text-center font-sans-semibold text-muted-foreground underline">Denunciar este reporte</Text>
            </Pressable>
          )}
          {!isMine && (
            <Pressable
              role="button"
              onPress={block}
              className="min-h-touch flex-row items-center justify-center gap-2 self-center px-3"
            >
              <Ban color={theme.mutedForeground} size={icon * 0.8} />
              <Text className="shrink text-center font-sans-semibold text-muted-foreground underline">
                Bloquear a quien lo publicó
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background px-screen pt-3">
        {resolved ? (
          <Button
            onPress={() => act(() => registerEvent(report.id, 'sigue_roto'), 'No pudimos guardar tu aviso')}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <TriangleAlert color={theme.primaryForeground} size={icon} />
            )}
            <Text>Sigue roto</Text>
          </Button>
        ) : isMine || joined ? (
          <View className="min-h-button flex-row items-center justify-center gap-2.5 rounded-lg bg-success-soft px-5 py-3.5">
            <Check color={theme.successInk} size={icon} />
            <Text className="shrink text-center font-sans-bold text-lg text-success-ink">
              {isMine ? 'Es tu reporte' : 'Ya te sumaste'}
            </Text>
          </View>
        ) : (
          <Button onPress={() => act(() => joinReport(report.id), 'No pudimos sumarte')} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <UserPlus color={theme.primaryForeground} size={icon} />
            )}
            <Text>Me sumo</Text>
          </Button>
        )}
      </SafeAreaView>

      <FixSheet visible={fixing} busy={busy} onClose={() => setFixing(false)} onConfirm={markFixed} />
    </View>
  );
}

/** "¿Ya lo arreglaron?": confirma el arreglado, con una foto opcional de cómo quedó. */
function FixSheet({
  visible,
  busy,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (photoUri?: string) => void;
}) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const [photo, setPhoto] = useState<string>();

  async function addPhoto() {
    // Está frente al arreglo: cámara. Sin permiso de cámara, la galería.
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const result = camera.granted
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable accessibilityLabel="Cancelar" onPress={onClose} scaleOnPress={false} className="absolute inset-0 bg-black/40" />
        {/* El fondo aparece con el fade del Modal; solo la hoja sube desde abajo. */}
        <Animated.View entering={SHEET_ENTERING} pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View className="max-h-[90%] rounded-t-2xl bg-card">
            <ScrollView contentContainerClassName="gap-4 px-screen pb-10 pt-5">
              <Text variant="h2">¿Ya lo arreglaron?</Text>
              <Text>Si querés, sumá una foto de cómo quedó. Es opcional.</Text>
              {photo ? (
                <View className="flex-row flex-wrap items-center gap-3 rounded-lg bg-success-soft p-2.5">
                  <Image source={photo} style={{ width: 64, height: 64, borderRadius: 8 }} accessibilityLabel="Tu foto" />
                  <Text className="flex-1 font-sans-bold text-success-ink">Foto agregada</Text>
                  <Button variant="ghost" size="sm" onPress={() => setPhoto(undefined)}>
                    <X color={theme.foreground} size={20} />
                    <Text>Quitar</Text>
                  </Button>
                </View>
              ) : (
                <Pressable
                  role="button"
                  onPress={addPhoto}
                  className="min-h-button flex-row items-center justify-center gap-2.5 rounded-lg border-2 border-dashed border-border px-5 py-3.5 active:bg-muted"
                >
                  <ImagePlus color={theme.foreground} size={24} />
                  <Text className="font-sans-bold text-lg">Agregar foto</Text>
                </Pressable>
              )}
              <Button variant="success" onPress={() => onConfirm(photo)} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={theme.successForeground} />
                ) : (
                  <CircleCheck color={theme.successForeground} size={24} />
                )}
                <Text>Sí, está arreglado</Text>
              </Button>
              <Pressable role="button" onPress={onClose} className="min-h-touch items-center justify-center">
                <Text className="font-sans-semibold underline">Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
      {/* Una línea siempre: con letra grande, "1.284" partido en dos se lee como otro número. */}
      <Text className="font-display text-3xl" maxFontSizeMultiplier={1.5} numberOfLines={1} adjustsFontSizeToFit>
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
  type Item = {
    key: number;
    kind: 'creado' | PublicReportEvent['type'];
    text: string;
    at: string;
    others: number;
    photo?: string | null;
  };
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
      last.text = `Se sumaron ${last.others.toLocaleString('es-AR')} vecinos`;
      last.at = e.created_at;
    } else {
      const others = e.type === 'sumate' && !e.mine ? 1 : 0;
      items.push({
        key: e.id,
        kind: e.type,
        text: LABELS[e.type][e.mine ? 0 : 1],
        at: e.created_at,
        others,
        photo: e.photo_path,
      });
    }
  });
  return items.reverse();
}

const ICONS = { creado: MapPin, sumate: Users, resuelto: CircleCheck, sigue_roto: TriangleAlert, denuncia: Users };

function when(iso: string) {
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  // Sin el año, algo de hace 3 años parece de esta semana.
  const year = new Date(iso).getFullYear() === new Date().getFullYear() ? undefined : 'numeric';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year });
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
              {item.photo ? (
                <View className="mt-2 h-[120px] w-[160px] overflow-hidden rounded-[12px] bg-muted">
                  <Image
                    source={photoUrl(item.photo)}
                    style={{ width: 160, height: 120 }}
                    contentFit="cover"
                    accessibilityLabel="Foto de cómo quedó"
                  />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
