// Mapa público: un ícono por reporte, grupos de cercanos (solo visual), filtros por categoría y estado,
// y una hoja fija (25% / 85%) con la lista de lo que se ve. Nada depende de gestos: la hoja tiene botón.
import { CATEGORIES, categoryShortLabel, type CategoryCode, type PublicReport } from '@arreglemos/shared';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleCheck,
  CircleDot,
  CloudOff,
  LayoutGrid,
  ListFilter,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Supercluster from 'supercluster';

import { ReportRow, STATUS_LABEL, useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CATEGORY_ICONS } from '@/lib/categories';
import { mapReports, type Area, type MapFilters } from '@/lib/reports';

const LA_CALERA = { latitude: -31.344, longitude: -64.3355 };
const STATUS_OPTIONS = [
  { value: null, label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'resolved', label: 'Resueltos' },
] as const;

const areaOf = (r: Region): Area => ({
  west: r.longitude - r.longitudeDelta / 2,
  south: r.latitude - r.latitudeDelta / 2,
  east: r.longitude + r.longitudeDelta / 2,
  north: r.latitude + r.latitudeDelta / 2,
});
// Zoom web-mercator a partir del ancho visible: a zoom z el mundo mide 256·2^z puntos.
const zoomOf = (lngDelta: number, width: number) => Math.log2((360 * width) / (256 * lngDelta));
const lngDeltaOf = (zoom: number, width: number) => (360 * width) / (256 * 2 ** zoom);

const openReport = (id: number) => router.push(`/reporte/${id}`);

