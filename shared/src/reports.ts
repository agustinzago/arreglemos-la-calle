import { categoryLabel, type CategoryCode } from './categories';

/** Largo máximo de la dirección y la descripción (checks en public.reports). */
export const ADDRESS_MAX = 200;
export const DESCRIPTION_MAX = 1000;
/** "Otro" pide qué es (primera línea de la descripción); el resto del texto es el detalle. */
export const OTHER_MAX = 200;
export const DETAILS_MAX = DESCRIPTION_MAX - OTHER_MAX - 1;

/**
 * Título del reporte: el nombre de la categoría, o para "Otro" lo que escribió el vecino (la primera línea
 * de la descripción). Si no, varios "Otro" no se distinguen. `label`: categoryShortLabel en listas.
 */
export const reportTitle = (r: { category: string; description: string | null }, label: (code: string) => string = categoryLabel) =>
  (r.category === 'otro' && r.description?.split('\n')[0].trim()) || label(r.category);

export type ReportStatus = 'open' | 'resolved' | 'hidden';

/** Nombre del estado (CONTEXT.md) para app y web. Siempre con ícono: reloj abierto, check resuelto. */
export const STATUS_LABEL: Record<ReportStatus, string> = { open: 'Abierto', resolved: 'Resuelto', hidden: 'Oculto' };

/** Una fila de la vista public.reports_public (y lo que devuelve create_report). */
export type PublicReport = {
  id: number;
  category: CategoryCode;
  lat: number;
  lng: number;
  address: string | null;
  photo_path: string;
  description: string | null;
  status: ReportStatus;
  municipality_id: number | null;
  vecinos_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type ReportEventType = 'sumate' | 'resuelto' | 'sigue_roto' | 'denuncia';

/** Una fila de public.report_events_public: la historia del reporte, sin decir quién. */
export type PublicReportEvent = {
  id: number;
  report_id: number;
  type: ReportEventType;
  photo_path: string | null;
  created_at: string;
  /** true si el evento es del vecino que pregunta. */
  mine: boolean;
};

/** Una fila de public.municipalities_public. whatsapp null = todavía no lo tenemos. */
export type PublicMunicipality = { id: number; name: string; whatsapp: string | null };

/** Una fila de public.nearby_reports: un reporte abierto cerca del pin, con su distancia en metros. */
export type NearbyReport = PublicReport & { distance_m: number };
