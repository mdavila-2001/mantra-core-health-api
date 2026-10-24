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

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readNdjsonGz,
  rowKey,
  validateActorRow,
  validateRow,
  writeNdjsonGzSharded,
} from './lib/exchange.mjs';
import {
  derivePanelParts,
  ivdPanelsFrom,
  parsePcd,
  pcdNode,
} from './lib/fda-pcd.mjs';
import { aimlRows } from './lib/own-sources.mjs';
import {
  CACHE_DIR,
  MIRRORS,
  mirrorFilePath,
  mirrorVersion,
} from './lib/sources.mjs';
import { Taxonomy } from './lib/taxonomy.mjs';
import { mentionIdOf, resolveManufacturers } from './lib/manufacturers.mjs';
import { consolidate, labelKey } from './lib/consolidate.mjs';
import {
  REGIONS,
  locateRegion,
  materializeRegionFile,
  readRegionManifest,
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

// --- 1a. Suplemento del PCD: solo los product codes que la copia literal no
// tiene, del foiclass más nuevo de bjoleary/fdadata (ver
// extract-pcd-supplement.py y data/fda-pcd-supplement.json).
const pcdSupplementPath = join(HERE, 'data', 'fda-pcd-supplement.json');
let pcdSupplementAdded = 0;
if (existsSync(pcdSupplementPath)) {
  const sup = JSON.parse(readFileSync(pcdSupplementPath, 'utf8'));
  for (const r of sup.rows) {
    if (taxonomy.nodes.has(`fda-product-code|${r.PRODUCTCODE}`)) continue;
    const node = pcdNode(
      r,
      {
        source: sup.source,
        sourceUrl: sup.officialUrl,
        sourceVersion: `git:bjoleary/fdadata@${sup.via.commit.slice(0, 12)} (${sup.via.commitDate.slice(0, 10)})`,
        retrievedAt,
        mirror: sup.via,
        transformation: sup.transformation,
      },
      ivdPanels,
    );
    node.attributes.reviewPanelName = r.reviewPanelName;
    node.attributes.submissionType = r.submissionType;
    taxonomy.addNode(node);
    pcdSupplementAdded++;
  }
  console.log(
    `suplemento del PCD (bjoleary/fdadata): ${pcdSupplementAdded} product codes que la copia literal no tiene`,
  );
}

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

// --- 2. Fuentes de filas ------------------------------------------------------
// Las filas se recorren en streaming (varias pasadas) sin tenerlas todas en
// memoria: una región puede traer millones.
const own = aimlRows(
  readFileSync(mirrorFilePath('ej86-fda-ai', 'aiml'), 'utf8'),
  { retrievedAt },
);
console.log(
  `fuente propia fda-ai-enabled-devices: ${own.rows.length} filas (${own.errors.length} descartadas al leer)`,
);

const REGION_CACHE = join(CACHE_DIR, '..', 'regions');
const regionStatus = [];
const regionInputs = [];
// Filas de identidad de fabricantes (`manifest.actors`): solo para resolver.
const actorRows = [];
const actorStats = [];
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
  const paths = [];
  for (const f of manifest.files ?? []) {
    const m = materializeRegionFile(loc, f, REGION_CACHE, { repoDir: REPO });
    files.push({
      path: f.path,
      declaredRows: f.rows ?? null,
      sha256: m.sha256,
      ok: m.ok,
    });
    if (m.ok) paths.push(m.path);
  }
  regionInputs.push({ region, paths });
  const actorFiles = [];
  let actorsValid = 0;
  let actorsInvalid = 0;
  for (const f of manifest.actors ?? []) {
    const m = materializeRegionFile(loc, f, REGION_CACHE, { repoDir: REPO });
    actorFiles.push({
      path: f.path,
      declaredRows: f.rows ?? null,
      sha256: m.sha256,
      ok: m.ok,
    });
    if (!m.ok) continue;
    for await (const a of readNdjsonGz(m.path)) {
      if (validateActorRow(a).length) actorsInvalid++;
      else {
        actorsValid++;
        actorRows.push(a);
      }
    }
  }
  if (manifest.actors?.length)
    actorStats.push({
      region,
      files: actorFiles,
      valid: actorsValid,
      invalid: actorsInvalid,
    });
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
    rowsRead: 0,
    gaps: manifest.gaps ?? [],
  });
}

/** Todas las filas válidas y únicas, en el mismo orden en cada pasada. */
async function* validRows(onRead) {
  const seen = new Set();
  const take = function* (row, region) {
    const errors = validateRow(row);
    onRead?.(row, region, errors, false);
    if (errors.length) return;
    const k = rowKey(row);
    if (seen.has(k)) {
      onRead?.(row, region, [], true);
      return;
    }
    seen.add(k);
    row._region = region;
    yield row;
  };
  for (const r of own.rows) yield* take(r, 'master');
  for (const { region, paths } of regionInputs)
    for (const p of paths)
      for await (const r of readNdjsonGz(p)) yield* take(r, region);
}

