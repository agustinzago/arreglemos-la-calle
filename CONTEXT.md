# Arreglemos la Calle

App cívica independiente (no del gobierno) donde los vecinos reportan problemas de la calle con una foto, se suman a los reportes de otros y se los mandan a su municipio. Piloto en La Calera, Córdoba.

## Reportes

**Reporte**:
Un problema concreto en la vía pública, con una foto, una ubicación, una categoría y un estado. Es público desde que se crea.
_Avoid_: reclamo, denuncia, ticket, incidente, alerta

**Reporte sin enviar**:
Un reporte que el vecino armó pero que todavía no llegó (sin señal, o el servidor falló): queda guardado en su teléfono, sin número ni página pública, y se envía solo cuando se puede. Si el servidor lo rechaza, el vecino lo descarta o prueba de nuevo.
_Avoid_: pendiente, borrador, en cola

**Categoría**:
El tipo de problema de un reporte, de una lista fija (Bache, Calle de tierra en mal estado, Anegamiento, Luminaria apagada, Basural, Árbol caído, Semáforo o señal rota, Vereda rota, Cloaca desbordada, Otro). "Otro" exige una descripción.
_Avoid_: tipo, rubro, servicio

**Categoría sugerida**:
La categoría que la app propone a partir de la foto y que el vecino confirma o cambia. Nunca se asigna sin que el vecino la vea.

**Reporte cercano**:
Un reporte abierto de la misma categoría, dentro del radio de duplicado, que se le muestra al vecino antes de crear uno nuevo para que decida si es el mismo problema.
_Avoid_: duplicado (como estado), reporte repetido

**Radio de duplicado**:
La distancia, propia de cada categoría, dentro de la cual dos reportes pueden ser el mismo problema (corta para una luminaria, larga para una calle de tierra).

**Grupo**:
Varios reportes cercanos que el mapa muestra juntos ("4 reportes · 19 vecinos"). Es solo visual: cada reporte sigue siendo independiente.
_Avoid_: cluster, reporte agrupado

## Vecinos

**Vecino**:
Cualquier persona que usa la app. Se identifica por su dispositivo y puede vincular una cuenta de Apple o Google si quiere, pero nunca está obligado.
_Avoid_: usuario, ciudadano, denunciante

**Sumarse**:
Que un vecino declare que el problema de un reporte existente también lo afecta. Un vecino se suma una sola vez por reporte.
_Avoid_: votar, apoyar, like, +1

**Vecinos sumados**:
La cantidad de vecinos que se sumaron a un reporte, contando a quien lo creó. Es la medida de cuánto importa un problema.
_Avoid_: votos, apoyos, interés

## Estados

**Abierto**:
Estado de un reporte cuyo problema sigue sin arreglar.
_Avoid_: pendiente, activo

**Resuelto**:
Estado de un reporte que los vecinos confirmaron como arreglado.
_Avoid_: cerrado, solucionado, finalizado

**Oculto**:
Estado de un reporte retirado del mapa público por denuncias de los vecinos o por un operador.
_Avoid_: borrado, moderado, eliminado

**Marcar arreglado**:
Que un vecino indique que el problema de un reporte ya no está. Hacen falta dos vecinos distintos para que el reporte pase a resuelto.
_Avoid_: cerrar, resolver

**Sigue roto**:
Que un vecino indique que un reporte resuelto en realidad no está arreglado. Con uno alcanza para que vuelva a abierto.
_Avoid_: reabrir, reclamo

**Denuncia**:
Que un vecino señale que un reporte es falso, ofensivo o no corresponde. Solo sirve para moderar; no tiene nada que ver con la denuncia ante el municipio.
_Avoid_: reporte (de contenido), flag

**Operador**:
La persona que administra la app y puede cambiar el estado de un reporte a mano.
_Avoid_: admin, moderador

## Municipios

**Municipio**:
El gobierno local responsable de la zona donde está un reporte. Cada reporte pertenece al municipio dentro de cuyo límite cae; puede no pertenecer a ninguno.
_Avoid_: muni (en el modelo), gobierno, ciudad, localidad

**Enviar a la Muni**:
Que el vecino le mande el reporte al municipio desde su propio WhatsApp, con un mensaje armado y el link a la página pública.
_Avoid_: notificar, derivar, escalar

**Página pública**:
La página web de un reporte, que cualquiera puede abrir desde un link sin tener la app.

**Ranking semanal**:
La lista, por municipio, de los reportes abiertos con más vecinos sumados y con más días abiertos, pensada para mandársela al municipio.
_Avoid_: resumen, reporte semanal, digest
