import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

// ponytail: dominio sin decidir; SITE_URL (ver .env.example) lo pisa. Arma los links absolutos de og:url.
const SITE_URL = process.env.SITE_URL ?? "https://arreglemoslacalle.example";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Arreglemos la Calle",
  description: "Reportes vecinales de problemas de la calle, con foto y ubicación.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={rubik.className}>
      <body>
        <header className="top">
          <div className="brand">
            <span className="logo" aria-hidden="true">
              <i className="hole" />
              <i className="pin" />
              <i className="dot" />
            </span>
            Arreglemos la Calle
          </div>
          <span className="muted">App vecinal independiente</span>
        </header>
        {children}
        <footer className="foot">
          <a href="/privacidad">Privacidad</a>
          <a href="/soporte">Soporte</a>
        </footer>
      </body>
    </html>
  );
}
