// Curvas de animación compartidas. Copiadas tal cual de la auditoría de animaciones: no aproximar.
import { cubicBezier, Easing, SlideInDown } from 'react-native-reanimated';

/** Ease-out fuerte para UI: arranca rápido y frena suave. Para transiciones CSS de Reanimated. */
export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** Curva de hoja de iOS. Para animaciones `entering` de Reanimated. */
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

/** Entrada de una hoja inferior: sube desde abajo. Con "Reducir movimiento", Reanimated la saltea sola. */
export const SHEET_ENTERING = SlideInDown.duration(300).easing(EASE_SHEET);
