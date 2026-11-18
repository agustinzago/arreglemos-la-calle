// Curvas de animación compartidas. Copiadas tal cual de la auditoría de animaciones: no aproximar.
import { cubicBezier } from 'react-native-reanimated';

/** Ease-out fuerte para UI: arranca rápido y frena suave. Para transiciones CSS de Reanimated. */
export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
