import type { CategoryCode, PublicMunicipality, PublicReport, PublicReportEvent } from '@arreglemos/shared';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ensureSession, supabase } from './supabase';

/** Achica la foto y la vuelve a codificar como JPEG: el archivo nuevo no lleva EXIF (Ley 25.326). */
async function compressWithoutExif(uri: string) {
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1280 }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  return saved.uri;
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
export async function createReport(input: NewReport): Promise<PublicReport> {
  const user = await ensureSession();
  const path = `${user.id}/${Date.now()}.jpg`;
  const bytes = await new File(await compressWithoutExif(input.photoUri)).arrayBuffer();
  const upload = await supabase.storage.from('photos').upload(path, bytes, { contentType: 'image/jpeg' });
  if (upload.error) throw upload.error;

  const { data, error } = await supabase.rpc('create_report', {
    p_photo_path: path,
    p_lat: input.lat,
    p_lng: input.lng,
    p_category: input.category,
    p_description: input.description,
    p_address: input.address,
  });
  if (error) throw error;
  return data as PublicReport;
}

/** Lectura pública para el mapa básico. El mapa con área visible y filtros es #9. */
export async function listReports(): Promise<PublicReport[]> {
  const { data, error } = await supabase
    .from('reports_public')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data as PublicReport[];
}

/** Un reporte público; null si no existe o está oculto. */
export async function getReport(id: number): Promise<PublicReport | null> {
  const { data, error } = await supabase.from('reports_public').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PublicReport | null;
}

/** La historia del reporte, en orden. Con sesión, `mine` marca los eventos de este vecino. */
export async function listEvents(reportId: number): Promise<PublicReportEvent[]> {
  await ensureSession();
  const { data, error } = await supabase.from('report_events_public').select('*').eq('report_id', reportId).order('id');
  if (error) throw error;
  return data as PublicReportEvent[];
}

export async function getMunicipality(id: number): Promise<PublicMunicipality | null> {
  const { data, error } = await supabase.from('municipalities_public').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PublicMunicipality | null;
}

/** Operación "registrar evento": sumarse. Si ya estaba sumado, el error es `duplicate_event`. */
export async function joinReport(reportId: number): Promise<PublicReport> {
  await ensureSession();
  const { data, error } = await supabase.rpc('register_event', { p_report_id: reportId, p_type: 'sumate' });
  if (error) throw error;
  return data as PublicReport;
}

export const photoUrl = (path: string) => supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
