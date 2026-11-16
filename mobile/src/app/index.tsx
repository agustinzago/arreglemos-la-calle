// Cámara: la app abre acá. Al sacar la foto se toma la ubicación del GPS en ese momento.
// La pantalla de permisos, el pin arrastrable y la galería son #3.
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Camera, Map } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmergencyNotice } from '@/components/emergency-notice';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

export default function CameraScreen() {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const onPrimary = THEME[useColorScheme().colorScheme ?? 'light'].primaryForeground;

  if (!permission) return <View className="flex-1 bg-[#0b0d12]" />;

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-6 bg-background px-screen">
        <Text variant="h1">Necesitamos la cámara</Text>
        <Text>Para sacarle una foto al problema.</Text>
        <Button onPress={requestPermission}>
          <Text>Permitir la cámara</Text>
        </Button>
      </SafeAreaView>
    );
  }

  async function shoot() {
    setBusy(true);
    try {
      const location = await Location.requestForegroundPermissionsAsync();
      if (!location.granted) {
        Alert.alert('Falta la ubicación', 'Sin la ubicación no sabemos en qué calle está el problema.');
        return;
      }
      const [photo, position] = await Promise.all([
        camera.current!.takePictureAsync({ quality: 0.8, exif: false }),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ]);
      router.push({
        pathname: '/categoria',
        params: { photoUri: photo.uri, lat: position.coords.latitude, lng: position.coords.longitude },
      });
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
        <Button variant="ghost" size="sm" onPress={() => router.push('/mapa')}>
          <Map color="white" size={24} />
          <Text className="text-white">Mapa</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
