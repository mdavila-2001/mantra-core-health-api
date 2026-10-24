#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 1: descargas → `out/` (formato común).
//
// Lee lo que `fetch-official.mjs` (portales oficiales) y `fetch-mirrors.mjs`
// (espejos fijados) dejaron en `$DX_DEVICES_BUILD_DIR` (sin red) y
// escribe `out/<source>[-NNNN].ndjson.gz` + `out/manifest.json`. Re-ejecutable:
// la misma entrada produce los mismos archivos y los mismos sha256.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/build.mjs [--only anvisa-produtos,pmda-approvals]
// =============================================================================

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCsv } from '../../lib/medicine-catalog/common.mjs';
import {
  addPetitionLine,
  anvisaModelosRows,
  anvisaProdutosRows,
  anvisaUpdateStamp,
  freezePetitionIndex,
} from './lib/anvisa.mjs';
import { cdscoRows } from './lib/cdsco.mjs';
import { indexMdall, mdallRows } from './lib/hc-mdall.mjs';
import { readDelimitedRows } from './lib/lines.mjs';
import { PartWriter } from './lib/out.mjs';
import { extractPmdaDataset, pmdaRows } from './lib/pmda.mjs';
import { BUILD_DIR, OUT_DIR, ensureDir, readJson } from './lib/row.mjs';
import { daenDate, daenRows } from './lib/tga-daen.mjs';
import {
  GAPS,
  MIRRORS,
  OFFICIAL,
  OFFICIAL_DOWNLOADS,
  mirrorFileUrl,
  mirrorRef,
} from './sources.mjs';

const MIRRORS_DIR = join(BUILD_DIR, 'mirrors');
const EXTRACTED_DIR = join(BUILD_DIR, 'extracted');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');
const OFFICIAL_DIR = join(BUILD_DIR, 'official');
const officialRetrieved = existsSync(join(OFFICIAL_DIR, 'retrieved.json'))
  ? readJson(join(OFFICIAL_DIR, 'retrieved.json'))
  : {};

const args = process.argv.slice(2);
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(',')) : null;
const wants = (source) => only === null || only.has(source);

const retrieved = readJson(join(BUILD_DIR, 'retrieved.json'));
const mirrorPath = (repo, ...parts) =>
  join(MIRRORS_DIR, repo.replace('/', '__'), ...parts);
const retrievedAt = (repo) => {
  const r = retrieved[repo];
  if (r?.commit !== MIRRORS[repo].commit)
    throw new Error(`${repo}: falta correr fetch-mirrors.mjs`);
  return r.retrievedAt;
};
const short = (repo) => `${repo}@${MIRRORS[repo].commit.slice(0, 8)}`;

async function writeSource(source, sourceVersion, rows) {
  const writer = new PartWriter(OUT_DIR, source, sourceVersion);
  for (const row of rows) writer.add(row);
  return writer.finish();
}

/** Archivo oficial ya descargado por `fetch-official.mjs`: ruta local y cita. */
function officialFile(group, name) {
  const spec = OFFICIAL_DOWNLOADS[group].find((f) => f.name === name);
  const meta = officialRetrieved[spec.url];
  if (meta === undefined)
    throw new Error(`${name}: falta correr fetch-official.mjs --only ${group}`);
  return {
    path: join(OFFICIAL_DIR, meta.path),
    url: spec.url,
    retrievedAt: meta.retrievedAt,
    citation: {
      url: spec.url,
      lastModified: meta.lastModified,
      bytes: meta.bytes,
      sha256: meta.sha256,
    },
  };
}

const ANVISA_ENCODING = 'windows-1252';
const ANVISA_PETITION_FILES = [
  'CICLO_ANALISE_PETICOES_PROD_SAUDE_IN_VITRO.CSV',
  'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE(CORRELATOS).CSV',
  'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE.CSV',
];

let anvisaPetitionCache = null;
/** Índice proceso → áreas de interés y asuntos, de los tres archivos de peticiones. */
async function anvisaPetitions() {
  if (anvisaPetitionCache !== null) return anvisaPetitionCache;
  const index = new Map();
  const stats = {};
  for (const name of ANVISA_PETITION_FILES) {
    const file = officialFile('anvisa', name);
    const fileStats = {};
    for await (const line of readDelimitedRows(file.path, {
      encoding: ANVISA_ENCODING,
      strict: false,
      stats: fileStats,
    }))
      addPetitionLine(index, line);
    stats[name] = {
      badLines: fileStats.badLines,
      sha256: file.citation.sha256,
    };
  }
  anvisaPetitionCache = { index: freezePetitionIndex(index), stats };
  return anvisaPetitionCache;
}

