import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

// Espejo en JS de los tokens de src/global.css, para lo que no lee className
// (navegación, íconos de lucide, marcadores del mapa). Agregá tokens acá a medida que hagan falta.
export const THEME = {
  light: {
    background: 'hsl(220 20% 96%)',
    foreground: 'hsl(224 32% 12%)',
    card: 'hsl(0 0% 100%)',
    border: 'hsl(220 14% 80%)',
    primary: 'hsl(226 72% 40%)',
    primaryForeground: 'hsl(0 0% 100%)',
    primaryInk: 'hsl(226 75% 32%)',
    mutedForeground: 'hsl(222 12% 34%)',
    successInk: 'hsl(152 60% 18%)',
    warningInk: 'hsl(36 90% 22%)',
    destructiveInk: 'hsl(356 75% 34%)',
    warning: 'hsl(45 100% 51%)',
    warningForeground: 'hsl(224 32% 12%)',
    success: 'hsl(152 60% 24%)',
    destructive: 'hsl(356 72% 42%)',
  },
  dark: {
    background: 'hsl(224 24% 8%)',
    foreground: 'hsl(220 25% 94%)',
    card: 'hsl(224 20% 13%)',
    border: 'hsl(224 12% 30%)',
    primary: 'hsl(224 95% 74%)',
    primaryForeground: 'hsl(224 40% 10%)',
    primaryInk: 'hsl(224 100% 80%)',
    mutedForeground: 'hsl(220 14% 72%)',
    successInk: 'hsl(146 52% 72%)',
    warningInk: 'hsl(46 95% 68%)',
    destructiveInk: 'hsl(356 92% 78%)',
    warning: 'hsl(46 100% 58%)',
    warningForeground: 'hsl(224 32% 10%)',
    success: 'hsl(146 50% 60%)',
    destructive: 'hsl(356 90% 72%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
