#!/usr/bin/env node
// =============================================================================
// Normaliza todos los crudos FDA/NLM disponibles en `$DX_DEVICES_US_RAW_DIR`
// al formato común y escribe en `out/`:
//
//   <source>-NNNN.ndjson.gz            una línea por registro (formato común)
//   fda-product-codes.json             TODOS los product codes vistos, con
//                                      include/exclude, regla y motivo
//   coverage.json                      equipos por tipo y panel, fabricantes,
//                                      marcas, fuentes y huecos
//   manifest.json                      el del README común (region, files, gaps)
//                                      más las entradas y espejos usados
//
// Cada fuente se usa si su crudo existe; si falta, queda registrada como hueco.
// Determinista: dos corridas sobre los mismos crudos → mismos bytes.
//
//   node tools/terminology-import/diagnostic-devices/us/build.mjs
// =============================================================================

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FORMAT_VERSION, manufacturerKey, recordKey } from './lib/format.mjs';
import { ensureDir, parseCsv, readJsonIfExists, readPipeDelimited, streamOpenFdaResults, unzipStream, writeNdjsonParts, zipEntries } from './lib/io.mjs';
import {
  ProductCodeTable,
  from510kLineage,
  fromAccessGudidDelimited,
  fromOpenFda510k,
  fromOpenFdaPma,
  fromOpenFdaRegistrationListing,
  fromOpenFdaUdi,
  observeListing,
  observeSubmission,
  observeUdi,
} from './lib/normalize.mjs';
import { MIRRORS_DIR, OFFICIAL_DIR, OUT_DIR, RAW_DIR } from './lib/paths.mjs';
import { MIRRORS } from './lib/sources.mjs';

const table = new ProductCodeTable();
const bySource = new Map(); // source → Map(recordKey → row)
const inputs = [];
const gaps = [];

function add(row) {
  if (!row) return;
  const m = bySource.get(row.source) ?? new Map();
  const k = recordKey(row);
  const prev = m.get(k);
  // Misma fila desde dos vías (oficial y espejo): gana la oficial.
  if (!prev || (prev.extra?.via?.kind === 'mirror' && row.extra?.via?.kind === 'official')) m.set(k, row);
  bySource.set(row.source, m);
}

const officialPath = (...p) => join(OFFICIAL_DIR, ...p);
const officialManifest = readJsonIfExists(officialPath('manifest.json'), { files: [] });
const mirrorsManifest = readJsonIfExists(join(MIRRORS_DIR, 'mirrors-manifest.json'), []);

function openFdaZips(endpoint) {
  const dir = officialPath('openfda', ...endpoint.split('/'));
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json.zip')).sort().map((f) => join(dir, f));
}

function officialProv(file, kind) {
  const f = officialManifest.files.find((x) => file.endsWith(x.dest));
  return {
    sourceVersion: f ? `${kind} export ${f.exportDate ?? 'desconocida'} (${f.url})` : `${kind} (sin manifiesto)`,
    retrievedAt: f?.fetchedAt ?? new Date(0).toISOString(),
    via: { kind: 'official', url: f?.url ?? null, sha256: f?.sha256 ?? null },
  };
}

async function eachOpenFda(endpoint, fn) {
  let n = 0;
  for (const zip of openFdaZips(endpoint)) {
    const [entry] = await zipEntries(zip);
    const { count } = await streamOpenFdaResults(unzipStream(zip, entry), (r) => fn(r, zip));
    n += count;
  }
  return n;
}

