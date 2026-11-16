// Cola de reportes sin enviar (#12): la lógica de envío, sin el almacenamiento ni la red.

/**
 * La base rechazó el envío para siempre (SQLSTATE 22xxx datos inválidos, 23xxx restricciones, incluido
 * 23505 = ese reporte ya llegó): reintentar no sirve. Sin red, 5xx o sesión vencida no son rechazos.
 */
export function isRejection(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^2[23][0-9A-Z]{3}$/.test(code);
}

/**
 * Envía los pendientes en orden. Lo enviado (o rechazado) se saca con `remove`; ante cualquier otro error
 * corta y deja ese y los siguientes para el próximo intento, así no se pierden ni cambian de orden.
 */
export async function sendInOrder<T>(items: T[], send: (item: T) => Promise<unknown>, remove: (item: T) => void) {
  for (const item of items) {
    try {
      await send(item);
    } catch (e) {
      if (!isRejection(e)) return;
      // ponytail: un rechazo se descarta en silencio (la app valida antes; no debería pasar).
    }
    remove(item);
  }
}
