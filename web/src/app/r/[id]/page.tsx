// Página pública del reporte: la que abre el link de "Enviar a la Muni" y la vista previa de WhatsApp.
// Bloqueante (instant = false) para que las etiquetas OG estén completas en el <head>.
export const instant = false;

import { categoryLabel, reportTitle, STATUS_LABEL, type PublicMunicipality, type PublicReport } from "@arreglemos/shared";
import type { Metadata } from "next";
import { cache } from "react";
import { Icon } from "@/lib/icon";
import { Photo } from "@/lib/photo";
import { dataMode, reportFixture, type DataMode } from "@/dev/fixtures";
import { db, photoUrl } from "@/lib/supabase";
import ReportNotFound from "../../not-found";

const DAY = 86_400_000;
const fmt = new Intl.NumberFormat("es-AR").format;
// ponytail: todavía no hay tiendas publicadas; poner el link a la tienda (o a una página de descarga) cuando existan.
const APP_URL = "#descargar";

/** El reporte y su municipio; null si no existe o está oculto (reports_public no muestra los ocultos). */
const getReport = cache(async (id: string, mode: DataMode | null = null) => {
  if (!/^\d{1,18}$/.test(id)) return null;
  if (mode) {
    const fx = reportFixture(mode, id);
    return fx && { ...fx, photo: photoUrl(fx.report.photo_path) };
  }
  const supabase = db();
  const { data: report, error } = await supabase.from("reports_public").select("*").eq("id", id).maybeSingle<PublicReport>();
  if (error) throw error;
  if (!report) return null;
  const municipality = report.municipality_id
    ? await supabase.from("municipalities_public").select("*").eq("id", report.municipality_id).maybeSingle<PublicMunicipality>()
    : null;
  if (municipality?.error) throw municipality.error;
  return { report, municipality: municipality?.data ?? null, photo: photoUrl(report.photo_path) };
});

function title(r: PublicReport, m: PublicMunicipality | null) {
  const where = r.address ?? m?.name;
  return where ? `${reportTitle(r)} en ${where}` : reportTitle(r);
}

const vecinos = (n: number) => (n === 1 ? "1 vecino sumado" : `${fmt(n)} vecinos sumados`);

export async function generateMetadata({ params, searchParams }: PageProps<"/r/[id]">): Promise<Metadata> {
  const data = await getReport((await params).id, await dataMode(searchParams));
  if (!data) return { title: "Este reporte no está disponible", robots: { index: false } };
  const t = title(data.report, data.municipality);
  const description = `${vecinos(data.report.vecinos_count)} · ${STATUS_LABEL[data.report.status]} · Arreglemos la Calle`;
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

export default async function ReportPage({ params, searchParams }: PageProps<"/r/[id]">) {
  const data = await getReport((await params).id, await dataMode(searchParams));
  // Se renderiza acá y no con notFound(): con Cache Components ese camino manda el HTML vacío y lo dibuja el JS.
  if (!data) return <ReportNotFound />;
  const { report: r, municipality: m, photo } = data;
  const resolved = r.status === "resolved";
  // Nunca negativo: un reporte recién creado puede llegar "del futuro" si el reloj de la base va adelantado.
  const days = Math.max(0, Math.floor(((resolved && r.resolved_at ? Date.parse(r.resolved_at) : Date.now()) - Date.parse(r.created_at)) / DAY));
  const unit = days <= 1 ? "día" : "días";
  const place = m ? `${m.name}, Córdoba` : null;
  const d = 0.004;
  const bbox = [r.lng - d, r.lat - d, r.lng + d, r.lat + d].join(",");

  return (
    <main className="report">
      <div className="photo">
        <Photo src={photo} alt={`Foto: ${title(r, m)}`} iconSize={48} />
        <span className={`badge ${resolved ? "resolved" : "open"}`}>
          {resolved ? <Icon name="check" /> : <Icon name="clock" />}
          {STATUS_LABEL[r.status]}
        </span>
      </div>
      <div className="body">
        <div>
          <div className="category">{categoryLabel(r.category)}</div>
          <h1>{title(r, m)}</h1>
          <div className="muted">{[place, `Reporte ${r.id}`].filter(Boolean).join(" · ")}</div>
        </div>
        {r.description && <p style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{r.description}</p>}
        <div className="stats">
          <div className="stat">
            <b>{fmt(r.vecinos_count)}</b>
            <span>{r.vecinos_count === 1 ? "vecino sumado" : "vecinos sumados"}</span>
          </div>
          <div className="stat">
            {!resolved && days === 0 ? (
              <><b>Hoy</b><span>lo reportaron</span></>
            ) : (
              // Arreglado el mismo día: "<1 día hasta el arreglo", como en la app.
              <><b>{resolved && days === 0 ? "<1" : fmt(days)}</b><span>{resolved ? `${unit} hasta el arreglo` : `${unit} abierto`}</span></>
            )}
          </div>
        </div>
        <div className="cta">
          <a className="button" href={APP_URL}>
            <Icon name="download" />
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
          <Icon name="pin" />
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
