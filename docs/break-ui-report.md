# break-ui report — 2026-11-18

Worst-case data run on every screen and component. Six parallel passes: report detail (D), map (M), Mis reportes (R), capture flow (C), submit flow + UI primitives (S), web (W). Cross-cutting fixes (X) merge findings that several passes hit.

- **Mobile findings are inferred.** There is no simulator or emulator on this machine and the app has no web target. They come from NativeWind classes and Yoga layout at 320/375/430pt, font scale 1.0–2.0, and dark mode.
- **Web findings are verified in the browser** at 320/390/1440px, 200% text, and dark mode, unless the row says inferred.

## Fix round (same day)

**Applied:**
- X1–X10.
- Every Broken item: D1–D4, M1, M2, R1, R2, C1–C4, S1, S2, W1–W4.
- Two more Broken found while re-checking web at 200% text: `h1` gets `overflow-wrap:anywhere`, and `.stats` uses `minmax(min(9rem,100%),1fr)`.
- New migration `supabase/migrations/20261118130000_text_limits.sql`. It is **not applied**: run `supabase db push` when ready.

**Verified:**
- Web: in the browser, on every page and mode at 320px with 100% and 200% text. No page scrolls sideways.
- Mobile: from code only.

**Check on a device:**
- R2 (photos of queued reports after an app update).
- Hermes `toLocaleString('es-AR')` showing "1.284".
- The multiline input scroll.
- `scrollToEnd` on "Otro".

**Still open:**
- The Ugly and Fragile rows not listed above.
- New from this round: an event type the app doesn't know crashes the timeline (`ICONS[item.kind]` in `reporte/[id].tsx`).
- New from this round: for "Otro", the h1 repeats the first line of the description shown below it.

## Toggle

- **Mobile.** A dev-only pill at bottom-center reads "Data: Off". Tap it to open: Off / Demo / Worst case / Empty / One / 1,000. The choice persists in localStorage and remounts the current screen.
  - Files: `mobile/src/dev/data-mode.ts`, `mobile/src/dev/data-toggle.tsx`, and `mobile/src/dev/fixtures/*.ts` (one file per area).
  - The boundary hooks sit in `mobile/src/lib/{reports,unsent,account,location,suggestion}.ts`.
  - In any mode except Off, writes to Supabase throw (`assertLiveData`), and `createReport` returns a fixture.
- **Web.** `?data=demo|worst|empty|one|huge` on `/r/[id]` (ids 1–7 vary) and `/ranking/<any-slug>`. Files: `web/src/dev/fixtures.ts` and `web/src/dev/DataToggle.tsx`, rendered only when `NODE_ENV === "development"`.

## X — Cross-cutting (one fix, many screens)

