#!/usr/bin/env node
// =============================================================================
// ROW · build desde los archivos OFICIALES (`fetch-official.mjs`) → `out/`.
// Reemplaza la salida de las fuentes que antes venían de espejos
// (`anvisa-produtos`, `hc-mdall`) y agrega las que hoy se pueden leer del
// origen (`tfda-licences`, `invima-registros`). Lo demás de `out/` se conserva
// tal cual (manifest.files / stats de las otras fuentes).
//
//   node --max-old-space-size=2500 build-official.mjs [--only=anvisa-produtos,hc-mdall,tfda-licences,invima-registros]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import { parseCsv } from '../../lib/medicine-catalog/common.mjs';
import {
  anvisaProdutosRows,
  anvisaUpdateStamp,
  splitSemicolonCsv,
} from './lib/anvisa.mjs';
import { indexMdall, mdallRows } from './lib/hc-mdall.mjs';
import { invimaRows } from './lib/invima.mjs';
import { PartWriter } from './lib/out.mjs';
import { BUILD_DIR, OUT_DIR, ensureDir, readJson } from './lib/row.mjs';
import { assertTfdaHeader, tfdaRows } from './lib/tfda.mjs';
import { GAPS, OFFICIAL } from './sources.mjs';

const OFFICIAL_DIR = join(BUILD_DIR, 'official');
const registry = readJson(join(OFFICIAL_DIR, 'official.json'));
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',') ?? null;
const wants = (s) => only === null || only.includes(s);

const rec = (key) => {
  const r = registry[key];
  if (!r?.file) throw new Error(`falta ${key} en official.json: correr fetch-official.mjs`);
  return r;
};
const provenance = (r) => ({
  url: r.url,
  lastModified: r.lastModified,
  sha256: r.sha256,
  bytes: r.bytes,
});
const path = (r) => join(OFFICIAL_DIR, r.file);
const day = (iso) => iso.slice(0, 10);

async function writeSource(source, sourceVersion, rows) {
  const writer = new PartWriter(OUT_DIR, source, sourceVersion);
  for (const row of rows) writer.add(row);
  return writer.finish();
}

const OFFICIAL_FILES = {
  'anvisa-produtos': 'anvisa/TA_PRODUTO_SAUDE_SITE.csv',
  'hc-mdall': 'hc-mdall/active_license.json',
  'tfda-licences': 'tfda/68_csv.zip',
};

async function buildAnvisa() {
  const r = rec(OFFICIAL_FILES['anvisa-produtos']);
  const lines = splitSemicolonCsv(new TextDecoder('latin1').decode(readFileSync(path(r))));
  const stamp = lines.map((l) => anvisaUpdateStamp(l.DT_ATUALIZACAO_DADO)).filter(Boolean).sort().pop();
  const sourceVersion = `TA_PRODUTO_SAUDE_SITE.csv Last-Modified ${r.lastModified}; DT_ATUALIZACAO_DADO ${stamp}`;
  const rows = anvisaProdutosRows(lines, {
    sourceUrl: r.url,
    sourceVersion,
    retrievedAt: r.retrievedAt,
    official: provenance(r),
    officialPortal: OFFICIAL.anvisa,
  });
  return {
    files: await writeSource('anvisa-produtos', sourceVersion, rows),
    stats: { inputLines: lines.length, rows: rows.length },
  };
}

async function buildMdall() {
  const get = (name) => rec(`hc-mdall/${name}`);
  const load = (name) => JSON.parse(readFileSync(path(get(name)), 'utf8'));
  const activeLicences = load('active_license.json');
  const archiveLicences = load('archive_license.json');
  const index = indexMdall({
    activeLicences,
    archiveLicences,
    companies: load('company.json'),
    devices: [...load('active_device.json'), ...load('archive_device.json')],
  });
  const refresh = [...activeLicences, ...archiveLicences].map((l) => l.last_refresh_dt).filter(Boolean).sort().pop();
  const retrievedAt = get('active_device_identifier.json').retrievedAt;
  const sourceVersion = `MDALL API last_refresh_dt ${refresh}`;
  const files = [
    'active_license.json', 'archive_license.json', 'company.json', 'active_device.json',
    'archive_device.json', 'active_device_identifier.json', 'archive_device_identifier.json',
  ].map((n) => ({ name: n, ...provenance(get(n)) }));
  const ctx = {
    sourceUrl: 'https://health-products.canada.ca/api/medical-devices/',
    sourceVersion,
    retrievedAt,
    official: { api: 'https://health-products.canada.ca/api/medical-devices/', files: files.map((f) => `${f.name}:${f.sha256}`) },
    officialPortal: OFFICIAL.hcMdall,
  };
  function* identifiers() {
    yield* load('active_device_identifier.json');
    yield* load('archive_device_identifier.json');
  }
  const stats = {};
  const written = await writeSource('hc-mdall', sourceVersion, mdallRows(index, identifiers(), ctx, stats));
  return {
    files: written,
    stats: {
      licences: index.licences.size,
      companies: index.companyById.size,
      devices: index.deviceNames.size,
      ...stats,
      rows: written.reduce((n, f) => n + f.rows, 0),
    },
  };
}

