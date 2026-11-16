// Helpers de los tests del contrato: vecinos anónimos reales contra el proyecto de test.
// Cada archivo llama `afterAll(cleanup)`: borra lo que crearon sus vecinos (filas, fotos y usuarios).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}: copiá .env.example a .env (ver README)`);
  return value;
}

const url = env('SUPABASE_URL');
const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Clave secreta: saltea grants y RLS. Solo para preparar y limpiar, nunca para lo que se prueba. */
export const admin = createClient(url, env('SUPABASE_SECRET_KEY'), opts);

/** Cliente sin sesión, como la web pública. */
export const anon = () => createClient(url, env('SUPABASE_PUBLISHABLE_KEY'), opts);

export type Vecino = { client: SupabaseClient; id: string };

const userIds: string[] = [];
const photoPaths: string[] = [];

/** Un vecino nuevo con sesión anónima, como la app al abrirse por primera vez. */
export async function vecino(): Promise<Vecino> {
  const client = anon();
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error; // 429: subir el límite de sesiones anónimas del proyecto de test
  userIds.push(data.user!.id);
  return { client, id: data.user!.id };
}

/** Sube una foto (unos bytes alcanzan) a la carpeta del vecino y devuelve su ruta. */
export async function uploadPhoto(v: Vecino): Promise<string> {
  const path = `${v.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await v.client.storage
    .from('photos')
    .upload(path, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: 'image/jpeg' });
  if (error) throw error;
  photoPaths.push(path);
  return path;
}

type ReportInput = { lat: number; lng: number; category?: string; description?: string; address?: string };

/** Llama a la operación "crear reporte" con una foto recién subida. Devuelve { data, error } de supabase-js. */
export async function createReport(v: Vecino, input: ReportInput) {
  return v.client.rpc('create_report', {
    p_photo_path: await uploadPhoto(v),
    p_lat: input.lat,
    p_lng: input.lng,
    p_category: input.category ?? 'bache',
    p_description: input.description,
    p_address: input.address,
  });
}

export async function cleanup() {
  const ids = userIds.splice(0);
  const paths = photoPaths.splice(0);
  if (ids.length) {
    const { error } = await admin.from('reports').delete().in('device_id', ids);
    if (error) throw error;
  }
  if (paths.length) await admin.storage.from('photos').remove(paths);
  for (const id of ids) await admin.auth.admin.deleteUser(id);
}

/** Puntos de prueba (lat, lng) verificados contra los polígonos de IDECOR. */
export const PLACES = {
  laCalera: { lat: -31.344, lng: -64.3355 },
  cordoba: { lat: -31.4167, lng: -64.1833 },
  villaAllende: { lat: -31.295, lng: -64.295 },
  sierras: { lat: -31.2, lng: -64.6 }, // fuera de todo municipio
};