| # | Sev | Problem | Fix | Hits |
|---|---|---|---|---|
| X1 | Ugly→Broken at 2x | Button label Text has no `shrink`: icon+label spill past padding, wrapped lines left-aligned | `shrink text-center` in `buttonTextVariants` base, `mobile/src/components/ui/button.tsx:24` | C5, D5, R3, R8, S14 |
| X2 | Broken at ≥1.3x | `flex-1` (basis 0) inside `flex-wrap` rows never wraps: labels stack 2–3 letters per line, break mid-word | `flex-1` → `grow` at `index.tsx:117,121,125`, `permissions-screen.tsx:115`, `mis-reportes.tsx:189,193` | C1, C4, R3 |
| X3 | Ugly | Counts ≥1,000 shown raw ("1284", es-AR expects "1.284") | `toLocaleString('es-AR')` / `Intl.NumberFormat('es-AR')`: `report.tsx:34`, `cercanos.tsx:77`, `reporte/[id].tsx:227,239,483` (ship with D4), web `r/[id]/page.tsx:46,92,99`, `ranking/[municipio]/page.tsx:50,123,160` | M5, C8, D7, W9 |
| X4 | Broken | `created_at` a few minutes in the future (clock skew) → "-1 días abierto" | `Math.max(0, …)`: `reporte/[id].tsx:121`, web `r/[id]/page.tsx:69`, `ranking/[municipio]/page.tsx:49` | D2, W8 |
| X5 | Ugly | "1 días / 0 días hasta el arreglo" | singular + same-day copy: `reporte/[id].tsx:229-230`, web `r/[id]/page.tsx:99` | D6, W7 |
| X6 | Fragile | No length limit on `address` / `description` anywhere (`text` columns `init.sql:27,29`, no `maxLength`) | DB `check (char_length(...) <= N)` + matching `maxLength` at `categoria.tsx:121`, `detalles.tsx:138` | M14, C15, C16, S15, D14, R11, W18 |
| X7 | Ugly | `otro` reports titled just "Otro": rows indistinguishable; the WhatsApp message to the Muni drops the description | first line of description as title (`report.tsx:43,56`, web `r/[id]`), pass description to `shared/src/whatsapp.ts:13` via `detalles.tsx:80-87` | M8, S5, W(dec 2), R(dec) |
| X8 | Ugly | `items-center` on rows whose text wraps → icon/photo/button float mid-block | `items-start`: `account-card.tsx:83`, `mis-reportes.tsx:164`, `ubicacion.tsx:225`, `cercanos.tsx:86`, `detalles.tsx:114` | R6, R7, C10, S10 |
| X9 | Fragile→crash | Category code unknown to an old installed build (`CATEGORY_ICONS[x]` undefined) crashes the map | `?? Ellipsis` at `mapa.tsx:307`, `detalles.tsx:31`; `categoryLabel` fallback at `supabase/functions/_shared/categories.ts:18` | M3, S18, D13 |
| X10 | Ugly | Photo 404 / slow load: blank band or broken-image icon | muted bg + category icon behind image (pattern at `report.tsx:51-53`): `reporte/[id].tsx:201-207,533`, `mis-reportes.tsx:166`, web `r/[id]/page.tsx:77`, `ranking/[municipio]/page.tsx:152` | D8, R4, W10 |

## D — Report detail (`mobile/src/app/reporte/[id].tsx`, `StatusBadge`)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| D1 | Broken | events | 1,288 events | Supabase max-rows (1,000) cuts `listEvents`: the timeline says 999, the stat says 1284, and the viewer's own later events get dropped. `markedFixed`/`joined` come out wrong, and "Ya está arreglado" comes back but silently fails | flags server-side + newest-first with limit: `lib/reports.ts:102`, `[id].tsx:125-129` |
| D2 | Broken | `created_at` | +3 min | "-1 días abierto" | X4 |
| D3 | Broken | event date | 3 years ago | `when()` drops the year, so it reads as this week | `year:'numeric'` when not current year, `[id].tsx:506` |
| D4 | Broken | Stat value | "1284" at 375pt, font ≥1.33 | splits "128" / "4" | `numberOfLines={1} adjustsFontSizeToFit`, `[id].tsx:445` |
| D5 | Ugly | WhatsApp CTA | label 298pt wide | overflows padding; at 2x spills past green fill | X1; also `[id].tsx:336` |
| D6 | Ugly | resolved days | 1 / 0 | "1 días", "0 días" | X5 |
| D7 | Ugly | counts | 1284 | no separator | X3 |
| D8 | Ugly | photo | 404 / 3G | blank 310pt band, badge floating | X10 |
| D9 | Ugly | bottom bar | iPhone SE (0 inset) | "Me sumo" touches screen edge | `pb-3`, `[id].tsx:320` |
| D10 | Ugly | status bar | bright photo in dark mode | clock unreadable over edge-to-edge photo | top scrim + light StatusBar, `[id].tsx:201` |
| D11 | Ugly | StatusBadge icon | font 2.0 | text 30px, icon stays 18 | scale by `min(fontScale,1.5)`, `components/report.tsx:24` |
| D12 | Ugly | "· Reporte 1284" | long address | splits "Reporte" / "1284" | non-breaking space, `[id].tsx:220` |
| D13 | Fragile | category | unknown code | raw "poste_caido" in h1 | X9 |
| D14 | Fragile | description | 800-char paste | pushes "Enviar a la Muni" ~700pt down | X6 + clamp (decision) |
| D15 | Fragile | timeline | 401 rows | `.map` in ScrollView, not virtualized | cap at ~30 + "Ver toda la historia", `[id].tsx:514` |
| D16 | Fragile | BackButton | long page | scrolls away (header hidden) | render outside ScrollView, `[id].tsx:211` |
| D17 | Fragile | `id` param | `/reporte/abc` | NaN, 22P02, then "Revisá tu conexión" with a retry that can never work | `Number.isInteger` guard, `[id].tsx:62-75` |

