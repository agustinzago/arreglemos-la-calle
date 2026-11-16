import type { ConfigContext, ExpoConfig } from 'expo/config';

// La config está en app.json (scripts/push-setup.sh y eas init escriben ahí). Esto solo suma lo que
// viene de variables de entorno: en EAS Build salen de las variables de EAS (ver README, Lanzamiento).
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    // Google Sign-In (vincular cuenta) necesita en iOS el esquema de URL del client ID de iOS al revés. Sin la
    // variable no se suma el plugin y la app no ofrece Google en iOS (ver lib/account.ts).
    plugins: [
      ...(config.plugins ?? []),
      ...(googleIosClientId
        ? [
            [
              '@react-native-google-signin/google-signin',
              { iosUrlScheme: `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}` },
            ] as [string, unknown],
          ]
        : []),
    ],
    android: {
      ...config.android,
      // Firebase (push): variable de EAS de tipo archivo, o el archivo local si se commiteó.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
      // Mapa de Android (react-native-maps usa Google Maps). Sin key el mapa queda gris fuera de Expo Go.
      config: { ...config.android?.config, googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
    },
  }) as ExpoConfig;
