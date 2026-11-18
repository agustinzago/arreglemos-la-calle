import {
  ADDRESS_MAX,
  DESCRIPTION_MAX,
  type CategoryCode,
  type NearbyReport,
  type PublicMunicipality,
  type PublicReport,
  type PublicReportEvent,
} from '@arreglemos/shared';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ensureSession, supabase } from './supabase';

// Solo desarrollo: fixtures de break-ui (src/dev). En release __DEV__ es false y Metro saca el require.
const dev: typeof import('@/dev/fixtures') | null = __DEV__ ? require('@/dev/fixtures') : null;

/** Achica la foto y la vuelve a codificar como JPEG: el archivo nuevo no lleva EXIF (Ley 25.326). */
export async function compressWithoutExif(uri: string) {
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1280 }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Sube una foto ya sin EXIF a la carpeta del vecino. Si ya estaba (409: un reintento), la reusa. */
async function uploadPhoto(userId: string, name: string, uri: string) {
  const path = `${userId}/${name}.jpg`;
  const bytes = await new File(uri).arrayBuffer();
  const upload = await supabase.storage.from('photos').upload(path, bytes, { contentType: 'image/jpeg' });
  if (upload.error && !('statusCode' in upload.error && upload.error.statusCode === '409')) throw upload.error;
  return path;
}

export type NewReport = {
  photoUri: string;
  lat: number;
  lng: number;
  category: CategoryCode;
  description?: string;
  address?: string;
};

/** Operación "crear reporte" del contrato: sube la foto a la carpeta del vecino y llama a create_report. */
export async function createReport(input: NewReport, photoName = String(Date.now())): Promise<PublicReport> {
  const fx = dev?.createReportFixture(input);
  if (fx !== undefined) return fx;
  dev?.assertLiveData();
  return sendReport({ ...input, photoUri: await compressWithoutExif(input.photoUri) }, photoName);
}

/**
 * Como createReport, con la foto ya comprimida. Reintentar con el mismo `photoName` no duplica: la foto
 * ya subida se reusa y create_report rechaza una segunda vez la misma foto (23505).
 */
export async function sendReport(input: NewReport, photoName: string): Promise<PublicReport> {
  const user = await ensureSession();
  const path = await uploadPhoto(user.id, photoName, input.photoUri);

  const { data, error } = await supabase.rpc('create_report', {
    p_photo_path: path,
    p_lat: input.lat,
    p_lng: input.lng,
    p_category: input.category,
    p_description: input.description?.slice(0, DESCRIPTION_MAX),
    p_address: input.address?.slice(0, ADDRESS_MAX),
  });
  if (error) throw error;
  return data as PublicReport;
}

export type Area = { west: number; south: number; east: number; north: number };
export type MapFilters = { category: CategoryCode | null; status: 'open' | 'resolved' | null };

/** Operación "mapa" del contrato: reportes no ocultos del área visible, de más a menos vecinos. */
export async function mapReports(area: Area, filters: MapFilters): Promise<PublicReport[]> {
  const fx = dev?.mapReportsFixture(area, filters);
  if (fx !== undefined) return fx;
  const { data, error } = await supabase.rpc('map_reports', {
    p_west: area.west,
    p_south: area.south,
    p_east: area.east,
    p_north: area.north,
    p_category: filters.category,
    p_status: filters.status,
  });
  if (error) throw error;
  return data as PublicReport[];
}

/** Operación "reportes cercanos": hasta 3 abiertos de la categoría dentro de su radio de duplicado, del más cercano. */
export async function nearbyReports(lat: number, lng: number, category: CategoryCode): Promise<NearbyReport[]> {
  const fx = dev?.nearbyReportsFixture(lat, lng, category);
  if (fx !== undefined) return fx;
  await ensureSession();
  const { data, error } = await supabase.rpc('nearby_reports', { p_lat: lat, p_lng: lng, p_category: category });
  if (error) throw error;
  return data as NearbyReport[];
}

/** Un reporte público; null si no existe o está oculto. */
export async function getReport(id: number): Promise<PublicReport | null> {
  const fx = dev?.getReportFixture(id);
  if (fx !== undefined) return fx;
  const { data, error } = await supabase.from('reports_public').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PublicReport | null;
}

