# El envío al municipio lo hace el vecino desde su WhatsApp

Los municipios de la zona no tienen API ni un email de reclamos que se pueda usar, pero sí atienden por WhatsApp. La API de WhatsApp Business no permite escribirle a un número que no dio su consentimiento antes, y las librerías no oficiales violan los términos de uso. Por eso la app no le manda nada al municipio: le arma al vecino un mensaje con un link `wa.me` y la página pública del reporte, y lo envía él desde su propio teléfono.

## Consequences

- La app nunca sabe si el mensaje se envió ni qué contestó el municipio.
- La presión colectiva no viene del envío sino del ranking semanal, que el operador le manda al municipio a mano.
- Si algún municipio llega a dar una API o un canal propio, se agrega como otra forma de envío; esta no se reemplaza.