## M — Map (`mobile/src/app/mapa.tsx`, `ReportRow`)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| M1 | Broken | stacked pins | 8 reports at same lat/lng | cluster can't split; at z18 only the top marker is tappable. At 17.99 `Math.floor` keeps the cluster, so tapping again does nothing | expansion zoom >17 → zoom + `snapToIndex(1)`; `Math.floor(zoom + 0.01)`: `mapa.tsx:111,113-121` |
| M2 | Broken | list length | 1,000 in view | RPC `limit 500` (`20261116120900_map_reports.sql:27`); title says "500 reportes"; rest silently gone | `count(*) over ()` + "500 de 1.000 · acercá el mapa", `mapa.tsx:126` |
| M3 | Fragile | category | new code, old build | whole map crashes | X9 |
| M4 | Ugly | address | "Bulevar Presidente Arturo Umberto Illia 1150, Estación Juárez Celman" | 5 lines at 320, 7–8 at 2x; one row fills the sheet | `numberOfLines={2}`, `report.tsx:57` |
| M5 | Ugly | vecinos | 1284 | no separator | X3 |
| M6 | Ugly | age | 3 years | "1096 días" | months/years after ~60 days, `report.tsx:36-37` |
| M7 | Ugly | title at 2x | "Luminaria apagada" | 118–173pt column, mid-word break | 64pt thumbnail when `fontScale >= 1.5`, `report.tsx:51-55` |
| M8 | Ugly | `otro` | description with `\n` | row says only "Otro" | X7 |
| M9 | Ugly | pin a11y | 3 baches same corner | identical "Bache, Abierto" | append address, `mapa.tsx:178` |
| M10 | Ugly | empty + filter | 0 results | "Quitar filtros" below fold at 25% snap | ✕ on filter chip or snap up, `mapa.tsx:205-208,274-284` |
| M11 | Ugly | top overlay | 2x at 375pt | ~300pt tall, covers the map | move status radios into modal at ≥1.5x, `mapa.tsx:189-228` |
| M12 | Ugly | refetch error | after data | stale pins + "Sin reportes" title | "No se pudo actualizar" when `error && reports`, `mapa.tsx:77,126` |
| M13 | Fragile | sheet header | "Cargando reportes…" 2x | ~176pt > 167pt snap, "Ver lista" off-screen | first snap `Math.max(0.25*h,190)`, `mapa.tsx:235` |
| M14 | Fragile | address/description | — | no limit | X6 |

## R — Mis reportes (`mis-reportes.tsx`, `account-card.tsx`)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| R1 | Broken | load error | offline + 1 queued report | sections non-empty, so the error never shows and sent reports seem to vanish, with no retry | show error + retry inline whenever `failed`, `mis-reportes.tsx:52-53,98-100` |
| R2 | Broken (iOS, verify on device) | queued `photoUri` | app updated → new container UUID | absolute path stored; the file read throws; `sendInOrder` stops, so that report and every later one stay "Esperando señal" forever | store `${id}.jpg`, rebuild from `Paths.document`; missing file → `failed`: `unsent.ts:49,70` |
| R3 | Ugly→Broken 2x | Probar de nuevo / Descartar | 320pt | `flex-1` never wraps, icon hits the border; "Proba/r" at 2x | X2 + X1 |
| R4 | Ugly | queued photo missing | — | transparent tile, no icon | X10 |
| R5 | Ugly | footer links | 2x at 320 | overflow screen edges; 25pt tap targets | `flex-wrap` + `py-3`, `mis-reportes.tsx:87-91` |
| R6 | Ugly | linked email | long email at 2x | ShieldCheck floats mid-card | X8 |
| R7 | Ugly | queued row | 2x | 92pt photo centered on 400pt column | X8 |
| R8 | Ugly | "No se envió" badge | 2x | text past pill edge | `shrink` on badge Text, `mis-reportes.tsx:179` |
| R9 | Ugly | bottom CTA | new user | "Sacar otra foto" flips to "Sacar la primera foto" | wait for `items !== null`, `mis-reportes.tsx:135` |
| R10 | Fragile (App Store) | account card | linked user, `linkProviders()` = [] or rejects | whole card null, so "Borrar mi cuenta" can't be reached (Apple requires it) | gate only the anonymous branch, `account-card.tsx:77` |
| R11 | Fragile | list | 1,000 | `my_reports` has no limit (`20261116161000_my_reports.sql:18`) | page param |