async function buildTfda() {
  const r = rec(OFFICIAL_FILES['tfda-licences']);
  const csv = execFileSync('unzip', ['-p', path(r), '68_2.csv'], { maxBuffer: 400 * 1024 * 1024 }).toString('utf8');
  const records = parseCsv(csv);
  const header = Object.keys(records[0] ?? {});
  assertTfdaHeader(header);
  const changed = records.map((x) => x['異動日期']).filter(Boolean).sort().pop();
  const sourceVersion = `68_2.csv Last-Modified ${r.lastModified ?? day(r.retrievedAt)}; 異動日期 máx. ${changed}`;
  const stats = {};
  const rows = tfdaRows(
    records,
    {
      sourceUrl: r.url,
      sourceVersion,
      retrievedAt: r.retrievedAt,
      official: provenance(r),
      officialPortal: 'https://data.gov.tw/dataset/9576',
    },
    stats,
  );
  return {
    files: await writeSource('tfda-licences', sourceVersion, rows),
    stats: { inputRows: records.length, rows: rows.length, ...stats },
  };
}

async function buildInvima() {
  const pages = Object.keys(registry)
    .filter((k) => /^invima\/page-\d+\.json$/.test(k) && registry[k].file)
    .sort();
  if (!pages.length) throw new Error('falta invima en official.json');
  const input = pages.flatMap((k) => JSON.parse(readFileSync(path(registry[k]), 'utf8')));
  const meta = readJson(path(rec('invima/meta.json')));
  const updated = new Date(meta.rowsUpdatedAt * 1000).toISOString();
  const sourceVersion = `y4qt-w6tk rowsUpdatedAt ${updated}`;
  const stats = {};
  const rows = invimaRows(
    input,
    {
      sourceUrl: 'https://www.datos.gov.co/d/y4qt-w6tk',
      sourceVersion,
      retrievedAt: registry[pages[0]].retrievedAt,
      official: {
        api: 'https://www.datos.gov.co/resource/y4qt-w6tk.json',
        pages: pages.map((k) => `${k}:${registry[k].sha256}`),
      },
      officialPortal: 'https://www.datos.gov.co/d/y4qt-w6tk',
    },
    stats,
  );
  return {
    files: await writeSource('invima-registros', sourceVersion, rows),
    stats: { inputRows: input.length, rows: rows.length, ...stats },
  };
}

const BUILDERS = {
  'anvisa-produtos': buildAnvisa,
  'hc-mdall': buildMdall,
  'tfda-licences': buildTfda,
  'invima-registros': buildInvima,
};

async function main() {
  ensureDir(OUT_DIR);
  const previous = existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : { files: [], stats: {} };
  const rebuilt = new Set(Object.keys(BUILDERS).filter(wants));
  const files = previous.files.filter((f) => !rebuilt.has(f.source));
  const stats = { ...previous.stats };
  for (const source of rebuilt) {
    const t0 = Date.now();
    const result = await BUILDERS[source]();
    files.push(...result.files);
    stats[source] = result.stats;
    console.log(`${source}: ${JSON.stringify(result.stats)} → ${result.files.map((f) => `${f.path} (${f.bytes} B)`).join(', ')} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
  files.sort((a, b) => (a.path < b.path ? -1 : 1));
  const loaded = new Set(files.map((f) => f.source));
  const manifest = {
    region: 'row',
    generatedAt: new Date().toISOString(),
    formatVersion: 1,
    files,
    stats,
    gaps: GAPS.filter((g) => !loaded.has(g.source)),
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest → ${MANIFEST_PATH} (${files.reduce((n, f) => n + f.rows, 0)} filas en ${files.length} archivos)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
