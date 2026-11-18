// Fixtures del mapa (src/app/mapa.tsx). Hacen lo mismo que el RPC map_reports: solo lo que cae en el área,
// con los filtros, de más a menos vecinos y cortado en 500. Los reportes se ubican alrededor de un ancla
// fija (así acercarse a un grupo lo abre); si el mapa se va lejos, el ancla se muda adonde está el mapa.
import { CATEGORIES, type CategoryCode, type PublicReport } from '@arreglemos/shared';
import { pick } from '@/dev/data-mode';
import type { Area, MapFilters } from '@/lib/reports';

const DAY = 24 * 60 * 60 * 1000;
const RPC_LIMIT = 500; // supabase/migrations/20261116120900_map_reports.sql
const SPREAD = 0.01; // grados alrededor del ancla (~1 km): el área inicial del mapa es 0.02
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const photo = (seed: string, w = 400, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const MISSING_PHOTO = 'https://picsum.photos/id/99999/400/400'; // 404
// Coordenadas del mock (docs/design/export/project/App.dc.html), relativas a su centro.
const mock = (lat: number, lng: number) => ({ dLat: lat + 31.344, dLng: lng + 64.3355 });

type Row = Partial<PublicReport> & { id: number; category: CategoryCode; dLat: number; dLng: number };

const demo = (): Row[] => [
  { id: 431, category: 'bache', address: 'Av. San Martín 431, La Calera', created_at: ago(23), vecinos_count: 12, ...mock(-31.34391, -64.33546), description: 'Bache grande sobre la mano que va al centro. Ya rompió dos cubiertas.' },
  { id: 471, category: 'bache', address: 'Av. San Martín 468, La Calera', created_at: ago(4), vecinos_count: 2, ...mock(-31.34425, -64.33525) },
  { id: 467, category: 'vereda_rota', address: 'Av. San Martín 452, La Calera', created_at: ago(6), vecinos_count: 2, ...mock(-31.34384, -64.33473) },
  { id: 455, category: 'luminaria', address: 'Av. San Martín 455, La Calera', created_at: ago(9), vecinos_count: 3, ...mock(-31.34405, -64.33499) },
  { id: 402, category: 'basural', address: 'Vélez Sarsfield 210, La Calera', created_at: ago(41), vecinos_count: 31, ...mock(-31.34166, -64.33646) },
  { id: 460, category: 'anegamiento', address: 'Vélez Sarsfield 236, La Calera', created_at: ago(12), vecinos_count: 8, ...mock(-31.34143, -64.3362), description: 'Cada vez que llueve se junta agua y no se puede cruzar.' },
  { id: 388, category: 'calle_tierra', address: 'Belgrano 148, La Calera', created_at: ago(58), vecinos_count: 17, ...mock(-31.34283, -64.33257) },
  { id: 419, category: 'semaforo_senal', status: 'resolved', resolved_at: ago(14), address: 'Rivadavia 602, La Calera', created_at: ago(44), vecinos_count: 9, ...mock(-31.34607, -64.33457), description: 'El semáforo de la esquina quedó en amarillo intermitente.' },
  { id: 444, category: 'arbol_caido', status: 'resolved', resolved_at: ago(7), address: 'Rivadavia 640, La Calera', created_at: ago(18), vecinos_count: 5, ...mock(-31.34625, -64.3342) },
  { id: 476, category: 'cloaca', address: 'Los Aromos 77, La Calera', created_at: ago(3), vecinos_count: 14, ...mock(-31.3449, -64.33804) },
];

// Ocho reportes en el mismo punto exacto (misma esquina, mismo pin): un grupo que no se separa.
const stack = (): Row[] =>
  (['bache', 'basural', 'luminaria', 'bache', 'vereda_rota', 'anegamiento', 'bache', 'arbol_caido'] as const).map((category, i) => ({
    id: 9010 + i,
    category,
    status: i % 3 === 2 ? 'resolved' : 'open',
    vecinos_count: [5, 4, 3, 3, 2, 1, 1, 1][i],
    address: 'Av. San Martín 600, La Calera',
    created_at: ago(i * 5),
    dLat: -0.0012,
    dLng: 0.0016,
  }));

// La lista sale ordenada por vecinos, así que cada falla lleva un conteo distinto para quedar arriba.
const worst = (): Row[] => [
  { id: 9001, category: 'bache', vecinos_count: 1284, address: 'Bulevar Presidente Arturo Umberto Illia 1150, Estación Juárez Celman', created_at: ago(3 * 365 + 1), photo_path: photo('panorama', 4000, 200), dLat: 0.0021, dLng: -0.0018 },
  { id: 9002, category: 'otro', vecinos_count: 312, address: null, photo_path: MISSING_PHOTO, created_at: ago(334), dLat: 0.0008, dLng: 0.0031,
    description: 'Cartel de PARE doblado sobre la vereda desde la tormenta del sábado. Los chicos que salen de la escuela tienen que bajar a la calle para pasar y los autos vienen rápido por la bajada.\nYa avisamos al 0800 y nadie vino.' },
  { id: 9003, category: 'cloaca', vecinos_count: 87, status: 'resolved', resolved_at: ago(0), address: 'Avenida Monseñor Pablo Cabrera 5250, Córdoba', photo_path: photo('tall', 200, 4000), created_at: ago(2), dLat: -0.0029, dLng: -0.0024 },
  { id: 9004, category: 'luminaria', vecinos_count: 31, address: 'Ruta Provincial E-55, La Calera', created_at: new Date().toISOString(), dLat: 0.0034, dLng: 0.0009 },
  { id: 9005, category: 'calle_tierra', vecinos_count: 12, address: 'La Calera', created_at: ago(-0.1) /* reloj del teléfono atrasado */, dLat: -0.0004, dLng: -0.0035 },
  ...stack(),
  { id: 9006, category: 'semaforo_senal', vecinos_count: 2, status: 'resolved', resolved_at: ago(30), address: 'Av. Rafael Núñez 4625, Córdoba', created_at: ago(400), dLat: -0.0036, dLng: 0.0027 },
  { id: 9007, category: 'arbol_caido', vecinos_count: 1, address: 'Av. Japón 1100, Córdoba', created_at: ago(1), dLat: 0.0015, dLng: -0.0006 },
];

const one = (): Row[] => [{ id: 1, category: 'bache', address: 'Av. San Martín 431, La Calera', created_at: ago(1), dLat: 0, dLng: 0 }];

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const huge = (): Row[] =>
  Array.from({ length: 1000 }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length].code;
    return {
      id: 10_000 + i,
      category,
      status: rand(4 * i) < 0.25 ? 'resolved' : 'open',
      vecinos_count: 1 + Math.floor(rand(4 * i + 1) ** 3 * 400),
      address: `Calle ${i + 1} ${100 + (i % 900)}, La Calera`,
      description: category === 'otro' ? 'Cartel caído' : null,
      created_at: ago(Math.floor(rand(4 * i + 2) * 400)),
      dLat: (rand(4 * i + 3) - 0.5) * 2 * SPREAD,
      dLng: (rand(4 * i + 5) - 0.5) * 2 * SPREAD,
    };
  });