## C — Capture flow (index, permissions, ubicacion, categoria, cercanos)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| C1 | Broken | permission row label | "Ubicación" ≥1.5x | 2–3 letters per line next to badge | X2, `permissions-screen.tsx:115` |
| C2 | Broken | map hint chip | ≥1.5x | chip grows over the 260pt map and hides the pin it describes | `mapPadding` or move hint above map, `ubicacion.tsx:173,209-211` |
| C3 | Broken | "Otro" input/error | 2x, empty text | input + error below fold, keyboard covers; Continuar seems dead | ref `focus()` + `scrollToEnd`, `categoria.tsx:50,121`, `form-screen.tsx:23` |
| C4 | Broken | home nav labels | 1.3x | "repor/tes", "Gale/ría" | X2, `index.tsx:117,121,125` |
| C5 | Ugly | Button labels | 2x | overflow padding | X1 |
| C6 | Ugly | category chip | "Anegamiento" 1.15–1.49x | "Anegamient/o"; one-column threshold too high | `width / fontScale < 340 ? 'basis-full' : …`, `categoria.tsx:91` |
| C7 | Ugly | "Sugerido" badge | row 4, ≥1.5x | covers chip icon; overlaps chip above at 1x | cap 1.5x + `pt-6`, or inline, `categoria.tsx:96` |
| C8 | Ugly | vecinos | 1284 | no separator | X3 |
| C9 | Ugly | "a 100 m" | 320pt / 2x | "a 100" / "m" | non-breaking space, `cercanos.tsx:76-77` |
| C10 | Ugly | address rows | 6–8 lines at 2x | pin/photo/radio float | X8 |
| C11 | Ugly | busy label | "Buscando reportes cerca…" | footer height jumps | keep "Continuar" + spinner, `categoria.tsx:65` |
| C12 | Ugly | cercanos footer | 2x | ~314pt footer, ~1 card visible | cap CTA labels 1.5x (decision) |
| C13 | Ugly | ghost pressed (light) | press "Galería" | `active:bg-accent` near-white under white text on the dark camera | `active:bg-white/15`, `index.tsx:117-125` |
| C14 | Fragile | reverse geocode | never settles | no timeout, Confirm disabled forever | race timeout → `setAddress(null)`, `ubicacion.tsx:112,232` |
| C15 | Fragile | otro description | 2,000 chars | no limit | X6 |
| C16 | Fragile | address | direct RPC | no limit, unclamped on neighbors' cercanos | X6 |
| C17 | Fragile | suggestion | server returns "otro" | auto-selects + keyboard opens | filter `otro` client-side, `suggestion.ts:26` |

