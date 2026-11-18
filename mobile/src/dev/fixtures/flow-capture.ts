// Fixtures del arranque del reporte: dirección del pin (ubicacion.tsx), categoría sugerida (categoria.tsx)
// y cercanos (cercanos.tsx). La dirección sigue por los parámetros hasta detalles/confirmación.
// Qué muestra cada modo:
//   demo  — "Av. San Martín 425, La Calera"; sugiere Bache; 3 cercanos del diseño (App.dc.html, "05").
//   worst — calle larga + rango de numeración de Android + sin ciudad (cae a "Departamento Capital");
//           sugiere "Semáforo o señal rota" (4ª fila: el "Sugerido" pisa el chip de arriba); 3 cercanos
//           (el máximo del RPC): a 1 m y a 100 m (radio máximo, calle_tierra), 1284 y 1 vecinos,
//           dirección larga / nula / casi igual a otra, foto 404, panorámica y vertical.
//   empty — el geocoder no devuelve nada ("No encontramos la dirección…"); sin sugerencia; sin cercanos.
//   one   — calle de tierra sin nombre: solo la localidad ("Mendiolaza"); un solo cercano, 1 vecino.
//   huge  — los cercanos son como mucho 3 (limit 3 del RPC): igual que worst. Dirección y sugerencia reales.
import type { CategoryCode, NearbyReport } from '@arreglemos/shared';
import type { LocationGeocodedAddress } from 'expo-location';
import { pick } from '@/dev/data-mode';

const photo = (seed: string, w = 400, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

function geocoded(street: string | null, streetNumber: string | null, city: string | null, extra: Partial<LocationGeocodedAddress> = {}): LocationGeocodedAddress {
  return {
    street,
    streetNumber,
    city,
    district: null,
    region: 'Córdoba',
    subregion: null,
    country: 'Argentina',
    postalCode: null,
    name: null,
    isoCountryCode: 'AR',
    timezone: 'America/Argentina/Cordoba',
    formattedAddress: null,
    ...extra,
  };
}

const WORST_STREET = 'Avenida Doctor Amadeo Sabattini';

export const reverseGeocodeFixture = (): LocationGeocodedAddress[] | undefined =>
  pick({
    demo: () => [geocoded('Av. San Martín', '425', 'La Calera', { postalCode: 'X5151', subregion: 'Departamento Colón' })],
    // Android da rangos de numeración ("4201-4299") y a veces sin locality: formatAddress cae a subregion.
    worst: () => [
      geocoded(WORST_STREET, '4201-4299', null, {
        district: 'Ampliación Ferreyra',
        subregion: 'Departamento Capital',
        postalCode: 'X5016',
        name: `${WORST_STREET} 4201-4299`,
        formattedAddress: `${WORST_STREET} 4201-4299, X5016 Córdoba, Argentina`,
      }),
    ],
    empty: () => [],
    one: () => [geocoded(null, null, 'Mendiolaza', { subregion: 'Departamento Colón' })],
  });

export const suggestionFixture = (): CategoryCode | null | undefined =>
  pick<CategoryCode | null>({ demo: () => 'bache', worst: () => 'semaforo_senal', empty: () => null });

// "Otro" siempre trae descripción (check de la base); su primera línea es el título (reportTitle).
function nearby(
  id: number,
  category: string,
  address: string | null,
  distance_m: number,
  vecinos_count: number,
  photo_path: string,
  description: string | null = null,
): NearbyReport {
  return {
    id,
    category: category as CategoryCode,
    lat: -31.344,
    lng: -64.335,
    address,
    photo_path,
    description: description ?? (category === 'otro' ? 'Cartel caído' : null),
    status: 'open',
    municipality_id: 1,
    vecinos_count,
    created_at: '2026-10-02T13:00:00Z',
    updated_at: '2026-11-17T09:30:00Z',
    resolved_at: null,
    distance_m,
  };
}

// Si la categoría es "Otro": primera línea larga (el título de la tarjeta) y el detalle abajo.
const LONG_OTRO =
  'Tapa de la boca de tormenta corrida en la esquina, quedó un agujero de medio metro al lado del cordón y de noche no se ve\nYa se cayó un ciclista el martes.';

const worstNearby = (category: string) => [
  // A menos de 1 m (se redondea a "a 1 m"), 1284 vecinos, dirección larga, foto que da 404.
  nearby(90231, category, `${WORST_STREET} 4201-4299, Departamento Capital`, 0.4, 1284, 'https://example.com/fotos/no-existe.jpg', LONG_OTRO),
  // Sin dirección (el geocoder no la encontró), 1 vecino, en el borde del radio más grande, panorámica.
  nearby(90232, category, null, 99.6, 1, photo('panorama', 4000, 200)),
  // Casi la misma dirección que la primera: solo cambia el final. Foto vertical.
  nearby(90233, category, `${WORST_STREET} 4250, Departamento Capital`, 37.5, 87, photo('tall', 200, 4000), 'Poste de luz inclinado sobre la vereda'),
];

export const nearbyReportsFixture = (_lat: number, _lng: number, category: string): NearbyReport[] | undefined =>
  pick({
    demo: () => [
      nearby(431, category, 'Av. San Martín 431', 20, 12, photo('dup-431')),
      nearby(471, category, 'Av. San Martín 468', 60, 2, photo('dup-471')),
      nearby(467, category, 'Av. San Martín 452', 90, 2, photo('dup-467')),
    ],
    worst: () => worstNearby(category),
    empty: () => [],
    one: () => [nearby(482, category, 'Av. San Martín 431, La Calera', 8.2, 1, photo('dup-482'))],
    huge: () => worstNearby(category),
  });
