// `Pressable` de React Native con feedback háptico y de escala: un toque suave cada vez que se
// dispara `onPress`, y se achica a 0.97 mientras el dedo está apoyado. Usalo en lugar del de
// `react-native` para cualquier cosa que se toque.
import * as Haptics from 'expo-haptics';
import { cssInterop } from 'nativewind';
import { useState } from 'react';
import { Pressable as RNPressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { EASE_OUT } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);
// NativeWind solo lee className en componentes registrados; el animado no viene registrado.
cssInterop(AnimatedPressable, { className: 'style' });

const RESTING = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: 120,
  transitionTimingFunction: EASE_OUT,
} as const;
const PRESSED = { transform: [{ scale: 0.97 }] } as const;
// Con "Reducir movimiento" no se achica: solo baja la opacidad, sin transición.
const PRESSED_REDUCED = { opacity: 0.8 } as const;

/** El toque háptico de los botones, para los nativos que no pasan por `Pressable` (p. ej. Apple). */
function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

type PressableProps = Omit<React.ComponentProps<typeof RNPressable>, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** false en los fondos que cierran una hoja: ocupan toda la pantalla y no se tienen que achicar. */
  scaleOnPress?: boolean;
};

function Pressable({ onPress, onPressIn, onPressOut, style, scaleOnPress = true, ...props }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      onPress={
        onPress &&
        ((e) => {
          hapticTap();
          onPress(e);
        })
      }
      style={[scaleOnPress && !reduced && RESTING, scaleOnPress && pressed && (reduced ? PRESSED_REDUCED : PRESSED), style]}
    />
  );
}

export { hapticTap, Pressable };
export type { PressableProps };
