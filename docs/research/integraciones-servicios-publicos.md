# Integraciones con servicios públicos: a quién le llega un reporte

Investigación de qué canales oficiales existen para que un reporte llegue a quien arregla el problema (municipio, EPEC, Aguas Cordobesas, Caminos de las Sierras, etc.) en La Calera, Córdoba Capital y Sierras Chicas, y qué se puede integrar de verdad.

- **Fecha de consulta de todas las fuentes:** 2026-11-18, salvo que se indique otra cosa.
- **Método:** solo lectura. Páginas oficiales, fichas de las tiendas, portales de datos abiertos, documentación de APIs y especificaciones. No se contactó a nadie, no se envió ningún formulario ni se crearon cuentas. Cuando una afirmación sale solo de una nota periodística, se aclara.
- **Contexto:** [ADR 0001](../adr/0001-envio-por-whatsapp-del-vecino.md) (el vecino envía desde su WhatsApp) y [ADR 0006](../adr/0006-sin-emergencias.md) (sin emergencias).

## 1. Resumen

1. **No hay ninguna API pública para crear pedidos** en ninguno de los destinos relevados: Municipalidad de Córdoba, La Calera, EPEC, Aguas Cordobesas, Caminos de las Sierras, Villa Allende, Unquillo, Mendiolaza y Río Ceballos. Ninguno implementa Open311, y la lista oficial de servidores GeoReport v2 no tiene ninguna jurisdicción de América Latina ([Open311 Servers](https://wiki.open311.org/GeoReport_v2/Servers)).
2. **"Docta" es Mi Docta**, la plataforma digital de la Municipalidad de Córdoba, creada por la Ordenanza 13640 ([normativa](https://cordoba.gob.ar/mi-docta/normativa/)). Tiene web y apps para iOS y Android, se lanzó en septiembre de 2026 y reemplaza a VeDi. Promete "Reportá incidencias y seguí su estado en tiempo real" ([cordoba.gob.ar/mi-docta](https://cordoba.gob.ar/mi-docta/)), pero no publica API ni documentación para terceros.
3. **En Córdoba Capital, hoy el canal con foto y ubicación es la App Ciudadana.** Pide CUIL y clave de CiDi, la ubicación y al menos una foto, y sus categorías casi coinciden con las nuestras ([paso a paso](https://cordoba.gob.ar/app-ciudadana-paso-a-paso-para-cargar-un-requerimiento/)). Sus términos prohíben usar el contenido "en otro sitio web o entorno informático" sin autorización escrita, y también la ingeniería inversa ([T&C](https://cordoba.gob.ar/app-ciudadana-terminos-y-condiciones/)). Sin un convenio, solo se puede mandar al vecino a que lo cargue él.
4. **El alumbrado público es del municipio, no de EPEC**, tanto en La Calera como en Capital. En Capital, EPEC ejecuta el mantenimiento por un convenio de 2026, pero la planificación y el control son municipales ([cordoba.gob.ar](https://cordoba.gob.ar/la-municipalidad-invertira-37-mil-millones-en-la-readecuacion-del-sistema-de-alumbrado/)). La app de EPEC solo gestiona pedidos "por falta de suministro" ([Google Play](https://play.google.com/store/apps/details?id=ar.com.epec.epecmovil)). **Mandar "Luminaria apagada" a EPEC sería un error de destino.**
5. **La Calera confirma la premisa del ADR 0001.** Su trámite oficial de "Presentación de reclamos y consultas" se hace por WhatsApp o en persona, y el correo figura como "No disponible" ([guía de trámites](https://lacalera.gob.ar/guia-de-tramites/presentacion-de-reclamos-y-consultas/)). El módulo de reclamos de su portal (PGM) responde "Servicio no habilitado" ([municipalidad.com/laca/reclamos](https://www.municipalidad.com/laca/reclamos)).
6. **Casi todas nuestras categorías terminan en el municipio.** Las excepciones reales dependen del lugar, no de la categoría:
   - Un bache sobre la Ruta E-55 es de la Red de Accesos a Córdoba ([Caminos de las Sierras](https://caminosdelassierras.com.ar/que-es-la-red-de-accesos-a-cordoba/)).
   - Una pérdida de agua potable en Capital es de Aguas Cordobesas ([aguascordobesas.com.ar](https://www.aguascordobesas.com.ar/)), y no tenemos una categoría para eso.
7. **Lo integrable hoy, sin pedirle permiso a nadie:**
   - Elegir el destino de WhatsApp según el municipio y, si hace falta, según la categoría.
   - En Capital, mandar al vecino a la App Ciudadana o a Mi Docta con el texto listo para pegar.
   - Usar `mailto:` solo donde hay un correo institucional de atención. De los relevados, el único es Unquillo ([CAV](https://unquillo.gov.ar/centro-de-atencional-vecino/)).
8. **No hay datos abiertos para mostrar el estado oficial.** El catálogo de Capital tiene 183 datasets y ninguno de pedidos de vecinos ([API del catálogo](https://gobiernoabierto.cordoba.gob.ar/api/datos-abiertos/dato?page=1&size=200)). El portal provincial al que linkea La Calera devuelve 404. Lo que sí sirve es el GeoJSON de los CPC de Capital, para elegir el destino dentro de la ciudad ([API CPC](https://gobiernoabierto.cordoba.gob.ar/api/v2/cpc/cpc-geo/)).
9. **La mejor apuesta a mediano plazo es un convenio, no una integración técnica.** Hay tres puntos de apoyo:
   - La Ordenanza de Mi Docta prevé "integrar o compatibilizar plataformas existentes [...] y las que se incorporen en el futuro" (art. 1).
   - El Ente Metropolitano Córdoba reúne a Capital, La Calera, Mendiolaza, Villa Allende y otros ([cordoba.gob.ar](https://cordoba.gob.ar/ente-metropolitano-tres-anos/)).
   - Unos pocos proveedores (PGM, Mr-Bubo, MuniDigital) atienden a muchos municipios.
10. **El ADR 0001 se sostiene, con tres matices:**
    - Capital ya tiene un "canal propio" (App Ciudadana / Mi Docta), así que corresponde sumarlo como otra forma de envío.
    - El WhatsApp de Capital es un bot con botonera: un mensaje armado puede no entrar al flujo de pedidos (no verificado).
    - La página oficial de atención de Capital muestra **dos** números de WhatsApp. El repo usa uno de ellos (ver §5).

## 2. Tabla por categoría

"¿Integrable?" significa si la app puede hacer llegar el reporte por sí misma:

- **sí**: API o un canal que la app puede usar solo.
- **parcial**: la app prepara todo y el vecino lo envía, como en ADR 0001.
- **no**: el vecino tiene que hacerlo a mano en otro sistema, con su identidad.

### La Calera

Canal general de todas las filas: el WhatsApp del municipio, **351 510-6669**, que aparece en el pie de [lacalera.gob.ar](https://lacalera.gob.ar/) y es el que usa el repo. Además están las mesas presenciales de la Sede Central (WhatsApp 351 592-2283) y del Punto Muni (WhatsApp 351 514-9066) ([guía](https://lacalera.gob.ar/guia-de-tramites/presentacion-de-reclamos-y-consultas/)).

| Categoría | Responsable | Canal oficial | Tipo | ¿Integrable? |
|---|---|---|---|---|
| Bache | Municipio ("Tránsito / Reparación de calles"). Si es sobre la E-55: Caminos de las Sierras | Canal general. E-55: 0800 888 2847 y ERSeP 0800-888-6898 ([atención](https://caminosdelassierras.com.ar/atencion-al-usuario/)) | WhatsApp / 0800 | Parcial |
| Calle de tierra en mal estado | Municipio (Dirección de Obras Viales) | Canal general. El **riego** de calles de tierra tiene un WhatsApp propio, 3543 57-9463 ([trámite](https://lacalera.gob.ar/guia-de-tramites/solicitud-de-riego-para-calle-de-tierra-consolidada/)) | WhatsApp | Parcial |
| Anegamiento | Municipio (área no verificada) | Canal general | WhatsApp | Parcial |
| Luminaria apagada | Municipio ("Alumbrado público") | Canal general | WhatsApp | Parcial |
| Basural | Municipio ("Higiene urbana", "Ambiente"). Arrojo ilegal: también la Policía Ambiental provincial | Canal general. [Denuncia web provincial](https://denunciaspoliciaambiental.cba.gov.ar/front/denuncia.html) (admite anónima) | WhatsApp / formulario | Parcial / No |
| Árbol caído | Municipio (Dirección de Arbolado Urbano, "Espacios públicos"). Si hay riesgo: 103 / 911 (ADR 0006) | Canal general | WhatsApp | Parcial |
| Semáforo o señal rota | Municipio ("Tránsito") | Canal general | WhatsApp | Parcial |
| Vereda rota | Municipio ("Espacios públicos"). No verifiqué si la reparación le toca al frentista | Canal general | WhatsApp | Parcial |
| Cloaca desbordada | Municipio (Secretaría de Agua y Saneamiento, creada en dic. 2023, [agua](https://lacalera.gob.ar/agua/)) | Canal general | WhatsApp | Parcial |
| Otro | Municipio | Canal general | WhatsApp | Parcial |

### Córdoba Capital

Canales de todas las filas:

- **App Ciudadana**: necesita CiDi, ubicación y al menos una foto ([paso a paso](https://cordoba.gob.ar/app-ciudadana-paso-a-paso-para-cargar-un-requerimiento/)). La tabla indica la opción de la app que corresponde a cada categoría.
- **Mi Docta**: la plataforma que la reemplaza (ver §3.2).
- **Contact Center 0800-888-0404**, que "toma reclamos y solicitudes".
- **Bot de WhatsApp** ([atención al vecino](https://cordoba.gob.ar/atencion-al-vecino-nueva/)).

| Categoría | Responsable | Opción en App Ciudadana | Tipo | ¿Integrable? |
|---|---|---|---|---|
| Bache | Municipalidad | "Calles" (pavimentada o de tierra) | App / 0800 / WhatsApp bot | No (API); parcial (el vecino lo carga en la app oficial) |
| Calle de tierra en mal estado | Municipalidad | "Calles" | App | Ídem |
| Anegamiento | Municipalidad. Si es una pérdida de agua potable: Aguas Cordobesas | "Reportar peligro: boca de tormenta en mal estado". Agua: WhatsApp +54 9 351 855-5666 / 0800-800-2482 | App / WhatsApp | Ídem / parcial |
| Luminaria apagada | Municipalidad (Dirección de Alumbrado Público). EPEC ejecuta por convenio | "Alumbrado público" | App | No / parcial |
| Basural | Municipalidad (Higiene Urbana). La recolección está concesionada a LAM, LUSA y Urbacor por zona | "Recolección de residuos", "Vía pública", "Predio baldío" | App | No / parcial |
| Árbol caído | Municipalidad. Si hay riesgo: 103 / 911 | "Reportar peligro: árbol en mal estado" | App | No / parcial |
| Semáforo o señal rota | Municipalidad | "Semáforos" | App | No / parcial |
| Vereda rota | Municipalidad | "Reportar peligro: vereda rota" | App | No / parcial |
| Cloaca desbordada | Municipalidad (Aguas Cordobesas solo da agua potable) | "Cloacas" | App | No / parcial |
| Otro | Municipalidad | Según el caso | App / 0800 | No / parcial |

## 3. Hallazgos por entidad

### 3.1 Municipalidad de La Calera

- **Trámite "Presentación de reclamos y consultas"** ([guía](https://lacalera.gob.ar/guia-de-tramites/presentacion-de-reclamos-y-consultas/), modificada el 2026-08-24):
  - **Tipos:** Alumbrado público, Ambiente, Seguridad, control e inspección, Espacios públicos, Higiene urbana, Usurpaciones, Tránsito / Reparación de calles, Servicio de Salud, Agua y Saneamiento, Facturación de tasas, Comisión servicios especiales.
  - **Formas:** presencial (Sede Central, Av. San Martín 425; Punto Muni, Av. Ejército Argentino 254) o digital. En la digital, el vecino "se contacta por WhatsApp", el Call Center le pide los datos y le da un número para el seguimiento.
  - **Correo electrónico:** "No disponible".
  - **Datos que pide:** contacto y "datos de localización específica, preferentemente". No menciona fotos.
- **Números de WhatsApp:**
  - **351 510-6669:** está en el pie de todas las páginas como "Municipalidad de la Calera" ([inicio](https://lacalera.gob.ar/)). También es el número para el retiro de residuos de poda ([trámite](https://lacalera.gob.ar/guia-de-tramites/solicitud-de-permiso-de-poda-en-periodo-no-autorizado/)) y uno de los dos que se anunciaron por el cambio de sistema de gestión, junto con 3543 58-9626 ([nota, 02/12/2024](https://lacalera.gob.ar/cambio-en-el-sistema-de-gestion/)).
  - El trámite de reclamos digital no dice a qué número escribir.
  - **3543 57-9463:** riego de calles de tierra consolidadas. Lo atiende el call center y la tarea queda a cargo de la Dirección de Obras Viales ([trámite](https://lacalera.gob.ar/guia-de-tramites/solicitud-de-riego-para-calle-de-tierra-consolidada/)).
- **Arbolado:** la Dirección de Arbolado Urbano atiende en Saúl Moyano 100. Los permisos de poda son presenciales ([trámite](https://lacalera.gob.ar/guia-de-tramites/solicitud-de-permiso-de-poda-en-periodo-no-autorizado/)).
- **Agua y cloacas:** las presta el propio municipio, a través de la Secretaría de Agua y Saneamiento creada en diciembre de 2023. Atiende "a través del Call Center Municipal" ([agua](https://lacalera.gob.ar/agua/)).
- **Obras y servicios:** el discurso de apertura de sesiones 2026 nombra bacheo y pavimentación, iluminación LED y recolección diferenciada como tareas municipales ([nota oficial](https://lacalera.gob.ar/la-calera-apertura-de-sesiones-2026-rambaldi-ratifico-hechos-no-promesas-y-anuncio-el-megaplan-de-obras-para-una-la-calera-cada-vez-mejor/)).
- **Portal de gestión:** La Calera usa "Mi Muni" de Program Consultores S.A. (PGM), con ingreso por Clave Fiscal Municipal o CiDi ([municipalidad.com/laca](https://www.municipalidad.com/laca/home/menu)). La ruta del módulo de reclamos devuelve HTTP 500 con "Servicio no habilitado" ([municipalidad.com/laca/reclamos](https://www.municipalidad.com/laca/reclamos)).
- **Datos abiertos:** el trámite "Consulta de Datos Abiertos" manda a `datosgestionabierta.cba.gov.ar/dataset/la-calera` ([guía](https://lacalera.gob.ar/guia-de-tramites/consulta-de-datos-abiertos/)). Ese portal provincial (CKAN 2.11.5) devolvió 404 en todas las rutas, incluida la API.
- **Conclusión:** solo WhatsApp y atención presencial, que es lo que ya hace la app. El número del repo (`5493515106669`, en `supabase/migrations/20261117120000_gran_cordoba_municipalities.sql`) coincide con el oficial.

### 3.2 Municipalidad de Córdoba: Mi Docta, App Ciudadana, VeDi, WhatsApp y datos abiertos

**Mi Docta ("Docta")**

- **Qué es:** la plataforma creada por la **Ordenanza N° 13640** ([normativa](https://cordoba.gob.ar/mi-docta/normativa/), [texto](https://cordoba.gob.ar/wp-content/uploads/2026/04/MIDOCTA.pdf)). Cadena 3 informó la aprobación del Concejo el 17/04/2026 ([nota](https://www.cadena3.com/noticia/informados-al-regreso/cordoba-avanza-hacia-la-digitalizacion-total-con-la-plataforma-mi-docta_542373); fuente periodística).
- **Artículos de la ordenanza que importan:**
  - **Art. 3:** la crea "como único acceso digital a los servicios públicos".
  - **Art. 4:** aclara que eso es "sin perjuicio de la vigencia de otros canales de atención".
  - **Art. 2:** la interoperabilidad que promueve es "entre las distintas dependencias", no con terceros. El inc. f) prevé medios digitales para "realización de reclamos".
  - **Art. 1:** deja que la Autoridad de Aplicación integre "plataformas existentes en el ámbito municipal y las que se incorporen en el futuro".
- **Qué ofrece:** web y apps, con la promesa "Realizá tus reclamos y solicitudes. Reportá incidencias y seguí su estado en tiempo real" ([cordoba.gob.ar/mi-docta](https://cordoba.gob.ar/mi-docta/), [inicio](https://cordoba.gob.ar/)).
  - [iOS](https://apps.apple.com/us/app/midocta/id6755399727): vendedor "Municipalidad de Cordoba". La política de privacidad apunta a un dominio `midocta.test.cordoba.gob.ar`.
  - [Android](https://play.google.com/store/apps/details?id=ar.gob.cordoba.gobiernoabierto.midocta): actualizada el 13 nov 2026.
- **Lanzamiento y reemplazos:** Infonegocios (1/9/2026) dice que reemplaza a VeDi desde el lunes 7 de septiembre de 2026 ([nota](https://infonegocios.info/nota-principal/adios-a-vedi-y-al-papel-mi-docta-pone-mas-de-260-tramites-online-y-tambien-mide-cuanto-trabajan-los-empleados-publicos-5-000-ya-fueron-capacitados)). Vía País dice que en 15 a 20 días absorbería App Ciudadana, Tu Bondi y SEMM. Eso lo vi solo en el resumen del buscador: la nota devolvió 403 y no la pude leer. **No verificado.**
- **Para terceros:** no encontré API, SDK, términos para desarrolladores ni mención de terceros. Los términos y condiciones de la web no se pudieron leer, porque la página es una SPA y se carga vacía sin JavaScript.

**App Ciudadana (el canal con foto y mapa que existe hoy)**

- **Cómo funciona:** se ingresa "con número de CUIL y contraseña de CiDi". La ubicación es obligatoria y se debe "subir como mínimo una foto". Al enviarlo, el pedido llega "al área correspondiente" ([paso a paso, 2025-04-03](https://cordoba.gob.ar/app-ciudadana-paso-a-paso-para-cargar-un-requerimiento/)).
- **Categorías:** Reportar peligro, Alumbrado público, Calles, Cloacas, Plazas y espacios verdes, Predio baldío, Recolección de residuos, Semáforos y Vía pública. En Recolección muestra la empresa recolectora y, si corresponde, deja elevar un pedido o llamarla.
- **Ficha en Google Play** ([ficha](https://play.google.com/store/apps/details?id=com.munidigital.municiudadano_cordoba)):
  - Desarrollador: "MUNICIPALIDAD DE CORDOBA". El id del paquete es `com.munidigital…`, lo que sugiere que está construida sobre MuniDigital (inferencia por el nombre del paquete).
  - Se describe como "VERSIÓN DE PRUEBA" y se actualizó el 6 nov 2026.
  - La web municipal invita a una "Prueba Piloto de App Ciudadana" ([inicio](https://cordoba.gob.ar/)).
- **Términos y condiciones** ([T&C](https://cordoba.gob.ar/app-ciudadana-terminos-y-condiciones/), modificados el 2026-10-28):
  - Se necesita identidad en Vecino Digital/CiDi, y los datos del perfil tienen carácter de "DECLARACIÓN JURADA".
  - Prohíben "realizar ingeniería inversa" y "hacer uso del contenido en otro sitio web o entorno informático para cualquier propósito sin la autorización previa y por escrito de la Municipalidad".
  - El acceso es "personal y para uso exclusivo del usuario".
  - Los datos se tratan bajo la Ley 25.326.
- **Tablero público:** hay un tablero de gestión en Power BI con datos agregados ([tablero](https://cordoba.gob.ar/app-ciudadana-tablero/)). No es una API.

**Contact Center y WhatsApp**

- **Página "Atención al Vecino"** ([página](https://cordoba.gob.ar/atencion-al-vecino-nueva/), 2026-09-02):
  - Contact Center **0800-888-0404**, de lunes a viernes de 8 a 20 h, que toma "reclamos y solicitudes".
  - "ChatBot WhatsApp", 24 h, "botonera interactiva", con derivación a una persona.
- **Los dos números de esa página:**
  - El número visible es **+54 9 3516 10-0444** (`wa.me/5493516100444`).
  - El botón con ícono de WhatsApp apunta a otro número, `wa.me/5493513037291?text=Hola`. **El repo usa este segundo.**
- **Programa "MI VecinON":** el 351-610-0444 existe desde 2023 dentro de ese programa ([nota oficial](https://cordoba.gob.ar/desde-este-lunes-los-vecinos-de-la-ciudad-pueden-realizar-tramites-municipales-a-traves-de-whatsapp/)).
- **Pie de cordoba.gob.ar:** muestra "MiDocta – Municipalidad de Córdoba +54 9 3518666864" sin aclarar si es WhatsApp ([inicio](https://cordoba.gob.ar/)).

**Datos abiertos y APIs**

- **APIs de solo lectura** ([gobiernoabierto.cordoba.gob.ar/apis](https://gobiernoabierto.cordoba.gob.ar/apis)): catálogo de datos abiertos, categorías, barrios, CPC, visualizaciones, apps móviles. Ninguna sirve para pedidos.
- **El catálogo:** devuelve 183 datasets ([API](https://gobiernoabierto.cordoba.gob.ar/api/datos-abiertos/dato?page=1&size=200)). Los únicos relacionados son "Luminaria LED", "Semáforos", "Recolección diferenciada de residuos", "Espacios verdes" y "Centros Vecinales". No hay ninguno de pedidos de vecinos.
- **Endpoints geográficos:** `api/v2/cpc/cpc-geo/` devuelve un GeoJSON con 13 polígonos de CPC. `api/v2/barrios/barrios/` devolvió HTTP 500.
- **Antecedente CBA147:** la Municipalidad publicó en GitHub [CBA147](https://github.com/ModernizacionMuniCBA/CBA147), un sistema de requerimientos en C# con último push en 2022 y sin licencia declarada.
  - Expone rutas `v1/Requerimiento` (crear, listar, detalle, cambiar estado), autenticadas con un `token` del vecino logueado.
  - Sirve como referencia de cómo modelaron los pedidos. **No es una API ofrecida a terceros** y no la llamé.

**Quién hace cada cosa en Capital**

- **Alumbrado:**
  - **El convenio con EPEC:** la Municipalidad firmó un convenio con EPEC por $37.500 millones y 25 meses. El programa "será ejecutado por EPEC, con planificación y control a cargo del municipio", y EPEC se suma "a la Dirección de Alumbrado Público" ([nota oficial, 2026-03-30](https://cordoba.gob.ar/la-municipalidad-invertira-37-mil-millones-en-la-readecuacion-del-sistema-de-alumbrado/); [avance, 2026-10-07](https://cordoba.gob.ar/plan-alumbrado-30-000-intervenciones/)).
  - **El convenio provincial previo:** existe la Ley provincial 10686, un convenio con EPEC que vi solo en el resultado del buscador ([PDF Legislatura](https://legislaturacba.gob.ar/wp-content/uploads/2020/06/26022020-LEY-10686-CONVENIO-CON-EPEC-1.pdf); no lo abrí).
- **Residuos:**
  - La recolección está concesionada por zona: Sur LUSA, Norte URBACOR y Central LAM ([nota oficial](https://cordoba.gob.ar/cordoba-juega-limpio-comienza/); [conflicto 2025](https://cordoba.gob.ar/las-empresas-prestatarias-del-servicio-de-recoleccion-de-residuos-presentaron-un-pedido-de-conciliacion-obligatoria-en-la-secretaria-de-trabajo-provincial/)).
  - Responde la Secretaría de Ambiente y Economía Circular.
  - No verifiqué el estado actual de "Córdoba Obras y Servicios" ni de otros entes.
- **Arbolado:** GeTAU es una plataforma participativa de una ONG con la UNC, dentro de "Innovar por el Clima" ([nota oficial](https://cordoba.gob.ar/getau-aplicacion-arbolado-urbano/)). No es un canal de pedidos.

### 3.3 CiDi (Ciudadano Digital, Provincia)

- **Documentación pública:** [documentacioncidi.cba.gov.ar](https://documentacioncidi.cba.gov.ar/) publica un Swagger titulado `CiDi.WebApi.Documentos` ([swagger.json](https://documentacioncidi.cba.gov.ar/swagger/v1/swagger.json)). Los endpoints son para guardar y obtener documentos del Centro de Documentación Digital por CUIL o por la cookie de sesión. **No hay nada de pedidos ni de login para terceros.**
- **Uso por organismos:** el resumen del buscador de una página del Portal Tecnológico dice que "para diferentes organismos dentro de gobierno, se recomienda utilizar las APIs de Ciudadano Digital". No la pude leer: el documento es un PDF escaneado ([portaltecnologico.cba.gov.ar](https://portaltecnologico.cba.gov.ar/e_sig_001_primera_solicitud_para_usar_apis_de_documento_rev01-2)). Las integraciones se piden "vía Redmine / Mesa de Ayuda" (también solo por el resumen del buscador).
- **Quiénes ya lo usan:** EPEC usa el login de CiDi (`cidi.cba.gov.ar/Cuenta/Login?app=76`, sacado del código de su sitio). PGM dice que sus soluciones se integran con Ciudadano Digital ([municipalidad.com](https://www.municipalidad.com/)).
- **Conclusión:** CiDi es infraestructura de identidad y documentos para organismos públicos y sus proveedores. **No encontré un canal para que una app cívica privada se integre.** Además, cargar pedidos con el CiDi del vecino implicaría manejar sus credenciales, lo cual no corresponde.

### 3.4 EPEC

- **Canales** (sacados del código del sitio [epec.com.ar](https://www.epec.com.ar/), que es una SPA en Angular):
  - Teléfono **0800 777 0000**.
  - Botón de chatbot por WhatsApp a `wa.me/5493512004343`.
  - Oficina virtual con login propio, Apple o CiDi.
  - Formulario web de "reclamos técnicos", incluso sin login.
- **Endpoints internos:** el formulario web usa endpoints internos no documentados, con un token anónimo. Usarlos sería ingeniería inversa. **No es un canal ofrecido a terceros.**
- **App EPEC Móvil** ([Google Play](https://play.google.com/store/apps/details?id=ar.com.epec.epecmovil), actualizada el 14 sept 2026): "Gestionar reclamos por falta de suministro de energía", vinculados a un contrato. No menciona alumbrado público.
- **Alumbrado:** EPEC no es responsable del alumbrado ante el vecino. En Capital es contratista del municipio (§3.2). En La Calera el alumbrado figura entre los pedidos municipales (§3.1).
- **Qué sí iría a EPEC:** un cable caído, un poste de la red eléctrica o un corte de luz (hoy caerían en "Otro"). Si hay riesgo, es una emergencia (ADR 0006).
- **Segunda instancia:** ERSeP regula a EPEC, a las cooperativas eléctricas, al agua y a la RAC, y recibe pedidos como segunda instancia en el **0800-888-6898** ([dato publicado por Caminos de las Sierras](https://caminosdelassierras.com.ar/atencion-al-usuario/)). No pude abrir [ersep.cba.gov.ar](https://ersep.cba.gov.ar/), que devolvió 403.
- **No verificado:** si la distribuidora eléctrica de La Calera es EPEC o una cooperativa.

### 3.5 Residuos

- **Córdoba Capital:** el servicio es municipal (Higiene Urbana), con la recolección concesionada a LAM, LUSA y Urbacor. Los pedidos entran por App Ciudadana, "Recolección de residuos" ([nota oficial](https://cordoba.gob.ar/higiene-urbana-respondio-el-94-de-los-reclamos-receptados-en-la-app-ciudadana/) y §3.2). No encontré canales propios de las concesionarias.
- **La Calera:** municipal ("Higiene urbana"). El retiro de residuos de poda es por WhatsApp al 351 510-6669 ([trámite](https://lacalera.gob.ar/guia-de-tramites/solicitud-de-permiso-de-poda-en-periodo-no-autorizado/)).
- **Basural o arrojo ilegal:** la Policía Ambiental provincial tiene un formulario web de denuncias, también anónimas ([denuncias](https://denunciaspoliciaambiental.cba.gov.ar/front/denuncia.html)). Es una SPA y no revisé los campos.

### 3.6 Agua y cloacas

- **Aguas Cordobesas** es la "concesionaria del servicio de agua potable para la ciudad de Córdoba" ([inicio](https://www.aguascordobesas.com.ar/)).
  - **Canales:** 0800-800-2482 (24 h), WhatsApp **+54 9 351 855-5666**, chat y atención presencial en los CPC ([contacto](https://www.aguascordobesas.com.ar/CanalContacto/16/Contacto)).
  - **App:** "solicitar asistencia técnica por pérdidas de agua" ([Google Play](https://play.google.com/store/apps/details?id=com.aguascordobesas.app); desarrollada por PROMINENTE S.A., la misma empresa de Mr-Bubo).
  - **API:** no hay una pública.
- **Cloacas en Capital:** son municipales. La App Ciudadana tiene la categoría "Cloacas: desborde de líquidos cloacales" (§3.2).
- **La Calera:** agua y cloacas municipales (§3.1).

### 3.7 Rutas y caminos

- **Red de Accesos a Córdoba (RAC):** la forman 12 rutas más la Circunvalación, **incluida la Ruta Provincial E-55**. La concesionaria es Caminos de las Sierras ([qué es la RAC](https://caminosdelassierras.com.ar/que-es-la-red-de-accesos-a-cordoba/)).
  - Atención: 351 5561500, 0800 888 2847 y `clientes@camsierras.com.ar`.
  - Emergencias en ruta: 140 o 0800 777 8827 ([inicio](https://caminosdelassierras.com.ar/), [atención](https://caminosdelassierras.com.ar/atencion-al-usuario/)).
  - ERSeP "supervisa el estado de las calzadas, las luminarias" de la RAC y "recepta y resuelve los reclamos de los usuarios" en el 0800-888-6898 ([misma página](https://caminosdelassierras.com.ar/atencion-al-usuario/)).
- **La E-55 en La Calera:** que la E-55 sea la Av. Ejército Argentino lo saco de la cobertura del peaje ([Cadena 3](https://www.cadena3.com/noticia/informados-al-regreso/sigue-el-reclamo-de-vecinos-de-la-calera-por-un-peaje-que-consideran-ilegal_387873); fuente periodística). No lo verifiqué en un mapa oficial.
- **Dirección Provincial de Vialidad:** no encontré un canal específico para pedidos. La Provincia ofrece el 0800-888-1234 de Atención al Ciudadano y una página de "Estado de Rutas" ([canales](https://www.cba.gov.ar/ciudadano/canales-telefonicos/)). La E-64 (Camino La Ochoa) aparece como obra provincial ejecutada por Caminos de las Sierras ([nota](https://caminosdelassierras.com.ar/el-gobernador-llaryora-anuncio-la-obra-de-pavimentacion-de-la-ruta-provincial-e-64-camino-la-ochoa/)).

### 3.8 Sierras Chicas y proveedores compartidos

| Municipio | Canal oficial | Tipo | Fuente |
|---|---|---|---|
| Villa Allende | App "Villa Allende Municipio" (Mr-Bubo / PROMINENTE S.A.): adjunta fotos o videos, GPS y seguimiento. WhatsApp +54 9 351 714-5555 | App / WhatsApp | [inicio](https://www.villaallende.gov.ar/), [Google Play](https://play.google.com/store/apps/details?id=com.gp.mrbubo.villaallendemunicipio) |
| Unquillo | Centro de Atención al Vecino: 3543 488999, WhatsApp 3543 53-0674, **correo `centrodeatencionalvecino@unquillo.gov.ar`** | Teléfono / WhatsApp / email | [CAV](https://unquillo.gov.ar/centro-de-atencional-vecino/) |
| Mendiolaza | Formulario web de reclamos con mapa, en `gestion.mendiolaza.gob.ar/#/reclamos` (SPA con Leaflet; no revisé si pide login). 0800 268 3004, WhatsApp +54 9 3543 62-3587 | Formulario / WhatsApp / 0800 | [reclamos](https://www.mendiolaza.gob.ar/reclamos/), [inicio](https://www.mendiolaza.gob.ar/) |
| Río Ceballos | "Reclamos" en el portal de PGM (`municipalidad.com/rioceb/reclamos`): devolvió HTTP 500 y pide verificación por SMS. "+5493543602607 (Solo WhatsApp)" | Formulario / WhatsApp | [inicio](https://rioceballos.gob.ar/), [portal](https://www.municipalidad.com/rioceb/reclamos) |

Los números de WhatsApp del repo para estos cuatro municipios coinciden con los oficiales.

**Proveedores que se repiten**

- **PGM (Program Consultores S.A., Córdoba):** dice tener "+250 clientes activos" en 11 provincias. Ofrece un módulo "Mis Reclamos" y "APIs de integración", y se integra con Ciudadano Digital ([municipalidad.com](https://www.municipalidad.com/)). Lo usan La Calera y Río Ceballos.
- **Mr-Bubo (PROMINENTE S.A.):** plataforma de gestión de pedidos "Mr Bubo City" ([mr-bubo.net](https://mr-bubo.net/)). La usa Villa Allende, y la misma empresa hizo la app de Aguas Cordobesas. No publica una API.
- **MuniDigital:** por el id del paquete, estaría detrás de App Ciudadana (inferencia, no verificado).
- **Ente Metropolitano Córdoba:** fue fundado a fines de 2022. Sus miembros plenos incluyen Córdoba Capital, La Calera, Mendiolaza, Villa Allende, Saldán, Salsipuedes, Agua de Oro y Malagueño, entre otros. Ejecuta obras de iluminación LED, agua y residuos ([nota oficial](https://cordoba.gob.ar/ente-metropolitano-tres-anos/)).

### 3.9 Estándares y antecedentes

- **Open311 GeoReport v2:** la especificación está "frozen" ([spec](https://wiki.open311.org/GeoReport_v2/)).
  - **Endpoints:** `GET /services` (categorías con `service_code`), `GET /services/{code}` (atributos), `POST /requests` y `GET /requests`.
  - **Para crear un pedido:** se necesita `service_code`, una ubicación (`lat`/`long` o `address_string`) y `api_key`. `media_url`, `description` y los datos de contacto son opcionales.
  - **Formato:** XML obligatorio, JSON opcional.
  - **Quién lo implementa:** la [lista de servidores](https://wiki.open311.org/GeoReport_v2/Servers) solo tiene jurisdicciones de EE.UU., Canadá y Europa. **Ninguna entidad de Córdoba es compatible con Open311.**
- **FixMyStreet:** usa la ubicación para saber qué organismo puede ser responsable y elige el contacto (normalmente un email) "basado en la categoría". El email es el método por defecto, y la inyección directa en el sistema del organismo es la opción preferida ([cómo envía](https://fixmystreet.org/customising/send_reports/)).
- **Buenos Aires:** publica como dato abierto los contactos al "Sistema Único de Atención Ciudadana (SUACI) / BA Colaborativa", con "fecha, concepto y referencia geográfica". Se actualizó el 2026-11-17 ([CKAN API](https://data.buenosaires.gob.ar/api/3/action/package_search?q=atencion%20ciudadana&rows=5), [dataset](https://data.buenosaires.gob.ar/dataset/sistema-unico-atencion-ciudadana)). No encontré una API Open311 de escritura.
- **Rosario:** su manual SUACI (agosto 2026) dice que los pedidos entran por el 147, por Munibot, por formulario web y por nota-expediente ([PDF](https://www.rosario.gob.ar/inicio/sites/default/files/2026-08/Manual%20de%20usuario%20SUACI%20SOLICITUDES_Agosto2026.pdf); solo lo vi en el resumen del buscador). No encontré Open311.

## 4. Cómo podría funcionar

Las opciones están ordenadas de menor a mayor esfuerzo. Todas respetan el ADR 0001, salvo las que se marcan.

1. **Destino por municipio con excepciones por lugar** (esfuerzo bajo).
   - Hoy cada municipio tiene un WhatsApp, y casi todo debería seguir así.
   - La excepción que vale la pena es geográfica: un reporte sobre la E-55 o sobre otras rutas de la RAC debería sugerir Caminos de las Sierras (0800 888 2847) además del municipio. Se resuelve con un polígono o buffer de la traza y no hace falta una tabla por categoría.
   - Ojo: "Enviar a la Muni" deja de describir bien la acción si el destino es una concesionaria. Antes de hacerlo hay que actualizar `CONTEXT.md`.
2. **"Cargalo en App Ciudadana / Mi Docta" para Córdoba Capital** (esfuerzo bajo).
   - Un botón que copia la descripción y el link a la página pública, recuerda la categoría equivalente (según la tabla de §2) y abre la ficha de la tienda.
   - El vecino lo carga con su CiDi. Así cumple con los T&C y es el "canal propio" que el ADR 0001 dice que hay que sumar como otra forma de envío.
   - No encontré deep links documentados para abrir la app con datos precargados.
3. **`mailto:` donde exista un correo institucional de atención** (esfuerzo bajo).
   - Hoy solo Unquillo. Lo envía el vecino desde su correo, así que encaja con el ADR 0001.
   - Que la app mande correos desde el servidor, como FixMyStreet, contradice la premisa "la app no le manda nada al municipio". Además convierte a la app en cesionaria de datos personales (Ley 25.326). Necesitaría un ADR nuevo.
4. **Publicar nuestros reportes como GeoReport v2 de solo lectura o GeoJSON** (esfuerzo medio).
   - En vez de esperar una API de los municipios, exponemos `GET /services` (nuestras categorías) y `GET /requests` (reportes abiertos, con la página pública como `media_url`) desde Supabase.
   - Cualquier municipio o proveedor (PGM, Mr-Bubo, MuniDigital) podría consumirlos o importarlos sin desarrollo propio. Le da sustento técnico al Ranking semanal.
5. **Datos abiertos como insumo** (esfuerzo medio).
   - Los polígonos de CPC sirven para nombrar el CPC en el mensaje de Capital.
   - El dataset de Semáforos podría servir para ubicar mejor una "Semáforo o señal rota".
   - No hay fuente oficial de estados para mostrar "lo arregló la Muni": el estado lo siguen decidiendo los vecinos (ADR 0005).
6. **Convenio con un municipio, con el Ente Metropolitano o con un proveedor** (esfuerzo alto, no técnico).
   - **Municipalidad de Córdoba:** el art. 1 de la Ord. 13640 permite incorporar plataformas, y el art. 2 f) habla de participación y reclamos. El pedido concreto sería un `api_key` para crear pedidos en su sistema (idealmente con forma Open311), o que lean nuestro feed del punto 4.
   - **Ente Metropolitano Córdoba:** un solo interlocutor para Capital, La Calera, Mendiolaza, Villa Allende y otros.
   - **Proveedores:** un acuerdo con PGM, que ya anuncia "APIs de integración", cubriría de una vez a varios municipios que usan "Mis Reclamos".
7. **Lo que no hay que hacer:**
   - Usar endpoints internos (EPEC, CBA147, App Ciudadana), scrapear o automatizar formularios. Es ingeniería inversa y lo prohíben los T&C de App Ciudadana.
   - Cargar pedidos con la identidad CiDi del vecino. Su perfil tiene carácter de declaración jurada, y manejar sus credenciales no corresponde.
   - Mandar WhatsApp desde la app con librerías no oficiales (ya descartado en el ADR 0001).

**Qué cambia para el ADR 0001.** La decisión se mantiene. Lo que conviene actualizar:

- La premisa "no tienen [...] email" vale para La Calera (lo dice su guía), pero no para todos: Unquillo publica un correo.
- Capital tiene un canal propio con foto y ubicación, así que corresponde la consecuencia "se agrega como otra forma de envío".
- En Capital el WhatsApp es un bot y hay dos números publicados. Antes de confiar en el mensaje armado, conviene probar a mano qué número y qué flujo aceptan un pedido con link.

## 5. Preguntas abiertas y qué no se pudo verificar

- **WhatsApp de Córdoba Capital:** la página oficial muestra +54 9 3516 10-0444 como número visible y `wa.me/5493513037291` en el botón con ícono. El repo usa el segundo. Falta confirmar cuál atiende pedidos y si el bot acepta texto libre, link y foto, o solo la botonera.
- **Mi Docta:**
  - ¿Ya absorbió a App Ciudadana? Solo lo vi en el resumen del buscador de una nota de Vía País, que devolvió 403.
  - ¿Su app recibe pedidos con foto y ubicación?
  - ¿Qué dicen sus términos? La ficha de iOS apunta a un dominio `test`.
- **La Calera:**
  - ¿A qué número se refiere el trámite digital de reclamos?
  - ¿El call center acepta fotos y ubicación por WhatsApp?
  - ¿Qué área atiende "Anegamiento"?
  - ¿La vereda la repara el municipio o el frentista?
  - ¿La distribuidora eléctrica es EPEC o una cooperativa?
- **La E-55 en La Calera:** que sea la Av. Ejército Argentino sale de notas periodísticas sobre el peaje.
- **Dirección Provincial de Vialidad:** no encontré un canal propio para pedidos, y su sitio no respondió.
- **CiDi:** ¿puede un tercero privado pedir acceso a las APIs? Solo encontré la API de Documentos y una recomendación "para organismos dentro de gobierno", que vi solo en el resumen del buscador.
- **Mendiolaza:** no revisé si el formulario web pide login.
- **Río Ceballos:** el portal de reclamos devolvió 500.
- **Portal provincial `datosgestionabierta.cba.gov.ar`:** devolvió 404 en todo.
- **EPEC:** el WhatsApp (`wa.me/5493512004343`) y el 0800 salen del código del sitio, no de una página de contacto rotulada. ersep.cba.gov.ar devolvió 403.
- **Córdoba Capital:** no verifiqué el estado actual de entes como "Córdoba Obras y Servicios" en la higiene urbana.
