import type { CategoryCode } from './categories';

export type ReportStatus = 'open' | 'resolved' | 'hidden';

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
