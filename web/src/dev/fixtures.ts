// Solo desarrollo (break-ui): ?data=demo|worst|empty|one|huge reemplaza lo que devuelve Supabase en /r/[id] y
// /ranking/[municipio]. Sin el parámetro, o fuera de `next dev`, se leen los datos reales.
// Las fotos son URLs enteras: photoUrl las deja pasar en desarrollo.
import { connection } from "next/server";
import type { CategoryCode, PublicMunicipality, PublicReport } from "@arreglemos/shared";

export const MODES = ["demo", "worst", "empty", "one", "huge"] as const;
export type DataMode = (typeof MODES)[number];

/** El modo de ?data=…; null en producción (ni mira searchParams) o sin parámetro. */
export async function dataMode(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  if (process.env.NODE_ENV !== "development") return null;
  const v = (await searchParams).data;
  const mode = MODES.find((m) => m === v) ?? null;
  // Los fixtures no hacen I/O: sin esto el prerender de desarrollo llega al Date.now() de la página y se queja.
  if (mode) await connection();
  return mode;
}

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const PHOTO = (seed: string) => `https://picsum.photos/seed/${seed}/1280/960`;
const PANORAMA = "https://picsum.photos/seed/panorama/4000/200";
const BROKEN = "https://picsum.photos/id/1/no-existe.jpg"; // 404

const LA_CALERA: PublicMunicipality = { id: 1, name: "La Calera", whatsapp: "5493543000000" };
const CORDOBA: PublicMunicipality = { id: 2, name: "Córdoba", whatsapp: null };
// El nombre más largo del Gran Córdoba con el estilo de idecor (una comuna, no un municipio).
const LONG_MUNI: PublicMunicipality = { id: 3, name: "Villa Ciudad Parque Los Reartes", whatsapp: null };
const MUNIS = [LA_CALERA, CORDOBA, LONG_MUNI];

type Row = Partial<PublicReport> & { id: number; category: CategoryCode };
const report = (r: Row): PublicReport => ({
  lat: -31.343,
  lng: -64.335,
  address: null,
  photo_path: PHOTO(String(r.id)),
  description: null,
  status: "open",
  municipality_id: LA_CALERA.id,
  vecinos_count: 1,
  created_at: ago(12),
  updated_at: ago(1),
  resolved_at: null,
  ...r,
});

// "Otro" en la app: descripción = `${otro}\n${detalle}` (mobile/src/app/detalles.tsx). Sin límite en la base ni en la app.
const LONG_DESCRIPTION = (
  "Cable de luz colgando sobre la vereda\n" +
  "Hace tres años que el cable de media tensión cuelga a la altura de la cabeza frente a la escuela. <b>URGENTE</b>: " +
  "ya lo reclamamos por nota, por el 0800 y por mail, y nada. Peligro &amp; riesgo eléctrico para los chicos.\n\n" +
  "Salió en el diario: https://example.com/noticias/cordoba/2026/11/vecinos-de-barrio-general-paz-reclaman-por-un-cable-de-media-tension-que-cuelga-hace-tres-anos?utm_source=whatsapp&utm_medium=social\n\n" +
  "Cuando llueve chispea y se corta la luz en toda la cuadra. Los vecinos de la esquina pusieron una cinta pero el viento la vuela. " +
  "Pedimos que venga la cuadrilla de EPEC o de la Muni, la que corresponda, antes de que pase algo. ".repeat(12)
).slice(0, 2000);

const ADDR_LONG = "Avenida Intendente Ramón Bautista Mestre Norte 1250, Córdoba";
const ADDR_LONG_2 = "Boulevard Presidente Arturo Umberto Illia 3800, Córdoba";
const ADDR_RURAL = "Camino a San Antonio de Arredondo, Villa Ciudad Parque Los Reartes";

const CATS: CategoryCode[] = ["bache", "luminaria", "basural", "calle_tierra", "vereda_rota", "cloaca", "anegamiento"];

