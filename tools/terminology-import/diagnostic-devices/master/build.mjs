#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · master · etapa 1 (sin red): consolida.
//
//   1. Taxonomía: FDA Product Classification (copia fijada en `lib/sources.mjs`)
//      + nodos EMDN / GMDN / nacionales que traen los registros.
//   2. Filas: fuentes propias (`lib/own-sources.mjs`) + salidas de las
//      regiones us/eu/row leídas desde git (`lib/regions.mjs`). Cada fila se
//      valida contra el formato común; las inválidas se cuentan y se descartan.
//   3. Fabricantes resueltos (`lib/manufacturers.mjs`) y catálogo consolidado
//      (`lib/consolidate.mjs`).
//   4. Escribe `out/` (NDJSON gzip < 50 MB por archivo) y `out/coverage.json`.
//
// Uso:
//   node tools/terminology-import/diagnostic-devices/master/fetch-sources.mjs
//   git fetch origin
//   node --max-old-space-size=8000 tools/terminology-import/diagnostic-devices/master/build.mjs
//   … --us-dir <carpeta> | --eu-dir <carpeta> | --row-dir <carpeta>   (en vez de git)
//   … --skip-regions                                                 (solo fuentes propias)
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { rowKey, validateRow, writeNdjsonGzSharded } from './lib/exchange.mjs';
import {
  derivePanelParts,
  ivdPanelsFrom,
  parsePcd,
  pcdNode,
} from './lib/fda-pcd.mjs';
import { aimlRows } from './lib/own-sources.mjs';
import { MIRRORS, mirrorFilePath, mirrorVersion } from './lib/sources.mjs';
import { Taxonomy } from './lib/taxonomy.mjs';
import { resolveManufacturers } from './lib/manufacturers.mjs';
import { consolidate } from './lib/consolidate.mjs';
import {
  REGIONS,
  locateRegion,
  readRegionManifest,
  readRegionRows,
} from './lib/regions.mjs';
import { coverageReport } from './lib/coverage.mjs';
import {
  compareEmdnCopies,
  emdnNodes,
  parseEmdn,
  parseEmdnTsv,
} from './lib/emdn.mjs';
import { loadIndustryDirectories, matchIndustry } from './lib/industry.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../..');
const OUT = join(HERE, 'out');
const args = process.argv.slice(2);
const argValue = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : null;
const SKIP_REGIONS = args.includes('--skip-regions');

const retrievedAtOfCache = () => {
  try {
    return JSON.parse(
      readFileSync(
        join(
          dirname(mirrorFilePath('ej86-fda-ai', 'foiclass')),
          '..',
          'manifest.json',
        ),
        'utf8',
      ),
    ).generatedAt;
  } catch {
    throw new Error('Falta el caché: corré antes fetch-sources.mjs');
  }
};
const retrievedAt = retrievedAtOfCache().replace(/\.\d+Z$/, 'Z');

// --- 1. Taxonomía FDA --------------------------------------------------------
const taxonomy = new Taxonomy();
const pcdFile = MIRRORS['ej86-fda-ai'].files.foiclass;
const pcdRows = parsePcd(
  readFileSync(mirrorFilePath('ej86-fda-ai', 'foiclass'), 'utf8'),
);
const panelParts = derivePanelParts(pcdRows);
const ivdPanels = ivdPanelsFrom(panelParts);
const pcdProvenance = {
  source: pcdFile.source,
  sourceUrl: pcdFile.officialUrl,
  sourceVersion: mirrorVersion('ej86-fda-ai'),
  retrievedAt,
  mirror: {
    repo: MIRRORS['ej86-fda-ai'].repo,
    commit: MIRRORS['ej86-fda-ai'].commit,
    path: pcdFile.path,
    sha256: pcdFile.sha256,
  },
};
for (const r of pcdRows) taxonomy.addNode(pcdNode(r, pcdProvenance, ivdPanels));
console.log(
  `taxonomía FDA: ${pcdRows.length} product codes; paneles IVD medidos: ${[...ivdPanels].sort().join(', ')}`,
);

