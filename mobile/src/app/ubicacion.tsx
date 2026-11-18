// 03 Ubicación (paso 1 de 4): la miniatura de la foto y un mapa con el pin. El pin arranca en el GPS
// (foto de la cámara) o en el EXIF (foto de la galería); si no hay ubicación arranca sin pin.
// Se mueve tocando el mapa o arrastrándolo, y debajo se ve la dirección leída del pin.
import { formatAddress } from '@arreglemos/shared';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { MapPin, MapPinOff, Minus, Plus, Pointer, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { type LatLng, Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { reverseGeocode, whereAmI } from '@/lib/location';
import { startSuggestion } from '@/lib/suggestion';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

const LA_CALERA = { latitude: -31.344, longitude: -64.3355 };
const CLOSE = 0.004; // ~4 cuadras de alto
const GPS_TIMEOUT_MS = 15_000;

type Gps = 'loading' | 'ok' | 'error' | 'denied' | 'none';

export default function LocationScreen() {
  const params = useLocalSearchParams<{ photoUri: string; source: 'camera' | 'gallery'; lat?: string; lng?: string }>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const { fontScale } = useWindowDimensions();
  const icon = 24 * Math.min(fontScale, 1.5);
  // Con la letra grande el aviso crece y tapaba el pin (el mapa lo centra): va arriba del mapa, no encima.
  const hintAbove = fontScale >= 1.3;
  const map = useRef<MapView>(null);

  const fromExif = params.lat && params.lng ? { latitude: Number(params.lat), longitude: Number(params.lng) } : null;
  const [pin, setPin] = useState<LatLng | null>(fromExif);
  const [gps, setGps] = useState<Gps>(params.source === 'camera' ? 'loading' : fromExif ? 'ok' : 'none');
  // undefined = buscando, null = no se pudo leer.
  const [address, setAddress] = useState<string | null | undefined>(undefined);
  const region = useRef<Region>({ ...(fromExif ?? LA_CALERA), latitudeDelta: fromExif ? CLOSE : 0.03, longitudeDelta: fromExif ? CLOSE : 0.03 });
  const moved = useRef(false);
  const pinRef = useRef(pin); // el pin para onMapReady, que no ve el estado nuevo
  pinRef.current = pin;

  // Si el GPS llega antes de que el mapa termine de cargar, iOS ignora el movimiento: onMapReady lo repite.
  function center(to: LatLng) {
    map.current?.animateToRegion({ ...to, latitudeDelta: CLOSE, longitudeDelta: CLOSE });
  }

  function movePin(to: LatLng) {
    moved.current = true;
    setPin(to);
  }

  async function locate() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return setGps('denied');
    setGps('loading');
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), GPS_TIMEOUT_MS)),
      ]);
      const here = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      // Si el vecino ya tocó el mapa mientras esperábamos, no le movemos el pin.
      if (!moved.current) {
        setPin(here);
        center(here);
      }
      setGps('ok');
    } catch {
      setGps('error');
    }
  }

  useEffect(() => {
    if (params.source === 'camera') locate();
  }, []);

  // La sugerencia (#11) corre mientras el vecino pone el pin. Arranca cuando termina de entrar la pantalla:
  // si la pregunta por la IA sale mientras se cierra la galería o anima el cambio de pantalla, iOS no la muestra.
  const navigation = useNavigation();
  useEffect(() => {
    let started = false;
    // 'transitionEnd' es del stack nativo; el tipo genérico de useNavigation no lo conoce.
    return navigation.addListener('transitionEnd' as never, (e: { data?: { closing?: boolean } }) => {
      if (started || e.data?.closing) return;
      started = true;
      startSuggestion(params.photoUri);
    });
  }, [navigation]);

  // Si negó la ubicación y vuelve de Ajustes, probamos de nuevo.
  useEffect(() => {
    if (gps !== 'denied') return;
    const sub = AppState.addEventListener('change', (state) => state === 'active' && locate());
    return () => sub.remove();
  }, [gps]);

  // Dirección del pin. Espera un momento por si el vecino sigue moviéndolo (el geocoder limita pedidos).
  useEffect(() => {
    if (!pin) return;
    let stale = false;
    setAddress(undefined);
    const timer = setTimeout(() => {
      reverseGeocode(pin).then(
        (results) => !stale && setAddress(formatAddress(results[0])),
        () => !stale && setAddress(null),
      );
    }, 400);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [pin]);

  function zoom(factor: number) {
    const r = region.current;
    map.current?.animateToRegion({ ...r, latitudeDelta: r.latitudeDelta * factor, longitudeDelta: r.longitudeDelta * factor }, 200);
  }

  function confirm() {
    if (!pin) return;
    router.push({
      pathname: '/categoria',
      params: { photoUri: params.photoUri, lat: pin.latitude, lng: pin.longitude, address: address ?? '' },
    });
  }

  const addressText = !pin
    ? gps === 'loading'
      ? 'Buscando dónde estás…'
      : 'Sin dirección todavía'
    : address === undefined
      ? 'Buscando la dirección…'
      : (address ?? 'No encontramos la dirección, pero el pin está puesto');

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Paso 1 de 4' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="flex-grow gap-3 px-screen pt-4">
        <Text variant="h1">¿Dónde está el problema?</Text>

        {gps === 'error' && (
          <Banner tone="destructive" icon={<MapPinOff color={theme.destructiveInk} size={icon} />}>
            No encontramos tu ubicación. Tocá el mapa donde está el problema.
          </Banner>
        )}
        {gps === 'denied' && (
          <Banner tone="warning" icon={<MapPinOff color={theme.warningInk} size={icon} />}>
            No tenemos permiso para ver tu ubicación. Tocá el mapa donde está el problema, o activala en Ajustes.
          </Banner>
        )}
        {gps === 'denied' && (
          <Button variant="outline" onPress={() => Linking.openSettings()}>
            <Settings color={theme.primaryInk} size={icon} />
            <Text>Abrir Ajustes</Text>
          </Button>
        )}
        {gps === 'none' && (
          <Banner tone="warning" icon={<MapPinOff color={theme.warningInk} size={icon} />}>
            Esta foto no tiene la ubicación guardada. Tocá el mapa donde está el problema.
          </Banner>
        )}

        {hintAbove && <Hint icon={icon} />}

        <View className="min-h-[260px] flex-1 overflow-hidden rounded-2xl border border-border">
          <MapView
            ref={map}
            style={{ flex: 1 }}
            initialRegion={region.current}
            // Foto de galería sin ubicación: sin pin, pero el mapa arranca cerca del vecino y no en La Calera.
            onMapReady={() =>
              pinRef.current ? center(pinRef.current) : whereAmI().then((here) => here && !pinRef.current && center(here))
            }
            onRegionChangeComplete={(r) => (region.current = r)}
            onPress={(e) => e.nativeEvent.action !== 'marker-press' && movePin(e.nativeEvent.coordinate)}
            showsUserLocation={params.source === 'camera' && gps === 'ok'}
          >
            {pin && (
              <Marker
                coordinate={pin}
                draggable
                onDragEnd={(e) => movePin(e.nativeEvent.coordinate)}
                pinColor={theme.primary}
                title="El problema"
              />
            )}
          </MapView>

          {gps === 'loading' && (
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center gap-2.5 bg-background opacity-90">
              <ActivityIndicator size="large" color={theme.primary} />
              <Text className="font-sans-semibold text-muted-foreground">Buscando dónde estás…</Text>
            </View>
          )}

          <View pointerEvents="none" className="absolute left-2.5 right-2.5 top-2.5 flex-row items-start gap-2">
            <Image
              source={{ uri: params.photoUri }}
              accessibilityLabel="Tu foto"
              className="h-[76px] w-[76px] rounded-md border-[3px] border-card"
            />
            {!hintAbove && <Hint icon={icon} className="flex-1" />}
          </View>

          <View className="absolute bottom-2.5 right-2.5 gap-2">
            <ZoomButton label="Acercar" onPress={() => zoom(0.5)}>
              <Plus color={theme.foreground} size={icon} />
            </ZoomButton>
            <ZoomButton label="Alejar" onPress={() => zoom(2)}>
              <Minus color={theme.foreground} size={icon} />
            </ZoomButton>
          </View>
        </View>

        <View className="flex-row items-start gap-3 pb-3" accessibilityLiveRegion="polite">
          <MapPin color={theme.primaryInk} size={icon * 1.25} />
          <Text className={pin && address ? 'flex-1 text-lg font-sans-bold' : 'flex-1 text-muted-foreground'}>{addressText}</Text>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-background px-screen py-3">
        <Button onPress={confirm} disabled={!pin || address === undefined}>
          <Text>Confirmar ubicación</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function Banner({ tone, icon, children }: { tone: 'warning' | 'destructive'; icon: React.ReactNode; children: string }) {
  const box = tone === 'warning' ? 'bg-warning-soft' : 'bg-destructive-soft';
  const ink = tone === 'warning' ? 'text-warning-ink' : 'text-destructive-ink';
  return (
    <View role="note" className={`flex-row items-start gap-2.5 rounded-md px-3.5 py-3 ${box}`}>
      {icon}
      <Text className={`flex-1 text-sm font-sans-semibold ${ink}`}>{children}</Text>
    </View>
  );
}

function Hint({ icon, className }: { icon: number; className?: string }) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  return (
    <View className={cn('flex-row items-center gap-2 rounded-md bg-card px-3 py-2', className)}>
      <Pointer color={theme.primaryInk} size={icon} />
      <Text className="flex-1 text-sm font-sans-semibold">Tocá el mapa o arrastrá el pin</Text>
    </View>
  );
}

function ZoomButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      accessibilityLabel={label}
      className="h-touch w-touch items-center justify-center rounded-md border border-border bg-card active:bg-accent"
    >
      {children}
    </Pressable>
  );
}
