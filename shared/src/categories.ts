// Lista fija de categorías (spec #1). Los códigos son estables y la base los valida con un
// check en public.reports.category: agregar uno es una migración más este archivo.
export const CATEGORIES = [
  { code: 'bache', label: 'Bache' },
  { code: 'calle_tierra', label: 'Calle de tierra en mal estado' },
  { code: 'anegamiento', label: 'Anegamiento / desagüe tapado' },
  { code: 'luminaria', label: 'Luminaria apagada' },
  { code: 'basural', label: 'Basural / residuos' },
  { code: 'arbol_caido', label: 'Árbol o rama caída' },
  { code: 'semaforo_senal', label: 'Semáforo / señal rota' },
  { code: 'vereda_rota', label: 'Vereda rota' },
  { code: 'cloaca', label: 'Cloaca desbordada' },
  { code: 'otro', label: 'Otro' },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]['code'];

export const categoryLabel = (code: string) => CATEGORIES.find((c) => c.code === code)?.label ?? code;
