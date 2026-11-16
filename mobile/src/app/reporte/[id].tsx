// Placeholder: el detalle del reporte es #6, en esta misma ruta. Al mergear, quedarse con la versión de #6.
import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-background px-screen py-6">
      <Stack.Screen options={{ title: 'Reporte' }} />
      <Text variant="h1">Reporte {id}</Text>
    </View>
  );
}
