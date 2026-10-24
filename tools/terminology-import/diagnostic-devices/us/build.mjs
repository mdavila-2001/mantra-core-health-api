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

import { createReadStream, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { FIELDS, FORMAT_VERSION, clean, manufacturerKey, recordKey } from './lib/format.mjs';
import { ensureDir, parseCsv, readJsonIfExists, readPipeDelimited, streamOpenFdaResults, streamXmlElements, unzipStream, writeNdjsonParts, xmlBlocks, xmlTag, zipEntries } from './lib/io.mjs';
import {
  ProductCodeTable,
  classificationFromFdadata,
  classificationFromFoiclass,
  from510kLineage,
  fromAiList,
  fromGudidXml,
  fromLivd,
  fromRlFlat,
  fromFdadataPma,
  fromFdadataPmn,
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
import { MIRRORS, authorizationKind } from './lib/sources.mjs';

const table = new ProductCodeTable();
const bySource = new Map(); // source → Map(recordKey → row)
const inputs = [];
const gaps = [];
let rlDone = false;

/** Prioridad de una vía: la oficial siempre gana; entre espejos, el más nuevo (`priority`). */
const priority = (r) => (r.extra?.via?.kind === 'official' ? 1000 : (r.extra?.via?.priority ?? 0));

/**
 * Mismo registro (`source` + `sourceRecordId`) desde dos vías: queda la de
 * mayor prioridad; sus `null` se completan con la otra y `extra.alsoIn`
 * guarda la vía de la otra (procedencia de lo completado).
 */
function mergeRows(a, b) {
  const [hi, lo] = priority(b) > priority(a) ? [b, a] : [a, b];
  const out = { ...hi };
  for (const f of FIELDS) if (out[f] === null && lo[f] !== null && !PROVENANCE.includes(f)) out[f] = lo[f];
  const { via: loVia, alsoIn: loAlso = [], ...loExtra } = lo.extra ?? {};
  const { alsoIn: hiAlso = [], ...hiExtra } = hi.extra ?? {};
  const keep = Object.fromEntries(Object.entries(hiExtra).filter(([, v]) => v !== null && v !== undefined));
  out.extra = { ...loExtra, ...keep, alsoIn: [...hiAlso, loVia, ...loAlso].filter(Boolean) };
  return out;
}
const PROVENANCE = ['source', 'sourceRecordId', 'sourceUrl', 'sourceVersion', 'retrievedAt'];

function add(row) {
  if (!row) return;
  const m = bySource.get(row.source) ?? new Map();
  const k = recordKey(row);
  const prev = m.get(k);
  m.set(k, prev ? mergeRows(prev, row) : row);
  bySource.set(row.source, m);
}

const officialPath = (...p) => join(OFFICIAL_DIR, ...p);
const officialManifest = readJsonIfExists(officialPath('manifest.json'), { files: [] });
const mirrorsManifest = readJsonIfExists(join(MIRRORS_DIR, 'mirrors-manifest.json'), []);

function mirrorFile(id, path) {
  const p = join(MIRRORS_DIR, id, path);
  return mirrorsManifest.some((m) => m.id === id) && existsSync(p) ? p : null;
}
function mirrorVersion(id, what) {
  const m = MIRRORS.find((x) => x.id === id);
  const mf = mirrorsManifest.find((x) => x.id === id);
  const when = m.upstream?.exportDate ?? `corte ${mf?.commitDate?.slice(0, 10) ?? '?'}`;
  return `${what} ${when} vía espejo ${m.repo}@${m.commit.slice(0, 12)}`;
}
function mirrorProv(id, file, what) {
  const m = MIRRORS.find((x) => x.id === id);
  const mf = mirrorsManifest.find((x) => x.id === id);
  const f = mf?.files.find((x) => x.path === file);
  return {
    sourceVersion: mirrorVersion(id, what),
    // Fecha de descarga declarada; si no, la fecha completa de exportación; si no, el commit del espejo (cota superior).
    retrievedAt: new Date(m.upstream?.fetchedAt ?? (/^\d{4}-\d{2}-\d{2}$/.test(m.upstream?.exportDate ?? '') ? `${m.upstream.exportDate}T00:00:00Z` : mf?.commitDate)).toISOString(),
    via: { kind: 'mirror', repo: m.repo, commit: m.commit, file, sha256: f?.sha256 ?? null, derivedFrom: f?.derivedFrom ?? null, upstreamUrl: m.upstream?.url ?? null, upstreamSha256: m.upstream?.sha256 ?? null, priority: m.priority ?? 0 },
  };
}

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
} else if (mirrorFile('ej86-fda-ai-medical-device-analytics', 'foiclass.csv') || mirrorFile('bjoleary-fdadata', '.converted/product_codes.ndjson')) {
  const foi = mirrorFile('ej86-fda-ai-medical-device-analytics', 'foiclass.csv');
  if (foi) {
    const n = await readPipeDelimited(createReadStream(foi), (r) => table.addClassification(classificationFromFoiclass(r)));
    inputs.push({ source: 'mirror ej86-fda-ai-medical-device-analytics foiclass.csv', version: mirrorVersion('ej86-fda-ai-medical-device-analytics', 'FDA foiclass.zip'), records: n });
  }
  const pcs = mirrorFile('bjoleary-fdadata', '.converted/product_codes.ndjson');
  if (pcs) {
    let added = 0;
    const rows = readFileSync(pcs, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
    for (const r of rows) {
      const c = classificationFromFdadata(r);
      if (c.product_code && !table.get(c.product_code)?.classificationSource?.startsWith('fda:')) {
        table.addClassification(c);
        added++;
      }
    }
    inputs.push({ source: 'mirror bjoleary-fdadata product_codes', version: mirrorVersion('bjoleary-fdadata', 'FDA foiclass.zip'), records: rows.length, addedCodes: added });
  }
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
      priority: lineage.priority,
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

// --- 2b. 510(k)/De Novo y PMA: espejo bjoleary/fdadata (archivos de descarga FDA) ---
const fdPmn = mirrorFile('bjoleary-fdadata', '.converted/pmn.ndjson');
const fdPma = mirrorFile('bjoleary-fdadata', '.converted/pma.ndjson');
if (fdPmn) {
  const prov = mirrorProv('bjoleary-fdadata', '.converted/pmn.ndjson', 'FDA pmn*.zip (510(k) Download Files)');
  let n = 0;
  let kept = 0;
  for (const line of readFileSync(fdPmn, 'utf8').split('\n')) {
    if (!line) continue;
    n++;
    const row = fromFdadataPmn(JSON.parse(line), table, prov);
    if (row) (add(row), kept++);
  }
  inputs.push({ source: 'mirror bjoleary-fdadata pmn', version: prov.sourceVersion, records: n, inScope: kept });
}
let pmaDone = false;
if (fdPma) {
  const prov = mirrorProv('bjoleary-fdadata', '.converted/pma.ndjson', 'FDA pma.zip (PMA y suplementos)');
  const rows = readFileSync(fdPma, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const out = fromFdadataPma(rows, table, prov);
  out.forEach(add);
  pmaDone = true;
  inputs.push({ source: 'mirror bjoleary-fdadata pma', version: prov.sourceVersion, records: rows.length, inScope: out.length });
}
const aiCsv = mirrorFile('ej86-fda-ai-medical-device-analytics', 'aiml-devices-csv.csv');
if (aiCsv) {
  const prov = mirrorProv('ej86-fda-ai-medical-device-analytics', 'aiml-devices-csv.csv', 'FDA AI-Enabled Medical Devices list');
  const rows = parseCsv(readFileSync(aiCsv, 'utf8'));
  let kept = 0;
  for (const r of rows) {
    const row = fromAiList(r, table, prov);
    if (row) (add(row), kept++);
  }
  inputs.push({ source: 'mirror ej86 aiml-devices-csv', version: prov.sourceVersion, records: rows.length, inScope: kept });
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
} else if (!pmaDone) gaps.push({ source: 'fda-pma', url: 'https://download.open.fda.gov/device/pma/', reason: '403 del proxy — host bloqueado (download.open.fda.gov / accessdata.fda.gov) y sin espejo completo verificado.' });

if (officialListing.length) {
  let kept = 0;
  const n = await eachOpenFda('device/registrationlisting', (r, zip) => {
    for (const row of fromOpenFdaRegistrationListing(r, table, officialProv(zip, 'openFDA device/registrationlisting'))) (add(row), kept++);
  });
  inputs.push({ source: 'openfda device/registrationlisting', records: n, inScope: kept });
}

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
} else if (mirrorsManifest.some((m) => m.id === 'delapro-gudid')) {
  // Espejo parcial de GUDID (Full Release XML 2025-05-01, sólo panel dental).
  const m = MIRRORS.find((x) => x.id === 'delapro-gudid');
  let n = 0;
  let kept = 0;
  for (const file of m.files.filter((f) => f.endsWith('.zip'))) {
    const zip = mirrorFile(m.id, file);
    if (!zip) continue;
    const prov = mirrorProv(m.id, file, 'AccessGUDID Full Release XML (filtro dental)');
    for (const entry of await zipEntries(zip)) {
      if (!entry.endsWith('.xml')) continue;
      n += await streamXmlElements(unzipStream(zip, entry), 'device', (xml) => {
        const row = fromGudidXml(xml, table, prov, { xmlTag, xmlBlocks });
        if (row) (add(row), kept++);
      });
    }
  }
  inputs.push({ source: 'mirror delapro-gudid (dental)', version: mirrorVersion(m.id, 'AccessGUDID Full Release XML'), records: n, inScope: kept });
  gaps.push({ source: 'fda-gudid', url: 'https://accessgudid.nlm.nih.gov/download/delimited', reason: '403 del proxy — GUDID completo inaccesible; sólo se usó el subconjunto dental del Full Release 2025-05-01 (espejo Delapro/GUDID). Faltan los demás paneles.' });
} else {
  gaps.push({ source: 'fda-gudid', url: 'https://accessgudid.nlm.nih.gov/download/delimited', reason: '403 del proxy — accessgudid.nlm.nih.gov y download.open.fda.gov bloqueados por la red de la sesión. Sin GUDID no hay UDI-DI ni modelo/versión por equipo.' });
}

// --- 2c. Registration & Listing: archivos planos de FDA 2024 (espejo sdgoldberg/MedDev) ---
const rlDir = mirrorFile('sdgoldberg-meddev', 'project/data/Registration.txt') ? join(MIRRORS_DIR, 'sdgoldberg-meddev', 'project/data') : null;
if (rlDir && !officialListing.length) {
  const prov = mirrorProv('sdgoldberg-meddev', 'project/data/registration_listing.txt', 'FDA Establishment Registration & Device Listing (archivos planos)');
  const load = async (f) => {
    const rows = [];
    await readPipeDelimited(createReadStream(join(rlDir, f), { encoding: 'latin1' }), (r) => rows.push(r));
    return rows;
  };
  const regs = new Map((await load('Registration.txt')).map((r) => [r.REG_KEY, r]));
  const owners = new Map((await load('Owner_Operator.txt')).map((r) => [r.REG_KEY, r]));
  const pcdByKey = new Map();
  for (const r of await load('Listing_PCD.txt')) pcdByKey.set(r.key_val, [...(pcdByKey.get(r.key_val) ?? []), r]);
  const estab = new Map();
  for (const r of await load('listing_estabtypes.txt')) estab.set(r.REGISTRATION_LISTING_ID, [...(estab.get(r.REGISTRATION_LISTING_ID) ?? []), r.ESTABLISHMENT_TYPE_ID]);
  const links = await load('registration_listing.txt');
  let kept = 0;
  let orphan = 0;
  for (const link of links) {
    const reg = regs.get(link.REG_KEY);
    if (!reg) {
      orphan++;
      continue;
    }
    for (const pcd of pcdByKey.get(link.KEY_VAL) ?? []) {
      const row = fromRlFlat({ reg, link, pcd, owner: owners.get(link.REG_KEY), estabTypes: [...new Set(estab.get(link.REGISTRATION_LISTING_ID) ?? [])].sort() }, table, prov);
      if (row) (add(row), kept++);
    }
  }
  rlDone = true;
  inputs.push({ source: 'mirror sdgoldberg-meddev (R&L 2024)', version: prov.sourceVersion, records: links.length, registrations: regs.size, listingsWithProductCode: pcdByKey.size, inScope: kept, linksWithoutRegistration: orphan });
}

if (!rlDone) gaps.push({ source: 'fda-rl', url: 'https://download.open.fda.gov/device/registrationlisting/', reason: '403 del proxy — host bloqueado; sin él no hay país del fabricante ni nombres propietarios por establecimiento.' });

// --- 2d. LIVD SARS-CoV-2 de CDC (pruebas IVD con EUA de FDA) ----------------------
const livd = mirrorFile('cdcgov-routes-livd', 'ReportStream/metadata/tables/local/LIVD-SARS-CoV-2.csv');
if (livd) {
  const m = MIRRORS.find((x) => x.id === 'cdcgov-routes-livd');
  const prov = {
    ...mirrorProv(m.id, 'ReportStream/metadata/tables/local/LIVD-SARS-CoV-2.csv', 'CDC LIVD SARS-CoV-2'),
    fileUrl: `https://github.com/CDCgov/routes/blob/${m.commit}/ReportStream/metadata/tables/local/LIVD-SARS-CoV-2.csv`,
  };
  const rows = parseCsv(readFileSync(livd, 'utf8').replace(/^\uFEFF/, ''));
  const out = fromLivd(rows, prov);
  out.forEach(add);
  inputs.push({ source: 'mirror cdcgov-routes LIVD SARS-CoV-2', version: prov.sourceVersion, records: rows.length, testKits: out.length });
}

// --- 3a. Enriquecimiento: base CLIA de FDA (analitos por documento / K-number) ------
const cliaFiles = ['output/clia_doc2test2analyte_chem.tsv', 'output/clia_doc2test2analyte_gp.tsv'].map((f) => mirrorFile('unmtransinfo-cfde-biomarkers', f)).filter(Boolean);
if (cliaFiles.length) {
  const prov = mirrorProv('unmtransinfo-cfde-biomarkers', 'output/clia_doc2test2analyte_chem.tsv', 'FDA CLIA database (analitos)');
  const byDoc = new Map();
  let n = 0;
  for (const f of cliaFiles) {
    const [head, ...lines] = readFileSync(f, 'utf8').split('\n').filter(Boolean);
    const cols = head.split('\t');
    for (const line of lines) {
      const r = Object.fromEntries(line.split('\t').map((v, i) => [cols[i], v]));
      n++;
      const doc = clean(r.DOCUMENT_NUMBER)?.toUpperCase();
      if (!doc) continue;
      const e = byDoc.get(doc) ?? new Map();
      e.set(`${r.TEST_SYSTEM_ID}|${r.ANALYTE_ID}`, { testSystemId: r.TEST_SYSTEM_ID, analyteId: r.ANALYTE_ID, analyte: r.ANALYTE_NAME, dateEffective: r.DATE_EFFECTIVE });
      byDoc.set(doc, e);
    }
  }
  const index = new Map();
  for (const src of ['fda-510k', 'fda-denovo', 'fda-pma']) for (const row of bySource.get(src)?.values() ?? []) if (row.authorizationId) index.set(row.authorizationId, [...(index.get(row.authorizationId) ?? []), row]);
  let matched = 0;
  for (const [doc, e] of byDoc) {
    const rows = index.get(doc);
    if (!rows) continue;
    for (const row of rows) row.extra = { ...row.extra, fdaCliaAnalytes: { items: [...e.values()].sort((a, b) => `${a.testSystemId}|${a.analyteId}`.localeCompare(`${b.testSystemId}|${b.analyteId}`)), via: prov.via } };
    matched++;
  }
  inputs.push({ source: 'mirror unmtransinfo-cfde-biomarkers (CLIA)', version: prov.sourceVersion, records: n, documents: byDoc.size, enrichedAuthorizations: matched });
}

// --- 3b. Enriquecimiento: lista FDA de pruebas de ácidos nucleicos (patógenos por K-number) ---
const naat = mirrorFile('double-strand-naat-registry', 'FDA510kPathogens_NAAT.csv');
if (naat) {
  const prov = mirrorProv('double-strand-naat-registry', 'FDA510kPathogens_NAAT.csv', 'FDA Nucleic Acid Based Tests list');
  const byK = new Map();
  const rows = parseCsv(readFileSync(naat, 'utf8'));
  for (const r of rows) {
    for (const k of String(r.Submissions ?? '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean)) {
      const e = byK.get(k) ?? { targets: [], technologies: new Set() };
      e.targets.push({ ncbiTaxId: r.TaxID, label: r.FDAregulatoryLabels, rank: r.rank });
      if (r.Technology && r.Technology !== 'NA') e.technologies.add(r.Technology);
      byK.set(k, e);
    }
  }
  let matched = 0;
  const unmatched = [];
  for (const [k, e] of byK) {
    const kind = authorizationKind(k);
    const src = kind === 'DENOVO' ? 'fda-denovo' : kind === 'PMA' ? 'fda-pma' : 'fda-510k';
    const row = [...(bySource.get(src)?.values() ?? [])].find((r) => r.authorizationId === k);
    if (!row) {
      unmatched.push(k);
      continue;
    }
    row.extra = { ...row.extra, fdaNaatList: { targets: e.targets.sort((a, b) => a.ncbiTaxId.localeCompare(b.ncbiTaxId)), technologies: [...e.technologies].sort(), via: prov.via } };
    matched++;
  }
  inputs.push({ source: 'mirror double-strand-naat-registry', version: prov.sourceVersion, records: rows.length, submissions: byK.size, enriched: matched, unmatched: unmatched.sort() });
}

// --- 4. Escritura ------------------------------------------------------------------
ensureDir(OUT_DIR);
// Lo que había en out/ antes de esta corrida: base para contar lo nuevo de la pasada.
const brandKey = (r) => `${manufacturerKey(r.manufacturerName) ?? ''}|${r.brandName.toUpperCase()}`;
const previous = { records: new Set(), manufacturers: new Set(), brands: new Set(), udiDi: new Set() };
for (const f of readdirSync(OUT_DIR).filter((x) => /^fda-[a-z0-9-]+-\d{4}\.ndjson\.gz$/.test(x))) {
  for (const line of gunzipSync(readFileSync(join(OUT_DIR, f))).toString('utf8').split('\n')) {
    if (!line) continue;
    const r = JSON.parse(line);
    previous.records.add(`${r.source}|${r.sourceRecordId}`);
    const mk = manufacturerKey(r.manufacturerName);
    if (mk) previous.manufacturers.add(mk);
    if (r.brandName) previous.brands.add(brandKey(r));
    if (r.udiDi) previous.udiDi.add(r.udiDi);
  }
}
const SOURCES = ['fda-510k', 'fda-denovo', 'fda-pma', 'fda-rl', 'fda-gudid', 'cdc-livd-sars-cov-2'];
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
const brands = new Set(all.filter((r) => r.brandName).map(brandKey));
const deltaVsPrevious = {
  records: all.filter((r) => !previous.records.has(`${r.source}|${r.sourceRecordId}`)).length,
  manufacturers: [...manufacturers].filter((m) => !previous.manufacturers.has(m)).length,
  brands: [...brands].filter((b) => !previous.brands.has(b)).length,
  udiDi: all.filter((r) => r.udiDi && !previous.udiDi.has(r.udiDi)).length,
  bySource: count(all.filter((r) => !previous.records.has(`${r.source}|${r.sourceRecordId}`)), (r) => r.source),
};
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
  deltaVsPrevious,
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

console.log(JSON.stringify({ deltaVsPrevious, rows: all.length, bySource: coverage.totals.bySource, productCodes: coverage.productCodes, manufacturers: manufacturers.size, brands: brands.size, parts: parts.map((p) => `${p.path} ${p.rows} filas ${(p.bytes / 1e6).toFixed(1)} MB`), gaps: gaps.map((g) => g.source) }, null, 1));
