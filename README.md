# Arreglemos la Calle

App cívica para reportar problemas de la calle con una foto. Vocabulario en `CONTEXT.md`, decisiones en `docs/adr/`, spec en el issue #1.

## Estructura

```
mobile/     App Expo (SDK 58, Expo Router, NativeWind v4, React Native Reusables). Rutas en mobile/src/app/
shared/     @arreglemos/shared: código TS sin build que usan la app, la web y los tests (categorías, tipos)
supabase/   migrations/ (SQL con timestamp) y scripts/ (generador de municipios desde IDECOR)
tests/      Tests del contrato del backend: vitest + supabase-js contra el proyecto de Supabase de test
web/        Next.js 16 (solo lectura): /r/[id] (reporte con Open Graph), /ranking/[municipio], /privacidad, /soporte. Lee el .env de la raíz
```

Workspace de pnpm (`nodeLinker: hoisted`, lo necesita NativeWind). Node 24, pnpm 11.

## Puesta en marcha

```sh
pnpm install
cp .env.example .env                 # credenciales del proyecto de Supabase de TEST
cp mobile/.env.example mobile/.env   # URL y clave publicable para la app
```

En el proyecto de Supabase: activar "Allow anonymous sign-ins" y subir el límite de sesiones anónimas por IP (Auth → Rate Limits), si no los tests reciben 429.

## Comandos

```sh
pnpm test          # tests del contrato (lee .env o las variables de entorno)
pnpm typecheck     # tsc de la app y de la web
pnpm --filter web dev                            # web en localhost:3000 (el test de OG hace next build + start solo)

cd mobile
npx expo start                                   # desarrollo (Expo Go o dev build)
npx expo export --platform ios --platform android --output-dir /tmp/export   # bundle completo sin simulador
npx expo install <paquete>                       # agregar dependencias a la app
```

## Migraciones

Sin Docker ni Supabase local: las migraciones se aplican con psql sobre el proyecto de test (y después producción).

```sh
set -a; . ./.env; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/migrations/<archivo>.sql
```

- Un archivo nuevo por cambio, `supabase/migrations/<YYYYMMDDHHMMSS>_<nombre>.sql`. No se editan migraciones ya aplicadas.
- Escribirlas re-ejecutables (`if not exists`, `create or replace`, `on conflict do nothing`).
- La base de test es compartida: nunca borrar ni resetear el esquema; los tests crean sus datos y los borran al terminar.
- Municipios: `node supabase/scripts/municipalities-sql.mjs > supabase/migrations/<timestamp>_municipalities.sql`.

## Edge Functions

`supabase/functions/suggest-category`: recibe la foto y le pide a Claude Haiku 5.5 la categoría sugerida. Importa
`shared/src/suggestion.ts` (prompt y parser, con test en `tests/suggestion.test.ts`). Si no está desplegada, la app
sigue igual: ningún chip aparece marcado. Desplegar es un paso humano (hace falta un access token de Supabase):

```sh
export SUPABASE_ACCESS_TOKEN=sbp_…   # Dashboard → Account → Access Tokens
npx supabase@3.1.0 secrets set ANTHROPIC_API_KEY=sk-ant-… --remote=<project-ref> --yes
npx supabase@3.1.0 functions deploy suggest-category --use-api --remote=<project-ref> --yes
```

La key de Anthropic va solo como secreto de la función, nunca en la app ni en `.env`. Dejar la verificación de JWT
activada (default): la app la llama con la sesión anónima del vecino.

## Avisos push

Cuando un reporte pasa a resuelto o vuelve a abierto, un trigger de la base (`notify_status_change`,
migración `*_notices.sql`) avisa a quienes lo crearon o se sumaron y aceptaron los avisos: guarda cada aviso
en `public.notices` y los manda a la API de push de Expo con `pg_net`. No hay Edge Function que desplegar.
Las respuestas de Expo quedan en `net._http_response`.

La app solo ofrece "¿Te avisamos cuando lo arreglen?" si tiene `extra.eas.projectId` y corre en un teléfono
real. Los pasos humanos (cuenta de Expo, `eas init`, Firebase/FCM, APNs, build de desarrollo y la prueba
de punta a punta) están en un asistente:

