import type { CategoryCode } from '@arreglemos/shared';
import {
  Construction,
  Droplets,
  Ellipsis,
  Footprints,
  LightbulbOff,
  Mountain,
  TrafficCone,
  Trash2,
  TreeDeciduous,
  Waves,
} from 'lucide-react-native';

/** Ícono de cada categoría (docs/design: Material Symbols → lucide). Siempre van con su texto. */
export const CATEGORY_ICONS: Record<CategoryCode, typeof Construction> = {
  bache: Construction,
  calle_tierra: Mountain,
  anegamiento: Waves,
  luminaria: LightbulbOff,
  basural: Trash2,
  arbol_caido: TreeDeciduous,
  semaforo_senal: TrafficCone,
  vereda_rota: Footprints,
  cloaca: Droplets,
  otro: Ellipsis,
};

/** El ícono de un reporte. Un código que esta versión no conoce usa el de "Otro" (si no, la pantalla rompe). */
export const categoryIcon = (code: string) => CATEGORY_ICONS[code as CategoryCode] ?? Ellipsis;
