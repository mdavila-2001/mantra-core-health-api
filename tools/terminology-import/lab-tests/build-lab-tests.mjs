#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · etapa 1 (fuentes descargadas → NDJSON común). Sin red.
//
// Lee `<GLOSSARY_BUILD_DIR>/lab-tests-sources/` y escribe, por capa:
//   ndjson/lab-tests-<capa>.ndjson     un registro común por línea (lib/records.mjs)
//   ndjson/lab-tests-<capa>.meta.json  code systems, archivos leídos (SHA-256), conteos
// y además `lab-tests-coverage.json` (totales por dominio/categoría/fuente y huecos).
//
// Capas: loinc (si hay distribución en lab-tests-sources/loinc/), hl7-tho, ucum.
// Una fuente ausente no aborta: queda registrada como hueco en la cobertura.
//
// Uso:
//   node tools/terminology-import/lab-tests/build-lab-tests.mjs [--loinc-release 2.81] [--es-variant <ID>]
//   (--es-variant elige la variante en castellano por su ID de LinguisticVariants.csv;
//    por omisión, la primera `es` del índice en orden de ID.)
// =============================================================================

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { basename, join, relative } from 'node:path';

import { BUILD_DIR, ensureDir, nowIso, sha256File, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { THO_TABLES, thoRecords } from './lib/hl7-tho.mjs';
import {
  loincRecords,
  parseClassNames,
  parseLinguisticIndex,
  parseLinguisticVariant,
  parseLoincTable,
  parsePanels,
  parsePartLinks,
  parsePlaybook,
  parseTop2000,
  parseUniversalLabOrders,
} from './lib/loinc.mjs';
import { GTR_CODE_SYSTEM, conditionGeneMap, gtrRecords, methodCategoryMap, parseTsv, TEST_VERSION_COLUMNS } from './lib/gtr.mjs';
import { txToLoincInput } from './lib/loinc-tx.mjs';
import { CDISC_CODE_SYSTEM, cdiscRecords, parseCdiscTerminology } from './lib/cdisc.mjs';
import { NPU_CODE_SYSTEM, npuObjects, npuRecords } from './lib/npu.mjs';
import { parseCsv } from '../lib/glossary-es/loinc-es.mjs';
import { DOMAINS, assertRecord } from './lib/records.mjs';
import { GAPS, SOURCES } from './lib/sources.mjs';
import { TARIFF_EXCLUSIONS, TARIFF_RULES, addCie10esDesignations, cupsItems, fonasaItems, pamiItems, pamiOfficialItems, pcsAxisNames, pcsItems, pcsOrderFile, sigtapItems, tariffRecords, tussItems } from './lib/tariffs.mjs';
import { FULL_SHEET, PX_FILE } from '../lib/glossary-es/cie10es.mjs';
import { createRequire } from 'node:module';
import { UCUM_CODE_SYSTEM, ucumRecords } from './lib/ucum.mjs';

const SRC = join(BUILD_DIR, 'lab-tests-sources');
const OUT = ensureDir(join(BUILD_DIR, 'ndjson'));
const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const manifest = existsSync(join(SRC, 'manifest.json')) ? JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8')) : {};

/** Busca un archivo por nombre (o predicado) bajo `dir`, recursivo. */
function findFile(dir, test) {
  if (!existsSync(dir)) return null;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const hit = findFile(p, test);
      if (hit) return hit;
    } else if (typeof test === 'string' ? name === test : test(name, p)) return p;
  }
  return null;
}

function fileProv(path) {
  return { file: relative(BUILD_DIR, path), sha256: sha256File(path) };
}

function npmProv(key, file) {
  const m = manifest[key];
  if (!m) throw new Error(`Falta ${key} en ${join(SRC, 'manifest.json')}: corré fetch-lab-tests-sources.mjs.`);
  return { packageName: SOURCES[key].npm.name, packageVersion: SOURCES[key].npm.version, file: relative(BUILD_DIR, file), sha256: sha256File(file), tarballSha256: m.sha256, retrievedAt: m.retrievedAt, license: SOURCES[key].license };
}

const DIRECT_URL_PAMI = 'https://datos.pami.org.ar/dataset/9937b24d-abad-45fb-8158-c1c5684d2635/resource/5d32d7a8-3d6a-4ed4-9701-6d4fd024c657/download/nomenclador-comun.csv';

