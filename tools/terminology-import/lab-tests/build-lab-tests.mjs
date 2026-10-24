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
import { DatabaseSync } from 'node:sqlite';
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
import { DOMAINS, assertRecord } from './lib/records.mjs';
import { GAPS, SOURCES } from './lib/sources.mjs';
import { TARIFF_EXCLUSIONS, TARIFF_RULES, fonasaItems, pamiItems, pcsItems, sigtapItems, tariffRecords, tussItems } from './lib/tariffs.mjs';
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
  if (!tablePath) return { layer: 'loinc', missing: `no hay Loinc.csv bajo ${dir} (exige cuenta en loinc.org; ver SOURCES.md)` };
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
  'icd10pcs-cms': {
    file: ['data', 'medical-codes.db'],
    canonicalUrl: 'http://www.cms.gov/Medicare/Coding/ICD10',
    sqlite: true,
    version: (meta) => meta.release_id,
    sourceUrl: (meta) => meta.source_url,
    items: (dir) => {
      const db = new DatabaseSync(join(dir, 'data', 'medical-codes.db'), { readOnly: true });
      try {
        const sections = new Map(db.prepare("SELECT value, meaning FROM pcs_axes WHERE position = 1").all().map((r) => [r.value, r.meaning]));
        return pcsItems(db.prepare("SELECT code, short_desc, long_desc FROM codes WHERE system = 'ICD10PCS' AND billable = 1 ORDER BY code").all(), sections);
      } finally {
        db.close();
      }
    },
  },
  'pami-nomenclador': {
    file: ['dist', 'assets', 'estudios.json'],
    version: () => '2022-08-03',
    sourceUrl: () => SOURCES['pami-nomenclador'].officialUrl,
    items: (dir, read) => pamiItems(read(join(dir, 'dist', 'assets', 'estudios.json'))),
  },
};

function sqliteBuildMeta(path, system) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    return db.prepare('SELECT * FROM build_meta WHERE system = ?').get(system);
  } finally {
    db.close();
  }
}

async function buildTariff(key) {
  const def = TARIFF_LAYERS[key];
  const src = SOURCES[key];
  const dir = join(SRC, src.dir, 'package');
  const path = join(dir, ...def.file);
  if (!existsSync(path)) return { layer: key, missing: `paquete ${src.npm.name} no descargado` };
  const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const pkgMeta = def.sqlite ? sqliteBuildMeta(path, 'ICD10PCS') : def.meta ? read(join(dir, ...def.meta)) : null;
  const version = def.version(pkgMeta);
  const np = npmProv(key, path);
  const { records, stats } = tariffRecords(key, def.items(dir, read), {
    sourceName: `${src.name} — ${version} (vía ${src.npm.name}@${src.npm.version})`,
    sourceVersion: `${version}; ${src.npm.name}@${src.npm.version}`,
    sourceUrl: def.sourceUrl(pkgMeta),
    sourceFile: np.file,
    sourceSha256: np.sha256,
    retrievedAt: np.retrievedAt,
    license: src.license,
  });
  await writeLayer(key, records, {
    source: src.npm,
    packageMetadata: pkgMeta,
    codeSystems: [{ internalCode: key, name: src.name, canonicalUrl: def.canonicalUrl ?? `https://mantracore.health/fhir/CodeSystem/${key}`, version, sourceKey: key, records: records.length }],
    files: { [def.file.at(-1)]: { file: np.file, sha256: np.sha256 } },
    rules: TARIFF_RULES[key],
    exclusions: TARIFF_EXCLUSIONS[key] ?? [],
    stats,
  });
  return { layer: key, records, stats };
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
  for (const r of results) if (r.missing) console.log(`[build] ${r.layer}: SIN DATOS — ${r.missing}`);
  const cov = coverage(results);
  writeJson(join(OUT, 'lab-tests-coverage.json'), cov, true);
  console.log(JSON.stringify({ totals: cov.totals, byDomain: cov.byDomain, bySource: cov.bySource, missingLayers: cov.missingLayers }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-lab-tests:', err);
  process.exitCode = 1;
});
