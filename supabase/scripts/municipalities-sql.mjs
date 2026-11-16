// Genera la migración de municipios desde la capa idecor:radios_urbanos del WFS de IDECOR.
// Uso: node supabase/scripts/municipalities-sql.mjs > supabase/migrations/<timestamp>_municipalities.sql
// Para sumar un municipio, agregá su `key` (código de localidad de IDECOR), su nombre y su WhatsApp de
// reclamos en formato internacional (5493…), o null si no tiene uno confiable para reclamos de calle.
// Números: planilla "WhatsApp Municipios Gran Córdoba" (noviembre 2026), solo los de confianza alta.
const municipalities = {
  '110101': ['Córdoba', '5493513037291'], // VecinON
  '130127': ['La Calera', '5493515106669'],
  '130150': ['Villa Allende', '5493517145555'],
  '130449': ['Unquillo', '5493543530674'],
  '130136': ['Mendiolaza', '5493543623587'],
  '130440': ['Río Ceballos', '5493543602607'],
  '130142': ['Saldán', null], // el único número es la guardia del agua
  '130443': ['Salsipuedes', '5493543572003'],
  '130501': ['Agua de Oro', '5493525622107'],
  '130323': ['Estación Juárez Celman', '5493513270055'],
  '130326': ['Malvinas Argentinas', null], // el número publicado es de centros de salud
  '310119': ['Malagueño', null], // no publica WhatsApp
  '230455': ['Villa Carlos Paz', '5493541528386'],
  '310601': ['Alta Gracia', '5493547541796'],
  '130222': ['Jesús María', null], // el número publicado es de turnos
  '130209': ['Colonia Caroya', '5493525563216'],
};

const filter = `key IN (${Object.keys(municipalities).map((k) => `'${k}'`).join(',')})`;
const url =
  'https://idecor-ws.mapascordoba.gob.ar/geoserver/idecor/wfs?service=WFS&version=2.0.0&request=GetFeature' +
  '&typeNames=idecor:radios_urbanos&outputFormat=application/json&srsName=EPSG:4326' +
  `&CQL_FILTER=${encodeURIComponent(filter)}`;

const res = await fetch(url);
if (!res.ok) throw new Error(`IDECOR WFS: HTTP ${res.status}`);
const fc = await res.json();
if (fc.features.length !== Object.keys(municipalities).length) {
  throw new Error(`IDECOR WFS: expected ${Object.keys(municipalities).length} features, got ${fc.features.length}`);
}

console.log(`-- Generado por supabase/scripts/municipalities-sql.mjs desde ${url}`);
console.log('-- Re-runnable: actualiza nombre, polígono y WhatsApp si el municipio ya existe.');
for (const f of fc.features) {
  const key = f.properties.key;
  const [name, whatsapp] = municipalities[key];
  const geojson = JSON.stringify(f.geometry).replaceAll("'", "''");
  console.log(
    `insert into public.municipalities (idecor_key, name, whatsapp, geom) values ('${key}', '${name}', ${whatsapp ? `'${whatsapp}'` : 'null'}, ` +
      `extensions.st_multi(extensions.st_makevalid(extensions.st_setsrid(extensions.st_geomfromgeojson('${geojson}'), 4326)))::extensions.geography) ` +
      `on conflict (idecor_key) do update set name = excluded.name, whatsapp = excluded.whatsapp, geom = excluded.geom;`,
  );
}
