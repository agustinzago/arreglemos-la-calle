// Genera la migración de municipios desde la capa idecor:radios_urbanos del WFS de IDECOR.
// Uso: node supabase/scripts/municipalities-sql.mjs > supabase/migrations/<timestamp>_municipalities.sql
// Para sumar un municipio, agregá su `key` (código de localidad de IDECOR) y su nombre acá.
const names = {
  '130127': 'La Calera',
  '110101': 'Córdoba',
  '130150': 'Villa Allende',
};

const filter = `key IN (${Object.keys(names).map((k) => `'${k}'`).join(',')})`;
const url =
  'https://idecor-ws.mapascordoba.gob.ar/geoserver/idecor/wfs?service=WFS&version=2.0.0&request=GetFeature' +
  '&typeNames=idecor:radios_urbanos&outputFormat=application/json&srsName=EPSG:4326' +
  `&CQL_FILTER=${encodeURIComponent(filter)}`;

const res = await fetch(url);
if (!res.ok) throw new Error(`IDECOR WFS: HTTP ${res.status}`);
const fc = await res.json();
if (fc.features.length !== Object.keys(names).length) {
  throw new Error(`IDECOR WFS: expected ${Object.keys(names).length} features, got ${fc.features.length}`);
}

console.log(`-- Generado por supabase/scripts/municipalities-sql.mjs desde ${url}`);
console.log('-- Re-runnable: actualiza nombre y polígono si el municipio ya existe.');
for (const f of fc.features) {
  const key = f.properties.key;
  const geojson = JSON.stringify(f.geometry).replaceAll("'", "''");
  console.log(
    `insert into public.municipalities (idecor_key, name, geom) values ('${key}', '${names[key]}', ` +
      `extensions.st_multi(extensions.st_makevalid(extensions.st_setsrid(extensions.st_geomfromgeojson('${geojson}'), 4326)))::extensions.geography) ` +
      `on conflict (idecor_key) do update set name = excluded.name, geom = excluded.geom;`,
  );
}
