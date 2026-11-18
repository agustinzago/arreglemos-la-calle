// Fixtures del final del reporte: detalles, confirmación y guardado.
// Casi todo llega de otras fronteras, no de acá:
//   detalles   — foto, lat/lng y dirección vienen por parámetros de ubicacion (reverseGeocodeFixture en
//                flow-capture.ts; worst = "Avenida Doctor Amadeo Sabattini 4201-4299, Departamento Capital",
//                empty = '' → "Donde sacaste la foto"); categoría y el texto de "otro" de categoria (lo escribe
//                el vecino: sin maxLength); la descripción la escribe el vecino. Para el peor caso, pegá un
//                texto de 2.000 caracteres con saltos de línea, emoji y `<b>&amp;`.
//   confirmación — el municipio sale de getMunicipalityFixture (report-detail.ts) según municipality_id.
//   guardado   — solo el parámetro `reason` ('offline' | 'error'): se llega con el teléfono sin señal.
//                NoticesCard depende de `noticesAvailable` (dispositivo real + projectId): no hay fixture.
//
// createReportFixture: "Enviar reporte" sin tocar Supabase (sin esto, en modo worst se guarda de verdad un
// reporte con la dirección del fixture). Necesita `const fx = dev?.createReportFixture(input); if (fx !== undefined)
// return fx;` al principio de createReport (lib/reports.ts). municipality_id elige qué ve la confirmación:
//   demo  — reporte 4821, Muni con WhatsApp.
//   worst — reporte 128406, id par: "Villa Ciudad Parque Los Reartes" con WhatsApp (los 3 botones del pie).
//   huge  — id impar: "Comuna de San Antonio de Arredondo" sin WhatsApp ("Todavía no tenemos el WhatsApp de…").
//   empty — sin municipio (fuera de todo polígono y a más de 2 km): "no hay a quién mandárselo".
//   one   — reporte número 1.
import type { PublicReport } from '@arreglemos/shared';
import { pick } from '@/dev/data-mode';
import type { NewReport } from '@/lib/reports';

function created(input: NewReport, id: number, municipality_id: number | null): PublicReport {
  const now = new Date().toISOString();
  return {
    id,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    // Como create_report: nullif(trim(...), '').
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
    photo_path: `https://picsum.photos/seed/arreglemos-${id}/1280/960`,
    status: 'open',
    municipality_id,
    vecinos_count: 1,
    created_at: now,
    updated_at: now,
    resolved_at: null,
  };
}

export const createReportFixture = (input: NewReport): PublicReport | undefined =>
  pick({
    demo: () => created(input, 4821, 2),
    worst: () => created(input, 128406, 2),
    huge: () => created(input, 128407, 3),
    empty: () => created(input, 4822, null),
    one: () => created(input, 1, 1),
  });
