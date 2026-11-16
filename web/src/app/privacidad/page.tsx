// Política de privacidad: la URL que piden App Store Connect, Play Console y la pantalla de consentimiento de Google.
// Describe lo que la app hace hoy (migraciones de supabase/ y mobile/src/lib). Si cambia qué datos se guardan o
// con quién se comparten, hay que actualizarla.
// ponytail: borrador escrito por un agente, falta la revisión de una persona (ver README, "Pendiente humano").
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad · Arreglemos la Calle",
  description: "Qué datos guarda Arreglemos la Calle, qué es público y cómo borrar tu cuenta.",
};

const EMAIL = "hola@arreglemoslacalle.app";

export default function PrivacyPage() {
  return (
    <main className="doc">
      <div>
        <div className="eyebrow">Política de privacidad</div>
        <h1>Qué datos guardamos y qué es público</h1>
        <div className="muted">Última actualización: 16 de noviembre de 2026</div>
      </div>
      <p className="draft">Borrador: este texto todavía no fue revisado.</p>

      <p>
        Arreglemos la Calle es una iniciativa vecinal independiente para reportar problemas de la calle con foto y
        ubicación. No pertenece a ninguna Municipalidad ni a ningún gobierno. Esta política explica qué datos usa la app,
        qué se publica y cómo borrarlos. Si tenés dudas, escribinos a <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>

      <h2>Lo más importante</h2>
      <ul>
        <li>No necesitás cuenta, nombre, email ni teléfono para usar la app.</li>
        <li>Los reportes son públicos: la foto, la ubicación, la categoría y la descripción los puede ver cualquiera.</li>
        <li>Nunca publicamos quién hizo un reporte.</li>
        <li>No vendemos datos, no mostramos publicidad y no usamos herramientas de seguimiento ni de analítica.</li>
      </ul>

      <h2>Tu identificador anónimo</h2>
      <p>
        La primera vez que usás la app se crea una sesión anónima en nuestro servidor: un identificador al azar que queda
        guardado en tu teléfono. Con ese identificador la app sabe cuáles son tus reportes (en Mis reportes) y evita que
        te sumes dos veces al mismo. No está asociado a tu nombre ni a tu número, y nunca se publica.
      </p>

      <h2>Los reportes</h2>
      <p>
        Cuando creás un reporte guardamos la foto, el punto del mapa que elegiste, la dirección aproximada, la categoría,
        la descripción si escribiste una y la fecha. Todo eso es público: aparece en la app, en este sitio (por ejemplo
        en arreglemoslacalle.app/r/123), en el ranking semanal de cada municipio y en una interfaz pública para que los
        municipios y otros sistemas puedan leer los reportes.
      </p>
      <p>
        Por eso, sacá la foto al problema y no a las personas: evitá que se vean caras, patentes o datos personales, y no
        pongas tu nombre ni tu teléfono en la descripción.
      </p>
      <p>
        Cuando te sumás a un reporte, avisás que ya lo arreglaron (con una foto opcional, que también es pública), decís
        que sigue roto o lo denunciás, guardamos ese movimiento con tu identificador. Se publica que alguien lo hizo,
        nunca quién. Las denuncias no se publican: sirven para ocultar reportes inapropiados.
      </p>

      <h2>Tu ubicación</h2>
      <p>
        La app pide permiso de ubicación para centrar el mapa donde estás y mostrarte reportes cercanos. Solo guardamos
        el punto de cada reporte que creás, no tu recorrido ni tu ubicación en otro momento. La dirección aproximada la
        calcula el servicio de mapas de tu teléfono (Apple o Google) a partir de ese punto.
      </p>

      <h2>Avisos cuando lo arreglen</h2>
      <p>
        Si aceptás que te avisemos, guardamos el identificador de notificaciones de tu teléfono (un token de Expo) junto
        a tu identificador anónimo. Lo usamos solo para avisarte cuando cambia el estado de tus reportes. Los avisos
        pasan por Expo y por el servicio de notificaciones de Apple o de Google. Los podés apagar cuando quieras desde
        los ajustes del teléfono.
      </p>

      <h2>Sugerencia de categoría</h2>
      <p>
        Apenas elegís la foto, la app manda una copia chica a nuestro servidor, que se la pasa a Anthropic (el modelo de
        inteligencia artificial Claude) para sugerirte una categoría. Esto pasa aunque después no termines el reporte.
        No guardamos esa copia. Anthropic la procesa para devolver la sugerencia, según sus condiciones para empresas.
      </p>

      <h2>Vincular tu cuenta (opcional)</h2>
      <p>
        Si querés no perder tus reportes al cambiar de teléfono, podés vincular tu cuenta con Apple o con Google desde
        Mis reportes. En ese caso recibimos el email de esa cuenta (con Apple, puede ser un email privado que Apple
        reenvía) y un identificador de Apple o Google. No recibimos tu contraseña, tus contactos ni nada más, y no
        usamos el email para mandarte mensajes. Lo usamos solo para que puedas entrar con la misma cuenta en otro
        teléfono.
      </p>

      <h2>WhatsApp a la Muni</h2>
      <p>
        El botón &ldquo;Enviar a la Muni por WhatsApp&rdquo; abre WhatsApp con un mensaje ya armado para el número del
        municipio. El mensaje lo mandás vos, desde tu WhatsApp: la app no lo envía, no lo lee y no registra si lo
        mandaste. Ese mensaje queda sujeto a la política de privacidad de WhatsApp.
      </p>

      <h2>Con quién compartimos datos</h2>
      <p>No vendemos ni cedemos datos. Usamos estos servicios para que la app funcione:</p>
      <ul>
        <li>Supabase: base de datos, fotos y sesiones.</li>
        <li>Vercel: aloja este sitio.</li>
        <li>Expo, Apple y Google: avisos, mapas y, si vinculás tu cuenta, el inicio de sesión.</li>
        <li>Anthropic: la sugerencia de categoría.</li>
      </ul>
      <p>Estos servicios pueden guardar los datos en servidores fuera de la Argentina.</p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>
        Los reportes quedan publicados, también después de arreglados, hasta que borres tu cuenta, nos pidas borrarlos o
        los ocultemos por denuncias. Tu identificador anónimo queda mientras uses la app; si la desinstalás sin vincular
        tu cuenta, el teléfono lo pierde y ya no podemos asociarte a tus reportes.
      </p>

      <h2>Cómo borrar tu cuenta y tus datos</h2>
      <p>
        Si vinculaste tu cuenta, entrá a Mis reportes y tocá &ldquo;Borrar mi cuenta&rdquo;. Se borran en el momento tus
        reportes, sus fotos, tu cuenta y tu token de avisos. Donde te sumaste o avisaste algo en reportes de otros
        vecinos, el movimiento sigue contando pero queda desvinculado de vos, y se borra la foto que hayas agregado. No
        se puede deshacer.
      </p>
      <p>
        Si no vinculaste tu cuenta, o si querés borrar un reporte puntual, escribinos a{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a> con el link o el número de los reportes y los borramos.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedirnos acceder a tus datos, corregirlos o borrarlos escribiendo a{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>, según la Ley 25.326 de Protección de Datos Personales. La Agencia de
        Acceso a la Información Pública es la autoridad de control y recibe los reclamos sobre el cumplimiento de esa
        ley.
      </p>

      <h2>Cambios</h2>
      <p>
        Si cambiamos qué datos usamos, actualizamos esta página y la fecha de arriba.
      </p>
    </main>
  );
}
