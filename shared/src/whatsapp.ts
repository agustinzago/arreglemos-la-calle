import { categoryLabel } from './categories';
import { reportTitle } from './reports';

/** Link a la página pública del reporte (/r/[id] en la web). */
export const reportUrl = (webUrl: string, id: number) => `${webUrl.replace(/\/+$/, '')}/r/${id}`;

/** Texto de "Enviar a la Muni" (ADR-0001): qué es (para "Otro", lo que escribió el vecino), dirección y link. */
export function municipalityMessage(
  r: { id: number; category: string; address: string | null; description?: string | null },
  municipality: string,
  url: string,
) {
  const where = r.address ? ` en ${r.address}` : '';
  return `Hola, soy vecino de ${municipality}. Quiero avisar de un problema: ${reportTitle({ description: null, ...r }, (c) => categoryLabel(c).toLowerCase())}${where}. Reporte ${r.id}. ${url}`;
}

/** Link wa.me que abre el chat con el número (formato internacional, ej. 5493543…) y el texto escrito. */
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