// --- 1. Clasificación oficial (pisa todo lo observado) -------------------------------
const classZips = openFdaZips('device/classification');
if (classZips.length) {
  const n = await eachOpenFda('device/classification', (r) => table.addClassification({ ...r, __source: 'openfda:device/classification' }));
  inputs.push({ source: 'openfda device/classification', files: classZips.length, records: n });
} else if (existsSync(officialPath('fda', 'foiclass.zip'))) {
  const zip = officialPath('fda', 'foiclass.zip');
  const [entry] = await zipEntries(zip);
  const n = await readPipeDelimited(unzipStream(zip, entry), (r) =>
    table.addClassification({
      product_code: r.PRODUCTCODE,
      device_name: r.DEVICENAME,
      review_panel: r.REVIEW_PANEL,
      medical_specialty: r.MEDICALSPECIALTY,
      device_class: r.DEVICECLASS,
      regulation_number: r.REGULATIONNUMBER,
      definition: r.Definition ?? r.DEFINITION,
      __source: 'fda:foiclass',
    }),
  );
  inputs.push({ source: 'FDA foiclass.zip', records: n });
} else {
  gaps.push({ source: 'fda-classification', url: 'https://download.open.fda.gov/device/classification/', reason: '403 del proxy — host bloqueado por la red de la sesión (api.fda.gov / accessdata.fda.gov). Tipo, panel y clase se deducen de los propios registros.' });
}

// --- 2. 510(k) y De Novo: espejo choiben314/510k-lineage -----------------------------
const lineage = MIRRORS.find((m) => m.id === 'choiben314-510k-lineage');
const lineageCsv = join(MIRRORS_DIR, lineage.id, 'dataset', 'devices.csv');
const official510k = openFdaZips('device/510k');
let lineageRows = [];
if (existsSync(lineageCsv)) {
  lineageRows = parseCsv(readFileSync(lineageCsv, 'utf8'));
  for (const r of lineageRows) table.observe(r.product_code, { regulationNumber: r.regulation_number, panel: r.review_panel, deviceClass: r.device_class });
}
const officialListing = openFdaZips('device/registrationlisting');
const officialPma = openFdaZips('device/pma');
const officialUdi = openFdaZips('device/udi');

// Pasada de observación de las fuentes oficiales en streaming (sólo si no hay clasificación).
if (!classZips.length) {
  if (official510k.length) await eachOpenFda('device/510k', (r) => observeSubmission(r, table));
  if (officialPma.length) await eachOpenFda('device/pma', (r) => observeSubmission(r, table));
  if (officialListing.length) await eachOpenFda('device/registrationlisting', (r) => observeListing(r, table));
  if (officialUdi.length) await eachOpenFda('device/udi', (r) => observeUdi(r, table));
}

if (lineageRows.length) {
  const mf = mirrorsManifest.find((m) => m.id === lineage.id);
  const prov = {
    sourceVersion: `openFDA device/510k export ${lineage.upstream.exportDate} vía espejo ${lineage.repo}@${lineage.commit.slice(0, 12)}`,
    retrievedAt: new Date(lineage.upstream.fetchedAt).toISOString(),
    via: {
      kind: 'mirror',
      repo: lineage.repo,
      commit: lineage.commit,
      file: 'dataset/devices.csv',
      sha256: mf?.files.find((f) => f.path === 'dataset/devices.csv')?.sha256 ?? null,
      upstreamUrl: lineage.upstream.url,
      upstreamSha256: lineage.upstream.sha256,
    },
  };
  let kept = 0;
  for (const r of lineageRows) {
    const row = from510kLineage(r, table, prov);
    if (row) {
      add(row);
      kept++;
    }
  }
  inputs.push({ source: `mirror ${lineage.id}`, records: lineageRows.length, inScope: kept });
} else if (!official510k.length) {
  gaps.push({ source: 'fda-510k', url: 'https://download.open.fda.gov/device/510k/', reason: 'Ni el export oficial ni el espejo están en el directorio de crudos (correr fetch-mirrors.mjs).' });
}

