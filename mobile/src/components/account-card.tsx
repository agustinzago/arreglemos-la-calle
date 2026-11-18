// "Vincular cuenta" (historias 55–56 de #1), al pie de Mis reportes. Anónimo: vincular Apple o Google
// para no perder los reportes (en otro teléfono, el mismo botón entra con la cuenta y los trae).
// Vinculado: con qué cuenta y "Borrar mi cuenta", que Apple exige. Sin proveedores no se muestra.
import type { User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ShieldCheck, Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/components/report';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { currentUser, deleteAccount, linkAccount, linkProviders, type Provider } from '@/lib/account';

const NAME: Record<Provider, string> = { apple: 'Apple', google: 'Google' };

/** `onChange`: cambió el vecino (entró con otra cuenta o borró la suya), hay que recargar la lista. */
export function AccountCard({ onChange }: { onChange: () => void }) {
  const theme = useTheme();
  const dark = useColorScheme().colorScheme === 'dark';
  const [providers, setProviders] = useState<Provider[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    linkProviders().then(setProviders, () => {});
    currentUser().then(setUser);
  }, []);

  async function run(action: () => Promise<void>, failTitle: string) {
    setBusy(true);
    try {
      await action();
    } catch {
      Alert.alert(failTitle, 'Revisá tu conexión y probá de nuevo.');
    } finally {
      setUser(await currentUser());
      setBusy(false);
    }
  }

  function link(provider: Provider) {
    run(async () => {
      const result = await linkAccount(provider);
      if (result.status !== 'exists') return;
      Alert.alert(
        `Esa cuenta de ${NAME[provider]} ya tiene reportes`,
        'Está vinculada en otro teléfono. Si entrás con ella vas a ver sus reportes; lo que hiciste en este teléfono sin vincular queda afuera.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Entrar',
            onPress: () => run(() => result.signIn().then(onChange), 'No pudimos entrar con tu cuenta'),
          },
        ],
      );
    }, 'No pudimos vincular tu cuenta');
  }

  function remove() {
    Alert.alert(
      '¿Borrar tu cuenta?',
      'Se borran los reportes que creaste y sus fotos, y la cuenta deja de estar vinculada. Donde te sumaste o marcaste arreglado sigue contando, sin tu nombre. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => run(() => deleteAccount().then(onChange), 'No pudimos borrar tu cuenta'),
        },
      ],
    );
  }

  if (!providers.length || !user) return null;

  const linked = (user.identities ?? []).map((i) => i.provider).filter((p): p is Provider => p in NAME);
  if (!user.is_anonymous && linked.length) {
    return (
      <View className="mt-4 gap-3 rounded-xl border border-border bg-card p-4">
        <View role="status" className="flex-row items-start gap-3">
          <ShieldCheck color={theme.successInk} size={24} />
          <View className="shrink">
            <Text className="font-sans-bold">Cuenta vinculada con {linked.map((p) => NAME[p]).join(' y ')}</Text>
            {/* Con "Ocultar mi email" Apple manda un alias (…@privaterelay.appleid.com): no sirve mostrarlo. */}
            {user.email && !user.email.endsWith('@privaterelay.appleid.com') && <Text variant="muted">{user.email}</Text>}
          </View>
        </View>
        <Button variant="ghost" size="sm" className="min-h-[52px] rounded-md" disabled={busy} onPress={remove}>
          <Trash2 color={theme.destructiveInk} size={22} />
          <Text className="text-destructive-ink">Borrar mi cuenta</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="mt-4 gap-3 rounded-xl border border-border bg-card p-4">
      <Text className="font-sans-bold">No pierdas tus reportes</Text>
      <Text variant="muted">
        Vinculá tu cuenta de {providers.map((p) => NAME[p]).join(' o ')}. Si cambiás de teléfono, entrás con ella y los
        recuperás. Es opcional.
      </Text>
      {busy ? (
        <ActivityIndicator color={theme.primary} className="min-h-[52px]" />
      ) : (
        providers.map((p) =>
          p === 'apple' ? (
            <AppleAuthentication.AppleAuthenticationButton
              key={p}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={14}
              style={{ width: '100%', height: 52 }}
              onPress={() => link(p)}
            />
          ) : (
            <Button key={p} variant="outline" size="sm" className="min-h-[52px] rounded-md" onPress={() => link(p)}>
              <GoogleLogo />
              <Text>Continuar con Google</Text>
            </Button>
          ),
        )
      )}
    </View>
  );
}

/** La "G" de Google en colores, como pide su guía de marca para el botón de entrar. */
function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}
