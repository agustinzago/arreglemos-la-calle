// Lecturas de la web: del lado del servidor, con la clave publicable (lo mismo que ve cualquiera).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/** Se crea al primer uso, no al importar: el build no necesita las variables. */
export const db = () =>
  (client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));

export const photoUrl = (path: string) => db().storage.from("photos").getPublicUrl(path).data.publicUrl;
