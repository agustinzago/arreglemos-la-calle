// Página pública del reporte: la que abre el link de "Enviar a la Muni" y la vista previa de WhatsApp.
// Bloqueante (instant = false) para que las etiquetas OG estén completas en el <head>.
export const instant = false;

import { categoryLabel, type PublicMunicipality, type PublicReport } from "@arreglemos/shared";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { cache } from "react";
import ReportNotFound from "../../not-found";

const DAY = 86_400_000;
// ponytail: todavía no hay tiendas publicadas; poner el link a la tienda (o a una página de descarga) cuando existan.
const APP_URL = "#descargar";

/** El reporte y su municipio; null si no existe o está oculto (reports_public no muestra los ocultos). */
const getReport = cache(async (id: string) => {
  if (!/^\d{1,18}$/.test(id)) return null;
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: report, error } = await supabase.from("reports_public").select("*").eq("id", id).maybeSingle<PublicReport>();
  if (error) throw error;
  if (!report) return null;
  const muni = report.municipality_id
    ? await supabase.from("municipalities_public").select("*").eq("id", report.municipality_id).maybeSingle<PublicMunicipality>()
    : null;
  if (muni?.error) throw muni.error;
  const photo = supabase.storage.from("photos").getPublicUrl(report.photo_path).data.publicUrl;
  return { report, municipality: muni?.data ?? null, photo };
});

function title(r: PublicReport, m: PublicMunicipality | null) {
  const where = r.address ?? m?.name;
  return where ? `${categoryLabel(r.category)} en ${where}` : categoryLabel(r.category);
}

const vecinos = (n: number) => (n === 1 ? "1 vecino sumado" : `${n} vecinos sumados`);
const statusLabel = (r: PublicReport) => (r.status === "resolved" ? "Resuelto" : "Abierto");

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const data = await getReport((await params).id);
  if (!data) return { title: "Este reporte no está disponible", robots: { index: false } };
  const t = title(data.report, data.municipality);
  const description = `${vecinos(data.report.vecinos_count)} · ${statusLabel(data.report)} · Arreglemos la Calle`;
  return {
    title: t,
    description,
    openGraph: {
      title: t,
      description,
      type: "article",
      url: `/r/${data.report.id}`,
      siteName: "Arreglemos la Calle",
      locale: "es_AR",
      images: [{ url: data.photo, width: 1280, height: 960, alt: t }],
    },
    twitter: { card: "summary_large_image", title: t, description, images: [data.photo] },
  };
}

export default async function ReportPage({ params }: PageProps<"/r/[id]">) {
  const data = await getReport((await params).id);
  // Se renderiza acá y no con notFound(): con Cache Components ese camino manda el HTML vacío y lo dibuja el JS.
  if (!data) return <ReportNotFound />;
  const { report: r, municipality: m, photo } = data;
  const resolved = r.status === "resolved";
  const days = Math.floor(((resolved && r.resolved_at ? Date.parse(r.resolved_at) : Date.now()) - Date.parse(r.created_at)) / DAY);
  const place = m ? `${m.name}, Córdoba` : null;
  const d = 0.004;
  const bbox = [r.lng - d, r.lat - d, r.lng + d, r.lat + d].join(",");

  return (
    <main className="report">
      <div className="photo">
        <img src={photo} alt={`Foto: ${title(r, m)}`} />
        <span className={`badge ${resolved ? "resolved" : "open"}`}>
          {resolved ? <Icon d={CHECK} /> : <Icon d={CLOCK} />}
          {statusLabel(r)}
        </span>
      </div>
      <div className="body">
        <div>
          <div className="category">{categoryLabel(r.category)}</div>
          <h1>{title(r, m)}</h1>
          <div className="muted">{[place, `Reporte ${r.id}`].filter(Boolean).join(" · ")}</div>
        </div>
        {r.description && <p style={{ margin: 0 }}>{r.description}</p>}
        <div className="stats">
          <div className="stat">
            <b>{r.vecinos_count}</b>
            <span>{r.vecinos_count === 1 ? "vecino sumado" : "vecinos sumados"}</span>
          </div>
          <div className="stat">
            {!resolved && days === 0 ? (
              <><b>Hoy</b><span>lo reportaron</span></>
            ) : (
              <><b>{days}</b><span>{resolved ? "días hasta el arreglo" : days === 1 ? "día abierto" : "días abierto"}</span></>
            )}
          </div>
        </div>
        <div className="cta">
          <a className="button" href={APP_URL}>
            <Icon d={DOWNLOAD} />
            Descargá la app y sumate
          </a>
          <span className="muted">Gratis y sin crear cuenta. Para iPhone y Android.</span>
        </div>
        <div className="map">
          <iframe
            title="Mapa del reporte"
            loading="lazy"
            tabIndex={-1}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${r.lat},${r.lng}`}
          />
        </div>
        <div className="row">
          <Icon d={PIN} />
          <span>
            {r.address && <b>{r.address}</b>}
            {r.address && place && ", "}
            {place}{" "}
            <a href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`}>Ver en el mapa</a>
          </span>
        </div>
        <div className="note">
          Arreglemos la Calle es una app hecha por vecinos. No pertenece a la Municipalidad ni a ningún gobierno.
        </div>
      </div>
    </main>
  );
}

// Íconos de Lucide (los mismos que la app), inline para no sumar una dependencia por cuatro dibujos.
const CLOCK = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 6v6l4 2";
const CHECK = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-3 10 2 2 4-4";
const DOWNLOAD = "M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5";
const PIN = "M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6";

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
