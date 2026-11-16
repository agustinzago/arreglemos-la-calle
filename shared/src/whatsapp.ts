import { categoryLabel } from './categories';

/** Link a la página pública del reporte (/r/[id] en la web). */
export const reportUrl = (webUrl: string, id: number) => `${webUrl.replace(/\/+$/, '')}/r/${id}`;

/** Texto de "Enviar a la Muni" (ADR-0001): categoría, dirección y link a la página pública. */
export function municipalityMessage(
  r: { id: number; category: string; address: string | null },
  municipality: string,
  url: string,
) {
  const where = r.address ? ` en ${r.address}` : '';
  return `Hola, soy vecino de ${municipality}. Quiero avisar de un problema: ${categoryLabel(r.category).toLowerCase()}${where}. Reporte ${r.id}. ${url}`;
}

/** Link wa.me que abre el chat con el número (formato internacional, ej. 5493543…) y el texto escrito. */
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
