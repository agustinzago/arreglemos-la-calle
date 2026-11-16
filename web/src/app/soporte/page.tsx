// Soporte: la URL de contacto que piden App Store Connect y Play Console.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Soporte · Arreglemos la Calle",
  description: "Contacto y preguntas frecuentes de Arreglemos la Calle.",
};

const EMAIL = "hola@arreglemoslacalle.app";

const FAQ: [string, ReactNode][] = [
  [
    "¿Cómo hago un reporte?",
    "Abrí la app, tocá \"Sacar foto\" (o elegí una de la galería), ubicá el pin en el mapa y elegí la categoría. No hace falta crear una cuenta.",
  ],
  [
    "¿La app le manda el reporte a la Municipalidad?",
    "No sola. Con \"Enviar a la Muni por WhatsApp\" se abre WhatsApp con el mensaje listo y lo mandás vos. Arreglemos la Calle es una iniciativa vecinal independiente: no es un canal oficial del municipio.",
  ],
  [
    "Es una emergencia, ¿qué hago?",
    "No uses la app: llamá al 911 o al 103 (Defensa Civil).",
  ],
  [
    "¿Quién ve mis reportes?",
    <>
      Cualquiera: la foto, la ubicación y la descripción son públicas, pero nunca se muestra quién hizo el reporte. Más
      detalles en la <a href="/privacidad">política de privacidad</a>.
    </>,
  ],
  [
    "Ya lo arreglaron, ¿cómo lo marco?",
    "En el reporte, tocá \"Ya está arreglado\" y, si querés, sumá una foto de cómo quedó. Si otro vecino ve que sigue roto, puede decirlo con \"Sigue roto\".",
  ],
  [
    "Cambié de teléfono, ¿pierdo mis reportes?",
    "Si vinculaste tu cuenta con Apple o Google desde Mis reportes, no: entrá con la misma cuenta en el teléfono nuevo. Si no la vinculaste, el teléfono nuevo empieza de cero.",
  ],
  [
    "¿Cómo borro mi cuenta o un reporte?",
    <>
      Con la cuenta vinculada, en Mis reportes está &ldquo;Borrar mi cuenta&rdquo;, que borra tus reportes y sus fotos.
      Si no la vinculaste, o para borrar un reporte puntual, escribinos a <a href={`mailto:${EMAIL}`}>{EMAIL}</a> con el
      link del reporte.
    </>,
  ],
  [
    "Un reporte tiene algo inapropiado o datos de una persona",
    "En el reporte, tocá \"Denunciar este reporte\". Si es urgente, escribinos con el link y lo revisamos.",
  ],
];

export default function SupportPage() {
  return (
    <main className="doc">
      <div>
        <div className="eyebrow">Soporte</div>
        <h1>¿Necesitás ayuda?</h1>
      </div>
      <p>
        Escribinos a <a href={`mailto:${EMAIL}`}>{EMAIL}</a> por cualquier consulta, problema con la app o pedido sobre tus
        datos. Si es sobre un reporte, mandanos el link o el número.
      </p>
      <h2>Preguntas frecuentes</h2>
      {FAQ.map(([q, a]) => (
        <section key={q}>
          <h3>{q}</h3>
          <p>{a}</p>
        </section>
      ))}
    </main>
  );
}
