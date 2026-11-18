// `Pressable` de React Native con feedback háptico: un toque suave cada vez que se dispara
// `onPress`. Usalo en lugar del de `react-native` para cualquier cosa que se toque.
import * as Haptics from 'expo-haptics';
import { Pressable as RNPressable } from 'react-native';

/** El toque háptico de los botones, para los nativos que no pasan por `Pressable` (p. ej. Apple). */
function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function Pressable({ onPress, ...props }: React.ComponentProps<typeof RNPressable>) {
  return (
    <RNPressable
      onPress={
        onPress &&
        ((e) => {
          hapticTap();
          onPress(e);
        })
      }
      {...props}
    />
  );
}

export { hapticTap, Pressable };
