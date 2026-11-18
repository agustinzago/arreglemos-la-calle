// Fixtures de la pantalla del reporte (src/app/reporte/[id].tsx). También los usa confirmacion.tsx (getMunicipality).
// Devuelven algo para cualquier id (las filas del mapa y de Mis reportes linkean acá) y varían con el id:
//   worst: id % 6 → 0 "otro" larguísimo, 1.284 vecinos, 3 años, tuyo, foto panorámica; 1.288 eventos: tu
//                     "sigue roto" y "arreglado" llegan en la segunda página (ver listEventsFixture)
//                   1 recién creado, sin dirección ni municipio, foto que no carga, 1 vecino
//                   2 creado "en el futuro" (reloj del teléfono atrasado 3 min), te sumaste, Muni con WhatsApp
//                   3 resuelto 1 día después, hace 400 días (fechas sin año), te sumaste
//                   4 resuelto el mismo día hace 3 años, solo localidad (calle de tierra), Muni con WhatsApp
//                   5 categoría que esta versión no conoce (una app vieja), URL larga pegada
//   empty: id par → null (no disponible); id impar → reporte sin historia ni municipio
//   one: todo en 1 (1 vecino, 1 día); id impar resuelto en 1 día. huge: 1.000 eventos, ~400 en la historia.
// Municipio (getMunicipalityFixture): worst/huge → id impar: "Comuna de San Antonio de Arredondo" con
//   whatsapp null; id par: "Villa Ciudad Parque Los Reartes" con WhatsApp. empty → null. demo/one → con WhatsApp.
import type { CategoryCode, PublicMunicipality, PublicReport, PublicReportEvent } from '@arreglemos/shared';
import { pick } from '@/dev/data-mode';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

// Número sin asignar a propósito: tocar "Enviar a la Muni" en desarrollo no le escribe a nadie de verdad.
const FAKE_WA = '5490000000000';
const PHOTO = (seed: string | number) => `https://picsum.photos/seed/arreglemos-${seed}/1280/960`;
const PANORAMA = 'https://picsum.photos/seed/arreglemos-pano/4000/200';
const TALL = 'https://picsum.photos/seed/arreglemos-tall/200/4000';
const BROKEN = 'https://example.com/fotos/no-existe.jpg';

type Ev = [type: PublicReportEvent['type'], mine?: boolean, photo?: string];
type Detail = { report: PublicReport; events: PublicReportEvent[] };

/** Arma reporte + historia coherentes: eventos repartidos de created_at a resolved_at (o ahora), vecinos_count = sumate. */
function make(id: number, r: Partial<PublicReport>, evs: Ev[]): Detail {
  const report: PublicReport = {
    id,
    category: 'bache',
    lat: -31.344,
    lng: -64.3352,
    address: null,
    photo_path: PHOTO(id),
    description: null,
    status: 'open',
    municipality_id: 1,
    vecinos_count: 0,
    created_at: ago(DAY),
    updated_at: ago(HOUR),
    resolved_at: null,
    ...r,
  };
  const start = Date.parse(report.created_at);
  const end = report.resolved_at ? Date.parse(report.resolved_at) : Math.max(Date.now(), start);
  const events = evs.map(([type, mine = false, photo]: Ev, i): PublicReportEvent => ({
    id: id * 10_000 + i,
    report_id: id,
    type,
    photo_path: photo ?? null,
    mine,
    created_at: new Date(start + ((end - start) * i) / Math.max(evs.length - 1, 1)).toISOString(),
  }));
  report.vecinos_count = events.filter((e) => e.type === 'sumate').length;
  return { report, events };
}

const others = (n: number): Ev[] => Array.from({ length: n }, () => ['sumate'] as Ev);