## S — Submit flow + UI primitives (detalles, confirmacion, guardado, form-screen, notices, offline banner, ui/*)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| S1 | Broken | confirmacion footer | WhatsApp muni, 2x, 320dp | 3 pinned buttons ≈ 550pt; ~80pt left for content | pin only primary CTA, `confirmacion.tsx:90-104` |
| S2 | Broken (iOS, verify) | description input | 2,000 chars | multiline grows unbounded; caret goes under footer/keyboard | `max-h-48` multiline, `ui/input.tsx:15` + `maxLength`, `detalles.tsx:138` |
| S3 | Ugly | "Cambiar" | 1x at 360–375pt | `min-w-[140px]` forces wrap under thumbnail | put under value (decision), `detalles.tsx:114,117` |
| S4 | Ugly | Lugar/Problema | "Departamento" 2x | mid-word break, 72pt icon column | drop/stack icon at `fontScale > 1.5`, `detalles.tsx:116` |
| S5 | Ugly | WhatsApp text | `otro` | "un problema: otro en …"; description never reaches Muni | X7 |
| S6 | Ugly | address `''` | geocoder failed, pin moved | "Donde sacaste la foto" (wrong) | "En el punto que marcaste en el mapa", `detalles.tsx:42` |
| S7 | Ugly | keyboard | Face ID iPhone | 34pt dead band above keyboard | SafeAreaView outside KAV, `form-screen.tsx:15-31` |
| S8 | Ugly | "opened" | WhatsApp not installed | `wa.me` opens browser; "Se abrió WhatsApp…" shows anyway | honest copy (decision), `confirmacion.tsx:41-44,69` |
| S9 | Ugly | send error | rejection | raw `photo_not_found`, English Storage errors in Alert | Spanish per code + fallback, `detalles.tsx:96` |
| S10 | Ugly | "Otro: …" row | 2,000 chars | ~2,000pt row; icon + "Cambiar" off-screen mid-row | X8 + `numberOfLines={3}` |
| S11 | Ugly | NoticesCard | guardado offline | prompt then always "No pudimos activar…" | hide while `useOffline()`, `notices-card.tsx:27` |
| S12 | Ugly | guardado banner | reason `error` | WifiOff icon implies no signal | icon prop, `offline-banner.tsx:20` |
| S13 | Ugly | banner icons | 2x | fixed 22–24px next to 36pt text | `24*min(fontScale,1.5)`, `offline-banner.tsx:20`, `notices-card.tsx:31,49` |
| S14 | Fragile | Button label | "Ver en el mapa" 2x | overflow ~21pt | X1 |
| S15 | Fragile | description/address | — | no limit | X6 |
| S16 | Fragile | `municipalities.whatsapp` | "0351 15-555-1234" | no format check, wrong `wa.me` number | `check (whatsapp ~ '^549\d{10}$')` |
| S17 | Fragile | input a11y | VoiceOver | `aria-labelledby` Android-only; iOS reads placeholder | `accessibilityLabel`, `detalles.tsx:139` |
| S18 | Fragile | deep link | `arreglemos://detalles` no params | `CATEGORY_ICONS[undefined]` crash | X9 / redirect, `detalles.tsx:31` |

## W — Web (verified in browser unless noted)

| # | Sev | Field | Worst case | What happens | Fix |
|---|---|---|---|---|---|
| W1 | Broken | description | long URL, 320px | page widens to 502px, horizontal scroll | `overflow-wrap:anywhere`, `r/[id]/page.tsx:89` or `globals.css:44` |
| W2 | Broken | ranking row | long address / "Luminaria apagada" at 320; 200% at 390 | text column 45–70px, one word per line; numbers drawn over the address | <480px grid `22px 44px minmax(0,1fr)`, `.big` under text, `align-items:start`, `globals.css:114` |
| W3 | Broken | landing hero | 200% text, 390px | column 472px, `overflow-x:clip` cuts h1 + lead | `minmax(0,1fr)` `globals.css:350`, `overflow-wrap:anywhere` `:175` |
| W4 | Broken | contact email | 200% text | /soporte, /privacidad scroll sideways to 496px | `overflow-wrap:anywhere` on `.doc a`, `globals.css:95` |
| W5 | Ugly | address + municipio | every real report | "…1250, Córdoba, Córdoba, Córdoba"; "Córdoba, Córdoba · Reporte 1" | skip place when address ends with it, `r/[id]/page.tsx:70,121-123` |
| W6 | Ugly | description newlines | `otro + "\n" + detalle` | lines run together | `white-space:pre-line`, `r/[id]/page.tsx:89` |
| W7 | Ugly | resolved days | 1 / 0 | "1 días", "0 días" | X5 |
| W8 | Ugly | `created_at` | +5 min | "-1 días" | X4 |
| W9 | Ugly | counts | 1284, 15873 | raw, also in OG descriptions | X3 |
| W10 | Ugly | photo 404 | — | broken icon + alt text; WhatsApp preview loses image (inferred) | X10 |
| W11 | Ugly | address + municipio null | `bache` | "Bache" label above "Bache" h1; title just "Bache" | `r/[id]/page.tsx:35-37` |
| W12 | Ugly | ranking, today | 0 days | "0 días abierto" vs "Hoy" on report page | `ranking/[municipio]/page.tsx:97,106` |
| W13 | Ugly | ranking stats | 390px | 2+1 layout, one orphan stat | 3-or-1 columns, `globals.css:76` |
| W14 | Ugly | long title | 100-char "Calle de tierra… Villa Ciudad Parque Los Reartes" | h1 5–7 lines at 320; WhatsApp title cut (inferred) | short label in OG (decision); W1 stops overflow |
| W15 | Fragile | og:image dims | real photos 1280×1699 | tags declare 1280×960 | drop/correct, `r/[id]/page.tsx:57`, `ranking/[municipio]/page.tsx:59` |
| W16 | Fragile | rank number | "100" | overflows 26px column | `auto`/`3ch`, `globals.css:114` |
| W17 | Fragile | landing 320 | phone mock 290px in 280px | 10px right gutter vs 20px left | W3 |
| W18 | Fragile | address/description | — | no limit | X6 |

