# 004 — Keep the camera pinch-zoom re-render to the camera view only

- **Status**: DONE without step 0 (no device was available; applied because it only moves code). Pinch feel still needs a device check.
- **Commit**: 2579875
- **Severity**: LOW
- **Category**: Performance
- **Estimated scope**: 1 file, about 30 lines moved

## Step 0: decide whether this is needed

This finding comes from reading the code, not from a measurement. Before editing anything, try it in a **release build** (`npx expo run:ios --configuration Release`, or an EAS preview build) on the oldest phone you support. Pinch to zoom on the camera screen.

- If the zoom follows your fingers smoothly, with no stutter, set **Status: WONTFIX**, add one line saying it was checked on device, and stop.
- If it stutters or lags behind your fingers, go on.

## Problem

The pinch gesture runs on the JS thread and calls `setZoom` on every update, 60–120 times a second. Each call re-renders the whole `CameraScreen`: the emergency notice, the buttons, the `GestureDetector` and the `CameraView`.

```tsx
// mobile/src/app/index.tsx:36-51 (current)
// `zoom` de expo-camera: 0 es 1x (el lente normal) y 1 el máximo, en escala exponencial.
const [zoom, setZoom] = useState(0);
// En refs y no en el estado: el gesto puede quedarse con callbacks de un render viejo.
const zoomNow = useRef(0);
const pinchStart = useRef(0);
const pinch = usePinchGesture({
  runOnJS: true,
  onActivate: () => {
    pinchStart.current = zoomNow.current;
  },
  // ponytail: 0.25 por cada "e" de escala del pellizco, a ojo; ajustar si se siente lento o rápido.
  onUpdate: (e) => {
    zoomNow.current = Math.min(1, Math.max(0, pinchStart.current + Math.log(e.scale) * 0.25));
    setZoom(zoomNow.current);
  },
});
```

```tsx
// mobile/src/app/index.tsx:98-110 (current)
<GestureDetector gesture={pinch}>
  <View style={{ flex: 1 }}>
    <CameraView
      ref={camera}
      facing="back"
      style={{ flex: 1 }}
      zoom={zoom}
      // expo-camera aplica el zoom inicial antes de configurar la sesión, iOS lo resetea y en
      // iPhones con ultra gran angular arranca en 0.5x. Un zoom apenas distinto lo vuelve a aplicar.
      onCameraReady={() => setZoom((z) => (z === 0 ? 0.0001 : z))}
    />
  </View>
</GestureDetector>
```

expo-camera's `zoom` is a plain React prop, so it has to change through React on every frame. That part cannot be removed. What can be avoided is re-rendering everything around it.

## Target

Move the zoom state, its refs, the pinch gesture and the `GestureDetector` + `CameraView` into a small component in the same file, `ZoomableCamera`. While pinching, only that component re-renders. Behavior stays identical: the same 0.25 factor, the same `onCameraReady` workaround, and the same comments.

## Repo conventions to follow

- Keep every existing Spanish comment word for word; they explain deliberate decisions (the `ponytail:` tuning note and the iOS 0.5x workaround).
- Small screen-local components live at the bottom of the screen file, as `ZoomButton` does in `mobile/src/app/ubicacion.tsx:264`.
- React 19.3: pass the camera ref as an ordinary prop named `cameraRef`.

## Steps

1. In `mobile/src/app/index.tsx`, delete lines 36–51 (the `zoom` state, `zoomNow`, `pinchStart` and `pinch`) from `CameraScreen`. Leave `camera`, `busy` and everything else.

2. Replace the JSX at lines 98–110 with:

   ```tsx
   <ZoomableCamera cameraRef={camera} />
   ```

3. Add this at the bottom of the file:

   ```tsx
   // Aparte de la pantalla: el pellizco actualiza el zoom en cada cuadro y así solo se vuelve a
   // dibujar la cámara, no los botones ni el aviso.
   function ZoomableCamera({ cameraRef }: { cameraRef: React.RefObject<CameraView | null> }) {
     // `zoom` de expo-camera: 0 es 1x (el lente normal) y 1 el máximo, en escala exponencial.
     const [zoom, setZoom] = useState(0);
     // En refs y no en el estado: el gesto puede quedarse con callbacks de un render viejo.
     const zoomNow = useRef(0);
     const pinchStart = useRef(0);
     const pinch = usePinchGesture({
       runOnJS: true,
       onActivate: () => {
         pinchStart.current = zoomNow.current;
       },
       // ponytail: 0.25 por cada "e" de escala del pellizco, a ojo; ajustar si se siente lento o rápido.
       onUpdate: (e) => {
         zoomNow.current = Math.min(1, Math.max(0, pinchStart.current + Math.log(e.scale) * 0.25));
         setZoom(zoomNow.current);
       },
     });
     return (
       <GestureDetector gesture={pinch}>
         <View style={{ flex: 1 }}>
           <CameraView
             ref={cameraRef}
             facing="back"
             style={{ flex: 1 }}
             zoom={zoom}
             // expo-camera aplica el zoom inicial antes de configurar la sesión, iOS lo resetea y en
             // iPhones con ultra gran angular arranca en 0.5x. Un zoom apenas distinto lo vuelve a aplicar.
             onCameraReady={() => setZoom((z) => (z === 0 ? 0.0001 : z))}
           />
         </View>
       </GestureDetector>
     );
   }
   ```

4. Check that the imports still resolve: `useRef` and `useState` are still used, and `GestureDetector`, `usePinchGesture`, `CameraView` and `View` are all still imported.

## Boundaries

- Do NOT change the zoom formula, the 0.25 factor, `runOnJS: true`, or the `onCameraReady` workaround.
- Do NOT try `Animated.createAnimatedComponent(CameraView)` or `animatedProps`. expo-camera does not document support for that.
- Do NOT add dependencies.
- If the current code does not match, STOP and report.

## Verification

- **Mechanical**: `pnpm -C mobile typecheck` and `pnpm -C mobile lint` pass.
- **Feel check** (release build, the same phone as in step 0):
  - Pinch in and out. The zoom follows your fingers; compare it with what you saw in step 0.
  - The camera still opens at 1x on an iPhone with an ultra-wide lens, not at 0.5x.
  - "Sacar foto" still takes the photo and moves on to `/ubicacion`.
  - Optional: in React DevTools Profiler, record a pinch. Only `ZoomableCamera` re-renders, not `CameraScreen`.
- **Done when**: step 0 was run, and either the plan is WONTFIX with a note or the checks above pass.
