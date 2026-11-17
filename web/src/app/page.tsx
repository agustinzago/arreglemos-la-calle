// Inicio del dominio: lo abren las tiendas, la pantalla de consentimiento de Google y quien escribe la URL a mano.
// ponytail: insignias de las tiendas sin link hasta que la app esté publicada; sumar las URLs de App Store y Play.
import { CATEGORIES } from "@arreglemos/shared";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arreglemos la Calle · Reportá los problemas de tu calle",
  description:
    "Sacá una foto de un bache, una luminaria apagada o un basural, sumá a tus vecinos y mandáselo a tu Municipalidad por WhatsApp. Sin crear cuenta.",
};

const Svg = ({ children, size = 24 }: { children: ReactNode; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const icons = {
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  message: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  wifiOff: <><path d="M12 20h.01" /><path d="M8.5 16.43a5 5 0 0 1 7 0" /><path d="M5 12.86a10 10 0 0 1 5.17-2.69" /><path d="M19 12.86a10 10 0 0 0-2-1.52" /><path d="M2 8.82a15 15 0 0 1 4.18-2.64" /><path d="M22 8.82a15 15 0 0 0-11.29-3.76" /><path d="m2 2 20 20" /></>,
  type: <><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></>,
  check: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  pin: <><path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>,
  bell: <><path d="M10.27 21a2 2 0 0 0 3.46 0" /><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" /></>,
  chart: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
};
type IconName = keyof typeof icons;
const Icon = ({ name, size }: { name: IconName; size?: number }) => <Svg size={size}>{icons[name]}</Svg>;

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "camera",
    title: "Sacá la foto",
    text: "La app abre directo en la cámara. Toma el lugar del GPS y te sugiere la categoría: vos solo confirmás.",
  },
  {
    icon: "users",
    title: "Sumá a tus vecinos",
    text: "Si alguien ya lo reportó, te sumás a ese reporte. Cuantos más vecinos sumados, más pesa el problema.",
  },
  {
    icon: "message",
    title: "Mandalo a la Muni",
    text: "Con un toque le llega a tu Municipalidad por WhatsApp, con la foto, la dirección y el link al reporte.",
  },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "Sin cuenta ni contraseña", text: "Te identifica tu teléfono. Vincular Apple o Google es opcional, para no perder tus reportes si lo cambiás." },
  { icon: "wifiOff", title: "Anda sin señal", text: "Si no hay señal, el reporte queda guardado en el teléfono y se envía solo apenas vuelve." },
  { icon: "type", title: "Letra y botones grandes", text: "Pensada para que la use cualquiera al primer intento, al sol y con una mano." },
  { icon: "check", title: "Lo deciden los vecinos", text: "Un reporte pasa a resuelto cuando dos vecinos confirman que está arreglado. Si sigue roto, con uno alcanza para que vuelva a abierto." },
  { icon: "pin", title: "Sin reportes repetidos", text: "Antes de crear uno nuevo te mostramos los reportes cercanos del mismo problema, para sumar fuerzas en vez de dividirlas." },
  { icon: "bell", title: "Te avisamos", text: "Recibí un aviso cuando arreglen lo que reportaste o algo a lo que te sumaste." },
];

const RANKING_EXAMPLE = [
  { cat: "Bache", where: "Av. San Martín 425", n: 19 },
  { cat: "Luminaria apagada", where: "Belgrano y Sarmiento", n: 14 },
  { cat: "Calle de tierra", where: "Los Algarrobos 1200", n: 11 },
  { cat: "Basural", where: "Ruta E55, km 9", n: 8 },
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
      <span className="l-store" aria-label="App Store, muy pronto">
        <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor" aria-hidden>
          <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.04-.83.85-1.84 1.34-2.93 1.26-.14-1.1.4-2.24 1.2-3.06.86-.88 2.12-1.36 2.98-1.24zM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-1 1.56-2.4 3.5-4.14 3.52-1.55.01-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1-1.74-.02-3.07-1.77-4.07-3.33C-.17 16.3-.47 11.18 1.27 8.5 2.5 6.6 4.45 5.48 6.28 5.48c1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.41-1.02 4.57-1.02 1.63 0 3.36.89 4.59 2.42-4.03 2.21-3.38 7.97.49 9.2z" />
        </svg>
        <span><small>Muy pronto en</small>App Store</span>
      </span>
      <span className="l-store" aria-label="Google Play, muy pronto">
        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden>
          <path d="M4 2.6v18.8c0 .5.55.8.98.55L21 13.1a1.25 1.25 0 0 0 0-2.2L4.98 2.05A.64.64 0 0 0 4 2.6z" />
        </svg>
        <span><small>Muy pronto en</small>Google Play</span>
      </span>
    </div>
  );
}

/** Pantalla de detalle del reporte, dibujada con CSS: ilustra la app sin depender de capturas. */
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
          <div className="l-sbody">
            <span className="l-cat">Bache</span>
            <b className="l-addr">Av. San Martín 425</b>
            <span className="l-sub">La Calera · Reporte 128</span>
            <div className="l-sstats">
              <div><b>19</b>vecinos sumados</div>
              <div><b>12</b>días abierto</div>
            </div>
            <span className="l-sbtn"><Icon name="users" size={18} />Me sumo</span>
            <span className="l-sbtn wa"><Icon name="message" size={18} />Enviar a la Muni</span>
          </div>
        </div>
      </div>
      <div className="l-float a"><span className="l-dot ok"><Icon name="check" size={16} /></span>Enviado a la Muni por WhatsApp</div>
      <div className="l-float b"><span className="l-dot"><Icon name="users" size={16} /></span>+3 vecinos se sumaron hoy</div>
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
              Baches, luminarias apagadas, basurales, calles anegadas. Reportalo con una foto, sumá a tus vecinos y
              mandáselo a tu Municipalidad por WhatsApp. En tres toques y sin crear cuenta.
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
                <span className="l-num">{i + 1}</span>
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
              Cada municipio recibe un resumen semanal con los problemas que más vecinos afectan y los que llevan más
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
                  <span className="l-thumb" />
                  <span>
                    <b>{r.cat}</b>
                    <span className="muted">{r.where}</span>
                  </span>
                  <span className="big"><b>{r.n}</b><span className="muted">vecinos</span></span>
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
            <p>No pedimos nombre, email ni teléfono. Lo contamos todo en la <a href="/privacidad">política de privacidad</a>.</p>
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
