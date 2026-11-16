// "¿Te avisamos cuando lo arreglen?" (#13), en la confirmación y en /guardado. El permiso de
// notificaciones se pide solo si acepta. Sin `noticesAvailable` no se muestra.
import { Bell, BellRing } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { enableNotices, noticesAvailable, noticesEnabled } from '@/lib/notices';

export function NoticesCard() {
  const theme = useTheme();
  const [state, setState] = useState<'ask' | 'asking' | 'on' | 'denied' | 'error'>(noticesEnabled() ? 'on' : 'ask');

  function accept() {
    setState('asking');
    enableNotices().then(setState, () => setState('error'));
  }

  // Al volver de Ajustes puede aceptar de nuevo.
  function openSettings() {
    Linking.openSettings();
    setState('ask');
  }

  if (!noticesAvailable) return null;
  if (state === 'on') {
    return (
      <View role="status" className="flex-row items-center gap-3 rounded-md bg-success-soft px-3.5 py-3">
        <BellRing color={theme.successInk} size={24} />
        <Text className="shrink font-sans-semibold text-success-ink">Listo, te vamos a avisar</Text>
      </View>
    );
  }
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <Text className="font-sans-bold">¿Te avisamos cuando lo arreglen?</Text>
      {state === 'denied' && (
        <Text variant="muted">Para avisarte, la app necesita permiso de notificaciones. Lo podés activar en Ajustes.</Text>
      )}
      {state === 'error' && <Text variant="muted">No pudimos activar los avisos. Revisá tu conexión y probá de nuevo.</Text>}
      {state === 'denied' ? (
        <Button variant="outline" size="sm" className="min-h-[52px] rounded-md" onPress={openSettings}>
          <Text>Abrir Ajustes</Text>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="min-h-[52px] rounded-md" disabled={state === 'asking'} onPress={accept}>
          <Bell color={theme.primaryInk} size={22} />
          <Text>{state === 'error' ? 'Probar de nuevo' : 'Sí, avisame'}</Text>
        </Button>
      )}
    </View>
  );
}