// --- 1b. EMDN completa (copia fijada + verificación con una segunda copia) ---
const emdnFile = MIRRORS['batirmedical-emdn'].files.emdn;
const emdnRowsA = parseEmdn(
  readFileSync(mirrorFilePath('batirmedical-emdn', 'emdn'), 'utf8'),
);
const emdnRowsB = parseEmdnTsv(
  readFileSync(mirrorFilePath('lisadonlon-emdn', 'emdn'), 'utf8'),
);
const emdnCheck = compareEmdnCopies(emdnRowsA, emdnRowsB);
// Términos distintos entre copias del mismo archivo: no se elige uno, se para.
if (emdnCheck.differ.length)
  throw new Error(
    `EMDN: las copias difieren en ${emdnCheck.differ.slice(0, 10).join(', ')}`,
  );
// Un código que falta en una copia (pérdida al extraer) se toma de la otra, citándola.
const onlyB = new Set(emdnCheck.onlyB);
const emdnRows = [...emdnRowsA, ...emdnRowsB.filter((r) => onlyB.has(r.code))];
const fromB = new Set(emdnCheck.onlyB);
const emdn = emdnNodes(emdnRows, {
  source: emdnFile.source,
  sourceUrl: emdnFile.officialUrl,
  sourceVersion: `EMDN V2 · ${mirrorVersion('batirmedical-emdn')}`,
  retrievedAt,
  mirror: {
    repo: MIRRORS['batirmedical-emdn'].repo,
    commit: MIRRORS['batirmedical-emdn'].commit,
    path: emdnFile.path,
    sha256: emdnFile.sha256,
  },
  verifiedAgainst: {
    repo: MIRRORS['lisadonlon-emdn'].repo,
    commit: MIRRORS['lisadonlon-emdn'].commit,
    path: MIRRORS['lisadonlon-emdn'].files.emdn.path,
  },
});
if (emdn.problems.length)
  throw new Error(
    `EMDN: estructura inconsistente: ${emdn.problems.slice(0, 5).join('; ')}`,
  );
for (const n of emdn.nodes) {
  if (fromB.has(n.code))
    n.provenance = {
      ...n.provenance,
      mirror: {
        repo: MIRRORS['lisadonlon-emdn'].repo,
        commit: MIRRORS['lisadonlon-emdn'].commit,
        path: MIRRORS['lisadonlon-emdn'].files.emdn.path,
      },
      note: 'falta en la copia principal',
    };
  taxonomy.addNode(n);
}
console.log(
  `taxonomía EMDN: ${emdn.nodes.length} términos (copia A ${emdnCheck.rowsA}, copia B ${emdnCheck.rowsB}; solo en A: ${emdnCheck.onlyA.join(', ') || '—'}; solo en B: ${emdnCheck.onlyB.join(', ') || '—'})`,
);

// --- 2. Filas ---------------------------------------------------------------
const rows = [];
const seen = new Set();
const sourceStats = new Map();
const stat = (source) => {
  if (!sourceStats.has(source))
    sourceStats.set(source, {
      source,
      region: null,
      read: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      invalidSamples: [],
    });
  return sourceStats.get(source);
};
const accept = (row, region) => {
  const s = stat(typeof row?.source === 'string' ? row.source : '(sin source)');
  s.region ??= region;
  s.read++;
  const errors = validateRow(row);
  if (errors.length) {
    s.invalid++;
    if (s.invalidSamples.length < 5)
      s.invalidSamples.push({
        sourceRecordId: row?.sourceRecordId ?? null,
        errors,
      });
    return;
  }
  const k = rowKey(row);
  if (seen.has(k)) {
    s.duplicates++;
    return;
  }
  seen.add(k);
  s.valid++;
  row._region = region;
  rows.push(row);
};

const own = aimlRows(
  readFileSync(mirrorFilePath('ej86-fda-ai', 'aiml'), 'utf8'),
  { retrievedAt },
);
for (const r of own.rows) accept(r, 'master');
console.log(
  `fuente propia fda-ai-enabled-devices: ${own.rows.length} filas (${own.errors.length} descartadas al leer)`,
);