async function readAnvisaLines(file) {
  const lines = [];
  for await (const line of readDelimitedRows(file.path, {
    encoding: ANVISA_ENCODING,
  }))
    lines.push(line);
  return lines;
}

const lastStamp = (lines) =>
  lines.reduce((max, l) => {
    const stamp = anvisaUpdateStamp(l.DT_ATUALIZACAO_DADO);
    return stamp !== null && (max === null || stamp > max) ? stamp : max;
  }, null);

async function buildAnvisaProdutos() {
  const file = officialFile('anvisa', 'TA_PRODUTO_SAUDE_SITE.csv');
  const lines = await readAnvisaLines(file);
  const petitions = await anvisaPetitions();
  const sourceVersion = `TA_PRODUTO_SAUDE_SITE.csv Last-Modified ${file.citation.lastModified} (DT_ATUALIZACAO_DADO ${lastStamp(lines)})`;
  const rows = anvisaProdutosRows(lines, {
    sourceUrl: file.url,
    sourceVersion,
    retrievedAt: file.retrievedAt,
    officialFile: file.citation,
    officialPortal: OFFICIAL.anvisa,
    petitionsByProcess: petitions.index,
  });
  return {
    files: await writeSource('anvisa-produtos', sourceVersion, rows),
    stats: {
      inputLines: lines.length,
      rows: rows.length,
      rowsWithPetitions: rows.filter((r) => r.extra.anvisaPetitions).length,
      petitionFiles: petitions.stats,
    },
  };
}

async function buildAnvisaModelos() {
  const site = officialFile('anvisa', 'TA_PRODUTO_SAUDE_SITE.csv');
  const processByRegistro = new Map();
  for await (const line of readDelimitedRows(site.path, {
    encoding: ANVISA_ENCODING,
  }))
    if (line.NUMERO_PROCESSO.trim() !== '')
      processByRegistro.set(
        line.NUMERO_REGISTRO_CADASTRO.trim(),
        line.NUMERO_PROCESSO.trim(),
      );
  const file = officialFile('anvisa', 'TA_PRODUTO_SAUDE_MODELO.csv');
  const lines = await readAnvisaLines(file);
  const petitions = await anvisaPetitions();
  const sourceVersion = `TA_PRODUTO_SAUDE_MODELO.csv Last-Modified ${file.citation.lastModified} (DT_ATUALIZACAO_DADO ${lastStamp(lines)})`;
  const stats = { inputLines: lines.length, rowsWithPetitions: 0 };
  function* counted() {
    for (const row of anvisaModelosRows(lines, {
      sourceUrl: file.url,
      sourceVersion,
      retrievedAt: file.retrievedAt,
      officialFile: file.citation,
      officialPortal: OFFICIAL.anvisa,
      petitionsByProcess: petitions.index,
      processByRegistro,
    })) {
      if (row.extra.anvisaPetitions) stats.rowsWithPetitions += 1;
      yield row;
    }
  }
  const files = await writeSource(
    'anvisa-produtos-modelos',
    sourceVersion,
    counted(),
  );
  return {
    files,
    stats: { ...stats, rows: files.reduce((n, f) => n + f.rows, 0) },
  };
}

async function buildPmda() {
  const repo = 'zoefcuk/pmda-medical-devices';
  const dataset = extractPmdaDataset(
    readFileSync(mirrorPath(repo, 'index.html'), 'utf8'),
  );
  const lastDate = dataset.rows
    .map((r) => r[dataset.columns.indexOf('approval_date')])
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `承認品目一覧・認証品目リスト hasta ${lastDate} (espejo ${short(repo)})`;
  const { rows, duplicates, withoutManufacturer } = pmdaRows(dataset, {
    sourceUrl: OFFICIAL.pmdaApprovals,
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'index.html'),
  });
  return {
    files: await writeSource('pmda-approvals', sourceVersion, rows),
    stats: {
      inputRows: dataset.rows.length,
      rows: rows.length,
      duplicates,
      withoutManufacturer,
    },
  };
}