// --- 3. Fuentes oficiales de openFDA (cuando el host esté habilitado) ---------------
if (official510k.length) {
  let kept = 0;
  const n = await eachOpenFda('device/510k', (r, zip) => {
    const row = fromOpenFda510k(r, table, officialProv(zip, 'openFDA device/510k'));
    if (row) (add(row), kept++);
  });
  inputs.push({ source: 'openfda device/510k', records: n, inScope: kept });
}
if (officialPma.length) {
  const all = [];
  const n = await eachOpenFda('device/pma', (r, zip) => all.push({ r, zip }));
  const prov = officialProv(all[0]?.zip ?? '', 'openFDA device/pma');
  const rows = fromOpenFdaPma(all.map((x) => x.r), table, prov);
  rows.forEach(add);
  inputs.push({ source: 'openfda device/pma', records: n, inScope: rows.length });
} else gaps.push({ source: 'fda-pma', url: 'https://download.open.fda.gov/device/pma/', reason: '403 del proxy — host bloqueado (download.open.fda.gov / accessdata.fda.gov) y sin espejo completo verificado.' });

if (officialListing.length) {
  let kept = 0;
  const n = await eachOpenFda('device/registrationlisting', (r, zip) => {
    for (const row of fromOpenFdaRegistrationListing(r, table, officialProv(zip, 'openFDA device/registrationlisting'))) (add(row), kept++);
  });
  inputs.push({ source: 'openfda device/registrationlisting', records: n, inScope: kept });
} else gaps.push({ source: 'fda-rl', url: 'https://download.open.fda.gov/device/registrationlisting/', reason: '403 del proxy — host bloqueado; sin él no hay país del fabricante ni nombres propietarios por establecimiento.' });

const gudidZip = existsSync(officialPath('accessgudid')) ? readdirSync(officialPath('accessgudid')).filter((f) => /Delimited_Full_Release_\d{8}\.zip$/.test(f)).sort().pop() : null;
if (officialUdi.length) {
  let kept = 0;
  const n = await eachOpenFda('device/udi', (r, zip) => {
    const row = fromOpenFdaUdi(r, table, officialProv(zip, 'openFDA device/udi'));
    if (row) (add(row), kept++);
  });
  inputs.push({ source: 'openfda device/udi', records: n, inScope: kept });
} else if (gudidZip) {
  const zip = officialPath('accessgudid', gudidZip);
  const version = gudidZip.match(/(\d{8})/)[1];
  const prov = officialProv(zip, `AccessGUDID Delimited Full Release ${version}`);
  const entries = await zipEntries(zip);
  const entry = (name) => entries.find((e) => e.toLowerCase().endsWith(`${name.toLowerCase()}.txt`));
  const group = new Map();
  const push = (di, k, v) => {
    const g = group.get(di) ?? { productCodes: [], submissions: [], gmdn: [] };
    g[k].push(v);
    group.set(di, g);
  };
  await readPipeDelimited(unzipStream(zip, entry('productCodes')), (r) => {
    if (table.scope(r.productCode).include) push(r.PrimaryDI, 'productCodes', r);
  });
  await readPipeDelimited(unzipStream(zip, entry('premarketSubmissions')), (r) => group.has(r.PrimaryDI) && push(r.PrimaryDI, 'submissions', r));
  await readPipeDelimited(unzipStream(zip, entry('gmdnTerms')), (r) => group.has(r.PrimaryDI) && push(r.PrimaryDI, 'gmdn', r));
  let kept = 0;
  const n = await readPipeDelimited(unzipStream(zip, entry('device')), (d) => {
    const g = group.get(d.PrimaryDI);
    if (!g) return;
    const row = fromAccessGudidDelimited(d, g, table, prov);
    if (row) (add(row), kept++);
  });
  inputs.push({ source: `AccessGUDID ${gudidZip}`, records: n, inScope: kept });
} else {
  gaps.push({ source: 'fda-gudid', url: 'https://accessgudid.nlm.nih.gov/download/delimited', reason: '403 del proxy — accessgudid.nlm.nih.gov y download.open.fda.gov bloqueados por la red de la sesión. Sin GUDID no hay UDI-DI ni modelo/versión por equipo.' });
}