// Una función y no constantes: "hace 0 días" se calcula en cada request, no cuando arrancó el server.
function reports(mode: DataMode): PublicReport[] {
  switch (mode) {
    case "demo":
      return [
        report({ id: 128, category: "bache", address: "Av. San Martín 425, La Calera", vecinos_count: 19, photo_path: PHOTO("bache") }),
        report({ id: 131, category: "luminaria", address: "Belgrano y Sarmiento, La Calera", vecinos_count: 14, created_at: ago(9) }),
        report({ id: 140, category: "calle_tierra", address: "Los Algarrobos 1200, La Calera", vecinos_count: 11, created_at: ago(30) }),
        report({ id: 152, category: "basural", address: "Ruta E55 km 9, La Calera", vecinos_count: 8, created_at: ago(5) }),
        report({ id: 160, category: "vereda_rota", address: "Gral. Paz 80, La Calera", vecinos_count: 4, created_at: ago(2) }),
      ];
    // Una falla distinta por fila (las primeras son las que se ven). /r/1..7?data=worst muestra cada una.
    case "worst":
      return [
        report({
          id: 1, category: "otro", address: ADDR_LONG, municipality_id: CORDOBA.id, description: LONG_DESCRIPTION,
          vecinos_count: 1284, created_at: ago(1095), photo_path: PANORAMA, lat: -31.4135, lng: -64.1811,
        }),
        report({ id: 2, category: "bache", vecinos_count: 312, created_at: ago(0), municipality_id: null, photo_path: BROKEN }),
        report({ id: 3, category: "calle_tierra", address: ADDR_RURAL, municipality_id: LONG_MUNI.id, vecinos_count: 57, created_at: ago(1100) }),
        // Creado "en el futuro": el reloj de la base va unos minutos adelante del server de la web.
        report({ id: 4, category: "semaforo_senal", address: ADDR_LONG_2, municipality_id: CORDOBA.id, vecinos_count: 2, created_at: ago(-5 / 1440) }),
        report({ id: 5, category: "arbol_caido", vecinos_count: 1, created_at: ago(40), status: "resolved", resolved_at: ago(39) }),
        report({ id: 6, category: "anegamiento", address: "Calle 1, La Calera", status: "resolved", created_at: ago(0.2), resolved_at: ago(0.1) }),
        report({ id: 7, category: "cloaca", address: ADDR_LONG_2, municipality_id: CORDOBA.id, created_at: ago(1) }),
      ];
    case "empty":
      return [];
    case "one":
      return [
        report({ id: 9, category: "bache", address: "Av. San Martín 425, La Calera", created_at: ago(1.2) }),
        report({ id: 10, category: "luminaria", address: "Belgrano 12, La Calera", status: "resolved", created_at: ago(3), resolved_at: ago(1.8) }),
      ];
    // El RPC corta en least(p_limit, 100); la web no pasa p_limit (5), así que 100 es el techo si alguien lo sube.
    case "huge":
      return Array.from({ length: 100 }, (_, i) =>
        report({
          id: 1_048_576 + i, category: CATS[i % CATS.length], address: i % 3 ? ADDR_LONG : ADDR_LONG_2, municipality_id: CORDOBA.id,
          vecinos_count: 25_000 - i * 211, created_at: ago(1100 - i * 7), photo_path: PHOTO(`h${i}`),
        }),
      );
  }
}

/** Lo que leería getReport de Supabase: el reporte con ese id (o el primero del modo) y su municipio. */
export function reportFixture(mode: DataMode, id: string) {
  const list = reports(mode);
  const r = list.find((x) => String(x.id) === id) ?? list[0];
  if (!r) return null;
  return { report: r, municipality: MUNIS.find((m) => m.id === r.municipality_id) ?? null };
}

const byDays = (list: PublicReport[]) => [...list].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
const open = (list: PublicReport[]) => list.filter((r) => r.status === "open");

/** Lo que leería getRanking: el municipio y la respuesta de weekly_ranking. */
export function rankingFixture(mode: DataMode) {
  const r = open(reports(mode));
  const top = (list: PublicReport[]) => list.slice(0, mode === "huge" ? 100 : 5);
  const ranking = {
    by_vecinos: top([...r].sort((a, b) => b.vecinos_count - a.vecinos_count)),
    by_days: top(byDays(r)),
    open_count: { demo: 42, worst: 1284, empty: 0, one: 1, huge: 12_840 }[mode],
    resolved_week: { demo: 7, worst: 0, empty: 0, one: 1, huge: 1284 }[mode],
    vecinos: { demo: 213, worst: 15_873, empty: 0, one: 1, huge: 98_765 }[mode],
  };
  const municipality = { demo: LA_CALERA, worst: LONG_MUNI, empty: LA_CALERA, one: LA_CALERA, huge: CORDOBA }[mode];
  return { municipality, ranking };
}
