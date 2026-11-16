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
