// Ranking semanal de un municipio: el link que el operador le manda a la Muni. /ranking/la-calera (o el id).
// Bloqueante (instant = false) como /r/[id], para que las etiquetas OG estén completas en el <head>.
export const instant = false;

import { categoryShortLabel, type PublicMunicipality, type PublicReport } from "@arreglemos/shared";
import type { Metadata } from "next";
import { cache } from "react";
import { db, photoUrl } from "@/lib/supabase";

const DAY = 86_400_000;
const TZ = "America/Argentina/Cordoba";

type Ranking = { by_vecinos: PublicReport[]; by_days: PublicReport[]; open_count: number; resolved_week: number; vecinos: number };

/** "La Calera" → "la-calera", "Córdoba" → "cordoba". */
const slug = (name: string) =>
  name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** El municipio (por slug o id) y su ranking; null si no existe o no está activo. */
const getRanking = cache(async (param: string) => {
  const supabase = db();
  const { data, error } = await supabase.from("municipalities_public").select("*");
  if (error) throw error;
  const munis = data as PublicMunicipality[];
  const key = decodeURIComponent(param);
  const m = munis.find((x) => slug(x.name) === key || String(x.id) === key);
  if (!m) return null;
  const ranking = await supabase.rpc("weekly_ranking", { p_municipality_id: m.id });
  if (ranking.error) throw ranking.error;
  const photo = (r: PublicReport) => photoUrl(r.photo_path);
  return { municipality: m, ranking: ranking.data as Ranking, photo, week: weekLabel(new Date()) };
});

/** "Semana del 10 al 16 de noviembre de 2026": los últimos siete días, como resolved_week. */
function weekLabel(today: Date) {
  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).formatToParts(d);
    const get = (t: string) => p.find((x) => x.type === t)!.value;
    return { day: get("day"), month: get("month"), year: get("year") };
  };
  const a = parts(new Date(today.getTime() - 6 * DAY));
  const b = parts(today);
  const from = a.month === b.month ? a.day : `${a.day} de ${a.month}`;
  return `Semana del ${from} al ${b.day} de ${b.month} de ${b.year}`;
}

const daysOpen = (r: PublicReport) => Math.floor((Date.now() - Date.parse(r.created_at)) / DAY);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function generateMetadata({ params }: PageProps<"/ranking/[municipio]">): Promise<Metadata> {
  const data = await getRanking((await params).municipio);
  if (!data) return { title: "Este ranking no está disponible", robots: { index: false } };
  const { municipality: m, ranking: r } = data;
  const title = `Ranking semanal de ${m.name}`;
  const description = `${plural(r.open_count, "reporte abierto", "reportes abiertos")} · ${plural(r.vecinos, "vecino sumado", "vecinos sumados")} · ${data.week}`;
  const top = r.by_vecinos[0];
  const images = top ? [{ url: data.photo(top), width: 1280, height: 960, alt: title }] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: "article", url: `/ranking/${slug(m.name)}`, siteName: "Arreglemos la Calle", locale: "es_AR", images },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images: images?.map((i) => i.url) },
  };
}

export default async function RankingPage({ params }: PageProps<"/ranking/[municipio]">) {
  const data = await getRanking((await params).municipio);
  // Inline y no con notFound(): con Cache Components ese camino manda el HTML vacío (ver /r/[id]).
  if (!data) {
    return (
      <main className="gone">
        <h1>Este ranking no está disponible</h1>
        <p className="muted">Puede que el municipio todavía no esté en la app o que el link esté mal escrito.</p>
      </main>
    );
  }
  const { municipality: m, ranking: r, photo } = data;

  return (
    <main className="ranking">
      <div>
        <div className="eyebrow">Ranking semanal</div>
        <h1>{`Reportes vecinales de ${m.name}`}</h1>
        <div className="muted">{`Municipio de ${m.name}, Córdoba · ${data.week}`}</div>
      </div>
      <div className="stats">
        <Stat n={r.open_count} label={r.open_count === 1 ? "reporte abierto" : "reportes abiertos"} />
        <Stat n={r.resolved_week} label={r.resolved_week === 1 ? "resuelto esta semana" : "resueltos esta semana"} />
        <Stat n={r.vecinos} label={r.vecinos === 1 ? "vecino sumado" : "vecinos sumados"} />
      </div>
      <div className="lists">
        <List
          title="Con más vecinos sumados"
          intro="Los reportes abiertos que más vecinos acompañan."
          reports={r.by_vecinos}
          photo={photo}
          detail={(x) => plural(daysOpen(x), "día abierto", "días abierto")}
          big={(x) => [x.vecinos_count, x.vecinos_count === 1 ? "vecino" : "vecinos"]}
        />
        <List
          title="Con más días abiertos"
          intro="Los reportes que llevan más tiempo sin resolverse."
          reports={r.by_days}
          photo={photo}
          detail={(x) => plural(x.vecinos_count, "vecino sumado", "vecinos sumados")}
          big={(x) => [daysOpen(x), daysOpen(x) === 1 ? "día" : "días"]}
        />
      </div>
      <div className="note">
        Cómo se arma: los reportes los cargan vecinos desde la app, con foto y ubicación. Cada vecino se puede sumar una
        sola vez por reporte. Arreglemos la Calle es una iniciativa vecinal independiente; no pertenece a la Municipalidad
        ni a ningún gobierno.
      </div>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat">
      <b>{n}</b>
      <span>{label}</span>
    </div>
  );
}

function List(props: {
  title: string;
  intro: string;
  reports: PublicReport[];
  photo: (r: PublicReport) => string;
  detail: (r: PublicReport) => string;
  big: (r: PublicReport) => [number, string];
}) {
  return (
    <section>
      <h2>{props.title}</h2>
      <div className="muted intro">{props.intro}</div>
      {props.reports.length === 0 ? (
        <div className="rank-list empty muted">No hay reportes abiertos por ahora.</div>
      ) : (
        <ol className="rank-list">
          {props.reports.map((x, i) => {
            const [n, unit] = props.big(x);
            return (
              <li key={x.id}>
                <a className="rank-row" href={`/r/${x.id}`}>
                  <span className="rank">{i + 1}</span>
                  <img src={props.photo(x)} alt="" loading="lazy" />
                  <span>
                    <b>{categoryShortLabel(x.category)}</b>
                    <span className="muted">
                      {x.address ?? "Sin dirección"} · {props.detail(x)}
                    </span>
                  </span>
                  <span className="big">
                    <b>{n}</b>
                    <span className="muted">{unit}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
