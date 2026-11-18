// Fixtures de Mis reportes (src/app/mis-reportes.tsx) y la tarjeta de cuenta.
// Qué muestra cada modo:
//   demo  — los del diseño (App.dc.html, "10 Mis reportes"); sin pendientes; anónimo con Apple y Google ("Apple o Google").
//   worst — creados y sumados mezclados, direcciones largas o nulas, "otro" con descripción larga, 1284 y 1 vecinos,
//           ahora / hace 3 años / fecha futura, foto 404, panorámica y vertical; pendientes fallidos y viejos, uno
//           sin archivo de foto; vinculado con Google y un email largo.
//   empty — sin reportes ni pendientes; vinculado con Apple pero sin proveedores en el teléfono (la tarjeta, y con
//           ella "Borrar mi cuenta", desaparece).
//   one   — un solo reporte, 1 vecino; anónimo con un solo proveedor (Google).
//   huge  — 1.000 reportes; vinculado con Apple y Google, email de "Ocultar mi email" (no se muestra).
import type { CategoryCode, PublicReport, ReportStatus } from '@arreglemos/shared';
import type { User, UserIdentity } from '@supabase/supabase-js';
import { pick } from '@/dev/data-mode';
import type { Provider } from '@/lib/account';
import type { MyReport } from '@/lib/reports';
import type { UnsentReport } from '@/lib/unsent';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const photo = (seed: string | number, w = 400, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

function report(
  id: number,
  category: CategoryCode,
  address: string | null,
  vecinos: number,
  days: number,
  status: ReportStatus = 'open',
  extra: Partial<PublicReport> = {},
): PublicReport {
  return {
    id,
    category,
    lat: -31.344,
    lng: -64.335,
    address,
    photo_path: photo(`${category}-${id}`),
    description: null,
    status,
    municipality_id: 1,
    vecinos_count: vecinos,
    created_at: ago(days),
    updated_at: ago(Math.max(days - 1, 0)),
    resolved_at: status === 'resolved' ? ago(Math.max(days - 14, 0)) : null,
    ...extra,
  };
}

const LONG_OTRO =
  'Cambiaron el poste de luz pero dejaron el viejo cortado a un metro del piso, con cables pelados colgando a la altura de la cabeza de los chicos que van a la escuela. Ya llamamos al 0800 tres veces y nos dijeron que es de EPEC, y EPEC dice que es de la Municipalidad.';

export const myReportsFixture = (): MyReport[] | undefined =>
  pick<MyReport[]>({
    demo: () => [
      { created: true, report: report(482, 'bache', 'Av. San Martín 425, La Calera', 1, 0) },
      { created: true, report: report(388, 'calle_tierra', 'Belgrano 148, La Calera', 17, 58) },
      {
        created: false,
        report: report(460, 'anegamiento', 'Vélez Sarsfield 236, La Calera', 8, 12, 'open', {
          description: 'Cada vez que llueve se junta agua y no se puede cruzar.',
        }),
      },
      { created: false, report: report(419, 'semaforo_senal', 'Rivadavia 602, La Calera', 9, 44, 'resolved') },
    ],
    worst: () => [
      // Creado ahora, "Otro" (el título no dice qué es), dirección larga, 1 vecino, foto que da 404.
      {
        created: true,
        report: report(90211, 'otro', 'Avenida Monseñor Pablo Cabrera 7400, Córdoba', 1, 0, 'open', {
          description: LONG_OTRO,
          photo_path: 'https://example.com/fotos/no-existe.jpg',
        }),
      },
      // Sumado, 1284 vecinos, hace 3 años, foto panorámica.
      {
        created: false,
        report: report(1284, 'cloaca', 'Bulevar Presidente Arturo Umberto Illia 1284, Córdoba', 1284, 3 * 365, 'open', {
          photo_path: photo('panorama', 4000, 200),
        }),
      },
      // Creado, sin dirección (calle de tierra sin nombre), fecha en el futuro (reloj del teléfono adelantado).
      { created: true, report: report(90230, 'calle_tierra', null, 1, -3) },
      // Sumado, resuelto hace 3 años, solo la localidad (el geocoder no trajo calle), foto vertical.
      {
        created: false,
        report: report(3021, 'luminaria', 'Mendiolaza', 2, 3 * 365, 'resolved', { photo_path: photo('tall', 200, 4000) }),
      },
      // Creado, el subregion del geocoder de Android como localidad.
      { created: true, report: report(90244, 'semaforo_senal', 'Avenida Doctor Amadeo Sabattini 4250, Departamento Capital', 87, 23) },
      { created: false, report: report(5510, 'arbol_caido', 'Ruta Provincial E-55 km 12, Departamento Colón', 31, 1) },
      { created: false, report: report(5511, 'vereda_rota', 'Ituzaingó 1, Córdoba', 1, 400, 'resolved') },
      { created: true, report: report(90250, 'basural', 'Fray Luis Beltrán y Cardeñosa, Villa Allende', 12, 7) },
    ],
    empty: () => [],
    one: () => [{ created: true, report: report(482, 'bache', 'Av. San Martín 425, La Calera', 1, 0) }],
    huge: () => {
      const cats: CategoryCode[] = ['bache', 'calle_tierra', 'anegamiento', 'luminaria', 'basural', 'arbol_caido', 'semaforo_senal', 'vereda_rota', 'cloaca'];
      const streets = ['Av. San Martín', 'Vélez Sarsfield', 'Belgrano', 'Rivadavia', 'Los Aromos', 'Av. Colón', 'Obispo Trejo'];
      return Array.from({ length: 1000 }, (_, i) => ({
        created: i % 3 === 0,
        report: {
          ...report(100000 + i, cats[i % cats.length], `${streets[i % streets.length]} ${100 + i}, Córdoba`, 1 + ((i * 37) % 500), i % 900, i % 5 === 0 ? 'resolved' : 'open'),
          photo_path: photo(i, 200, 200),
        },
      }));
    },
  });

// Fotos pendientes: rutas locales. La primera apunta al contenedor de una instalación vieja (iOS cambia la ruta
// de Documents al actualizar la app), así que el archivo no existe.
const STALE = 'file:///var/mobile/Containers/Data/Application/0B7C9E2A-4F1D-4C55-9A3E-6D2F8B1C0A99/Documents/pending';

export const unsentReportsFixture = (): UnsentReport[] | undefined =>
  pick<UnsentReport[]>({
    demo: () => [],
    worst: () => [
      // Rechazado hace 6 meses: "otro" con descripción larga, dirección larga, sin archivo de foto.
      {
        id: '1747000000000',
        createdAt: ago(180),
        failed: true,
        photoUri: `${STALE}/1747000000000.jpg`,
        lat: -31.42,
        lng: -64.19,
        category: 'otro',
        description: LONG_OTRO,
        address: 'Avenida Monseñor Pablo Cabrera 7400, Córdoba',
      },
      // Rechazado, sin dirección, foto remota (no es un archivo local).
      {
        id: '1763300000000',
        createdAt: ago(2),
        failed: true,
        photoUri: photo('unsent-bache'),
        lat: -31.42,
        lng: -64.19,
        category: 'bache',
      },
      // Esperando señal hace 45 días, nombre de categoría largo, archivo de foto que no existe.
      {
        id: '1759400000000',
        createdAt: ago(45),
        photoUri: `${STALE}/1759400000000.jpg`,
        lat: -31.42,
        lng: -64.19,
        category: 'cloaca',
        address: 'Bulevar Presidente Arturo Umberto Illia 1284, Córdoba',
      },
      {
        id: '1763400000000',
        createdAt: ago(0),
        photoUri: photo('unsent-semaforo'),
        lat: -31.42,
        lng: -64.19,
        category: 'semaforo_senal',
        address: 'Ruta Provincial E-55 km 12, Departamento Colón',
      },
    ],
    empty: () => [],
    one: () => [],
    huge: () => [],
  });

const identity = (provider: Provider) => ({ provider, id: `${provider}-1`, identity_id: `${provider}-1` }) as UserIdentity;
const user = (u: Partial<User>) => ({ id: 'dev-user', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: ago(30), ...u }) as User;

export const currentUserFixture = (): User | null | undefined =>
  pick<User | null>({
    demo: () => user({ is_anonymous: true, identities: [] }),
    worst: () =>
      user({
        is_anonymous: false,
        email: 'maria.florencia.etchegaray.villanueva@estudio-contable-cordoba.example.com',
        identities: [identity('google')],
      }),
    empty: () => user({ is_anonymous: false, email: 'vecino@example.com', identities: [identity('apple')] }),
    one: () => user({ is_anonymous: true, identities: [] }),
    // El alias de "Ocultar mi email" usa el dominio real de Apple: es lo que la tarjeta filtra.
    huge: () => user({ is_anonymous: false, email: 'x7k2m9p4qd@privaterelay.appleid.com', identities: [identity('apple'), identity('google')] }),
  });

export const linkProvidersFixture = (): Provider[] | undefined =>
  pick<Provider[]>({
    demo: () => ['apple', 'google'],
    worst: () => ['apple', 'google'],
    empty: () => [],
    one: () => ['google'],
    huge: () => ['apple', 'google'],
  });