/** CSV con separador arbitrario (reusa el parser RFC 4180 cambiando `;` por un separador seguro). */
function parseCsvWith(text, sep) {
  if (sep === ',') return parseCsv(text);
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === '') continue;
    const cells = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i += 1; } else if (c === '"') q = false; else cur += c;
      } else if (c === '"') q = true;
      else if (c === sep) { cells.push(cur); cur = ''; } else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

/** Procedencia de un archivo bajado por URL directa (fetch-direct-sources.mjs). */
function directProv(path) {
  const entry = Object.values(manifest).find((m) => m?.files && Object.keys(m.files).some((f) => path.endsWith(f)));
  const f = entry && Object.entries(entry.files).find(([name]) => path.endsWith(name))[1];
  if (!f) throw new Error(`${path} no está en manifest.json: corré fetch-direct-sources.mjs.`);
  return { file: relative(BUILD_DIR, path), sha256: f.sha256, retrievedAt: f.retrievedAt, url: f.url };
}

async function writeLayer(layer, records, meta) {
  records.forEach(assertRecord);
  await writeNdjson(join(OUT, `lab-tests-${layer}.ndjson`), records);
  writeJson(join(OUT, `lab-tests-${layer}.meta.json`), { layer, builtAt: nowIso(), records: records.length, ...meta }, true);
  console.log(`[build] lab-tests-${layer}: ${records.length} registros`);
}

// --- Capa HL7 THO -------------------------------------------------------------
async function buildTho() {
  const pkg = join(SRC, SOURCES['hl7-tho'].dir, 'package');
  if (!existsSync(pkg)) return { layer: 'hl7-tho', missing: 'paquete hl7.terminology.r4 no descargado' };
  const records = [];
  const codeSystems = [];
  const files = {};
  for (const key of Object.keys(THO_TABLES)) {
    const path = join(pkg, `CodeSystem-${key}.json`);
    const cs = JSON.parse(readFileSync(path, 'utf8'));
    const prov = npmProv('hl7-tho', path);
    files[basename(path)] = { file: prov.file, sha256: prov.sha256 };
    const rows = thoRecords(cs, key, prov);
    records.push(...rows);
    codeSystems.push({ internalCode: THO_TABLES[key].codeSystem, name: `${THO_TABLES[key].label} (${cs.title ?? cs.name})`, canonicalUrl: cs.url, version: cs.version, sourceKey: 'hl7-tho', records: rows.length });
  }
  await writeLayer('hl7-tho', records, { source: SOURCES['hl7-tho'].npm, codeSystems, files });
  return { layer: 'hl7-tho', records };
}

// --- Capa UCUM ----------------------------------------------------------------
async function buildUcum() {
  const defsPath = join(SRC, SOURCES.ucum.dir, 'package', 'data', 'ucumDefs.min.json');
  if (!existsSync(defsPath)) return { layer: 'ucum', missing: 'paquete @lhncbc/ucum-lhc no descargado' };
  const thoPath = join(SRC, SOURCES['hl7-tho'].dir, 'package', 'ValueSet-ucum-common.json');
  const hasTho = existsSync(thoPath);
  const { records, stats } = ucumRecords(JSON.parse(readFileSync(defsPath, 'utf8')), hasTho ? JSON.parse(readFileSync(thoPath, 'utf8')) : null, {
    lhc: npmProv('ucum', defsPath),
    tho: hasTho ? npmProv('hl7-tho', thoPath) : null,
  });
  const version = `ucum-lhc-${SOURCES.ucum.npm.version}`;
  await writeLayer('ucum', records, {
    source: SOURCES.ucum.npm,
    codeSystems: [{ internalCode: UCUM_CODE_SYSTEM, name: 'UCUM — Unified Code for Units of Measure', canonicalUrl: 'http://unitsofmeasure.org', version, sourceKey: 'ucum', records: records.length }],
    files: { 'ucumDefs.min.json': fileProv(defsPath), ...(hasTho ? { 'ValueSet-ucum-common.json': fileProv(thoPath) } : {}) },
    stats,
  });
  return { layer: 'ucum', records, stats };
}

