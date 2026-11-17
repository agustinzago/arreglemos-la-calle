# Ficha de App Store

Textos para copiar en App Store Connect (versión 1.0.0). Entre paréntesis, el límite de caracteres de Apple.

## Información de la app

**Nombre** (30)

```
Arreglemos la Calle
```

**Subtítulo** (30)

```
Reportá problemas de tu calle
```

**Categoría:** Utilidades (principal), Estilo de vida (secundaria).

**URL de soporte:** `https://arreglemoslacalle.app/soporte`
**URL de marketing:** `https://arreglemoslacalle.app`
**URL de la política de privacidad:** `https://arreglemoslacalle.app/privacidad`

## Versión 1.0.0

**Texto promocional** (170, se puede cambiar sin mandar a revisión)

```
Sacale una foto al bache, la luminaria apagada o el basural de tu cuadra. Sumate a los reportes de tus vecinos y mandáselos a tu municipio por WhatsApp.
```

**Descripción** (4000)

```
¿Ese bache lleva meses en tu cuadra? Con Arreglemos la Calle lo reportás en segundos y, entre todos los vecinos, hacemos que se vea.

SACÁ UNA FOTO Y LISTO
La app abre directo en la cámara. Sacás la foto, confirmás dónde está el problema y elegís la categoría: bache, calle de tierra en mal estado, anegamiento, luminaria apagada, basural, árbol caído, semáforo o señal rota, vereda rota, cloaca desbordada u otro. La app te puede sugerir la categoría a partir de la foto, pero siempre la confirmás vos.

SUMATE A LO QUE YA REPORTARON
Si alguien ya reportó el mismo problema cerca, la app te lo muestra antes de crear uno nuevo. Sumarte cuenta: cuantos más vecinos se suman, más importa el reporte.

MANDÁSELO A TU MUNICIPIO
Con un toque le mandás el reporte a tu municipio desde tu propio WhatsApp, con un mensaje armado y el link a la página del reporte. Cada semana, cada municipio tiene su ranking público con los problemas que más vecinos esperan y los que llevan más tiempo sin arreglar.

EL MAPA DE TU BARRIO
Mirá en el mapa todo lo que reportaron tus vecinos y los reportes cerca tuyo.

LOS VECINOS DICEN CUÁNDO ESTÁ ARREGLADO
Cuando el problema se arregla, los vecinos lo marcan. Si vuelve a romperse, con un toque vuelve a estar abierto. Si querés, te avisamos cuando arreglen lo que reportaste o aquello a lo que te sumaste.

SIN REGISTRARTE
No te pedimos nombre, email ni teléfono, y nunca se muestra quién hizo un reporte. Si querés no perder tus reportes al cambiar de teléfono, podés vincular tu cuenta de Apple o Google. Es opcional.

FUNCIONA SIN SEÑAL
Si no tenés conexión, el reporte queda guardado en tu teléfono y se envía solo cuando vuelve la señal.

Hoy funciona en el Gran Córdoba: Córdoba, La Calera, Villa Allende, Unquillo, Mendiolaza, Río Ceballos, Saldán, Salsipuedes, Agua de Oro, Estación Juárez Celman, Malvinas Argentinas, Malagueño, Villa Carlos Paz, Alta Gracia, Jesús María y Colonia Caroya. Se puede reportar desde cualquier lugar.

Arreglemos la Calle es una app vecinal independiente: no es del gobierno ni de ningún municipio. No es para emergencias: si hay riesgo para personas, llamá al 911 o al 103.
```

**Palabras clave** (100, separadas por coma, sin espacios)

```
bache,reclamo,municipio,vecinos,barrio,córdoba,luminaria,basural,vereda,cloaca,calera,denuncia
```

**Copyright:** `2026` seguido del nombre que figura como vendedor en la cuenta de Apple Developer.

## Clasificación por edad

En el cuestionario, todo "No" o "Ninguno", salvo:

- **Contenido generado por usuarios:** Sí (los reportes, con foto y descripción, son públicos). La app tiene denuncia de
  reportes, bloqueo de usuarios y contacto en `/soporte`.

## Capturas (iPhone 6.9")

Cinco, en este orden, con un título corto arriba de cada una:

1. Cámara abierta frente a un bache: "Sacale una foto al problema".
2. Elegir la categoría, con la sugerida marcada: "Elegí qué es, en un toque".
3. Reporte cercano antes de crear uno nuevo: "Sumate a lo que ya reportaron".
4. Confirmación con "Enviar a la Muni": "Mandáselo a tu municipio por WhatsApp".
5. Mapa con grupos de reportes: "Mirá lo que pasa en tu barrio".

## Notas para la revisión

En App Review Information → Notes. Van en inglés para el revisor. No hace falta usuario de prueba (el campo de
inicio de sesión queda vacío): la app no pide registrarse.

```
Arreglemos la Calle is an independent civic app (not affiliated with any government or municipality) where neighbors report street problems (potholes, broken street lights, garbage dumps, etc.) with a photo.

NO LOGIN REQUIRED
On first launch the app creates an anonymous account tied to the device. No name, email or phone is ever requested. Every feature can be used without signing in.

HOW TO TEST
1. Allow camera and location. The app opens on the camera.
2. Take a photo (or tap "Galería" to pick one), confirm the location on the map, pick a category and send. The report is public as soon as it is created.
3. "Mapa" shows all reports; "Mis reportes" lists the ones you created or joined.
Reports can be created anywhere. Outside the 16 supported municipalities in Córdoba, Argentina, the report has no municipality, so the "Enviar a la Muni" (send to the municipality via WhatsApp) button is not shown. To see it, set the location pin inside Córdoba city (for example -31.4167, -64.1833).

SIGN IN WITH APPLE / GOOGLE (OPTIONAL)
In "Mis reportes", the "No pierdas tus reportes" card lets the user link an Apple or Google account, only to keep their reports when switching phones. Once linked, the same card shows "Borrar mi cuenta" (delete my account), which deletes the account, the reports and photos it created, and unlinks the provider.

USER-GENERATED CONTENT (GUIDELINE 1.2)
Every report screen has "Denunciar este reporte" (report as false or offensive; after several reports it is hidden from everyone) and "Bloquear a quien lo publicó" (block the author; the user stops seeing their reports). Contact: https://arreglemoslacalle.app/soporte

AI CATEGORY SUGGESTION
The first time a photo is taken, the app asks for permission before sending a small copy of the photo to Anthropic to suggest a category. The user always confirms or changes the category. This can be changed later in "Mis reportes".

NOT FOR EMERGENCIES
The app shows a permanent notice asking users to call 911 or 103 if people are at risk.
```

## Privacidad de la app

Rastreo (tracking): **No**. Datos recopilados, todos para **Funcionalidad de la app** y **vinculados a la identidad
del usuario** (por la cuenta anónima). Ninguno se usa para rastreo.

| Tipo en App Store Connect | Qué es |
| --- | --- |
| Ubicación → Ubicación precisa | El lugar del problema |
| Contenido del usuario → Fotos o videos | La foto del reporte |
| Contenido del usuario → Otro contenido del usuario | Dirección y descripción del reporte |
| Identificadores → ID de usuario | La cuenta anónima del dispositivo |
| Identificadores → ID del dispositivo | El token de avisos, si los acepta |
| Información de contacto → Dirección de correo electrónico | Solo si vincula Apple o Google (opcional) |