async function buildMdall() {
  const repo = 'misterrPink1/symmetric';
  const dir = join(EXTRACTED_DIR, 'hc-mdall');
  const load = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
  const activeLicences = load('active_license.json');
  const archiveLicences = load('archive_license.json');
  const index = indexMdall({
    activeLicences,
    archiveLicences,
    companies: load('company.json'),
  });
  const refresh = [...activeLicences, ...archiveLicences]
    .map((l) => l.last_refresh_dt)
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `MDALL last_refresh_dt ${refresh} (espejo ${short(repo)})`;
  const ctx = {
    sourceUrl: mirrorFileUrl(repo, 'datasets.zip'),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'datasets.zip'),
    officialPortal: OFFICIAL.hcMdall,
  };
  function* identifiers() {
    yield* load('active_device_identifier.json');
    yield* load('archive_device_identifier.json');
  }
  const stats = {};
  const files = await writeSource(
    'hc-mdall',
    sourceVersion,
    mdallRows(index, identifiers(), ctx, stats),
  );
  return {
    files,
    stats: {
      licences: index.licences.size,
      companies: index.companyById.size,
      ...stats,
      rows: files.reduce((n, f) => n + f.rows, 0),
    },
  };
}

async function buildDaen() {
  const repo = 'tobinsouth/MedicalDeviceNLP';
  const summariesDir = 'data/medical_device_summaries';
  const full = readFileSync(
    join(EXTRACTED_DIR, 'tga-daen', 'reports.jsonl'),
    'utf8',
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const summaries = readdirSync(mirrorPath(repo, summariesDir))
    .filter((n) => n.endsWith('.csv'))
    .sort()
    .flatMap((n) =>
      parseCsv(readFileSync(mirrorPath(repo, summariesDir, n), 'utf8')),
    );
  const lastReport = [...full, ...summaries]
    .map((r) => daenDate(r['Report date']))
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `DAEN reportes hasta ${lastReport} (espejo ${short(repo)})`;
  const { rows, withoutManufacturer } = daenRows(full, summaries, {
    sourceUrl: mirrorFileUrl(repo, 'data'),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, 'data/list_of_reports'),
    officialPortal: OFFICIAL.tgaDaen,
  });
  return {
    files: await writeSource('tga-daen', sourceVersion, rows),
    stats: {
      fullReports: full.length,
      summaryRows: summaries.length,
      rows: rows.length,
      withoutManufacturer,
    },
  };
}

async function buildCdsco() {
  const repo = 'vishnuu-patil/india-meddevice-intelligence';
  const path = 'Data/MD - Medical Devices.xlsx';
  const sheetRows = readFileSync(
    join(EXTRACTED_DIR, 'cdsco', 'md-medical-devices.jsonl'),
    'utf8',
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const ctx = {
    sourceUrl: mirrorFileUrl(repo, path),
    sourceVersion: '',
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, path),
    officialPortal: OFFICIAL.cdsco,
  };
  const probe = cdscoRows(sheetRows, { ...ctx, sourceVersion: 'probe' });
  const lastIssued = probe.rows
    .map((r) => r.authorizationDate)
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `MD - Medical Devices, licencias emitidas hasta ${lastIssued} (espejo ${short(repo)})`;
  const { rows, skipped } = cdscoRows(sheetRows, { ...ctx, sourceVersion });
  return {
    files: await writeSource('cdsco-import-licences', sourceVersion, rows),
    stats: { sheetRows: sheetRows.length, rows: rows.length, ...skipped },
  };
}

const BUILDERS = {
  'anvisa-produtos': buildAnvisaProdutos,
  'anvisa-produtos-modelos': buildAnvisaModelos,
  'pmda-approvals': buildPmda,
  'hc-mdall': buildMdall,
  'tga-daen': buildDaen,
  'cdsco-import-licences': buildCdsco,
};

async function main() {
  ensureDir(OUT_DIR);
  const previous = existsSync(MANIFEST_PATH)
    ? readJson(MANIFEST_PATH)
    : { files: [], stats: {} };
  const files = [];
  const stats = {};
  for (const [source, build] of Object.entries(BUILDERS)) {
    if (!wants(source)) {
      files.push(...previous.files.filter((f) => f.source === source));
      if (previous.stats?.[source]) stats[source] = previous.stats[source];
      continue;
    }
    const started = Date.now();
    const result = await build();
    files.push(...result.files);
    stats[source] = result.stats;
    console.log(
      `${source}: ${JSON.stringify(result.stats)} → ${result.files.map((f) => f.path).join(', ')} (${((Date.now() - started) / 1000).toFixed(1)} s)`,
    );
  }
  const manifest = {
    region: 'row',
    generatedAt: new Date().toISOString(),
    formatVersion: 1,
    files,
    stats,
    gaps: GAPS,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `manifest → ${MANIFEST_PATH} (${files.reduce((n, f) => n + f.rows, 0)} filas en ${files.length} archivos)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
