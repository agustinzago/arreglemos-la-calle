// Página pública /r/[id]: pide el HTML real a la web (next build + next start) y mira el <head>,
// como lo hace WhatsApp para armar la vista previa. Con WEB_URL usa un servidor ya levantado.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { admin, cleanup, createReport, PLACES, vecino } from './helpers';

const webDir = fileURLToPath(new URL('../web', import.meta.url));
const nextBin = createRequire(`${webDir}/package.json`).resolve('next/dist/bin/next');
const BASE = process.env.WEB_URL ?? 'http://localhost:3100';
const WHATSAPP = { 'User-Agent': 'WhatsApp/2.23.20.0 A' };
let server: ChildProcess | undefined;

beforeAll(async () => {
  if (process.env.WEB_URL) return;
  execFileSync(process.execPath, [nextBin, 'build'], { cwd: webDir, stdio: 'ignore' });
  server = spawn(process.execPath, [nextBin, 'start', '-p', '3100'], { cwd: webDir, stdio: 'ignore', detached: true });
  for (let i = 0; i < 100; i++) {
    if (await fetch(BASE).then(() => true, () => false)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('la web no arrancó');
}, 180_000);

afterAll(async () => {
  if (server?.pid) process.kill(-server.pid); // todo el grupo: next start puede tener hijos
  await cleanup();
});

// El fallback de not-found viaja siempre en el payload RSC: se busca el <h1> renderizado.
const GONE = '<h1>Este reporte no está disponible</h1>';
const page = async (id: number | string) => (await fetch(`${BASE}/r/${id}`, { headers: WHATSAPP })).text();

test('las etiquetas Open Graph salen del servidor, en el <head>', async () => {
  const v = await vecino();
  const { data: report, error } = await createReport(v, { ...PLACES.laCalera, address: 'Av. San Martín 431' });
  expect(error).toBeNull();

  const html = await page(report.id);
  const head = html.split('</head>')[0];
  expect(head).toContain('<meta property="og:title" content="Bache en Av. San Martín 431"');
  expect(head).toContain('<meta property="og:description" content="1 vecino sumado · Abierto · Arreglemos la Calle"');
  expect(head).toMatch(/<meta property="og:image" content="https:\/\/[^"]+\/photos\/[^"]+\.jpg"/);
  expect(head).toMatch(new RegExp(`<meta property="og:url" content="https?://[^"]+/r/${report.id}"`));

  const body = html.split('</head>')[1];
  expect(body).toContain('Bache en Av. San Martín 431');
  expect(body).toContain('La Calera, Córdoba');
  expect(body).toContain('Abierto');
  expect(body).toContain('Descargá la app y sumate');
  expect(body).toContain('openstreetmap.org/export/embed.html');
});

test('un id inexistente o un reporte oculto no está disponible', async () => {
  expect(await page(999_999_999_999)).toContain(GONE);
  expect(await page('no-es-un-id')).toContain(GONE);

  const v = await vecino();
  const { data: report } = await createReport(v, PLACES.cordoba);
  expect(await page(report.id)).not.toContain(GONE);
  await admin.from('reports').update({ status: 'hidden' }).eq('id', report.id).throwOnError();
  const html = await page(report.id);
  expect(html).toContain(GONE);
  expect(html).not.toContain('og:image');
});

test('el ranking semanal se elige por municipio, linkea a cada reporte y tiene Open Graph', async () => {
  const v = await vecino();
  const { data: report } = await createReport(v, { ...PLACES.laCalera, address: 'Belgrano 120' });
  // Base compartida: lo envejece para que encabece "más días abiertos".
  const old = new Date(Date.now() - 3650 * 86_400_000).toISOString();
  await admin.from('reports').update({ created_at: old }).eq('id', report.id).throwOnError();

  const html = await (await fetch(`${BASE}/ranking/la-calera`, { headers: WHATSAPP })).text();
  const [head, body] = html.split('</head>');
  expect(head).toContain('<meta property="og:title" content="Ranking semanal de La Calera"');
  expect(head).toMatch(/<meta property="og:description" content="\d+ reportes? abiertos? · [^"]+ · Semana del [^"]+"/);
  expect(head).toMatch(/<meta property="og:image" content="https:\/\/[^"]+\/photos\/[^"]+\.jpg"/);
  expect(body).toContain('<h1>Reportes vecinales de La Calera</h1>');
  expect(body).toContain('Con más vecinos sumados');
  expect(body).toContain('Con más días abiertos');
  expect(body).toContain(`href="/r/${report.id}"`);
  expect(body).toContain('Belgrano 120');

  const gone = await (await fetch(`${BASE}/ranking/no-existe`, { headers: WHATSAPP })).text();
  expect(gone).toContain('<h1>Este ranking no está disponible</h1>');
});