// --- 4. Escritura ------------------------------------------------------------------
ensureDir(OUT_DIR);
const SOURCES = ['fda-510k', 'fda-denovo', 'fda-pma', 'fda-rl', 'fda-gudid'];
const parts = [];
for (const source of SOURCES) {
  const rows = [...(bySource.get(source)?.values() ?? [])].sort((a, b) => a.sourceRecordId.localeCompare(b.sourceRecordId));
  const versions = [...new Set(rows.map((r) => r.sourceVersion))].sort();
  const written = writeNdjsonParts(OUT_DIR, source, rows);
  parts.push(...written.map((p) => ({ path: p.file, source, sourceVersion: versions.join(' + '), rows: p.rows, bytes: p.bytes, sha256: p.sha256 })));
}

const pcRows = table.rows();
writeFileSync(join(OUT_DIR, 'fda-product-codes.json'), `${JSON.stringify(pcRows, null, 1)}\n`);

// --- 5. Cobertura -----------------------------------------------------------------
const all = [...bySource.values()].flatMap((m) => [...m.values()]);
const count = (arr, f) => {
  const m = {};
  for (const x of arr) {
    const k = f(x);
    if (k !== null && k !== undefined) m[k] = (m[k] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
};
const manufacturers = new Set(all.map((r) => manufacturerKey(r.manufacturerName)).filter(Boolean));
const brands = new Set(all.filter((r) => r.brandName).map((r) => `${manufacturerKey(r.manufacturerName) ?? ''}|${r.brandName.toUpperCase()}`));
const coverage = {
  rawDir: RAW_DIR.replace(/^.*\/dx-devices-data\//, '<raw>/'),
  totals: {
    rows: all.length,
    bySource: count(all, (r) => r.source),
    byRecordLevel: count(all, (r) => r.extra?.recordLevel),
    manufacturers: manufacturers.size,
    brands: brands.size,
    udiDi: all.filter((r) => r.udiDi).length,
    withModel: all.filter((r) => r.model).length,
    withCountry: all.filter((r) => r.manufacturerCountry).length,
  },
  productCodes: {
    seen: pcRows.length,
    included: pcRows.filter((p) => p.include).length,
    excluded: pcRows.filter((p) => !p.include).length,
    includedByRule: count(pcRows.filter((p) => p.include), (p) => p.rule.replace(/^(subpart:\d+\.\d|regulation:[\d.]+|product_code:\w+|panel:\w+:unclassified).*$/, '$1')),
    withoutName: pcRows.filter((p) => p.include && !p.deviceName).length,
  },
  byPanel: count(all, (r) => r.extra?.panel ?? 'sin panel'),
  byProductCode: count(all, (r) => r.deviceTypeCode),
  byRiskClass: count(all, (r) => r.riskClass ?? 'sin clase'),
  byStatus: count(all, (r) => r.status ?? 'sin estado'),
  byDecisionYear: count(all, (r) => r.authorizationDate?.slice(0, 4) ?? null),
  topManufacturers: Object.fromEntries(Object.entries(count(all, (r) => manufacturerKey(r.manufacturerName))).slice(0, 100)),
  inputs,
  gaps,
};
writeFileSync(join(OUT_DIR, 'coverage.json'), `${JSON.stringify(coverage, null, 1)}\n`);
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  `${JSON.stringify(
    {
      region: 'us',
      generatedAt: new Date().toISOString(),
      formatVersion: FORMAT_VERSION,
      scope: 'Sólo product codes de alcance diagnóstico; criterio en ../lib/scope.mjs y lista completa en fda-product-codes.json',
      files: parts,
      gaps,
      inputs,
      mirrors: mirrorsManifest,
      official: officialManifest.files,
    },
    null,
    1,
  )}\n`,
);

console.log(JSON.stringify({ rows: all.length, bySource: coverage.totals.bySource, productCodes: coverage.productCodes, manufacturers: manufacturers.size, brands: brands.size, parts: parts.map((p) => `${p.path} ${p.rows} filas ${(p.bytes / 1e6).toFixed(1)} MB`), gaps: gaps.map((g) => g.source) }, null, 1));
