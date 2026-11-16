// Cámara: la app abre acá. Antes, si faltan permisos, la pantalla de permisos.
// La foto (de la cámara o de la galería) sigue a /ubicacion, que toma el GPS o el EXIF.
import { gpsFromExif } from '@arreglemos/shared';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Camera, Images, List, Map } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { PermissionsScreen } from '@/components/permissions-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

async function pickFromGallery() {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], exif: true, quality: 1 });
  if (result.canceled) return;
  const asset = result.assets[0];
  // Sin GPS en la foto, /ubicacion arranca sin pin y el vecino lo tiene que poner.
  const gps = gpsFromExif(asset.exif);
  router.push({ pathname: '/ubicacion', params: { photoUri: asset.uri, source: 'gallery', ...gps } });
}

export default function CameraScreen() {
  const camera = useRef<CameraView>(null);
  const [cameraPermission, requestCamera, getCamera] = useCameraPermissions();
  const [locationPermission, requestLocation, getLocation] = Location.useForegroundPermissions();
  const [busy, setBusy] = useState(false);
  const onPrimary = THEME[useColorScheme().colorScheme ?? 'light'].primaryForeground;

  // Al volver de Ajustes, releer los permisos.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        getCamera();
        getLocation();
      }
    });
    return () => sub.remove();
  }, [getCamera, getLocation]);

  if (!cameraPermission || !locationPermission) return <View className="flex-1 bg-[#0b0d12]" />;

  if (!cameraPermission.granted || locationPermission.status === 'undetermined') {
    return (
      <PermissionsScreen
        camera={cameraPermission.status}
        location={locationPermission.status}
        onStart={async () => {
          await requestCamera();
          await requestLocation();
        }}
        onGallery={pickFromGallery}
      />
    );
  }

  async function shoot() {
    setBusy(true);
    try {
      const photo = await camera.current!.takePictureAsync({ quality: 0.8, exif: false });
      router.push({ pathname: '/ubicacion', params: { photoUri: photo.uri, source: 'camera' } });
    } catch (e) {
      Alert.alert('No pudimos sacar la foto', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b0d12]">
      <View className="px-screen pb-2">
        <EmergencyNotice tone="solid" />
      </View>
      <CameraView ref={camera} facing="back" style={{ flex: 1 }} />
      <View className="gap-3 px-screen py-4">
        <Button onPress={shoot} disabled={busy} accessibilityLabel="Sacar foto">
          {busy ? <ActivityIndicator color={onPrimary} /> : <Camera color={onPrimary} size={28} />}
          <Text>Sacar foto</Text>
        </Button>
        <View className="flex-row flex-wrap gap-3">
          <Button variant="ghost" size="sm" className="flex-1" onPress={pickFromGallery}>
            <Images color="white" size={24} />
            <Text className="text-white">Galería</Text>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onPress={() => router.push('/mapa')}>
            <Map color="white" size={24} />
            <Text className="text-white">Mapa</Text>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onPress={() => router.push('/mis-reportes')}>
            <List color="white" size={24} />
            <Text className="text-white">Mis reportes</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
