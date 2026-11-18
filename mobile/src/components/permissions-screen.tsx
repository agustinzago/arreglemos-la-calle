// 01 Permisos: en el primer uso explica por qué pedimos cámara y ubicación ("Empezar").
// Si la cámara está negada, lo dice y lleva a Ajustes; mientras tanto se puede usar una foto de la galería.
// La ubicación negada no bloquea: la pantalla de ubicación lo avisa y el vecino pone el pin a mano.
import type { PermissionStatus } from 'expo-camera';
import { ArrowRight, Ban, Camera, CircleCheck, Images, MapPin, Settings, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';

type Props = {
  camera: PermissionStatus;
  location: PermissionStatus;
  onStart: () => void;
  onGallery: () => void;
};

export function PermissionsScreen({ camera, location, onStart, onGallery }: Props) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  const icon = 24 * Math.min(useWindowDimensions().fontScale, 1.5);
  const denied = camera === 'denied';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-screen py-6">
        {denied ? (
          <>
            <Text variant="h1">Falta el permiso de la cámara</Text>
            <Text>Sin la cámara no podemos sacar la foto. Se activa en un minuto:</Text>
            <View className="rounded-xl border border-border bg-card">
              <StatusRow icon={<Camera color={theme.foreground} size={icon} />} label="Cámara" granted={false} />
              <View className="h-px bg-border" />
              <StatusRow
                icon={<MapPin color={theme.foreground} size={icon} />}
                label="Ubicación"
                granted={location === 'granted'}
              />
            </View>
            <Step n={1}>
              Tocá <Text className="font-sans-bold">Abrir Ajustes</Text>, acá abajo.
            </Step>
            <Step n={2}>
              Activá <Text className="font-sans-bold">Cámara</Text>.
            </Step>
            <Step n={3}>Volvé a Arreglemos.</Step>
          </>
        ) : (
          <>
            <Text variant="h2" className="text-primary-ink">
              Arreglemos la Calle
            </Text>
            <Text variant="h1">Para empezar, necesitamos dos permisos</Text>
            <Reason
              icon={<Camera color={theme.primaryInk} size={icon} />}
              title="Cámara"
              body="Para sacarle una foto al problema."
            />
            <Reason
              icon={<MapPin color={theme.primaryInk} size={icon} />}
              title="Ubicación"
              body="Para saber en qué calle está. Solo mientras usás la app."
            />
            <View className="flex-row gap-2.5">
              <ShieldCheck color={theme.mutedForeground} size={icon} />
              <Text variant="muted" className="flex-1">
                No hace falta crear cuenta. Somos vecinos: esta app no es de la Municipalidad.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <View className="gap-3 border-t border-border bg-background px-screen py-3">
        {denied ? (
          <>
            <Button onPress={() => Linking.openSettings()}>
              <Settings color={theme.primaryForeground} size={icon} />
              <Text>Abrir Ajustes</Text>
            </Button>
            <Button variant="outline" onPress={onGallery}>
              <Images color={theme.primaryInk} size={icon} />
              <Text className="text-base">Elegir una foto de la galería</Text>
            </Button>
          </>
        ) : (
          <Button onPress={onStart}>
            <Text>Empezar</Text>
            <ArrowRight color={theme.primaryForeground} size={icon} />
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function Reason({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View className="flex-row gap-3.5 rounded-xl border border-border bg-card p-4">
      <View className="h-12 w-12 items-center justify-center rounded-[12px] bg-primary-soft">{icon}</View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-sans-bold">{title}</Text>
        <Text className="text-muted-foreground">{body}</Text>
      </View>
    </View>
  );
}

function StatusRow({ icon, label, granted }: { icon: React.ReactNode; label: string; granted: boolean }) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  return (
    <View className="flex-row flex-wrap items-center gap-3 p-4">
      {icon}
      {/* grow y no flex-1: con la letra grande "No permitida" baja a otra línea en vez de aplastar el nombre. */}
      <Text className="grow font-sans-bold">{label}</Text>
      <View
        className={`flex-row items-center gap-1 rounded-full py-[3px] pl-1.5 pr-2.5 ${granted ? 'bg-success-soft' : 'bg-destructive-soft'}`}
      >
        {granted ? <CircleCheck color={theme.successInk} size={18} /> : <Ban color={theme.destructiveInk} size={18} />}
        <Text className={`text-xs font-sans-bold ${granted ? 'text-success-ink' : 'text-destructive-ink'}`}>
          {granted ? 'Permitida' : 'No permitida'}
        </Text>
      </View>
    </View>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-foreground">
        <Text className="font-sans-bold text-background" maxFontSizeMultiplier={1}>
          {n}
        </Text>
      </View>
      <Text className="flex-1">{children}</Text>
    </View>
  );
}
