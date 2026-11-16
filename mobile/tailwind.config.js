/** Arreglemos la Calle — tokens de diseño para NativeWind v4.
 *  Los colores salen de las variables CSS de global.css (claro y oscuro).
 *
 *  Tamaño de letra del sistema: los tamaños son la base al 100%. Dejar
 *  allowFontScaling activo en todos los <Text>. Cuerpo y botones escalan hasta
 *  200% (maxFontSizeMultiplier={2}); los títulos (xl, 2xl, 3xl) hasta 150%
 *  (maxFontSizeMultiplier={1.5}) para que no rompan la pantalla.
 *
 *  Íconos: el diseño usa Material Symbols Rounded como referencia. En código,
 *  usar los equivalentes de lucide-react-native que trae React Native Reusables.
 */
const { hairlineWidth } = require('nativewind/theme');

const c = (name) => `hsl(var(--${name}))`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground'), soft: c('primary-soft'), ink: c('primary-ink') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        success: { DEFAULT: c('success'), foreground: c('success-foreground'), soft: c('success-soft'), ink: c('success-ink') },
        warning: { DEFAULT: c('warning'), foreground: c('warning-foreground'), soft: c('warning-soft'), ink: c('warning-ink') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground'), soft: c('destructive-soft'), ink: c('destructive-ink') },
      },
      fontFamily: {
        // @expo-google-fonts/rubik — una sola familia para toda la app
        sans: ['Rubik_400Regular'],
        'sans-medium': ['Rubik_500Medium'],
        'sans-semibold': ['Rubik_600SemiBold'],
        'sans-bold': ['Rubik_700Bold'],
        display: ['Rubik_800ExtraBold'],
      },
      fontSize: {
        xs: ['15px', { lineHeight: '20px' }],   // badges y metadatos
        sm: ['16px', { lineHeight: '22px' }],   // texto secundario
        base: ['18px', { lineHeight: '25px' }], // cuerpo (mínimo)
        lg: ['20px', { lineHeight: '24px' }],   // botones y énfasis
        xl: ['24px', { lineHeight: '28px' }],   // subtítulos
        '2xl': ['30px', { lineHeight: '33px' }], // título de pantalla
        '3xl': ['38px', { lineHeight: '40px' }], // número de reporte, cifras
      },
      spacing: {
        // escala de 4: 1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 (Tailwind por defecto)
        touch: '48px',  // área táctil mínima
        button: '58px', // alto mínimo del botón principal
        screen: '20px', // margen lateral de pantalla
      },
      borderRadius: {
        sm: '10px',   // miniaturas de foto
        md: '14px',   // inputs, avisos
        lg: '16px',   // botones, chips
        xl: '18px',   // tarjetas
        '2xl': '24px', // hoja inferior, mapa
        full: '9999px',
      },
      borderWidth: { hairline: hairlineWidth(), 2: '2px' },
    },
  },
  plugins: [],
};
