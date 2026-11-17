// Inicio del dominio: lo abren las tiendas, la pantalla de consentimiento de Google y quien escribe la URL a mano.
// ponytail: insignias de las tiendas sin link hasta que la app esté publicada; sumar las URLs de App Store y Play.
import { CATEGORIES } from "@arreglemos/shared";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/lib/icon";

export const metadata: Metadata = {
  title: "Arreglemos la Calle · Reportá los problemas de tu calle",
  description:
    "Sacá una foto de un bache, una luminaria apagada o un basural, sumá a tus vecinos y mandáselo a tu Municipalidad por WhatsApp. Sin crear cuenta.",
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "camera",
    title: "Sacá la foto",
    text: "La app abre directo en la cámara. Toma el lugar del GPS y puede sugerirte la categoría, que vos confirmás o cambiás.",
  },
  {
    icon: "users",
    title: "Sumate",
    text: "Si alguien ya lo reportó, te sumás a ese reporte. Cuantos más vecinos sumados, más pesa el problema.",
  },
  {
    icon: "message",
    title: "Mandalo a la Muni",
    text: "Con un toque se abre tu WhatsApp con el mensaje listo para tu Municipalidad: la foto, la dirección y el link al reporte.",
  },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "Sin cuenta ni contraseña", text: "Te identifica tu teléfono. Vincular Apple o Google es opcional, para no perder tus reportes si lo cambiás." },
  { icon: "wifiOff", title: "Anda sin señal", text: "Si no hay señal, el reporte queda guardado en el teléfono y se envía solo apenas vuelve." },
  { icon: "type", title: "Letra y botones grandes", text: "Pensada para que la use cualquiera al primer intento, al sol y con una mano." },
  { icon: "check", title: "Lo deciden los vecinos", text: "Un reporte pasa a resuelto cuando dos vecinos confirman que está arreglado. Si sigue roto, con uno alcanza para que vuelva a abierto." },
  { icon: "pin", title: "Primero, los cercanos", text: "Antes de crear uno nuevo te mostramos los reportes cercanos del mismo problema, para sumar fuerzas en vez de dividirlas." },
  { icon: "bell", title: "Te avisamos", text: "Recibí un aviso cuando arreglen lo que reportaste o algo a lo que te sumaste." },
];

const RANKING_EXAMPLE = [
  { cat: "Bache", where: "Av. San Martín 425", vecinos: 19, photo: "asfalto" },
  { cat: "Luminaria apagada", where: "Belgrano y Sarmiento", vecinos: 14, photo: "noche" },
  { cat: "Calle de tierra", where: "Los Algarrobos 1200", vecinos: 11, photo: "tierra" },
  { cat: "Basural", where: "Ruta E55, km 9", vecinos: 8, photo: "basural" },
];

const FAQ = [
  { q: "¿Cuánto cuesta?", a: "Nada. La app es gratis y no tiene publicidad." },
  {
    q: "¿La app es de la Municipalidad?",
    a: "No. Es una iniciativa vecinal independiente: no pertenece a ninguna Municipalidad ni a ningún gobierno. Juntamos los reportes y se los hacemos llegar; arreglar la calle le toca al municipio.",
  },
  { q: "¿Dónde funciona?", a: "Empezamos con un piloto en La Calera, Córdoba, y vamos sumando municipios del Gran Córdoba." },
  {
    q: "¿Qué pasa después de que lo mando?",
    a: "El reporte queda en el mapa público con su propia página, otros vecinos se pueden sumar y cada semana armamos un ranking para el municipio. Cuando lo arreglen, los vecinos lo marcan como arreglado y te avisamos.",
  },
  { q: "¿Cuándo la puedo descargar?", a: "Estamos terminando la revisión de App Store y Google Play. Muy pronto vas a poder descargarla gratis." },
];