/**
 * La historia del reporte, en orden. Con sesión, `mine` marca los eventos de este vecino.
 * Supabase corta cada select en "Max rows" (1.000 por defecto): sin paginar, un reporte con más de 1.000
 * eventos perdía los últimos, justo los que dicen si este vecino se sumó o avisó que está arreglado.
 */
// ponytail: una pedida por cada 1.000 eventos (N/1000). Si pesa, la base devuelve los flags del vecino
// (tuyo, te sumaste, avisaste arreglado) y la historia ya agrupada, y acá se piden solo los últimos.
export async function listEvents(reportId: number): Promise<PublicReportEvent[]> {
  const PAGE = 1000; // igual o menor que "Max rows" del proyecto: una página corta es la última
  const events: PublicReportEvent[] = [];
  for (let from = 0; ; from += PAGE) {
    let page = dev?.listEventsFixture(reportId, from, from + PAGE - 1);
    if (page === undefined) {
      await ensureSession();
      const { data, error } = await supabase
        .from('report_events_public')
        .select('*')
        .eq('report_id', reportId)
        .order('id')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      page = data as PublicReportEvent[];
    }
    events.push(...page);
    if (page.length < PAGE) return events;
  }
}

export async function getMunicipality(id: number): Promise<PublicMunicipality | null> {
  const fx = dev?.getMunicipalityFixture(id);
  if (fx !== undefined) return fx;
  const { data, error } = await supabase.from('municipalities_public').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PublicMunicipality | null;
}

/** Operación "registrar evento": sumarse. Si ya estaba sumado, el error es `duplicate_event`. */
export async function joinReport(reportId: number): Promise<PublicReport> {
  dev?.assertLiveData();
  await ensureSession();
  const { data, error } = await supabase.rpc('register_event', { p_report_id: reportId, p_type: 'sumate' });
  if (error) throw error;
  return data as PublicReport;
}

/**
 * Operación "registrar evento" para marcar arreglado (foto opcional, sin EXIF), sigue roto o denunciar.
 * Devuelve el reporte con el estado recalculado. Errores: `duplicate_event`, `not_open`, `not_resolved`.
 */
export async function registerEvent(
  reportId: number,
  type: 'resuelto' | 'sigue_roto' | 'denuncia',
  photoUri?: string,
): Promise<PublicReport> {
  dev?.assertLiveData();
  const user = await ensureSession();
  const path = photoUri ? await uploadPhoto(user.id, String(Date.now()), await compressWithoutExif(photoUri)) : undefined;
  const { data, error } = await supabase.rpc('register_event', { p_report_id: reportId, p_type: type, p_photo_path: path });
  if (error) throw error;
  return data as PublicReport;
}

/** Bloquear a quien publicó el reporte (guía 1.2 de Apple): este vecino deja de ver sus reportes y movimientos. */
export async function blockReportAuthor(reportId: number) {
  dev?.assertLiveData();
  await ensureSession();
  const { error } = await supabase.rpc('block_report_author', { p_report_id: reportId });
  if (error) throw error;
}

// En desarrollo, un fixture puede poner una URL entera como photo_path.
export const photoUrl = (path: string) =>
  __DEV__ && /^https?:\/\//.test(path) ? path : supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;

/** Un reporte de "Mis reportes": `created` = lo creó este vecino; si no, se sumó. */
export type MyReport = { report: PublicReport; created: boolean };

/** Operación "mis reportes": los que creó y a los que se sumó, del más reciente al más viejo (sin ocultos). */
export async function myReports(): Promise<MyReport[]> {
  const fx = dev?.myReportsFixture();
  if (fx !== undefined) return fx;
  await ensureSession();
  const { data, error } = await supabase.rpc('my_reports');
  if (error) throw error;
  return data as MyReport[];
}

// Base del link a /r/[id]. EXPO_PUBLIC_WEB_URL (mobile/.env) lo pisa, por ejemplo para probar un preview.
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://arreglemoslacalle.app';
