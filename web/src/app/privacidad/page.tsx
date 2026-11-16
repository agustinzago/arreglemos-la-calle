// Política de privacidad: la piden App Store y Google Play (URL en la ficha de cada tienda).
// Si la app empieza a juntar algo nuevo, actualizar esta página, la fecha y las respuestas de las tiendas (README).
// ponytail: borrador escrito por un agente, falta la revisión de una persona (README, Lanzamiento).
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad · Arreglemos la Calle",
  description: "Qué datos junta la app Arreglemos la Calle, para qué y con quién se comparten.",
};

export default function Privacidad() {
  return (
    <main className="doc">
      <h1>Política de privacidad</h1>
      <p className="muted">Última actualización: 17 de noviembre de 2026</p>
      <p className="draft">Borrador: este texto todavía no fue revisado.</p>

      <p>
        Arreglemos la Calle es una app vecinal independiente para reportar problemas de la calle con una foto. No es
        del gobierno ni de ningún municipio. Para usarla no pedimos tu nombre, tu email ni tu teléfono, no mostramos
        publicidad y no vendemos datos.
      </p>

      <h2>Qué datos juntamos y para qué</h2>
      <dl>
        <dt>Fotos</dt>
        <dd>
          La foto que sacás o elegís para un reporte. Antes de subirla, la app la achica y le borra los datos internos
          de la imagen (EXIF), como el modelo del teléfono o la ubicación guardada en la foto. La foto del reporte es
          pública.
        </dd>

        <dt>Ubicación</dt>
        <dd>
          Solo mientras usás la app y solo si le das permiso: para poner el problema en el mapa, completar la
          dirección y mostrarte reportes cercanos. Si elegís una foto de la galería, la app puede leer el lugar donde
          se sacó para proponerlo. Guardamos la ubicación del problema, no la tuya ni un historial de dónde estuviste.
        </dd>

        <dt>Cuenta anónima del dispositivo</dt>
        <dd>
          La primera vez que abrís la app se crea una cuenta anónima, sin nombre, email ni teléfono. Sirve para saber
          qué reportes hiciste y a cuáles te sumaste, para que cada vecino se sume una sola vez y para frenar abusos.
          Nunca se muestra en público. Si desinstalás la app sin vincular una cuenta, el teléfono la pierde y ya no
          podemos asociarte a tus reportes.
        </dd>

        <dt>Cuenta de Apple o Google (opcional)</dt>
        <dd>
          Si vinculás tu cuenta desde Mis reportes, para no perder tus reportes al cambiar de teléfono, recibimos el
          email de esa cuenta (con Apple puede ser un email privado que Apple reenvía) y un identificador de Apple o
          Google. No recibimos tu contraseña ni tus contactos, y no usamos el email para mandarte mensajes: sirve solo
          para que entres con la misma cuenta en otro teléfono.
        </dd>

        <dt>Token de avisos</dt>
        <dd>
          Solo si aceptás «¿Te avisamos cuando lo arreglen?». Es un código que identifica a tu teléfono para mandarle
          avisos. Lo usamos únicamente para avisarte cuando un reporte que hiciste o al que te sumaste se arregla o
          vuelve a estar roto. Podés apagar los avisos cuando quieras desde los ajustes del teléfono.
        </dd>

        <dt>Lo que escribís</dt>
        <dd>La categoría, la dirección y la descripción opcional del reporte. Son públicas.</dd>
      </dl>

      <h2>Qué es público y qué no</h2>
      <p>
        Cualquiera puede ver, en la app, en este sitio, en el ranking semanal de cada municipio y en una interfaz
        pública para que municipios y otros sistemas lean los reportes, la foto, la categoría, la descripción, la dirección y el
        lugar del problema, su estado, la fecha y cuántos vecinos se sumaron. Nunca se muestra quién hizo un reporte,
        quién se sumó ni tu token de avisos. Por eso no pongas datos personales ni caras en la foto o la descripción.
      </p>

      <h2>Con quién se comparten</h2>
      <ul>
        <li>
          <b>Supabase</b>, donde se guardan los reportes, las fotos y la cuenta anónima.
        </li>
        <li>
          <b>Expo, Apple y Google</b>, que entregan los avisos a tu teléfono si los aceptaste y, si vinculás tu
          cuenta, se encargan del inicio de sesión.
        </li>
        <li>
          <b>Anthropic</b>, que recibe una copia chica de la foto apenas la elegís (aunque después no termines el
          reporte) para sugerir la categoría del problema. No guardamos esa copia. La sugerencia la confirmás o
          cambiás vos.
        </li>
        <li>
          <b>Google Maps y Apple Maps</b>, que dibujan el mapa de la app.
        </li>
        <li>
          <b>Tu municipio</b>, solo si tocás «Enviar a la Muni»: se abre WhatsApp con el mensaje y el link del reporte
          y sos vos quien decide mandarlo, desde tu cuenta de WhatsApp.
        </li>
      </ul>
      <p>
        Cada uno de estos servicios usa los datos solo para lo que hace en la app, y pueden guardarlos en servidores
        fuera de la Argentina.
      </p>

      <h2>Permisos del teléfono</h2>
      <p>
        La app pide la cámara, las fotos, la ubicación y las notificaciones recién cuando hacen falta. Todos son
        opcionales: si decís que no, podés elegir el lugar a mano en el mapa y seguir sin avisos.
      </p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>
        Los reportes quedan publicados mientras la app funcione, salvo que borres tu cuenta o se oculten por denuncias de los vecinos o
        por el operador. El token de avisos se guarda hasta que lo apagues o desinstales la app.
      </p>

      <h2>Cómo borrar tu cuenta y tus datos</h2>
      <p>
        Si vinculaste tu cuenta, entrá a Mis reportes y tocá «Borrar mi cuenta». Se borran en el momento los reportes
        que creaste, sus fotos, tu cuenta y tu token de avisos. Donde te sumaste o avisaste algo en reportes de otros
        vecinos, el movimiento sigue contando pero queda desvinculado de vos, y se borra la foto que hayas agregado. No
        se puede deshacer.
      </p>
      <p>
        Si no vinculaste tu cuenta, o querés borrar un reporte puntual, escribinos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> con el número o el link de los reportes.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedirnos ver, corregir o borrar tus datos, por ejemplo un reporte que hiciste, escribiendo a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> con el número del reporte (más formas en{" "}
        <a href="/soporte">Soporte</a>). Respondemos en un plazo máximo de 10 días hábiles para el acceso y 5 para
        corregir o borrar, como pide la Ley 25.326 de Protección de Datos Personales.
      </p>
      <p className="muted">
        La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y
        reclamos de quienes vean afectados sus derechos sobre sus datos personales.
      </p>

      <h2>Menores</h2>
      <p>La app no está pensada para menores de 13 años y no junta datos a sabiendas de ellos.</p>

      <h2>Cambios</h2>
      <p>Si cambia algo de esta política, lo publicamos en esta página con la fecha nueva.</p>
    </main>
  );
}
