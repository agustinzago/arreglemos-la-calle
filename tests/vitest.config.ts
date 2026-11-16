import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Credenciales del proyecto de test: variables de entorno o el .env de la raíz (ver .env.example).
const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Una base compartida y un límite de sesiones anónimas por IP: mejor de a un archivo.
    fileParallelism: false,
  },
});