// --- Capa LOINC ---------------------------------------------------------------
async function buildLoinc() {
  const dir = join(SRC, SOURCES.loinc.dir);
  const tablePath = findFile(dir, 'Loinc.csv');
  if (!tablePath) return buildLoincFromTx();
  const release = arg('--loinc-release');
  if (!release) throw new Error('Hay Loinc.csv: pasá --loinc-release <versión de la distribución, p. ej. 2.81>.');
  const read = (p) => readFileSync(p, 'utf8');
  const files = { 'Loinc.csv': fileProv(tablePath) };
  const optional = (name, test, parse) => {
    const p = findFile(dir, test);
    if (!p) return undefined;
    files[name] = fileProv(p);
    return parse(read(p), name);
  };
  const input = { table: parseLoincTable(read(tablePath)) };
  input.classNames = optional('Part.csv', 'Part.csv', parseClassNames);
  input.partLinks = optional('LoincPartLink_Primary.csv', 'LoincPartLink_Primary.csv', parsePartLinks);
  input.panels = optional('PanelsAndForms.csv', 'PanelsAndForms.csv', parsePanels);
  input.universalLabOrders = optional('LoincUniversalLabOrdersValueSet.csv', 'LoincUniversalLabOrdersValueSet.csv', parseUniversalLabOrders);
  input.playbook = optional('LoincRsnaRadiologyPlaybook.csv', 'LoincRsnaRadiologyPlaybook.csv', parsePlaybook);
  input.top2000Us = optional('Top2000 US', (n, p) => /top.?2000/i.test(p) && /us/i.test(n) && n.endsWith('.csv'), parseTop2000);
  input.top2000Si = optional('Top2000 SI', (n, p) => /top.?2000/i.test(p) && /si/i.test(n) && n.endsWith('.csv'), parseTop2000);
  for (const k of Object.keys(input)) if (input[k] === undefined) delete input[k];

  let esVariant = null;
  const index = optional('LinguisticVariants.csv', 'LinguisticVariants.csv', parseLinguisticIndex);
  if (index?.length) {
    const wanted = arg('--es-variant');
    const chosen = wanted ? index.find((v) => v.id === wanted) : [...index].sort((a, b) => Number(a.id) - Number(b.id))[0];
    if (!chosen) throw new Error(`--es-variant ${wanted} no está en LinguisticVariants.csv (variantes es: ${index.map((v) => v.id).join(', ')})`);
    const p = findFile(dir, (n) => n === `${chosen.language}${chosen.country}${chosen.id}LinguisticVariant.csv`);
    if (p) {
      files[basename(p)] = fileProv(p);
      input.es = parseLinguisticVariant(read(p));
      esVariant = { ...chosen, file: basename(p) };
    }
  }

  const retrievedAt = statSync(tablePath).mtime.toISOString();
  const { records, stats } = loincRecords(input, { release, retrievedAt, files, esVariant, license: SOURCES.loinc.license });
  await writeLayer('loinc', records, {
    release,
    esVariant,
    codeSystems: [{ internalCode: 'loinc', name: 'LOINC', canonicalUrl: 'http://loinc.org', version: release, sourceKey: 'loinc', records: records.length }],
    files,
    stats,
  });
  return { layer: 'loinc', records, stats };
}

