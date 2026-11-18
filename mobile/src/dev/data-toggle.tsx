// Solo desarrollo (break-ui): control fijo abajo al centro para cambiar los datos de la app. Es chrome,
// no diseño: gris, sin animación. Tocarlo lo abre; elegir un modo lo guarda (sobrevive al reload) y
// reemplaza la pantalla actual por una nueva, que vuelve a pedir sus datos.
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';

import { DATA_MODE_LABEL, DATA_MODES, setDataMode, useDataMode, type DataMode } from './data-mode';

export function DataToggle() {
  const mode = useDataMode();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { bottom } = useSafeAreaInsets();

  function choose(m: DataMode) {
    setOpen(false);
    if (m === mode) return;
    setDataMode(m);
    router.replace({ pathname: pathname as never, params });
  }

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(bottom - 28, 2), alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#e5e5e5', borderRadius: 999, padding: 2, opacity: 0.95 }}>
        {(open ? DATA_MODES : [mode]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={`Dev data: ${DATA_MODE_LABEL[m]}`}
            onPress={() => (open ? choose(m) : setOpen(true))}
            style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: m === mode ? '#fff' : 'transparent' }}>
            <Text style={{ fontSize: 11, color: '#333' }}>{open ? DATA_MODE_LABEL[m] : `Data: ${DATA_MODE_LABEL[m]}`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