```sh
bash scripts/push-setup.sh
```

## Cuentas (vincular Apple o Google)

El vecino es anónimo (ADR-0004). En Mis reportes puede vincular Apple (solo iOS) o Google: la app pide el id token
nativo (`expo-apple-authentication`, `@react-native-google-signin/google-signin`) y llama
`supabase.auth.linkIdentity({ provider, token })` sobre la sesión anónima, así que el `auth.uid()` no cambia y conserva
todo lo que hizo. En otro teléfono el mismo botón falla con `identity_already_exists` y la app ofrece entrar con esa
cuenta (`signInWithIdToken`), que trae sus reportes. Con la cuenta vinculada aparece "Borrar mi cuenta" (Apple lo
exige): borra las fotos de su carpeta con la API de Storage y llama `delete_my_account` (migración
`*_delete_account.sql`). Google no anda en Expo Go (hace falta un build de desarrollo); sin los client IDs la app no lo
ofrece, y `mobile/app.config.ts` suma el plugin de Google solo si está `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Apple anda en Expo Go si se agrega `host.exp.Exponent` a los Client IDs de Apple en Supabase.

## Builds de la app

`mobile/eas.json` tiene tres perfiles de EAS Build:

- `development`: dev client (expo-dev-client), instalación interna. Se usa con `npx expo start --dev-client`.
- `preview`: build normal para probar en teléfonos (APK en Android), instalación interna.
- `production`: para las tiendas (AAB en Android). Sube solo el número de build.

`mobile/.env` no se commitea, así que en EAS Build no existe: las `EXPO_PUBLIC_*` salen de las variables de
EAS del environment del perfil (`development`, `preview`, `production`; ver Lanzamiento). `mobile/app.config.ts`
suma a `app.json` lo que viene de variables: `GOOGLE_MAPS_API_KEY` (mapa en Android) y `GOOGLE_SERVICES_JSON`
(Firebase, para los avisos) y, con `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, el plugin de Google Sign-In. La config que queda: `cd mobile && npx expo config --type public`.

Versiones: `appVersionSource: "remote"`, así que EAS guarda el `buildNumber` de iOS y el `versionCode` de Android
y `production` los sube en cada build (`autoIncrement`). La versión que ve la gente es `expo.version` en
`mobile/app.json`: subirla a mano en cada release a las tiendas (1.0.0 → 1.0.1 o 1.1.0).

```sh
cd mobile
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform ios     # y --platform android
```

## Lanzamiento

Lo que es código ya está. Esto es lo que hace una persona, más o menos en este orden.

### Supabase de producción

- [ ] Crear el proyecto de producción (el de test queda para los tests) y aplicar todas las migraciones en orden
      con su `SUPABASE_DB_URL` (ver Migraciones).
- [ ] Auth → Sign In / Providers: activar "Allow anonymous sign-ins" y "Allow manual linking" (vincular cuenta, ver
      Cuentas).
- [ ] Auth → Rate Limits: dejar el límite de inicios de sesión anónimos por IP en el default (30 por hora). Si
      vecinos de una misma red móvil (comparten IP) reciben error al abrir la app por primera vez, subirlo.
- [ ] Auth → Attack Protection: **no** activar el CAPTCHA todavía. Con CAPTCHA, `signInAnonymously` tiene que
      mandar un `captchaToken` y la app no lo hace: nadie podría entrar. Activarlo requiere sumar Turnstile o
      hCaptcha a la app primero.
- [ ] Desplegar `suggest-category` en producción (ver Edge Functions).
- [ ] Cargar el WhatsApp de cada municipio activo. Número con código de país, como lo pide wa.me (549 + característica
      sin 0 + número sin 15). Sin número la app no muestra "Enviar a la Muni":

  ```sql
  update public.municipalities set whatsapp = '5493543000000' where name = 'La Calera';
  select name, whatsapp from public.municipalities where active and whatsapp is not null;
  ```

### Dominio y web (Vercel)

