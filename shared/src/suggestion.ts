// Categoría sugerida por IA (#11). Lo usa la Edge Function suggest-category (Deno), por eso el import
// lleva la extensión .ts y este archivo no se re-exporta desde index.ts (la app no lo necesita).
import { CATEGORIES, type CategoryCode } from './categories.ts';

// "otro" no se sugiere: obligaría a escribir un texto y no ayuda en nada.
const SUGGESTABLE = CATEGORIES.filter((c) => c.code !== 'otro');

export const SUGGESTION_PROMPT = [
  'Sos un clasificador de fotos de problemas de la calle en Córdoba, Argentina.',
  'Respondé solo con uno de estos códigos, sin nada más:',
  ...SUGGESTABLE.map((c) => `${c.code}: ${c.label}`),
  'Si la foto no muestra claramente uno de esos problemas, respondé: ninguna',
].join('\n');

/** Respuesta del modelo → código de categoría válido, o null ("sin sugerencia"). */
export function parseSuggestion(text: unknown): CategoryCode | null {
  if (typeof text !== 'string') return null;
  // Toma los códigos que aparecen como palabra entera; si hay uno solo, es ese.
  const found = new Set(text.toLowerCase().match(/[a-z_]+/g));
  const matches = SUGGESTABLE.filter((c) => found.has(c.code));
  return matches.length === 1 ? matches[0].code : null;
}
