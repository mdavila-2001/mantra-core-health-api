#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · etapa 1: espejos → `out/` (formato común).
//
// Lee lo que `fetch-mirrors.mjs` dejó en `$DX_DEVICES_BUILD_DIR` (sin red) y
// escribe `out/<source>[-NNNN].ndjson.gz` + `out/manifest.json`. Re-ejecutable:
// la misma entrada produce los mismos archivos y los mismos sha256.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/build.mjs [--only anvisa-produtos,pmda-approvals]
// =============================================================================

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import { parseCsv } from '../../lib/medicine-catalog/common.mjs';
import {
  anvisaModelosRows,
  anvisaProdutosRows,
  anvisaUpdateStamp,
  splitSemicolonCsv,
} from './lib/anvisa.mjs';
import { cdscoRows } from './lib/cdsco.mjs';
import { indexMdall, mdallRows } from './lib/hc-mdall.mjs';
import { PartWriter } from './lib/out.mjs';
import { extractPmdaDataset, pmdaRows } from './lib/pmda.mjs';
import { BUILD_DIR, OUT_DIR, ensureDir, readJson } from './lib/row.mjs';
import { daenDate, daenRows } from './lib/tga-daen.mjs';
import {
  GAPS,
  MIRRORS,
  OFFICIAL,
  mirrorFileUrl,
  mirrorRef,
} from './sources.mjs';

const MIRRORS_DIR = join(BUILD_DIR, 'mirrors');
const EXTRACTED_DIR = join(BUILD_DIR, 'extracted');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');

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

async function buildAnvisaProdutos() {
  const repo = 'victoracioly/g.stec';
  const path = 'dispositivos_medicos_anvisa/data/dispositivos_raw.csv';
  const lines = splitSemicolonCsv(
    new TextDecoder('latin1').decode(readFileSync(mirrorPath(repo, path))),
  );
  const stamp = lines
    .map((l) => anvisaUpdateStamp(l.DT_ATUALIZACAO_DADO))
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `DT_ATUALIZACAO_DADO ${stamp} (espejo ${short(repo)})`;
  const rows = anvisaProdutosRows(lines, {
    sourceUrl: mirrorFileUrl(repo, path),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, path),
    officialPortal: OFFICIAL.anvisa,
  });
  return {
    files: await writeSource('anvisa-produtos', sourceVersion, rows),
    stats: { inputLines: lines.length, rows: rows.length },
  };
}

async function buildAnvisaModelos() {
  const repo = 'adnanioricce/DHsys';
  const dir = 'src/Tools/Helper/Csvs/Produtos';
  const names = readdirSync(mirrorPath(repo, dir))
    .filter((n) => /^\d+_produto_saude_modelo\.csv$/.test(n))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const lines = names.flatMap((n) =>
    splitSemicolonCsv(readFileSync(mirrorPath(repo, dir, n), 'utf8')),
  );
  const stamp = lines
    .map((l) => anvisaUpdateStamp(l.DT_ATUALIZACAO_DADO))
    .filter(Boolean)
    .sort()
    .pop();
  const sourceVersion = `DT_ATUALIZACAO_DADO ${stamp} (espejo ${short(repo)})`;
  const rows = anvisaModelosRows(lines, {
    sourceUrl: mirrorFileUrl(repo, dir),
    sourceVersion,
    retrievedAt: retrievedAt(repo),
    mirror: mirrorRef(repo, dir),
    officialPortal: OFFICIAL.anvisa,
  });
  return {
    files: await writeSource('anvisa-produtos-modelos', sourceVersion, rows),
    stats: {
      inputFiles: names.length,
      inputLines: lines.length,
      rows: rows.length,
    },
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
