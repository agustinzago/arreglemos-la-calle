import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver mobile/.env.example)');

export const supabase = createClient(url, key, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/** El vecino es anónimo por dispositivo (ADR-0004): la primera vez se crea la sesión, después se reusa. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signIn.user!;
}
