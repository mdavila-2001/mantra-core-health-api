#!/usr/bin/env node
// =============================================================================
// Catálogo universal de medicamentos · etapa 1 (descargas → NDJSON común).
//
// Lee lo que YA está descargado (no hace red) y escribe, por fuente, un NDJSON
// con el registro común de `lib/medicine-catalog/common.mjs`:
//
//   cima    glossary-data-build/cache/cima/detail/*.json     (25 470 productos)
//   anvisa  glossary-data-build/medicines-sources/anvisa/*.csv
//   invima  glossary-data-build/medicines-sources/invima-cum/*.csv
//
// Salida: glossary-data-build/ndjson/medicines-<fuente>.ndjson
//         glossary-data-build/ndjson/medicines-catalog.meta.json
//
// Nada se redacta ni se infiere: lo que la fuente no trae queda en null. Las
// fuentes no se fusionan; el único ancla común es el ATC nivel 5 exacto.
//
// Uso: node tools/terminology-import/build-medicine-catalog.mjs [--only cima,anvisa,invima]
// =============================================================================

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import { BUILD_DIR, ensureDir, nowIso, sha256File } from './lib/glossary-es/common.mjs';
import { anvisaToRecord } from './lib/medicine-catalog/anvisa.mjs';
import { cimaToRecord } from './lib/medicine-catalog/cima.mjs';
import { parseCsv } from './lib/medicine-catalog/common.mjs';
import { invimaGroupToRecord } from './lib/medicine-catalog/invima.mjs';

const SOURCES_DIR = join(BUILD_DIR, 'medicines-sources');
const OUT_DIR = ensureDir(join(BUILD_DIR, 'ndjson'));

const args = process.argv.slice(2);
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? new Set(args[onlyIndex + 1].split(',')) : null;
const wants = (name) => only === null || only.has(name);

/** Cuenta de lo que cada fuente produjo y de lo que descartó, para el informe. */
function summarize(records, extra = {}) {
  const withAtc = records.filter((r) => r.atc.length > 0).length;
  return {
    records: records.length,
    selectable: records.filter((r) => r.selectable).length,
    withAtc,
    withStrength: records.filter((r) => r.strengthText !== null).length,
    withPhoto: records.filter((r) => r.photos.length > 0).length,
    ...extra,
  };
}

function writeNdjson(source, records) {
  const path = join(OUT_DIR, `medicines-${source}.ndjson`);
  writeFileSync(path, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return path;
}

function buildCima() {
  const detailDir = join(BUILD_DIR, 'cache', 'cima', 'detail');
  const meta = JSON.parse(readFileSync(join(BUILD_DIR, 'ndjson', 'cima.meta.json'), 'utf8'));
  const records = readdirSync(detailDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => cimaToRecord(JSON.parse(readFileSync(join(detailDir, name), 'utf8')), meta.retrievedAt));
  return { records, extra: { retrievedAt: meta.retrievedAt } };
}

function buildAnvisa() {
  const path = join(SOURCES_DIR, 'anvisa', 'DADOS_ABERTOS_MEDICAMENTOS.csv');
  const text = new TextDecoder('latin1').decode(readFileSync(path));
  const rows = parseCsv(text, ';');
  const retrievedAt = readFileSync(join(SOURCES_DIR, '_retrieved_at.txt'), 'utf8').trim();
  const byCode = new Map();
  let withoutRegistration = 0;
  for (const row of rows) {
    const record = anvisaToRecord(row, retrievedAt);
    if (record === null) {
      withoutRegistration += 1;
      continue;
    }
    // Un nº de registro repetido conserva la primera fila: no se mezclan nombres.
    if (!byCode.has(record.code)) byCode.set(record.code, record);
  }
  return {
    records: [...byCode.values()],
    extra: { rows: rows.length, rowsWithoutRegistration: withoutRegistration, sha256: sha256File(path), retrievedAt },
  };
}

function buildInvima() {
  const path = join(SOURCES_DIR, 'invima-cum', 'cum_vigentes.csv');
  const rows = parseCsv(readFileSync(path, 'utf8'), ',');
  const retrievedAt = readFileSync(join(SOURCES_DIR, '_retrieved_at.txt'), 'utf8').trim();
  const groups = new Map();
  for (const row of rows) {
    const key = row.registrosanitario;
    if (key === '') continue;
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [row]);
    else group.push(row);
  }
  const records = [...groups.values()].map((group) => invimaGroupToRecord(group, retrievedAt)).filter((r) => r !== null);
  return { records, extra: { rows: rows.length, sha256: sha256File(path), retrievedAt } };
}

const BUILDERS = { cima: buildCima, anvisa: buildAnvisa, invima: buildInvima };
const report = { generatedAt: nowIso(), sources: {} };

for (const [source, build] of Object.entries(BUILDERS)) {
  if (!wants(source)) continue;
  const { records, extra } = build();
  const file = writeNdjson(source, records);
  report.sources[source] = { file, ...summarize(records, extra) };
  console.log(`${source}: ${records.length} registros → ${file}`);
}

writeFileSync(join(OUT_DIR, 'medicines-catalog.meta.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.sources, null, 2));