- [x] Comprar el dominio: `arreglemoslacalle.app` (ya es el default de la web y de la app).
- [ ] Vercel → Add New Project → importar el repo, Root Directory `web` (Next.js, pnpm y Node 24 los detecta solo).
- [ ] Variables del proyecto (Production): `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` de producción,
      `SITE_URL=https://arreglemoslacalle.app` (og:url y links absolutos) y `CONTACT_EMAIL` (la casilla de /privacidad y /soporte).
- [ ] Settings → Domains: agregar el dominio y cargar los registros DNS que pide Vercel.
- [ ] Crear la casilla `hola@arreglemoslacalle.app` (el default de `CONTACT_EMAIL`; un reenvío del dominio alcanza) y
      probar que llegue.
- [ ] Verificar el dominio en Google Search Console (la misma cuenta de Google que Play y Google Cloud): lo pide la
      pantalla de consentimiento de OAuth de Google Sign-In para ponerlo como dominio autorizado.
- [ ] Abrir `https://arreglemoslacalle.app/privacidad`, `/soporte`, `/r/<id>` y `/ranking/la-calera`.

### EAS (app)

- [ ] `bash scripts/push-setup.sh`: cuenta de Expo, `eas init` (projectId), Firebase/FCM y APNs.
- [ ] Google Maps para Android: Google Cloud Console → habilitar "Maps SDK for Android" → Credenciales → crear una
      API key restringida a apps de Android con el paquete `ar.arreglemoslacalle.app` y los SHA-1 del certificado de
      EAS (`npx eas-cli@latest credentials --platform android`) y de Play (Play Console → Integridad de la app).
- [ ] Variables de EAS (desde `mobile/`). `EXPO_PUBLIC_*` van en el bundle, así que no son secretas:

  ```sh
  ENVS="--environment production --environment preview --environment development"
  npx eas-cli@latest env:set $ENVS --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext
  npx eas-cli@latest env:set $ENVS --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_… --visibility plaintext
  npx eas-cli@latest env:set $ENVS --name EXPO_PUBLIC_WEB_URL --value https://arreglemoslacalle.app --visibility plaintext
  npx eas-cli@latest env:set $ENVS --name GOOGLE_MAPS_API_KEY --value AIza… --visibility sensitive
  npx eas-cli@latest env:set $ENVS --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
  ```

  Si `development` y `preview` tienen que apuntar al Supabase de test, cargar esos con sus propios valores.
- [ ] `npx eas-cli@latest build --profile preview --platform android` y probar en un teléfono: mapa, foto,
      reporte, compartir (link al dominio) y avisos.

### Cuentas de Apple y Google (vincular cuenta)

Hasta hacerlo, la tarjeta "No pierdas tus reportes" de Mis reportes no aparece (o no vincula). Ver Cuentas.

- [ ] Apple: el primer `eas build` de iOS crea el App ID `ar.arreglemoslacalle.app` con la capability **Sign in with
      Apple** (por el plugin `expo-apple-authentication`). Solo app nativa: no hacen falta Services ID, clave .p8 ni
      secreto.
- [ ] Supabase → Providers → Apple: activar, y en **Client IDs** poner `ar.arreglemoslacalle.app` (más
      `host.exp.Exponent` para probar en Expo Go).
- [ ] Google Cloud Console (la misma cuenta que Play y Firebase) → APIs & Services: pantalla de consentimiento (OAuth
      consent screen) con el dominio autorizado (verificarlo antes en Google Search Console) y la URL de
      `/privacidad`. Crear tres OAuth client IDs: **Web** (es el `webClientId`), **iOS** (bundle
      `ar.arreglemoslacalle.app`) y **Android** (paquete `ar.arreglemoslacalle.app` y SHA-1: uno con el certificado de
      EAS, `npx eas-cli@latest credentials --platform android`, y otro con el de Play → Integridad de la app).
- [ ] Supabase → Providers → Google: activar, en **Client IDs** el web primero y después el de iOS y los de Android,
      separados por coma, y activar **Skip nonce checks** (el SDK de Google en iOS manda un nonce que la app no ve).
      El client secret no hace falta para el flujo nativo.
