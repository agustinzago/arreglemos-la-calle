import type { CategoryCode, PublicMunicipality, PublicReport } from '@arreglemos/shared';
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

export async function getMunicipality(id: number): Promise<PublicMunicipality | null> {
  const { data, error } = await supabase.from('municipalities_public').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as PublicMunicipality | null;
}

// ponytail: dominio sin decidir; EXPO_PUBLIC_WEB_URL (mobile/.env) lo pisa. Base del link a /r/[id].
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://arreglemoslacalle.example';
