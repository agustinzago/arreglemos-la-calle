# Animation plans

Written by an `improve-animations` audit of `mobile/` at commit 24ba49e. Plan 001 landed in 2579875, and plans 002–004 are stamped against that commit. Each plan is meant to be handed to an agent with no other context.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Give every tap target an eased 0.97 press scale](001-press-feedback-scale.md) | MEDIUM | DONE (device check pending) |
| 002 | [Fade the modal backdrops, slide only the sheet](002-modal-sheet-backdrop-fade.md) | MEDIUM | TODO |
| 003 | [Flip the map sheet's toggle label when the sheet starts moving](003-sheet-toggle-label-timing.md) | LOW | TODO |
| 004 | [Keep the camera pinch-zoom re-render to the camera view only](004-camera-pinch-isolate-rerender.md) | LOW | TODO (measure first) |

## Order and dependencies

1. **001** comes first. It creates `mobile/src/lib/motion.ts` and adds the `scaleOnPress` prop.
2. **002** depends on 001. It adds to `motion.ts` and keeps `scaleOnPress={false}` on the same backdrop lines.
3. **003** is independent. It touches `mapa.tsx` like 001 and 002, but on a different line, so run it after them to avoid merge noise.
4. **004** is independent. It starts with a device check that may close it as WONTFIX.

## Not planned

- **Haptics on every tap**: kept on purpose, as the comment at the top of `mobile/src/components/ui/pressable.tsx` says. The `animate-expo` skill's counter-argument is one haptic per meaningful event (`selectionAsync` on a choice, `notificationAsync` on success), because haptics on everything lead people to turn them off. Revisit only by an explicit decision.
- **120fps**: `CADisableMinimumFrameDurationOnPhone` is not in `mobile/app.json`; Expo may add it during prebuild. Not verified.

## Additions to consider later

- **Confirmation screen** (`mobile/src/app/confirmacion.tsx:65`): the success check could scale from 0.9 and fade in on a `{ duration: 400, dampingRatio: 0.8 }` spring, with `Haptics.notificationAsync(Success)` on the same frame.
- **Location screen** (`mobile/src/app/ubicacion.tsx:202`): `exiting={FadeOut.duration(200)}` on the "Buscando dónde estás…" overlay.
- **Offline banner** (`mobile/src/app/detalles.tsx:111`, `mobile/src/app/mis-reportes.tsx:79`): a 200ms fade when it appears. The content will still jump.
- **Category filter** (`mobile/src/app/mapa.tsx:359`): swipe down to close, using gorhom's `BottomSheetModal` (already installed).