const regionStatus = [];
for (const region of REGIONS) {
  if (SKIP_REGIONS) {
    regionStatus.push({ region, status: 'skipped' });
    continue;
  }
  const loc = locateRegion(region, {
    repoDir: REPO,
    dirOverride: argValue(`--${region}-dir`),
  });
  if (loc.kind === 'missing') {
    regionStatus.push({ region, status: 'pending', reason: loc.reason });
    console.log(`región ${region}: PENDIENTE (${loc.reason})`);
    continue;
  }
  const manifest = readRegionManifest(loc, { repoDir: REPO });
  const files = [];
  let n = 0;
  for (const row of readRegionRows(loc, manifest, {
    repoDir: REPO,
    onFile: (f) => files.push(f),
  })) {
    accept(row, region);
    n++;
  }
  regionStatus.push({
    region,
    status: 'consolidated',
    ref: loc.ref ?? null,
    commit: loc.commit ?? null,
    commitDate: loc.commitDate ?? null,
    dir: loc.dir ?? null,
    alternatives: loc.alternatives ?? [],
    manifestGeneratedAt: manifest.generatedAt ?? null,
    files,
    rowsRead: n,
    gaps: manifest.gaps ?? [],
  });
  console.log(
    `región ${region}: ${n} filas desde ${loc.ref ?? loc.dir} (${files.filter((f) => !f.ok).length} archivos con sha256 distinto, descartados)`,
  );
}

// --- 3. Taxonomía de los registros, fabricantes y catálogo --------------------
for (const row of rows) taxonomy.addFromRow(row);
const propagated = taxonomy.propagateByCrosswalk();
const resolution = resolveManufacturers(rows);
const catalog = consolidate(rows, taxonomy, resolution);
console.log(
  `filas válidas ${rows.length}; de diagnóstico ${catalog.included}; fabricantes ${catalog.manufacturers.length}; modelos ${catalog.models.length}; nodos heredados por mapeo ${propagated}`,
);

const industryData = loadIndustryDirectories(
  join(HERE, 'data', 'industry-directories.json'),
);
const industry = matchIndustry(industryData, resolution.entities);
console.log(
  `listados del sector: ${industry.stats.mentions} menciones, ${industry.stats.companies} empresas (${industry.stats.companiesMatchedToRegistry} cruzan con un registro, ${industry.stats.companiesOnlyInIndustryLists} solo en listados)`,
);

// --- 4. Salida ---------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const tax = taxonomy.toJSON();
const files = [
  ...writeNdjsonGzSharded(OUT, 'taxonomy-nodes', tax.nodes),
  ...writeNdjsonGzSharded(OUT, 'taxonomy-crosswalks', tax.crosswalks),
  ...writeNdjsonGzSharded(OUT, 'manufacturers', catalog.manufacturers),
  ...writeNdjsonGzSharded(OUT, 'models', catalog.models),
  ...writeNdjsonGzSharded(OUT, 'review-manufacturers', resolution.review),
  ...writeNdjsonGzSharded(OUT, 'industry-mentions', industry.mentions),
  ...writeNdjsonGzSharded(OUT, 'industry-candidates', industry.candidates),
];
const coverage = coverageReport({
  taxonomy: tax,
  catalog,
  resolution,
  industry: industry.stats,
  emdnCheck,
  sourceStats: [...sourceStats.values()],
  regionStatus,
  panelParts,
  ivdPanels: [...ivdPanels].sort(),
  mirrors: MIRRORS,
});
writeFileSync(
  join(OUT, 'coverage.json'),
  `${JSON.stringify(coverage.json, null, 2)}\n`,
);
writeFileSync(join(OUT, 'coverage.md'), coverage.markdown);
writeFileSync(
  join(OUT, 'manifest.json'),
  `${JSON.stringify({ region: 'master', formatVersion: 1, generatedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), regions: regionStatus.map(({ files: _f, ...r }) => r), files }, null, 2)}\n`,
);
console.log(
  `out/ → ${files.length} archivos de datos + coverage.{json,md} + manifest.json`,
);
