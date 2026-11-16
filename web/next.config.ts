import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Un solo .env en la raíz del repo (ver .env.example). En Vercel las variables vienen del proyecto.
const envFile = path.join(__dirname, "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@arreglemos/shared"],
  // Monorepo: sin esto Turbopack no resuelve `next` (hoisted en la raíz).
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