function StoreBadges() {
  return (
    <div className="l-stores">
      <span className="l-store">
        <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor" aria-hidden>
          <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.04-.83.85-1.84 1.34-2.93 1.26-.14-1.1.4-2.24 1.2-3.06.86-.88 2.12-1.36 2.98-1.24zM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-1 1.56-2.4 3.5-4.14 3.52-1.55.01-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1-1.74-.02-3.07-1.77-4.07-3.33C-.17 16.3-.47 11.18 1.27 8.5 2.5 6.6 4.45 5.48 6.28 5.48c1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.41-1.02 4.57-1.02 1.63 0 3.36.89 4.59 2.42-4.03 2.21-3.38 7.97.49 9.2z" />
        </svg>
        <span><small>Muy pronto en</small>App Store</span>
      </span>
      <span className="l-store">
        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden>
          <path d="M4 2.6v18.8c0 .5.55.8.98.55L21 13.1a1.25 1.25 0 0 0 0-2.2L4.98 2.05A.64.64 0 0 0 4 2.6z" />
        </svg>
        <span><small>Muy pronto en</small>Google Play</span>
      </span>
    </div>
  );
}

/** Pantalla de detalle del reporte, dibujada con CSS: ilustra la app sin depender de capturas (datos de ejemplo). */
function PhoneMock() {
  return (
    <div className="l-visual" aria-hidden>
      <div className="l-map">
        <i className="l-pin" style={{ left: "12%", top: "18%" }} />
        <i className="l-pin ok" style={{ left: "80%", top: "12%" }} />
        <i className="l-pin" style={{ left: "86%", top: "64%" }} />
        <i className="l-pin ok" style={{ left: "8%", top: "74%" }} />
      </div>
      <div className="l-phone">
        <div className="l-screen">
          <div className="l-photo">
            <span className="l-badge"><Icon name="alert" size={15} />Abierto</span>
          </div>
          <div className="l-screen-body">
            <span className="l-cat">Bache</span>
            <b className="l-addr">Av. San Martín 425</b>
            <span className="l-sub">La Calera · Reporte 128</span>
            <div className="l-screen-stats">
              <div><b>19</b>vecinos sumados</div>
              <div><b>12</b>días abierto</div>
            </div>
            <span className="l-screen-btn"><Icon name="users" size={18} />Me sumo</span>
            <span className="l-screen-btn wa"><Icon name="message" size={18} />Enviar a la Muni</span>
          </div>
        </div>
      </div>
      <div className="l-float top"><span className="l-dot ok"><Icon name="check" size={16} /></span>Enviado a la Muni por WhatsApp</div>
      <div className="l-float bottom"><span className="l-dot"><Icon name="users" size={16} /></span>+3 vecinos se sumaron hoy</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing">
      <section className="l-hero">
        <div className="l-wrap l-hero-grid">
          <div className="l-hero-copy">
            <span className="l-pill"><i />Piloto en La Calera, Córdoba</span>
            <h1>
              Sacá la foto. <span className="l-mark">Arreglemos la calle.</span>
            </h1>
            <p className="l-lead">
              Baches, luminarias apagadas, basurales, calles anegadas. Reportalo con una foto, sumate a lo que reportan tus
              vecinos y mandáselo a tu Municipalidad por WhatsApp. En un minuto y sin crear cuenta.
            </p>
            <StoreBadges />
            <ul className="l-trust">
              <li><Icon name="check" size={18} />Gratis</li>
              <li><Icon name="check" size={18} />Sin cuenta</li>
              <li><Icon name="check" size={18} />Independiente de cualquier gobierno</li>
            </ul>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section className="l-cats" aria-label="Lo que podés reportar">
        <div className="l-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined}>
              {CATEGORIES.filter((c) => c.code !== "otro").map((c) => (
                <li key={c.code}>{c.label}</li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      <section className="l-section" id="como-funciona">
        <div className="l-wrap">
          <header className="l-head">
            <span className="eyebrow">Cómo funciona</span>
            <h2>De la vereda a la Muni en menos de un minuto</h2>
          </header>
          <ol className="l-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="l-num" aria-hidden>{i + 1}</span>
                <span className="l-ico"><Icon name={s.icon} size={26} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-section l-dark">
        <div className="l-wrap">
          <header className="l-head">
            <span className="eyebrow">Hecha para la calle</span>
            <h2>Simple para el vecino, seria para el municipio</h2>
          </header>
          <div className="l-features">
            {FEATURES.map((f) => (
              <article key={f.title}>
                <span className="l-ico"><Icon name={f.icon} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="l-section">
        <div className="l-wrap l-split">
          <div>
            <span className="eyebrow">Para los municipios</span>
            <h2>Un ranking claro, cada semana</h2>
            <p className="l-lead">
              Cada semana le mandamos al municipio el ranking con los problemas que más vecinos afectan y los que llevan más
              tiempo sin resolverse. Datos concretos, con foto y dirección, para decidir por dónde empezar.
            </p>
            <ul className="l-list">
              <li><Icon name="users" size={20} />Los reportes con más vecinos sumados</li>
              <li><Icon name="chart" size={20} />Los que llevan más días abiertos</li>
              <li><Icon name="link" size={20} />Cada reporte con su página pública, foto y mapa</li>
            </ul>
            <a className="l-link" href="/ranking/la-calera">Ver el ranking de La Calera <Icon name="arrow" size={18} /></a>
          </div>
          <figure className="l-rank" aria-label="Ejemplo de ranking semanal">
            <figcaption>
              <span>Ranking semanal · La Calera</span>
              <em>Ejemplo</em>
            </figcaption>
            <ol>
              {RANKING_EXAMPLE.map((r, i) => (
                <li key={r.where}>
                  <span className="rank">{i + 1}</span>
                  <span className={`l-thumb ${r.photo}`} />
                  <span>
                    <b>{r.cat}</b>
                    <span className="muted">{r.where}</span>
                  </span>
                  <span className="big"><b>{r.vecinos}</b><span className="muted">vecinos</span></span>
                </li>
              ))}
            </ol>
          </figure>
        </div>
      </section>

      <section className="l-section l-tight">
        <div className="l-wrap l-values">
          <article>
            <Icon name="heart" />
            <h3>Independiente</h3>
            <p>No pertenecemos a ninguna Municipalidad ni a ningún gobierno. Somos vecinos ayudando a vecinos.</p>
          </article>
          <article>
            <Icon name="lock" />
            <h3>Privada</h3>
            <p>No pedimos nombre, email ni teléfono (el email solo si vinculás Apple o Google). Lo contamos todo en la <a href="/privacidad">política de privacidad</a>.</p>
          </article>
          <article>
            <Icon name="link" />
            <h3>Pública</h3>
            <p>Cada reporte tiene su propia página para compartirla con quien quieras. Lo que se reporta, se ve.</p>
          </article>
        </div>
      </section>

      <section className="l-section l-tight">
        <div className="l-wrap">
          <p className="l-emergency" role="note">
            <Icon name="alert" size={26} />
            <span><b>¿Hay riesgo para personas?</b> Llamá al 911 o al 103. La app no es para emergencias.</span>
          </p>
        </div>
      </section>

      <section className="l-section">
        <div className="l-wrap l-faq">
          <header className="l-head">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2>Lo que más nos preguntan</h2>
          </header>
          <div>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
            <p className="muted">¿Otra duda? Escribinos desde <a href="/soporte">soporte</a>.</p>
          </div>
        </div>
      </section>

      <section className="l-wrap">
        <div className="l-final">
          <h2>Tu calle no se arregla sola.<br />Entre todos, sí.</h2>
          <p>Muy pronto en App Store y Google Play.</p>
          <StoreBadges />
        </div>
      </section>
    </main>
  );
}
