// Soporte y contacto: la piden App Store y Google Play (URL de soporte en la ficha de cada tienda).
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Soporte · Arreglemos la Calle",
  description: "Ayuda y contacto de la app Arreglemos la Calle.",
};

export default function Soporte() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return (
    <main className="doc">
      <h1>Soporte</h1>
      <p>¿Algo no anda, tenés una idea o querés que borremos un reporte? Escribinos a {mail}.</p>
      <p className="muted">Si es sobre un reporte, mandanos su número (aparece como «Reporte 128» debajo de la dirección, o en el link /r/128).</p>

      <h2>Preguntas frecuentes</h2>
      <dl>
        <dt>¿La app es del municipio?</dt>
        <dd>
          No. Es una app vecinal independiente. Sirve para juntar los reportes y mandárselos a la Muni, pero arreglar
          la calle le toca al municipio.
        </dd>

        <dt>¿Cómo borro un reporte que hice?</dt>
        <dd>
          Si vinculaste tu cuenta, en Mis reportes está «Borrar mi cuenta», que borra todos tus reportes. Para uno
          solo, o si no vinculaste, escribinos a {mail} con el número del reporte y lo sacamos.
        </dd>
        <dt>Cambié de teléfono, ¿pierdo mis reportes?</dt>
        <dd>
          No, si antes los vinculaste: en Mis reportes tocá «Continuar con Apple» o «Continuar con Google». En el
          teléfono nuevo, tocá lo mismo con la misma cuenta y aparecen tus reportes. Sin vincular, quedan en el teléfono
          viejo.
        </dd>

        <dt>Vi un reporte falso u ofensivo</dt>
        <dd>
          Abrilo en la app y tocá «Denunciar». Con varias denuncias se oculta del mapa; también podés escribirnos. Si no
          querés ver más lo que publica esa persona, tocá «Bloquear a quien lo publicó».
        </dd>

        <dt>No me llegan los avisos</dt>
        <dd>
          Fijate en los ajustes del teléfono que las notificaciones de Arreglemos la Calle estén permitidas. Los avisos
          llegan cuando un reporte tuyo o al que te sumaste se arregla o vuelve a estar roto.
        </dd>

        <dt>La app no encuentra dónde estoy</dt>
        <dd>Revisá que tenga permiso de ubicación, o mové el mapa a mano hasta el lugar del problema.</dd>

        <dt>¿Qué datos guardan?</dt>
        <dd>
          Lo contamos en la <a href="/privacidad">política de privacidad</a>. No pedimos nombre, email ni teléfono (el email solo si vinculás Apple o Google).
        </dd>
      </dl>
    </main>
  );
}