// --- 3a. Pasada A: validación, taxonomía de los registros y menciones ---------
const sourceStats = new Map();
const stat = (source, region) => {
  if (!sourceStats.has(source))
    sourceStats.set(source, {
      source,
      region,
      read: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      diagnostic: 0,
      attachedBySameModel: 0,
      invalidSamples: [],
    });
  return sourceStats.get(source);
};
const lightById = new Map(); // mención + fuente → fila liviana con peso
let validCount = 0;
for await (const row of validRows((row, region, errors, dup) => {
  const s = stat(
    typeof row?.source === 'string' ? row.source : '(sin source)',
    region,
  );
  if (dup) {
    s.duplicates++;
    s.valid--;
    return;
  }
  s.read++;
  if (errors.length) {
    s.invalid++;
    if (s.invalidSamples.length < 5)
      s.invalidSamples.push({
        sourceRecordId: row?.sourceRecordId ?? null,
        errors,
      });
  } else s.valid++;
})) {
  validCount++;
  taxonomy.addFromRow(row);
  const k = `${mentionIdOf(row)}\u0000${row.source}`;
  const l = lightById.get(k);
  if (l) l._weight++;
  else
    lightById.set(k, {
      source: row.source,
      sourceRecordId: row.sourceRecordId,
      sourceUrl: row.sourceUrl,
      sourceVersion: row.sourceVersion,
      retrievedAt: row.retrievedAt,
      manufacturerName: row.manufacturerName,
      manufacturerCountry: row.manufacturerCountry,
      manufacturerRegistryId: row.manufacturerRegistryId,
      extra: row.extra?.manufacturerIds
        ? { manufacturerIds: row.extra.manufacturerIds }
        : undefined,
      _weight: 1,
    });
}
for (const r of regionStatus)
  if (r.status === 'consolidated')
    r.rowsRead = [...sourceStats.values()]
      .filter((s) => s.region === r.region)
      .reduce((n, s) => n + s.read, 0);
for (const r of regionStatus)
  if (r.status === 'consolidated')
    console.log(
      `región ${r.region}: ${r.rowsRead} filas desde ${r.ref ?? r.dir} (${r.files.filter((f) => !f.ok).length} archivos con sha256 distinto, descartados)`,
    );
const propagated = taxonomy.propagateByCrosswalk();
const resolution = resolveManufacturers([...lightById.values(), ...actorRows], {
  trackRows: false,
});
lightById.clear();
if (actorRows.length)
  console.log(
    `identidades de fabricantes publicadas (actores): ${actorRows.length}`,
  );

// --- 3b. Pasada B: filas de diagnóstico y claves de sus modelos ----------------
const keep = [];
const dxKeys = new Set();
const modelKeys = (row) => {
  const ent = resolution.entityOf(row);
  const out = [];
  if (labelKey(row.brandName) !== '')
    out.push(
      `${ent}\u0000${labelKey(row.brandName)}\u0000${labelKey(row.model)}`,
    );
  if (row.udiDi?.trim()) out.push(`${ent}\u0000udi\u0000${row.udiDi.trim()}`);
  return out;
};
const slim = (row) => {
  const { extra, ...rest } = row;
  // `extra.deviceTypes` hace falta para decidir y `extra.manufacturerIds` para
  // resolver el fabricante; el resto de `extra` no.
  if (!extra?.deviceTypes && !extra?.manufacturerIds) return rest;
  const e = {};
  if (extra.deviceTypes) e.deviceTypes = extra.deviceTypes;
  if (extra.manufacturerIds) e.manufacturerIds = extra.manufacturerIds;
  return { ...rest, extra: e };
};
let notDiagnosticRows = 0;
for await (const row of validRows()) {
  const decision = taxonomy.decideRow(row);
  const d = decision.diagnostic;
  if (d === true) {
    keep.push({ ...slim(row), _decision: decision });
    for (const k of modelKeys(row)) dxKeys.add(k);
  } else if (d === false) notDiagnosticRows++;
}
// --- 3c. Pasada C: filas sin decisión que son del mismo modelo ----------------
let undeterminedSeen = 0;
const undeterminedByType = new Map();
let undeterminedNoType = 0;
for await (const row of validRows()) {
  const d = taxonomy.decideRow(row);
  if (d.diagnostic !== null) continue;
  undeterminedSeen++;
  if (modelKeys(row).some((k) => dxKeys.has(k)))
    keep.push({ ...slim(row), _decision: d });
  else {
    if (!d.types.length) undeterminedNoType++;
    // Sin nodo en la taxonomía: se cuenta por nomenclatura declarada.
    const ts = d.types.length
      ? d.types
      : [
          row.deviceTypeSystem
            ? `${row.deviceTypeSystem}|(sin criterio)`
            : '(sin tipo)',
        ];
    for (const t of ts)
      undeterminedByType.set(t, (undeterminedByType.get(t) ?? 0) + 1);
  }
}
dxKeys.clear();
const catalog = consolidate(keep, taxonomy, resolution);
// Los conteos de excluidas salen de las pasadas (consolidate solo vio lo que se guardó).
catalog.excluded.notDiagnostic =
  notDiagnosticRows + catalog.excluded.notDiagnostic;
catalog.excluded.undetermined =
  undeterminedSeen - catalog.excluded.attachedBySameModel;
catalog.excluded.noType = undeterminedNoType;
catalog.excluded.undeterminedByType = undeterminedByType;
for (const m of catalog.models)
  for (const r of m.registrations) {
    const s = sourceStats.get(r.source);
    if (r.typeEvidence === 'own-type') s.diagnostic++;
    else s.attachedBySameModel++;
  }
console.log(
  `filas válidas ${validCount}; de diagnóstico ${catalog.included} (${catalog.excluded.attachedBySameModel} por ser del mismo modelo); fabricantes ${catalog.manufacturers.length}; modelos ${catalog.models.length}; nodos heredados por mapeo ${propagated}`,
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
  actorStats,
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