let anchor: { lat: number; lng: number } | undefined;
function anchorIn(a: Area) {
  const near = anchor && a.north > anchor.lat - SPREAD && a.south < anchor.lat + SPREAD && a.east > anchor.lng - SPREAD && a.west < anchor.lng + SPREAD;
  if (!anchor || !near) anchor = { lat: (a.south + a.north) / 2, lng: (a.west + a.east) / 2 };
  return anchor;
}

function toReport({ dLat, dLng, ...r }: Row, at: { lat: number; lng: number }): PublicReport {
  const created_at = r.created_at ?? ago(1);
  return {
    lat: at.lat + dLat,
    lng: at.lng + dLng,
    address: null,
    photo_path: photo(`r${r.id}`),
    description: null,
    status: 'open',
    municipality_id: 1,
    vecinos_count: 1,
    updated_at: created_at,
    resolved_at: r.status === 'resolved' ? created_at : null,
    ...r,
    created_at,
  };
}

export const mapReportsFixture = (area: Area, filters: MapFilters): PublicReport[] | undefined => {
  const rows = pick<Row[]>({ demo, worst, empty: () => [], one, huge });
  if (!rows) return undefined;
  const at = anchorIn(area);
  return rows
    .map((r) => toReport(r, at))
    .filter(
      (r) =>
        r.lat >= area.south &&
        r.lat <= area.north &&
        r.lng >= area.west &&
        r.lng <= area.east &&
        (filters.category === null || r.category === filters.category) &&
        (filters.status === null || r.status === filters.status),
    )
    .sort((a, b) => b.vecinos_count - a.vecinos_count || b.created_at.localeCompare(a.created_at))
    .slice(0, RPC_LIMIT);
};
