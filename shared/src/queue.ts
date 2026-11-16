// Cola de reportes sin enviar (#12): la lógica de envío, sin el almacenamiento ni la red.

/** create_report rechaza una segunda vez la misma foto (índice único en photo_path): ese reporte ya llegó. */
export const isAlreadySent = (error: unknown) => (error as { code?: unknown } | null)?.code === '23505';

/**
 * Se rechazó para siempre y reintentar solo no sirve: SQLSTATE 22xxx (datos inválidos), 23xxx
 * (restricciones), 42501 (sin permiso), o un 4xx de HTTP (Storage) salvo 401/408/429. Sin red, 5xx o
 * sesión vencida no son rechazos.
 */
export function isRejection(error: unknown): boolean {
  const e = error as { code?: unknown; status?: unknown } | null;
  if (typeof e?.code === 'string' && (/^2[23][0-9A-Z]{3}$/.test(e.code) || e.code === '42501')) return true;
  const status = e?.status;
  return typeof status === 'number' && status >= 400 && status < 500 && ![401, 408, 429].includes(status);
}

/**
 * Envía en orden. `sent`: llegó (o ya había llegado). `failed`: se rechazó; se marca y se sigue con el
 * próximo, así uno roto no traba a los demás. Ante cualquier otro error (sin red, servidor caído) corta y
 * deja ese y los siguientes para el próximo intento, así no cambian de orden.
 */
export async function sendInOrder<T>(
  items: T[],
  send: (item: T) => Promise<unknown>,
  on: { sent: (item: T) => void; failed: (item: T, error: unknown) => void },
) {
  for (const item of items) {
    try {
      await send(item);
    } catch (e) {
      if (isAlreadySent(e)) {
        on.sent(item);
        continue;
      }
      if (!isRejection(e)) return;
      on.failed(item, e);
      continue;
    }
    on.sent(item);
  }
}
