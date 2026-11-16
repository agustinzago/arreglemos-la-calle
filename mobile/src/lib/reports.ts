import type { CategoryCode, PublicReport } from '@arreglemos/shared';
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

export type Area = { west: number; south: number; east: number; north: number };
export type MapFilters = { category: CategoryCode | null; status: 'open' | 'resolved' | null };

/** Operación "mapa" del contrato: reportes no ocultos del área visible, de más a menos vecinos. */
export async function mapReports(area: Area, filters: MapFilters): Promise<PublicReport[]> {
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

export const photoUrl = (path: string) => supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
