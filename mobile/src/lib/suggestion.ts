// Categoría sugerida por IA (#11). El pedido sale apenas hay foto y corre mientras el vecino ubica el
// pin. Si no llega en 2 s (o la Edge Function falla o no está desplegada) es "sin sugerencia": nunca se espera.
import { CATEGORIES, type CategoryCode } from '@arreglemos/shared';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
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

/** Arranca el pedido para esta foto (en segundo plano, sin bloquear). */
export function startSuggestion(photoUri: string) {
  const controller = new AbortController();
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => {
      controller.abort();
      resolve(null);
    }, TIMEOUT_MS),
  );
  const request = requestSuggestion(photoUri, controller.signal).catch(() => null);
  current = { photoUri, suggestion: Promise.race([request, timeout]) };
}

/** La sugerencia de esa foto: un código, o null si no hay (tardó, falló o es otra foto). */
export function suggestionFor(photoUri: string): Promise<CategoryCode | null> {
  return current?.photoUri === photoUri ? current.suggestion : Promise.resolve(null);
}
