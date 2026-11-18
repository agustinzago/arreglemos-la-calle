# 003 — Flip the map sheet's "Ver lista / Ver mapa" label when the sheet starts moving

- **Status**: TODO
- **Commit**: 2579875
- **Severity**: LOW
- **Category**: Interruptibility (feedback timing)
- **Estimated scope**: 1 file, 1 line

## Problem

On the map, the bottom sheet's toggle shows a chevron and a "Ver lista" / "Ver mapa" label driven by `sheetOpen`. That state updates in `onChange`, which `@gorhom/bottom-sheet` fires after the sheet has finished moving. Its type doc says "Callback when the sheet position changed to a provided point", at `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/types.d.ts:262-267`. So you tap "Ver lista", the sheet rises, and only once it stops does the label become "Ver mapa". The feedback arrives late, after the motion it describes.

```tsx
// mobile/src/app/mapa.tsx:252-258 (current)
<BottomSheet
  ref={sheetRef}
  index={0}
  snapPoints={['25%', '85%']}
  enableDynamicSizing={false}
  enablePanDownToClose={false}
  onChange={(i) => setSheetOpen(i === 1)}
```

`sheetOpen` is used for the label and chevron (`mobile/src/app/mapa.tsx:271-272`) and by `toggleSheet` (`mobile/src/app/mapa.tsx:135`).

## Target

Use `onAnimate`, which fires as the sheet starts moving toward its new snap point. Its signature is `(fromIndex, toIndex, fromPosition, toPosition) => void` (`types.d.ts:274-279`). That covers taps on the toggle, drags that settle on a snap point, and the programmatic `snapToIndex(1)` at `mobile/src/app/mapa.tsx:132`.

```tsx
onAnimate={(_from, to) => setSheetOpen(to === 1)}
```

## Steps

1. In `mobile/src/app/mapa.tsx:258`, replace `onChange={(i) => setSheetOpen(i === 1)}` with `onAnimate={(_from, to) => setSheetOpen(to === 1)}`. Change nothing else.

## Boundaries

- Do NOT change snap points, the toggle, or any other sheet prop.
- If the line does not match, STOP and report.

## Verification

- **Mechanical**: `pnpm -C mobile typecheck` and `pnpm -C mobile lint` pass.
- **Feel check** (dev client on a real phone):
  - Tap "Ver lista". The label switches to "Ver mapa" and the chevron flips as soon as the sheet starts rising, not when it stops.
  - Drag the sheet up by hand and let go past halfway. The label flips as the sheet settles toward the top.
  - Drag it partly up and let go so it falls back down. The label stays "Ver lista" and does not flicker.
  - Zoom into a cluster past max cluster zoom (this triggers `snapToIndex(1)`). The label reads "Ver mapa" while the sheet rises.
- **Done when**: the checks above pass and `onChange` is no longer used on that `BottomSheet`.
