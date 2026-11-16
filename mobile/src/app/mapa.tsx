// Mapa básico: un pin por reporte público. Grupos, filtros, íconos y la hoja con la lista son #9.
import { categoryLabel, type PublicReport } from '@arreglemos/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Text } from '@/components/ui/text';
import { listReports } from '@/lib/reports';
import { THEME } from '@/lib/theme';

const LA_CALERA = { latitude: -31.344, longitude: -64.3355 };

export default function MapScreen() {
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string }>();
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    listReports().then(setReports, () => setError(true));
  }, []);

  const center = params.lat && params.lng ? { latitude: Number(params.lat), longitude: Number(params.lng) } : LA_CALERA;

  return (
    <View className="flex-1 bg-background">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        showsUserLocation
      >
        {reports.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            title={categoryLabel(r.category)}
            description={r.status === 'resolved' ? 'Resuelto' : 'Abierto'}
            onPress={() => router.push(`/reporte/${r.id}`)}
            pinColor={String(r.id) === params.id ? theme.primary : r.status === 'resolved' ? theme.success : theme.warning}
          />
        ))}
      </MapView>
      {error && (
        <View className="absolute inset-x-0 top-0 bg-destructive-soft px-screen py-3">
          <Text className="text-destructive-ink">No pudimos cargar los reportes.</Text>
        </View>
      )}
    </View>
  );
}