- [ ] Variables de EAS (y `mobile/.env` para desarrollo local). `app.config.ts` arma con la de iOS el `iosUrlScheme`
      del plugin de Google:

  ```sh
  npx eas-cli@latest env:set $ENVS --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <n>-<…>.apps.googleusercontent.com --visibility plaintext
  npx eas-cli@latest env:set $ENVS --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value <n>-<…>.apps.googleusercontent.com --visibility plaintext
  ```

- [ ] Build de desarrollo o preview y probar: vincular en un teléfono, ver "Cuenta vinculada", entrar con la misma
      cuenta en otro y ver los mismos reportes; después "Borrar mi cuenta".

### Arte

- [ ] Ícono y splash: siguen siendo los del template de Expo. Reemplazar `mobile/assets/expo.icon` (iOS),
      `mobile/assets/images/icon.png`, `android-icon-foreground.png`, `android-icon-background.png`,
      `android-icon-monochrome.png` y `splash-icon.png`.
- [ ] Capturas para las tiendas (iPhone 6.9" y teléfono Android), ícono de Play de 512×512 y gráfico destacado de
      1024×500.

### App Store

- [ ] Apple Developer Program (USD 99/año).
- [ ] `npx eas-cli@latest build --profile production --platform ios`: EAS crea el App ID y los certificados.
- [ ] App Store Connect → Apps → nueva app con el bundle `ar.arreglemoslacalle.app`, idioma principal Español (México).
- [ ] `npx eas-cli@latest submit --profile production --platform ios` y probar por TestFlight.
- [ ] Ficha: nombre, subtítulo, descripción, palabras clave, capturas, categoría, URL de soporte
      `https://arreglemoslacalle.app/soporte` y URL de privacidad `https://arreglemoslacalle.app/privacidad`.
- [ ] Privacidad de la app (las respuestas siguen `/privacidad`): sin rastreo (tracking: no). Datos recopilados,
      todos para "Funcionalidad de la app" y vinculados al usuario (por la cuenta anónima):
      Ubicación precisa; Fotos o videos; Otro contenido del usuario (descripción); ID de usuario (cuenta anónima);
      ID del dispositivo (token de avisos); Dirección de correo (solo si vincula Apple o Google, opcional).
- [ ] Cifrado: no hace falta responder, `ios.config.usesNonExemptEncryption: false` ya está en `app.json` (solo HTTPS).
- [ ] Notas para la revisión: contar que la cuenta es anónima, que los reportes son públicos y que vincular Apple o
      Google es opcional (en Mis reportes); "Borrar mi cuenta" aparece ahí una vez vinculada.

### Google Play

- [ ] Cuenta de Play Console (USD 25). Las cuentas personales nuevas tienen que hacer una prueba cerrada con al
      menos 12 testers durante 14 días antes de poder publicar en producción: arrancarla temprano.
- [ ] Crear la app, `npx eas-cli@latest build --profile production --platform android` y subir el primer AAB a mano
      (Play no acepta el primero por API). Después, `eas submit` con una cuenta de servicio de Google Play.
- [ ] Ficha: descripción, capturas, ícono, gráfico destacado, mail de contacto y política de privacidad
      `https://arreglemoslacalle.app/privacidad`.
- [ ] Seguridad de los datos: recopila datos: sí; comparte con terceros: no (Supabase, Expo y Anthropic son
      proveedores de servicio); cifrados en tránsito: sí; se puede pedir el borrado: sí ("Borrar mi cuenta" en la app y `https://arreglemoslacalle.app/soporte`).
      Tipos, todos para "Funcionalidad de la app": Ubicación precisa; Fotos; Otro contenido generado por el usuario
      (descripción); ID del dispositivo u otros IDs (cuenta anónima y token de avisos, opcional); Dirección de correo
      (solo si vincula Apple o Google, opcional).
- [ ] Clasificación de contenido: el contenido lo generan los usuarios y es público (hay "Denunciar" y un operador
      que oculta reportes). Público objetivo: 13 años o más. Sin anuncios.