// --- Capas de nomencladores / aranceles (FONASA, SIGTAP, TUSS, PAMI) ------------
const TARIFF_LAYERS = {
  'fonasa-mle': {
    file: ['data', 'mle-2026.json'],
    version: () => '2026',
    sourceUrl: () => 'https://www.fonasa.cl/',
    items: (dir, read) => fonasaItems(read(join(dir, 'data', 'mle-2026.json'))),
  },
  'sigtap-sus': {
    file: ['data', '2026.08', 'tables', 'procedures.json'],
    version: (meta) => meta.version,
    sourceUrl: (meta) => meta.sourceUrl,
    meta: ['data', '2026.08', 'metadata.json'],
    items: (dir, read) => {
      const t = (n) => read(join(dir, 'data', '2026.08', 'tables', n));
      return sigtapItems(t('procedures.json'), t('subGroups.json'), t('organizationForms.json'));
    },
  },
  'tuss-ans': {
    file: ['data', '2026.06.26', 'tables', 'procedures.json'],
    version: (meta) => meta.version,
    sourceUrl: (meta) => meta.sourceUrl,
    meta: ['data', '2026.06.26', 'metadata.json'],
    items: (dir, read) => tussItems(read(join(dir, 'data', '2026.06.26', 'tables', 'procedures.json'))),
  },
  // Archivos oficiales de CMS FY2027 (vigente 2026-10-01 → 2027-09-30). La copia FY2026 de
  // @cyanheads/medical-codes-mcp-server se cotejó contra el order file 2026 de CMS: 0 diferencias.
  'icd10pcs-cms': {
    direct: true,
    file: ['2027-icd-10-pcs-order-file-long-abbreviated-titles.zip'],
    canonicalUrl: 'http://www.cms.gov/Medicare/Coding/ICD10',
    version: () => 'ICD-10-PCS FY2027',
    sourceUrl: () => 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    items: (dir) => {
      const order = execFileSync('unzip', ['-p', join(dir, '2027-icd-10-pcs-order-file-long-abbreviated-titles.zip'), 'icd10pcs_order_2027.txt'], { maxBuffer: 64 * 1024 * 1024 }).toString('latin1');
      const tables = execFileSync('unzip', ['-p', join(dir, '2027-icd-10-pcs-code-tables-index.zip'), 'icd10pcs_tables_2027.xml'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
      const { sections, types } = pcsAxisNames(tables);
      return pcsItems(pcsOrderFile(order), sections, types);
    },
  },

  'cups-co': {
    direct: true,
    file: ['POSPOPULI-LABORATORIO-s5f2-yivs.csv'],
    version: () => `${(manifest['minsalud-co-laboratorio']?.files?.['POSPOPULI-LABORATORIO-s5f2-yivs.csv']?.retrievedAt ?? '').slice(0, 10)} (datos.gov.co)`,
    sourceUrl: () => SOURCES['cups-co'].officialUrl,
    items: (dir) => {
      const rowsOf = (f) => {
        const [header, ...data] = parseCsv(readFileSync(join(dir, f), 'utf8'));
        return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
      };
      const provOf = (f, url) => {
        const p = directProv(join(dir, f));
        return { sourceUrl: url, sourceFile: p.file, sourceSha256: p.sha256, retrievedAt: p.retrievedAt };
      };
      return cupsItems(rowsOf('POSPOPULI-LABORATORIO-s5f2-yivs.csv'), rowsOf('Procedimiento-del-PBS-9zcz-bjue.csv'), {
        'POSPOPULI-LABORATORIO': provOf('POSPOPULI-LABORATORIO-s5f2-yivs.csv', 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/POSPOPULI-LABORATORIO/s5f2-yivs'),
        'Procedimiento del PBS': provOf('Procedimiento-del-PBS-9zcz-bjue.csv', 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/Procedimiento-del-PBS/9zcz-bjue'),
      });
    },
  },
  // CSV oficial de datos.pami.org.ar (cotejado: mismos 4 739 códigos que nomenclador-salud-js, que además
  // había cambiado la caja de los nombres). `pamiItems` queda para la redistribución npm.
  'pami-nomenclador': {
    direct: true,
    file: ['nomenclador-comun.csv'],
    version: () => 'Nomenclador Común, estructura de unidades febrero 2019 (datos.pami.org.ar)',
    sourceUrl: () => DIRECT_URL_PAMI,
    items: (dir) => pamiOfficialItems(parseCsvWith(new TextDecoder('latin1').decode(readFileSync(join(dir, 'nomenclador-comun.csv'))), ';')),
  },
};

/** Designaciones en castellano de CIE-10-ES Procedimientos (si está descargado con fetch-direct-sources.mjs). */
function enrichPcsWithCie10es(records) {
  const path = join(SRC, 'cie10es', PX_FILE);
  const m = manifest['cie10es-px']?.files?.[PX_FILE];
  if (!existsSync(path) || !m) return { skipped: 'CIE-10-ES Procedimientos no descargado' };
  const XLSX = createRequire(import.meta.url)('xlsx');
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(path, { dense: true }).Sheets[FULL_SHEET], { header: 1, defval: null });
  const [header, ...data] = rows;
  const ci = header.indexOf('Código');
  const di = header.indexOf('Descripción');
  if (ci < 0 || di < 0) throw new Error(`CIE-10-ES: la hoja «${FULL_SHEET}» no tiene Código/Descripción. Cabeceras: ${header.join(', ')}`);
  const esByCode = new Map(data.filter((r) => r[ci] && r[di]).map((r) => [String(r[ci]).trim(), String(r[di]).trim()]));
  return { ...addCie10esDesignations(records, esByCode, { edition: '2026', url: m.url, file: relative(BUILD_DIR, path), sha256: m.sha256 }), cieCodes: esByCode.size };
}

async function buildTariff(key) {
  const def = TARIFF_LAYERS[key];
  const src = SOURCES[key];
  const dir = def.direct ? join(SRC, src.dir) : join(SRC, src.dir, 'package');
  const path = join(dir, ...def.file);
  const via = src.npm ? `${src.npm.name}@${src.npm.version}` : 'descarga directa (fetch-direct-sources.mjs)';
  if (!existsSync(path)) return { layer: key, missing: `${via}: no descargado` };
  const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const pkgMeta = def.meta ? read(join(dir, ...def.meta)) : null;
  const version = def.version(pkgMeta);
  const np = def.direct ? directProv(path) : npmProv(key, path);
  const { records, stats } = tariffRecords(key, def.items(dir, read), {
    sourceName: src.npm ? `${src.name} — ${version} (vía ${via})` : `${src.name} — ${version}`,
    sourceVersion: src.npm ? `${version}; ${via}` : version,
    sourceUrl: def.sourceUrl(pkgMeta),
    sourceFile: np.file,
    sourceSha256: np.sha256,
    retrievedAt: np.retrievedAt,
    license: src.license,
  });
  if (key === 'icd10pcs-cms') stats.cie10es = enrichPcsWithCie10es(records);
  await writeLayer(key, records, {
    source: src.npm ?? { direct: true },
    packageMetadata: pkgMeta,
    codeSystems: [{ internalCode: key, name: src.name, canonicalUrl: def.canonicalUrl ?? `https://mantracore.health/fhir/CodeSystem/${key}`, version, sourceKey: key, records: records.length }],
    files: { [def.file.at(-1)]: { file: np.file, sha256: np.sha256 } },
    rules: TARIFF_RULES[key],
    exclusions: TARIFF_EXCLUSIONS[key] ?? [],
    stats,
  });
  return { layer: key, records, stats };
}

/**
 * LOINC sin distribución oficial: tx.fhir.org (fetch-loinc-txfhir.mjs) + NLM
 * (fetch-loinc-ctss.mjs). Mismo `loincRecords`, misma capa `loinc`.
 */
async function buildLoincFromTx() {
  const txPath = join(SRC, 'loinc-txfhir', 'loinc-txfhir.json');
  const ctssPath = join(SRC, 'loinc-ctss', 'loinc-ctss-items.json');
  const panPath = join(SRC, 'loinc-ctss', 'loinc-ctss-panels.json');
  if (!existsSync(txPath) || !existsSync(ctssPath)) {
    return { layer: 'loinc', missing: 'no hay Loinc.csv (exige cuenta en loinc.org) ni descarga por tx.fhir.org + NLM (fetch-loinc-txfhir.mjs, fetch-loinc-ctss.mjs)' };
  }
  const tx = JSON.parse(readFileSync(txPath, 'utf8'));
  const ctss = JSON.parse(readFileSync(ctssPath, 'utf8'));
  const pan = existsSync(panPath) ? JSON.parse(readFileSync(panPath, 'utf8')) : null;
  const { stats: inputStats, ...input } = txToLoincInput(tx, ctss, pan);
  const release = String(tx.codeSystemVersion ?? '').split('|').pop() || 'desconocida';
  const files = { 'Loinc.csv': fileProv(txPath), 'loinc-ctss-items.json': fileProv(ctssPath), ...(pan ? { 'loinc-ctss-panels.json': fileProv(panPath) } : {}) };
  const esVariant = { id: 'designaciones es-* de LOINC servidas por tx.fhir.org (nombre largo es-MX, nombre corto es-AR)', country: 'MX/AR', producer: null, file: 'tx.fhir.org ValueSet/$expand' };
  const { records, stats } = loincRecords(input, { release, retrievedAt: tx.finishedAt, files, esVariant, license: SOURCES.loinc.license, via: 'tx.fhir.org (HL7) y NLM Clinical Table Search Service' });
  await writeLayer('loinc', records, {
    release,
    via: { txfhir: tx.base, txRequests: tx.requests, txPartitions: tx.partitions, ctss: ctss.source, ctssLeaves: ctss.leaves, panels: pan ? { panelCodes: pan.panelCodes, withDefinition: pan.withDefinition, missing: pan.missing?.length ?? 0 } : null },
    esVariant,
    codeSystems: [{ internalCode: 'loinc', name: 'LOINC', canonicalUrl: 'http://loinc.org', version: release, sourceKey: 'loinc', records: records.length }],
    files,
    stats: { ...stats, input: inputStats },
  });
  return { layer: 'loinc', records, stats };
}

// --- Capa NCBI GTR --------------------------------------------------------------
async function buildGtr() {
  const dir = join(SRC, SOURCES['gtr-ncbi'].dir);
  const files = ['test_version.gz', 'test_condition_gene.txt', 'tests_by_method_category.txt'].map((f) => join(dir, f));
  if (!files.every(existsSync)) return { layer: GTR_CODE_SYSTEM, missing: 'archivos de GTR no descargados (fetch-gtr.mjs)' };
  const m = manifest['gtr-ncbi'];
  if (!m) throw new Error('Falta gtr-ncbi en manifest.json: corré fetch-gtr.mjs.');
  const versions = parseTsv(gunzipSync(readFileSync(files[0])).toString('utf8'), TEST_VERSION_COLUMNS, 'test_version.gz');
  const { records, stats } = gtrRecords(versions, conditionGeneMap(readFileSync(files[1], 'utf8')), methodCategoryMap(readFileSync(files[2], 'utf8')), {
    sourceVersion: `FTP de NCBI, test_version.gz sha256 ${m.files['test_version.gz'].sha256.slice(0, 12)} (${m.retrievedAt.slice(0, 10)})`,
    sourceFile: relative(BUILD_DIR, files[0]),
    sourceSha256: m.files['test_version.gz'].sha256,
    retrievedAt: m.retrievedAt,
  });
  await writeLayer(GTR_CODE_SYSTEM, records, {
    source: { ftp: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/' },
    codeSystems: [{ internalCode: GTR_CODE_SYSTEM, name: SOURCES['gtr-ncbi'].name, canonicalUrl: 'https://www.ncbi.nlm.nih.gov/gtr/', version: m.retrievedAt.slice(0, 10), sourceKey: 'gtr-ncbi', records: records.length }],
    files: Object.fromEntries(Object.entries(m.files).map(([k, v]) => [k, { file: relative(BUILD_DIR, join(dir, k)), sha256: v.sha256, url: v.url }])),
    stats,
  });
  return { layer: GTR_CODE_SYSTEM, records, stats };
}

// --- Capa CDISC SDTM (NCI EVS) -----------------------------------------------------
async function buildCdisc() {
  const file = join(SRC, SOURCES['cdisc-sdtm'].dir, 'SDTM Terminology.txt');
  if (!existsSync(file)) return { layer: CDISC_CODE_SYSTEM, missing: 'SDTM Terminology.txt no descargado (fetch-direct-sources.mjs --only nci-cdisc-sdtm)' };
  const f = manifest['nci-cdisc-sdtm']?.files?.['SDTM Terminology.txt'];
  if (!f) throw new Error('Falta nci-cdisc-sdtm en manifest.json: corré fetch-direct-sources.mjs.');
  const published = f.lastModified ? new Date(f.lastModified).toISOString().slice(0, 10) : null;
  const { records, stats } = cdiscRecords(parseCdiscTerminology(readFileSync(file, 'utf8')), {
    sourceVersion: `SDTM Terminology.txt${published ? ` publicado ${published}` : ''}, sha256 ${f.sha256.slice(0, 12)} (NCI EVS)`,
    sourceFile: relative(BUILD_DIR, file),
    sourceSha256: f.sha256,
    retrievedAt: f.retrievedAt,
  });
  await writeLayer(CDISC_CODE_SYSTEM, records, {
    source: { url: f.url, lastModified: f.lastModified },
    codeSystems: [{ internalCode: CDISC_CODE_SYSTEM, name: SOURCES['cdisc-sdtm'].name, canonicalUrl: 'https://evs.nci.nih.gov/ftp1/CDISC/SDTM/', version: published ?? f.retrievedAt.slice(0, 10), sourceKey: 'cdisc-sdtm', records: records.length }],
    files: { 'SDTM Terminology.txt': { file: relative(BUILD_DIR, file), sha256: f.sha256, url: f.url } },
    stats,
  });
  return { layer: CDISC_CODE_SYSTEM, records, stats };
}

// --- Capa NPU (IFCC-IUPAC) -----------------------------------------------------------
async function buildNpu() {
  const file = join(SRC, SOURCES['npu-ifcc'].dir, 'npu-codes-latest.csv');
  if (!existsSync(file)) return { layer: NPU_CODE_SYSTEM, missing: 'npu-codes-latest.csv no descargado (fetch-direct-sources.mjs --only ifcc-npu)' };
  const f = manifest['ifcc-npu']?.files?.['npu-codes-latest.csv'];
  if (!f) throw new Error('Falta ifcc-npu en manifest.json: corré fetch-direct-sources.mjs.');
  const published = f.lastModified ? new Date(f.lastModified).toISOString().slice(0, 10) : null;
  const { records, stats } = npuRecords(npuObjects(parseCsv(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))), {
    sourceVersion: `npu-codes-latest.csv${published ? ` publicado ${published}` : ''}, sha256 ${f.sha256.slice(0, 12)} (IFCC)`,
    sourceFile: relative(BUILD_DIR, file),
    sourceSha256: f.sha256,
    retrievedAt: f.retrievedAt,
  });
  await writeLayer(NPU_CODE_SYSTEM, records, {
    source: { url: f.url, lastModified: f.lastModified },
    codeSystems: [{ internalCode: NPU_CODE_SYSTEM, name: SOURCES['npu-ifcc'].name, canonicalUrl: 'urn:oid:1.2.208.176', version: published ?? f.retrievedAt.slice(0, 10), sourceKey: 'npu-ifcc', records: records.length }],
    files: { 'npu-codes-latest.csv': { file: relative(BUILD_DIR, file), sha256: f.sha256, url: f.url } },
    stats,
  });
  return { layer: NPU_CODE_SYSTEM, records, stats };
}

function coverage(results) {
  const byDomain = Object.fromEntries(Object.keys(DOMAINS).map((d) => [d, 0]));
  const byCategory = {};
  const bySource = {};
  const unmappedLoincClasses = {};
  let withEs = 0;
  let panels = 0;
  let panelMembers = 0;
  for (const res of results) {
    for (const r of res.records ?? []) {
      if (r.domain) byDomain[r.domain] += 1;
      const cat = r.category ? `${r.category.scheme}:${r.category.code}` : `(sin categoría):${r.codeSystem}`;
      byCategory[cat] = { display: r.category?.display ?? null, domain: r.domain ?? null, count: (byCategory[cat]?.count ?? 0) + 1 };
      bySource[r.provenance.source] = (bySource[r.provenance.source] ?? 0) + 1;
      if (r.codeSystem === 'loinc' && !r.domain) unmappedLoincClasses[r.category?.code ?? '(sin clase)'] = (unmappedLoincClasses[r.category?.code ?? '(sin clase)'] ?? 0) + 1;
      if (r.designations.some((d) => d.lang === 'es')) withEs += 1;
      if (r.properties.loinc_panel_members?.length) {
        panels += 1;
        panelMembers += r.properties.loinc_panel_members.length;
      }
    }
  }
  return {
    builtAt: nowIso(),
    totals: Object.fromEntries(results.map((r) => [r.layer, r.records?.length ?? 0])),
    byDomain,
    byCategory: Object.fromEntries(Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))),
    bySource,
    loinc: {
      present: results.some((r) => r.layer === 'loinc' && r.records),
      withSpanishDesignation: withEs,
      panels,
      panelMembers,
      unmappedClasses: unmappedLoincClasses,
      excludedByClass: results.find((r) => r.layer === 'loinc')?.stats?.excludedByClass ?? null,
    },
    tariffs: Object.fromEntries(results.filter((r) => TARIFF_LAYERS[r.layer] && r.stats).map((r) => [r.layer, { items: r.stats.items, included: r.stats.included, excludedByPrefix: r.stats.excludedByPrefix, excludedExplicitly: r.stats.excludedExplicitly }])),
    missingLayers: results.filter((r) => r.missing).map((r) => ({ layer: r.layer, reason: r.missing })),
    gaps: GAPS,
  };
}

async function main() {
  const results = [await buildLoinc(), await buildTho(), await buildUcum()];
  for (const key of Object.keys(TARIFF_LAYERS)) results.push(await buildTariff(key));
  results.push(await buildGtr());
  results.push(await buildCdisc());
  results.push(await buildNpu());
  for (const r of results) if (r.missing) console.log(`[build] ${r.layer}: SIN DATOS — ${r.missing}`);
  const cov = coverage(results);
  writeJson(join(OUT, 'lab-tests-coverage.json'), cov, true);
  console.log(JSON.stringify({ totals: cov.totals, byDomain: cov.byDomain, bySource: cov.bySource, missingLayers: cov.missingLayers }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-lab-tests:', err);
  process.exitCode = 1;
});
