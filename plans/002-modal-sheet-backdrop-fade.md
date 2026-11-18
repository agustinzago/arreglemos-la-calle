# 002 — Fade the modal backdrops, slide only the sheet

- **Status**: DONE (not yet checked on a device)
- **Commit**: 2579875
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 3 files, about 30 lines
- **Depends on**: 001. That plan adds `scaleOnPress={false}` to the backdrops and creates `mobile/src/lib/motion.ts`. If 001 is not done, keep the backdrop lines as you find them, and create `motion.ts` in step 1 below.

## Problem

Two bottom sheets are built on React Native's `Modal` with `transparent animationType="slide"`. With `slide`, everything inside the Modal moves up together, including the `bg-black/40` backdrop. The dim layer rises from the bottom of the screen like a hard-edged slab instead of fading in. On close, the dimming slides down off the screen.

```tsx
// mobile/src/app/mapa.tsx:359-362 (current): CategoryFilter, "¿Qué problema querés ver?"
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <View className="flex-1 justify-end">
    <Pressable accessibilityLabel="Cerrar" onPress={onClose} className="absolute inset-0 bg-black/40" />
    <View className="max-h-[88%] gap-4 rounded-t-2xl bg-card px-screen pb-10 pt-5">
      …
    </View>
  </View>
</Modal>
```

```tsx
// mobile/src/app/reporte/[id].tsx:394-397 (current): "¿Ya lo arreglaron?"
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <View className="flex-1 justify-end">
    <Pressable accessibilityLabel="Cancelar" onPress={onClose} className="absolute inset-0 bg-black/40" />
    <View className="max-h-[90%] rounded-t-2xl bg-card">
      …
    </View>
  </View>
</Modal>
```

(If plan 001 is done, each backdrop line also has `scaleOnPress={false}`.)

## Target

- **Modal**: `animationType="fade"`, so the backdrop only fades in and out.
- **Sheet**: slides up from below the screen over **300ms** with the iOS sheet curve `Easing.bezier(0.32, 0.72, 0, 1)`, using a Reanimated `entering` animation: `SlideInDown.duration(300).easing(EASE_SHEET)`.
- **Close**: no `exiting` animation. The Modal fade closes the whole thing, which is quick and calm. Reanimated `exiting` does not run reliably inside a closing RN `Modal`.
- **Reduced motion**: nothing extra to do. Reanimated layout animations default to `ReduceMotion.System`, so with Reduce Motion on, the slide is skipped and only the Modal fade remains.

The sheet's own `View` keeps its `className` unchanged. The `entering` animation goes on a new, unstyled `Animated.View` that wraps the sheet. Reanimated's `Animated.View` is not registered with NativeWind, so putting `className` on it would silently drop the styles.

## Repo conventions to follow

- Code comments are in Spanish (Rioplatense, using "vos").
- Shared motion values live in `mobile/src/lib/motion.ts`, created by plan 001. That file currently exports `EASE_OUT = cubicBezier(0.23, 1, 0.32, 1)`.
- The repo uses the `pointerEvents` prop (not the style form), for example `mobile/src/app/ubicacion.tsx:203`.

## Steps

1. In `mobile/src/lib/motion.ts`, add the following (create the file with only this content if plan 001 was not done):

   ```ts
   import { Easing, SlideInDown } from 'react-native-reanimated';

   /** Curva de hoja de iOS. Para animaciones `entering` de Reanimated. */
   export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

   /** Entrada de una hoja inferior: sube desde abajo. Con "Reducir movimiento", Reanimated la saltea sola. */
   export const SHEET_ENTERING = SlideInDown.duration(300).easing(EASE_SHEET);
   ```

   Merge the import with the existing `react-native-reanimated` import, so there is a single import line.

2. In `mobile/src/app/mapa.tsx`, add the imports:

   ```tsx
   import Animated from 'react-native-reanimated';
   ```

   and, in the `@/lib/...` group, `import { SHEET_ENTERING } from '@/lib/motion';`.

3. Restructure `CategoryFilter`'s Modal (`mobile/src/app/mapa.tsx:359` onward). The backdrop stays a full-screen sibling. The sheet moves into a full-screen `Animated.View` that lets taps through where it is empty. The sheet's inner `View`, and everything inside it, stays exactly as it is:

   ```tsx
   <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
     <View className="flex-1">
       <Pressable accessibilityLabel="Cerrar" onPress={onClose} scaleOnPress={false} className="absolute inset-0 bg-black/40" />
       {/* El fondo aparece con el fade del Modal; solo la hoja sube desde abajo. */}
       <Animated.View entering={SHEET_ENTERING} pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end' }}>
         <View className="max-h-[88%] gap-4 rounded-t-2xl bg-card px-screen pb-10 pt-5">
           {/* …unchanged children… */}
         </View>
       </Animated.View>
     </View>
   </Modal>
   ```

   (Drop `scaleOnPress={false}` if plan 001 was not done.)

4. Make the same change in `mobile/src/app/reporte/[id].tsx:394` onward: add the same two imports, then:

   ```tsx
   <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
     <View className="flex-1">
       <Pressable accessibilityLabel="Cancelar" onPress={onClose} scaleOnPress={false} className="absolute inset-0 bg-black/40" />
       {/* El fondo aparece con el fade del Modal; solo la hoja sube desde abajo. */}
       <Animated.View entering={SHEET_ENTERING} pointerEvents="box-none" style={{ flex: 1, justifyContent: 'flex-end' }}>
         <View className="max-h-[90%] rounded-t-2xl bg-card">
           {/* …unchanged children… */}
         </View>
       </Animated.View>
     </View>
   </Modal>
   ```

## Boundaries

- Do NOT change anything inside the sheet `View`s: content, classes, or handlers.
- Do NOT add `className` to any `Animated.View`.
- Do NOT add an `exiting` animation, and do NOT replace these Modals with `@gorhom/bottom-sheet` or a router `formSheet`. Those are separate, bigger decisions.
- Do NOT add dependencies.
- If the current code does not match the excerpts above, STOP and report.

## Verification

- **Mechanical**: `pnpm -C mobile typecheck` and `pnpm -C mobile lint` pass with no new errors.
- **Feel check** (dev client on a real phone):
  - Map › filter button. The dark backdrop fades in over the whole screen while the white sheet rises from the bottom edge. There is no dark slab sliding up.
  - Tap the dark area above the sheet. The filter closes; taps above the sheet still reach the backdrop.
  - Tap "Cerrar" and the filter options. They work as before.
  - Report detail › "¿Ya lo arreglaron?". Same behavior, and "Agregar foto" still opens the camera or gallery.
  - Set the system text size to the largest setting. Each sheet still stops at 88% / 90% of the screen height and its content scrolls.
  - With Reduce Motion on, the sheet appears with the fade only and does not slide.
  - If you can record the screen, step through the opening frame by frame. The backdrop's opacity grows evenly and its top edge never moves.
- **Done when**: neither Modal uses `animationType="slide"` (`grep -rn 'animationType="slide"' mobile/src` prints nothing) and all checks above pass.