// El mock del diseño (docs/design/export/project/App.dc.html, REPORTS): categoría, dirección, días, vecinos, arreglado hace, descripción.
const DEMO: [CategoryCode, string, number, number, number?, string?][] = [
  ['bache', 'Av. San Martín 431', 23, 12, undefined, 'Bache grande sobre la mano que va al centro. Ya rompió dos cubiertas.'],
  ['bache', 'Av. San Martín 468', 4, 2],
  ['vereda_rota', 'Av. San Martín 452', 6, 2],
  ['luminaria', 'Av. San Martín 455', 9, 3],
  ['basural', 'Vélez Sarsfield 210', 41, 31],
  ['anegamiento', 'Vélez Sarsfield 236', 12, 8, undefined, 'Cada vez que llueve se junta agua y no se puede cruzar.'],
  ['calle_tierra', 'Belgrano 148', 58, 17],
  ['semaforo_senal', 'Rivadavia 602', 44, 9, 14, 'El semáforo de la esquina quedó en amarillo intermitente.'],
  ['arbol_caido', 'Rivadavia 640', 18, 5, 7],
  ['cloaca', 'Los Aromos 77', 3, 14],
];

function demo(id: number): Detail {
  const [category, address, days, vec, fixedAgo, description] = DEMO[Math.abs(id) % DEMO.length];
  const fixed = fixedAgo !== undefined;
  return make(
    id,
    { category, address, description: description ?? null, created_at: ago(days * DAY), status: fixed ? 'resolved' : 'open', resolved_at: fixed ? ago(fixedAgo * DAY) : null },
    [['sumate'], ...others(vec - 1), ...(fixed ? ([['resuelto'], ['resuelto', false, PHOTO(`${id}-arreglado`)]] as Ev[]) : [])],
  );
}

// "Otro" + lo que agregó, unidos con \n como en detalles.tsx. Sin límite en la base ni maxLength en el formulario.
const PASTED = `Poste de hormigón inclinado sobre la vereda, con cables colgando
Hace TRES AÑOS que está así. Ya hicimos el reclamo al 0800 de la Muni varias veces (reclamo n° 2023-0045871, después el 2024-0112093 y el último 2025-0098812) y nunca vino nadie.

El poste está frente a la escuela y los chicos pasan por debajo todos los días a las 7:30 y a las 13. Con el viento del domingo se inclinó todavía más y ahora los cables quedan a la altura de la cabeza de un adulto.

La empresa dice que es de la Municipalidad y la Municipalidad dice que es de la empresa 🙄

Les dejo la nota que salió en el diario: https://www.example.com/ciudadanos/vecinos-de-barrio-alberdi-reclaman-por-un-poste-a-punto-de-caer-frente-a-una-escuela/

Por favor súmense así nos dan bola!!!`;

const WORST: ((id: number) => Detail)[] = [
  (id) =>
    make(
      id,
      { category: 'otro', description: PASTED, address: 'Avenida Intendente Ramón Bautista Mestre Norte 2850, Córdoba', photo_path: PANORAMA, created_at: ago(3 * YEAR + 40 * DAY), municipality_id: 1 },
      [['sumate', true], ...others(1283), ['resuelto', false, PANORAMA], ['resuelto', false, BROKEN], ['sigue_roto', true], ['resuelto', true, TALL]],
    ),
  (id) => make(id, { category: 'calle_tierra', photo_path: BROKEN, created_at: ago(30_000), municipality_id: null }, [['sumate']]),
  (id) =>
    make(
      id,
      { category: 'semaforo_senal', address: 'Bv. Presidente Arturo Umberto Illia 1284, Córdoba', created_at: ago(-3 * MIN), municipality_id: 2 },
      [['sumate'], ['sumate'], ['sumate', true]],
    ),
  (id) =>
    make(
      id,
      { category: 'luminaria', address: 'Av. Colón 5100, Córdoba', description: 'Está apagada toda la cuadra.', created_at: ago(400 * DAY), resolved_at: ago(399 * DAY - 2 * HOUR), status: 'resolved', municipality_id: 3 },
      [['sumate'], ...others(85), ['sumate', true], ['resuelto', false, BROKEN], ['resuelto']],
    ),
  (id) =>
    make(
      id,
      { category: 'anegamiento', address: 'Villa Ciudad Parque Los Reartes', description: 'Se inunda toda la cuadra 🌧️🌧️ cada vez que llueve', created_at: ago(3 * YEAR), resolved_at: ago(3 * YEAR - 3 * HOUR), status: 'resolved', municipality_id: 4 },
      [['sumate'], ['resuelto'], ['resuelto', false, PANORAMA]],
    ),
  (id) =>
    make(
      id,
      {
        // Una categoría agregada después (otra migración): las apps viejas reciben un código que no conocen.
        category: 'poste_caido' as CategoryCode,
        description: 'Mirá: https://m.example.com/groups/vecinosdebarriogeneralpaz/permalink/1284567890123456/?mibextid=Nif5oz&ref=share',
        created_at: ago(DAY + HOUR),
        municipality_id: 5,
      },
      [['sumate'], ...others(11)],
    ),
];

