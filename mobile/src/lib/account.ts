// Vincular la cuenta (historias 55–56 de #1, ADR-0004). El vecino anónimo suma una identidad de Apple
// o Google con linkIdentity sobre su sesión: el auth.uid() no cambia, así que conserva todo lo que hizo.
// En otro teléfono, la misma cuenta ya está vinculada a otro vecino: linkIdentity falla con
// identity_already_exists y la app ofrece entrar con ella (signInWithIdToken), que trae sus reportes.
// Pasos de Supabase, Apple y Google: README, "Pendiente humano".
import { deleteAccount as deleteAccountData } from '@arreglemos/shared';
import type { User } from '@supabase/supabase-js';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { forgetNotices, refreshNoticesToken } from './notices';
import { ensureSession, supabase } from './supabase';

// Solo desarrollo: fixtures de break-ui (src/dev). En release __DEV__ es false y Metro saca el require.
const dev: typeof import('@/dev/fixtures') | null = __DEV__ ? require('@/dev/fixtures') : null;

export type Provider = 'apple' | 'google';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
// Google necesita un build de desarrollo (no anda en Expo Go) y los client IDs (con el de iOS,
// app.config.ts suma el plugin con su iosUrlScheme).
const googleAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  !!googleWebClientId &&
  (Platform.OS !== 'ios' || !!googleIosClientId);

/** Con qué se puede vincular en este teléfono: Apple solo en iOS. */
export async function linkProviders(): Promise<Provider[]> {
  const fx = dev?.linkProvidersFixture();
  if (fx !== undefined) return fx;
  const apple = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
  return [...(apple ? (['apple'] as const) : []), ...(googleAvailable ? (['google'] as const) : [])];
}

/** El id token del proveedor, o null si el vecino canceló. */
async function idToken(provider: Provider): Promise<string | null> {
  if (provider === 'apple') {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      return credential.identityToken;
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
      throw e;
    }
  }
  // Import diferido: el módulo nativo no existe en Expo Go y romperría al cargar la pantalla.
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId });
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') return null;
  return response.data.idToken;
}

export type LinkResult =
  | { status: 'linked' | 'cancelled' }
  /** La cuenta ya es de otro vecino (otro teléfono): `signIn` entra con ella. */
  | { status: 'exists'; signIn: () => Promise<void> };

export async function linkAccount(provider: Provider): Promise<LinkResult> {
  dev?.assertLiveData();
  await ensureSession();
  const token = await idToken(provider);
  if (!token) return { status: 'cancelled' };
  const { error } = await supabase.auth.linkIdentity({ provider, token });
  if (error?.code === 'identity_already_exists') {
    return {
      status: 'exists',
      signIn: async () => {
        // El mismo token sirve para entrar; si ya venció, se pide de nuevo.
        let { error } = await supabase.auth.signInWithIdToken({ provider, token });
        if (error) {
          const again = await idToken(provider);
          if (!again) return;
          ({ error } = await supabase.auth.signInWithIdToken({ provider, token: again }));
        }
        if (error) throw error;
        // Los avisos que este teléfono ya tenía aceptados pasan a la cuenta con la que entró.
        await refreshNoticesToken().catch(() => {});
      },
    };
  }
  if (error) throw error;
  // La sesión que devuelve el vínculo trae el usuario sin la identidad nueva (identities vacío), y la
  // tarjeta seguía mostrando "No pierdas tus reportes". Refrescarla trae el usuario completo.
  await supabase.auth.refreshSession();
  return { status: 'linked' };
}

/** El vecino actual, para saber si ya vinculó (is_anonymous false) y con qué. */
export async function currentUser(): Promise<User | null> {
  const fx = dev?.currentUserFixture();
  if (fx !== undefined) return fx;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/** Borra la cuenta y todo lo suyo (exigido por Apple); el teléfono sigue como un vecino anónimo nuevo. */
export async function deleteAccount() {
  dev?.assertLiveData();
  const user = await currentUser();
  if (!user) return;
  await deleteAccountData(supabase, user.id);
  await supabase.auth.signOut({ scope: 'local' });
  forgetNotices();
  await ensureSession();
}
