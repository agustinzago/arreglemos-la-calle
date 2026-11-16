// Ubicación de una foto de galería y dirección leída del pin (#3).

/**
 * Lee la posición GPS del EXIF que devuelve expo-image-picker. iOS da valores positivos con el signo
 * en *Ref ('S'/'W'); Android ya los da con signo. Sin GPS (o con 0,0, que escriben algunas cámaras) → null.
 */
export function gpsFromExif(exif: Record<string, unknown> | null | undefined): { lat: number; lng: number } | null {
  if (!exif) return null;
  const lat = signed(exif.GPSLatitude, exif.GPSLatitudeRef, 'S');
  const lng = signed(exif.GPSLongitude, exif.GPSLongitudeRef, 'W');
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function signed(value: unknown, ref: unknown, negative: 'S' | 'W') {
  if (value == null || value === '') return null;
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  if (ref === negative) return -Math.abs(v);
  return ref ? Math.abs(v) : v;
}

type GeocodedAddress = {
  street?: string | null;
  streetNumber?: string | null;
  city?: string | null;
  subregion?: string | null;
  district?: string | null;
};

/** "Av. San Martín 425, La Calera" a partir de reverseGeocodeAsync. Las calles de tierra suelen venir sin calle. */
export function formatAddress(a: GeocodedAddress | null | undefined): string | null {
  if (!a) return null;
  const street = a.street ? [a.street, a.streetNumber].filter(Boolean).join(' ') : null;
  const locality = a.city ?? a.subregion ?? a.district ?? null;
  return [street, locality].filter(Boolean).join(', ') || null;
}