// Disputado durante 3 años: tandas de 7 sumate cortadas por arreglado, arreglado, sigue roto.
const CYCLE: Ev[] = [...others(7), ['resuelto'], ['resuelto'], ['sigue_roto']];
const huge = (id: number) =>
  make(
    id,
    { category: 'bache', address: 'Av. San Martín 431, Villa Allende', created_at: ago(3 * YEAR), resolved_at: ago(HOUR), status: 'resolved', municipality_id: 1 },
    [['sumate'], ...Array.from({ length: 999 }, (_, i): Ev => (i === 500 ? ['sumate', true] : i % 50 === 8 ? ['resuelto', false, PHOTO(i)] : CYCLE[i % 10]))],
  );

const one = (id: number) =>
  id % 2
    ? make(id, { address: 'Av. San Martín 431', created_at: ago(2 * DAY), resolved_at: ago(DAY - HOUR), status: 'resolved' }, [['sumate'], ['resuelto'], ['resuelto']])
    : make(id, { address: 'Av. San Martín 431', created_at: ago(DAY + HOUR) }, [['sumate']]);

const empty = (id: number) => (id % 2 ? make(id, { municipality_id: null }, []) : null);

// Un id que no es número (deep link roto) da NaN: sin fixture, va al backend de verdad como en producción.
const detail = (id: number) =>
  Number.isFinite(id)
    ? pick<Detail | null>({ demo: () => demo(id), worst: () => WORST[Math.abs(id) % WORST.length](id), empty: () => empty(id), one: () => one(id), huge: () => huge(id) })
    : undefined;

export const getReportFixture = (id: number): PublicReport | null | undefined => {
  const d = detail(id);
  return d === undefined ? undefined : (d?.report ?? null);
};

// Una página de .range(from, to), cortada como Supabase en "Max rows" (1.000 por defecto): así worst 0
// (1.288 eventos) pasa por dos páginas y huge (1.000 justos) pide una segunda que vuelve vacía.
const MAX_ROWS = 1000;
export const listEventsFixture = (reportId: number, from: number, to: number): PublicReportEvent[] | undefined => {
  const d = detail(reportId);
  return d === undefined ? undefined : (d?.events ?? []).slice(from, Math.min(to + 1, from + MAX_ROWS));
};

const longName = (id: number): PublicMunicipality =>
  id % 2
    ? { id, name: 'Comuna de San Antonio de Arredondo', whatsapp: null }
    : { id, name: 'Villa Ciudad Parque Los Reartes', whatsapp: FAKE_WA };

export const getMunicipalityFixture = (id: number): PublicMunicipality | null | undefined =>
  pick<PublicMunicipality | null>({
    demo: () => ({ id, name: 'Villa Allende', whatsapp: FAKE_WA }),
    worst: () => longName(id),
    huge: () => longName(id),
    one: () => ({ id, name: 'Córdoba', whatsapp: FAKE_WA }),
    empty: () => null,
  });
