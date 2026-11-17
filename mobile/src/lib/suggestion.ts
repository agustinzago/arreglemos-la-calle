// Categoría sugerida por IA (#11). El pedido sale apenas hay foto y corre mientras el vecino ubica el
// pin. Si no llega en 2 s (o la Edge Function falla o no está desplegada) es "sin sugerencia": nunca se espera.
// La foto va a Anthropic (IA de terceros): la primera vez se pide permiso (App Store, guía 5.1.2(i)).
// Después se cambia con el interruptor de Mis reportes.
import 'expo-sqlite/localStorage/install';
import { CATEGORIES, type CategoryCode } from '@arreglemos/shared';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { ensureSession, supabase } from './supabase';

const TIMEOUT_MS = 2_000;
let current: { photoUri: string; suggestion: Promise<CategoryCode | null> } | undefined;

async function requestSuggestion(photoUri: string, signal: AbortSignal): Promise<CategoryCode | null> {
  // Chica alcanza para clasificar y viaja rápido (~50 KB).
  const image = await ImageManipulator.manipulate(photoUri).resize({ width: 512 }).renderAsync();
  const { base64 } = await image.saveAsync({ compress: 0.5, format: SaveFormat.JPEG, base64: true });
  await ensureSession();
  const { data } = await supabase.functions.invoke<{ category: string | null }>('suggest-category', {
    body: { image: base64 },
    signal,
  });
  return CATEGORIES.find((c) => c.code === data?.category)?.code ?? null;
}

const CONSENT = 'ai-suggestion'; // '1' aceptó, '0' no, sin valor: todavía no le preguntamos

export const aiSuggestionsOn = () => localStorage.getItem(CONSENT) === '1';
export const setAiSuggestions = (on: boolean) => localStorage.setItem(CONSENT, on ? '1' : '0');

/** Arranca el pedido para esta foto (en segundo plano), si el vecino aceptó. La primera vez, pregunta. */
export function startSuggestion(photoUri: string) {
  current = undefined;
  const consent = localStorage.getItem(CONSENT);
  if (consent === '1') return request(photoUri);
  if (consent === '0') return;
  Alert.alert(
    '¿Usamos IA para sugerirte la categoría?',
    'La foto es analizada mediante IA y no la guardamos. Lo podés cambiar en Mis reportes.',
    [
      { text: 'No', style: 'cancel', onPress: () => setAiSuggestions(false) },
      {
        text: 'Sí',
        onPress: () => {
          setAiSuggestions(true);
          request(photoUri);
        },
      },
    ],
    { cancelable: false },
  );
}

function request(photoUri: string) {
  const controller = new AbortController();
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => {
      controller.abort();
      resolve(null);
    }, TIMEOUT_MS),
  );
  const pending = requestSuggestion(photoUri, controller.signal).catch(() => null);
  current = { photoUri, suggestion: Promise.race([pending, timeout]) };
}

/** La sugerencia de esa foto: un código, o null si no hay (tardó, falló o es otra foto). */
export function suggestionFor(photoUri: string): Promise<CategoryCode | null> {
  return current?.photoUri === photoUri ? current.suggestion : Promise.resolve(null);
}