export default function MapScreen() {
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string }>();
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const center = params.lat && params.lng ? { latitude: Number(params.lat), longitude: Number(params.lng) } : LA_CALERA;
  const [region, setRegion] = useState<Region>({ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  const [filters, setFilters] = useState<MapFilters>({ category: null, status: null });
  const [reports, setReports] = useState<PublicReport[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // Android dibuja los marcadores propios como imagen: se redibujan un momento después de cada cambio y se congelan.
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    let stale = false;
    setError(false);
    mapReports(areaOf(region), filters).then(
      (r) => !stale && setReports(r),
      () => !stale && setError(true),
    );
    return () => {
      stale = true;
    };
  }, [region, filters, retry]);

  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 500);
    return () => clearTimeout(t);
  }, [reports, colorScheme]);

  const index = useMemo(() => {
    const sc = new Supercluster<{ id: number; vecinos: number }, { vecinos: number }>({
      radius: 60,
      maxZoom: 17,
      map: (p) => ({ vecinos: p.vecinos }),
      reduce: (acc, p) => {
        acc.vecinos += p.vecinos;
      },
    });
    sc.load(
      (reports ?? []).map((r) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [r.lng, r.lat] },
        properties: { id: r.id, vecinos: r.vecinos_count },
      })),
    );
    return sc;
  }, [reports]);
  const byId = useMemo(() => new Map((reports ?? []).map((r) => [r.id, r])), [reports]);

  const a = areaOf(region);
  const features = index.getClusters([a.west, a.south, a.east, a.north], Math.floor(zoomOf(region.longitudeDelta, width)));

  const zoomInto = (clusterId: number, [lng, lat]: number[]) => {
    const lngDelta = lngDeltaOf(Math.min(index.getClusterExpansionZoom(clusterId), 18), width);
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      longitudeDelta: lngDelta,
      latitudeDelta: lngDelta * (region.latitudeDelta / region.longitudeDelta),
    });
  };

  const toggleSheet = () => sheetRef.current?.snapToIndex(sheetOpen ? 0 : 1);
  const filtered = filters.category !== null || filters.status !== null;
  const count = reports?.length ?? 0;
  const title = error ? 'Sin reportes' : reports === null ? 'Cargando reportes…' : count === 1 ? '1 reporte' : `${count} reportes`;

  return (
    <View className="flex-1 bg-background">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        userInterfaceStyle={colorScheme === 'dark' ? 'dark' : 'light'}
        showsUserLocation
        toolbarEnabled={false}
      >
        {features.map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          if ('cluster' in f.properties && f.properties.cluster) {
            const { cluster_id, point_count, vecinos } = f.properties;
            return (
              <Marker
                key={`c${cluster_id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={tracks}
                onPress={() => zoomInto(cluster_id, f.geometry.coordinates)}
                accessibilityLabel={`Grupo de ${point_count} reportes y ${vecinos} vecinos. Tocá para acercar.`}
              >
                <View className="flex-row items-center gap-2 rounded-full border-2 border-card bg-foreground py-1 pl-1 pr-3.5">
                  <View className="min-h-[30px] min-w-[30px] items-center justify-center rounded-full bg-warning px-1">
                    <Text maxFontSizeMultiplier={1.5} className="text-base font-sans-bold text-warning-foreground">
                      {point_count}
                    </Text>
                  </View>
                  <Text maxFontSizeMultiplier={1.5} className="text-[15px] font-sans-bold text-background">
                    reportes · {vecinos} vecinos
                  </Text>
                </View>
              </Marker>
            );
          }
          const r = byId.get((f.properties as { id: number }).id);
          if (!r) return null;
          return (
            <Marker
              key={`r${r.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              tracksViewChanges={tracks}
              onPress={() => openReport(r.id)}
              accessibilityLabel={`${categoryShortLabel(r.category)}, ${STATUS_LABEL[r.status]}`}
            >
              <ReportPin report={r} highlighted={String(r.id) === params.id} />
            </Marker>
          );
        })}
      </MapView>

      {/* Arriba: Volver, filtro por problema y por estado. */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}>
        <View pointerEvents="box-none" className="gap-2 px-screen">
          <View pointerEvents="box-none" className="flex-row flex-wrap gap-2">
            <Pressable
              role="button"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="min-h-touch flex-row items-center gap-2 rounded-md bg-card px-3 shadow active:opacity-80"
            >
              <ArrowLeft size={22} color={theme.foreground} />
              <Text className="text-sm font-sans-bold">Volver</Text>
            </Pressable>
            <Pressable
              role="button"
              accessibilityHint="Abre la lista de problemas para filtrar el mapa"
              onPress={() => setFilterOpen(true)}
              className="min-h-touch shrink flex-row items-center gap-2 rounded-md bg-card px-3 shadow active:opacity-80"
            >
              <ListFilter size={22} color={theme.foreground} />
              <Text className="shrink text-sm">
                Problema: <Text className="text-sm font-sans-bold">{filters.category ? categoryShortLabel(filters.category) : 'Todos'}</Text>
              </Text>
              <ChevronDown size={20} color={theme.foreground} />
            </Pressable>
          </View>
          <View role="radiogroup" accessibilityLabel="Estado" className="flex-row flex-wrap gap-1 self-start rounded-[14px] bg-card p-1 shadow">
            {STATUS_OPTIONS.map((o) => {
              const selected = filters.status === o.value;
              const Icon = selected ? CircleDot : Circle;
              return (
                <Pressable
                  key={o.label}
                  role="radio"
                  aria-checked={selected}
                  onPress={() => setFilters((f) => ({ ...f, status: o.value }))}
                  className={`min-h-touch grow flex-row items-center justify-center gap-1 rounded-[10px] px-3 ${selected ? 'bg-foreground' : ''}`}
                >
                  <Icon size={18} color={selected ? theme.background : theme.foreground} />
                  <Text className={`text-xs font-sans-bold ${selected ? 'text-background' : 'text-foreground'}`}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={['25%', '85%']}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        onChange={(i) => setSheetOpen(i === 1)}
        backgroundStyle={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: theme.border, width: 40, height: 5 }}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-2 px-screen pb-3">
          <Text variant="h2" className="shrink">
            {title}
          </Text>
          <Pressable
            role="button"
            onPress={toggleSheet}
            className="min-h-touch flex-row items-center gap-1.5 rounded-[12px] bg-muted px-3 active:opacity-80"
          >
            {sheetOpen ? <ChevronDown size={22} color={theme.foreground} /> : <ChevronUp size={22} color={theme.foreground} />}
            <Text className="text-sm font-sans-bold">{sheetOpen ? 'Ver mapa' : 'Ver lista'}</Text>
          </Pressable>
        </View>
        <BottomSheetFlatList
          data={error ? [] : (reports ?? [])}
          keyExtractor={(r: PublicReport) => String(r.id)}
          renderItem={({ item }: { item: PublicReport }) => <ReportRow report={item} onPress={() => openReport(item.id)} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16, gap: 8 }}
          ListEmptyComponent={
            error ? (
              <View className="items-center gap-3 py-4">
                <CloudOff size={40} color={theme.destructive} />
                <Text className="text-center font-sans-semibold">No pudimos cargar los reportes.</Text>
                <Button variant="outline" onPress={() => setRetry((n) => n + 1)}>
                  <Text>Probar de nuevo</Text>
                </Button>
              </View>
            ) : reports === null ? (
              <View className="gap-2">
                <View className="h-[114px] rounded-xl bg-muted" />
                <View className="h-[114px] rounded-xl bg-muted" />
              </View>
            ) : (
              <View className="items-center gap-3 py-4">
                <Text className="text-center font-sans-semibold">
                  {filtered ? 'No hay reportes con este filtro.' : 'No hay reportes en esta zona.'}
                </Text>
                {filtered && (
                  <Button variant="outline" onPress={() => setFilters({ category: null, status: null })}>
                    <Text>Quitar filtros</Text>
                  </Button>
                )}
              </View>
            )
          }
        />
      </BottomSheet>

      <CategoryFilter
        visible={filterOpen}
        value={filters.category}
        onChange={(category) => {
          setFilters((f) => ({ ...f, category }));
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

/** 46 px, color por estado, ícono de la categoría; los resueltos llevan además un tilde. */
function ReportPin({ report, highlighted }: { report: PublicReport; highlighted: boolean }) {
  const theme = useTheme();
  const resolved = report.status === 'resolved';
  const Icon = CATEGORY_ICONS[report.category];
  return (
    <View className="p-1">
      <View
        className={`h-[46px] w-[46px] items-center justify-center rounded-full border-[3px] ${highlighted ? 'border-primary' : 'border-card'} ${resolved ? 'bg-success' : 'bg-warning'}`}
      >
        <Icon size={24} color={resolved ? theme.successForeground : theme.warningForeground} />
      </View>
      {resolved && (
        <View className="absolute right-0 top-0 rounded-full bg-card">
          <CircleCheck size={20} color={theme.successInk} />
        </View>
      )}
    </View>
  );
}

/** Hoja modal "¿Qué problema querés ver?": Todos más las 10 categorías, como opciones con ícono y texto. */
function CategoryFilter({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: CategoryCode | null;
  onChange: (c: CategoryCode | null) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const options = [{ code: null, label: 'Todos', Icon: LayoutGrid }, ...CATEGORIES.map((c) => ({ code: c.code, label: categoryShortLabel(c.code), Icon: CATEGORY_ICONS[c.code] }))];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityLabel="Cerrar" onPress={onClose} className="absolute inset-0 bg-black/40" />
        <View className="max-h-[88%] gap-4 rounded-t-2xl bg-card px-screen pb-10 pt-5">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text variant="h2" className="shrink">
              ¿Qué problema querés ver?
            </Text>
            <Pressable role="button" onPress={onClose} className="min-h-touch flex-row items-center gap-1.5 rounded-[12px] bg-muted px-3">
              <X size={20} color={theme.foreground} />
              <Text className="text-sm font-sans-bold">Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="flex-row flex-wrap gap-2" role="radiogroup">
            {options.map(({ code, label, Icon }) => {
              const selected = value === code;
              return (
                <Pressable
                  key={label}
                  role="radio"
                  aria-checked={selected}
                  onPress={() => onChange(code)}
                  className={`min-h-touch grow basis-[45%] flex-row items-center gap-2 rounded-lg border-2 p-3 ${selected ? 'border-primary bg-primary-soft' : 'border-border bg-card'}`}
                >
                  <Icon size={24} color={selected ? theme.primaryInk : theme.foreground} />
                  <Text className={`shrink grow font-sans-semibold ${selected ? 'text-primary-ink' : ''}`}>{label}</Text>
                  {selected ? <CircleDot size={20} color={theme.primaryInk} /> : <Circle size={20} color={theme.mutedForeground} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
