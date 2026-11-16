// Lista fija de categorías (spec #1, nombres de CONTEXT.md). Los códigos son estables y la base los valida
// con un check en public.reports.category: agregar uno es una migración más este archivo.
export const CATEGORIES = [
  { code: 'bache', label: 'Bache' },
  { code: 'calle_tierra', label: 'Calle de tierra en mal estado' },
  { code: 'anegamiento', label: 'Anegamiento' },
  { code: 'luminaria', label: 'Luminaria apagada' },
  { code: 'basural', label: 'Basural' },
  { code: 'arbol_caido', label: 'Árbol caído' },
  { code: 'semaforo_senal', label: 'Semáforo o señal rota' },
  { code: 'vereda_rota', label: 'Vereda rota' },
  { code: 'cloaca', label: 'Cloaca desbordada' },
  { code: 'otro', label: 'Otro' },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

export const categoryLabel = (code: string) => CATEGORIES.find((c) => c.code === code)?.label ?? code;

// Nombres cortos para listas, mapa y filtros (diseño). Los que no están acá usan el nombre completo.
const SHORT_LABELS: Partial<Record<CategoryCode, string>> = {
  calle_tierra: 'Calle de tierra',
  semaforo_senal: 'Semáforo roto',
};

export const categoryShortLabel = (code: string) => SHORT_LABELS[code as CategoryCode] ?? categoryLabel(code);