## Decisions for you

- **Address in list rows (M4, R):** clamp to 2 lines. Recommended, because the detail screen shows the full address. Exception: cercanos keeps the wrap, because near-duplicate addresses differ at the end.
- **Age format (M6):** "11 meses" / "3 años" after 60 days in rows. On the detail page and the ranking, keep days with a separator, because the day count is the advocacy number.
- **`otro` title (X7):** use the first line of the description, clamped to 1 line. Recommended.
- **Length limits (X6):** description/other 1,000 characters (one pass suggested 280), address 200. Match each DB check with the same `maxLength`.
- **Large-text footers (S1, C12):** pin only the primary CTA and let the rest scroll. Recommended over capping labels at 1.5x, which breaks the "buttons up to 200%" rule.
- **Rows at 2x (M7, R):** use a 64pt thumbnail when `fontScale >= 1.5`. Recommended over stacking the photo above the text.
- **Stacked pins (M1):** zoom in and open the list. Recommended over spiderfying, which needs custom code.
- **500 cap (M2):** show the total plus "acercá el mapa". Recommended over paginating the map.
- **Timeline (D15):** show the newest ~30 rows plus "Ver toda la historia". Recommended over a FlatList.
- **Long description on the detail page:** clamp at ~6 lines with "Ver más" on mobile (D14), because the actions sit below it. On web, let it wrap (W).
- **WhatsApp "opened" (S8):** honest copy ("Abrimos WhatsApp con el mensaje listo"). Recommended over scheme detection.
- **"Cambiar" (S3):** put it under the value. Recommended.
- **Ranking "Municipio de {name}" (W):** wrong for comunas. Drop the prefix and use "{name}, Córdoba".
- **Settings below 1,000 rows (R):** move the account card, the AI switch and Privacidad to their own "Cuenta" screen.
- **Not-found report:** add a line of explanation and a "Volver al mapa" button.
- **Inactive municipality:** give it its own message. The current one says "no está dentro de un municipio", which is false.

## What held up

- **Escaping:** text is rendered literally everywhere. `<b>`, `&amp;`, emoji and newlines come out as typed on mobile; on web, `<b>` and `&amp;` stay literal.
- **Plurals:** "1 vecino", "1 reporte", "1 día" and "hoy" are right, except X5.
- **Future dates:** a `created_at` in the future shows "hoy" in rows and the timeline.
- **Missing data:**
  - A null address shows "Sin dirección" and leaves no dangling separator.
  - An empty geocode result falls back correctly.
  - A null municipality and `whatsapp: null` each get a note that wraps.
- **Photos:**
  - `ReportRow` falls back to the category icon when the photo 404s.
  - Panorama and tall photos are cover-cropped in fixed boxes, with no layout shift.
- **Long lists:**
  - The map and Mis reportes lists are virtualized.
  - Events are grouped, so 1,283 joins collapse into one timeline row.
  - The empty, error and skeleton states exist and the skeleton matches the row height.
- **Large text:**
  - h1 is capped at 1.5x.
  - Line heights scale with the text, so diacritics don't clip.
  - At 320pt the Stats stack instead of squeezing.
- **Dark mode:** fully tokenized on mobile and web.
- **Wide screens:** the web max-widths hold at 1440px and wider.
- **Apple private relay:** the relay email is hidden.
- **Unsent queue:** fixtures can never be sent, retried or discarded, because those paths only read the real stored queue.

No repository content tried to steer any pass.
