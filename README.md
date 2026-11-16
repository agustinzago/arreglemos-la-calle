# Arreglemos la Calle

App cívica para reportar problemas de la calle con una foto. Vocabulario en `CONTEXT.md`, decisiones en `docs/adr/`, spec en el issue #1.

## Estructura

```
mobile/     App Expo (SDK 58, Expo Router, NativeWind v4, React Native Reusables). Rutas en mobile/src/app/
shared/     @arreglemos/shared: código TS sin build que usan la app, la web y los tests (categorías, tipos)
supabase/   migrations/ (SQL con timestamp) y scripts/ (generador de municipios desde IDECOR)
tests/      Tests del contrato del backend: vitest + supabase-js contra el proyecto de Supabase de test
web/        Next.js 16 (solo lectura): /r/[id], la página pública del reporte con Open Graph. Lee el .env de la raíz
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

## Pendiente humano

- Avisos push: correr `scripts/push-setup.sh` (ver Avisos push).
- Desplegar `suggest-category` y cargar el secreto `ANTHROPIC_API_KEY` (ver Edge Functions).
- Android fuera de Expo Go necesita una API key de Google Maps (plugin `react-native-maps` en `mobile/app.json`).
- Ícono y splash de la app todavía son los del template de Expo.
