# 001 — Give every tap target an eased 0.97 press scale

- **Status**: DONE in 2579875 (not yet checked on a device)
- **Commit**: 24ba49e
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 new file, 5 edited files, about 40 lines

## Problem

Press feedback is the most frequent motion in the app, and right now it is either instant or missing.

NativeWind's `active:` modifier changes the style with no duration, so the primary button jumps to 0.98 and back:

```tsx
// mobile/src/components/ui/button.tsx:11-14 (current)
default: 'bg-primary active:scale-[0.98]',
success: 'bg-success active:scale-[0.98]',
outline: 'border-2 border-primary bg-transparent active:bg-primary-soft',
ghost: 'active:bg-accent',
```

Other tap targets use a different instant feedback (`active:opacity-80`):

```tsx
// mobile/src/app/mapa.tsx:213 (current)
className="min-h-touch flex-row items-center gap-2 rounded-md bg-card px-3 shadow active:opacity-80"
// mobile/src/app/mapa.tsx:222 (current)
className="min-h-touch shrink flex-row items-center gap-2 rounded-md bg-card px-3 shadow active:opacity-80"
// mobile/src/app/mapa.tsx:269 (current)
className="min-h-touch flex-row items-center gap-1.5 rounded-[12px] bg-muted px-3 active:opacity-80"
// mobile/src/components/report.tsx:50 (current)
className={`flex-row items-center gap-3 rounded-xl border border-border p-2.5 active:opacity-80 ${className ?? 'bg-background'}`}
```

Many tap targets give no visual feedback at all: the category cards (`mobile/src/app/categoria.tsx:96`), the nearby-report rows (`mobile/src/app/cercanos.tsx:81`), the filter options and "Cerrar" (`mobile/src/app/mapa.tsx:367` and the options right after it), and "Denunciar", "Bloquear", "Cancelar" and "Volver" (`mobile/src/app/reporte/[id].tsx:309,319,428,442`).

The shared wrapper is the one place every tap goes through:

```tsx
// mobile/src/components/ui/pressable.tsx (current, whole file)
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
```

`hapticTap` is also imported by `mobile/src/components/account-card.tsx`, so it must stay exported.

## Target

Everything that uses the shared `Pressable` scales to `0.97` while the finger is down. The scale animates in both directions over **120ms** with `cubic-bezier(0.23, 1, 0.32, 1)`, using a Reanimated 4 CSS transition. That is all the implementation needs: no gesture, no shared value.

- The haptic stays exactly as it is, on `onPress`.
- With iOS "Reduce Motion" or Android "Remove animations" on, nothing scales. A pressed element drops to `opacity: 0.8` instead, with no transition.
- The two full-screen backdrops that close a sheet do not scale. They pass `scaleOnPress={false}`.
- `active:bg-*` color classes stay as they are. They work together with the scale.

## Repo conventions to follow

- Code comments are in Spanish (Rioplatense, using "vos"). Match the tone of the existing comment in `pressable.tsx`.
- Shared JS-side tokens live in `mobile/src/lib/`. `mobile/src/lib/theme.ts` mirrors the color tokens. Motion curves get their own `mobile/src/lib/motion.ts`.
- Class names are joined with `cn` from `@/lib/utils` (clsx + tailwind-merge).
- NativeWind only reads `className` on components registered with `cssInterop`. A component made with `Animated.createAnimatedComponent` is not registered by default, so it must be registered by hand.
- Reanimated 4.7: the CSS `transitionTimingFunction` must be `cubicBezier(...)` imported from `react-native-reanimated`, not a `'cubic-bezier(...)'` string (see `node_modules/react-native-reanimated/src/css/easing/types.ts`).

## Steps

1. Create `mobile/src/lib/motion.ts`:

   ```ts
   // Curvas de animación compartidas. Copiadas tal cual de la auditoría de animaciones: no aproximar.
   import { cubicBezier } from 'react-native-reanimated';

   /** Ease-out fuerte para UI: arranca rápido y frena suave. Para transiciones CSS de Reanimated. */
   export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
   ```

2. Replace the whole of `mobile/src/components/ui/pressable.tsx` with:

   ```tsx
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

   /** El toque háptico de los botones, para los nativos que no pasan por `Pressable` (p. ej. Apple). */
   function hapticTap() {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
   }
   // Con "Reducir movimiento" no se achica: solo baja la opacidad, sin transición.
   const PRESSED_REDUCED = { opacity: 0.8 } as const;

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
   ```

   `setPressed` runs twice per tap, not once per frame. That is fine.

3. Before going on, run `grep -rn "style={(" mobile/src` and look for a shared `Pressable` that gets a function `style` prop. If you find one, STOP and report it. The new type only accepts plain styles.

4. In `mobile/src/components/ui/button.tsx`, remove the instant scale from lines 11–12:

   ```tsx
   default: 'bg-primary',
   success: 'bg-success',
   ```

   Leave lines 13–14 (`active:bg-primary-soft`, `active:bg-accent`) unchanged. `ButtonProps` (line 37) is built from `React.ComponentProps<typeof Pressable>`, so it picks up the new type without any edit.

5. Remove ` active:opacity-80` (and only that token) from these four lines:
   - `mobile/src/app/mapa.tsx:213`
   - `mobile/src/app/mapa.tsx:222`
   - `mobile/src/app/mapa.tsx:269`
   - `mobile/src/components/report.tsx:50`

6. Add `scaleOnPress={false}` to the two sheet backdrops:

   ```tsx
   // mobile/src/app/mapa.tsx:361
   <Pressable accessibilityLabel="Cerrar" onPress={onClose} scaleOnPress={false} className="absolute inset-0 bg-black/40" />
   // mobile/src/app/reporte/[id].tsx:396
   <Pressable accessibilityLabel="Cancelar" onPress={onClose} scaleOnPress={false} className="absolute inset-0 bg-black/40" />
   ```

## Boundaries

- Do NOT change the haptic call, when it fires, or which elements get it.
- Do NOT touch `active:bg-*` classes, layout classes, or markup.
- Do NOT use NativeWind `transition-*` classes for this. Its transform transitions are experimental, and this plan uses Reanimated's CSS transitions on purpose.
- Do NOT add dependencies. `react-native-reanimated` 4.7.1 and `nativewind` are already installed.
- If any current-code excerpt above does not match what you find, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm -C mobile typecheck` and `pnpm -C mobile lint` both pass with no new errors.
- **Styling did not break** (check this first): open the camera screen. The "Sacar foto" button must still be blue, rounded, and full width. If any button or row lost its background, border or padding, `cssInterop` on the animated component is not applying `className`. STOP and report.
- **Feel check** (dev client on a real phone; judge smoothness in a release build):
  - Press and hold "Sacar foto". It shrinks a little within about a tenth of a second, without a jump. Release it and it eases back.
  - Tap a category card in `/categoria` and a row in `/cercanos`. Both now shrink slightly while pressed, where before they did nothing.
  - Tap quickly several times in a row. The scale never restarts from zero mid-motion; it picks up from wherever it is.
  - Open the map filter and tap the dark area outside the sheet. The backdrop closes the sheet and does not shrink.
  - Turn on iOS Settings › Accessibility › Motion › Reduce Motion and reopen the app. Nothing scales; pressed elements dim to 80% instead.
  - Haptics still fire once per tap, same as before.
- **Done when**: no `active:scale-` or `active:opacity-` classes are left in `mobile/src` (`grep -rn "active:scale-\|active:opacity-" mobile/src` prints nothing), every check above passes, and typecheck and lint are clean.
