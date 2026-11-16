import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Borra la cuenta del vecino (historia 56 de #1, exigido por Apple): primero sus fotos con la API de
 * Storage (la base no deja borrarlas con SQL), después delete_my_account borra sus reportes, deja
 * anónimos sus eventos en reportes ajenos y borra el usuario. Lo usan la app y el test del contrato.
 */
export async function deleteAccount(client: SupabaseClient, uid: string) {
  const photos = client.storage.from('photos');
  for (;;) {
    const { data: files, error } = await photos.list(uid, { limit: 100 });
    if (error) throw error;
    if (!files.length) break;
    const { data: removed, error: removeError } = await photos.remove(files.map((f) => `${uid}/${f.name}`));
    if (removeError) throw removeError;
    if (!removed.length) throw new Error('photos_not_removed');
  }
  const { error } = await client.rpc('delete_my_account');
  if (error) throw error;
}
