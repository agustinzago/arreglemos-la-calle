# Arreglemos la Calle — brief de diseño (para Claude Design)

Diseñá una app mobile (iOS y Android, Expo / React Native) llamada **Arreglemos la Calle**. En el ícono aparece "Arreglemos". Quiero un prototipo interactivo de alta fidelidad con todas las pantallas de abajo y los tokens de diseño (colores, tipografía, espaciado y radios).

## Qué es
Una app cívica independiente, no del gobierno. Un vecino saca una foto de un problema en la calle (un bache, una calle de tierra rota, una luminaria apagada, un basural) y lo reporta en 3 toques, sin crear cuenta. El reporte aparece en un mapa público, otros vecinos se suman y el vecino se lo manda a la municipalidad por WhatsApp con un toque. Piloto en La Calera, Córdoba, Argentina. Todos los textos van en español rioplatense, con voseo: "Sacá la foto", "Sumate".

## Usuarios y restricciones (lo más importante)
- **La tiene que poder usar un abuelo.** Con un solo intento, sin explicación.
- Texto de cuerpo de al menos 17-18 pt, y que respete el tamaño de letra del sistema (Dynamic Type / font scale) sin romperse.
- Áreas táctiles de al menos 48×48 dp. Los botones principales ocupan todo el ancho y van abajo, al alcance del pulgar.
- Contraste WCAG AA o más. Se usa al sol, en la calle.
- Los íconos siempre van con texto. Nada se hace solo con gestos. Los estados nunca se indican solo con color: siempre van con un ícono y una etiqueta.
- Una acción principal por pantalla. Sin jerga ni abreviaturas.

## Tono visual
- Vecinal, cálido y confiable. **No debe parecer una app de gobierno**: nada de escudos ni del celeste institucional.
- Paleta sugerida: tonos tierra o terracota como color principal, verde para "resuelto", ámbar para "abierto" y neutros cálidos. Está abierta a propuestas.
- Moderna y limpia, al estilo de las apps nativas actuales (iOS 26 / Material 3). Bordes redondeados y tarjetas con foto grande.
- Diseñá modo claro y modo oscuro.

## Pantallas
1. **Permisos (primer uso)**: una sola pantalla que explica por qué pide cámara y ubicación, con un botón "Empezar". Incluí también el estado "permiso denegado", con un botón para abrir Ajustes.
2. **Cámara (pantalla inicial)**: la app abre directo acá. Disparador grande, botón chico de galería y accesos al Mapa y a Mis reportes.
3. **Ubicación**: la foto en miniatura y un mapa con el pin, que se puede arrastrar, sobre la ubicación GPS. La dirección se lee del mapa ("Av. San Martín 425, La Calera"). Botón "Confirmar ubicación".
4. **Categoría**: chips grandes con ícono y texto para las 10 categorías: Bache, Calle de tierra en mal estado, Anegamiento / desagüe tapado, Luminaria apagada, Basural / residuos, Árbol o rama caída, Semáforo / señal rota, Vereda rota, Cloaca desbordada, Otro. Una de ellas aparece **preseleccionada por la IA** con la etiqueta "Sugerido". Si se elige "Otro", aparece un campo de texto obligatorio.
5. **¿Ya lo reportaron?**: hasta 3 reportes cercanos con foto, distancia y vecinos sumados. Botones "Es este, me sumo" y "Es otro, crear nuevo".
6. **Detalles y envío**: descripción opcional, un resumen de lo cargado y el botón "Enviar reporte". Incluí el estado sin conexión: "Sin señal, lo enviamos apenas vuelva".
7. **Confirmación**: número de reporte y el botón principal **"Enviar a la Muni por WhatsApp"**. Debajo, la opción "¿Te avisamos cuando lo arreglen?" para activar las notificaciones, y el login opcional con Apple o Google, en un lugar secundario.
8. **Mapa público**: reportes con íconos por categoría, agrupados por cuadra ("4 reportes · 19 vecinos"). Filtro por categoría y por estado (abierto o resuelto). Una hoja inferior (bottom sheet) con la lista.
9. **Detalle del reporte**: foto grande, categoría, dirección, días abierto, vecinos sumados y una línea de tiempo con los eventos. Acciones: "Me sumo", "Ya está arreglado" (con foto opcional), "Sigue roto" (si está resuelto) y "Denunciar" (secundario).
10. **Mis reportes**: lista con el estado de cada uno. Incluí el estado vacío ("Todavía no reportaste nada. ¡Sacá la primera foto!").
11. **Aviso fijo** en algún lugar visible: "¿Hay riesgo para personas? Llamá al 911 o al 103".

## Web (mobile-first, Next.js)
12. **Página pública del reporte** (`/r/[id]`), que es la que se abre desde el link de WhatsApp: foto, mapa, categoría, vecinos sumados y botón "Descargá la app y sumate".
13. **Ranking semanal por municipio**: los reportes con más vecinos sumados y con más días abiertos. Lo voy a mandar a la municipalidad, así que tiene que verse serio y claro.

## Stack de implementación (el diseño tiene que poder construirse con esto)
- **UI**: React Native Reusables (componentes estilo shadcn) sobre NativeWind v4. Usá solo componentes que existan ahí o que sean simples de armar: Button, Card, Badge, Input, Textarea, y chips hechos con Pressable.
- **Mapa**: react-native-maps, con agrupación de marcadores (clusters).
- **Hoja inferior**: @gorhom/bottom-sheet. La del mapa queda **persistente** (con dos alturas: 25% y 85%), no es un modal.
- **Patrón de formulario**: el de GOV.UK, con una pregunta por pantalla y una pantalla de revisión antes de enviar.

## Entregables
- Un artboard por pantalla. Usá el marco iPhone de 390×844 como base y repetí las pantallas clave en Android de 412×915.
- Prototipo navegable con el flujo completo: cámara, ubicación, categoría, duplicados, envío, confirmación y WhatsApp.
- Para cada pantalla, artboards separados con sus estados: **vacío, carga, error, sin conexión y permiso denegado**, cuando correspondan.
- Variantes en modo oscuro y con **fuente al 200%** en la cámara, la categoría, el detalle y la confirmación.
- Tokens de diseño en formato `tailwind.config.js` (colores como variables CSS para claro y oscuro, tipografía, espaciado y radios), compatibles con NativeWind v4.
- Una propuesta de ícono de la app (1024×1024), con versión monocromática para el ícono adaptativo de Android.
