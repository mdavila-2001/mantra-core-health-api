#!/usr/bin/env node
// =============================================================================
// Etapa 4 (respaldo en git): copia el corpus normalizado a `data/` del
// importador, comprimido, para que no se pierda con el contenedor.
//
//   data/out/*.ndjson.gz           procedures, assertions, maps (partes < 45 MB)
//   data/out/*.json.gz             coverage, load-plan.dry-run, validate-siblings
//   data/sources/<fuente>.meta.json  URL fijada, versión, sha256 y fecha de cada descarga
//   data/sources/_network.json     último sondeo de red
//   data/raw/<fuente>/*.gz         crudos chicos (< RAW_LIMIT); los grandes NO se suben:
//                                  `fetch.mjs` los reproduce con la URL y el sha256 del meta
//   data/MANIFEST.json             cada archivo con filas, bytes y sha256
//
// gzip determinista (cabecera sin fecha): dos corridas sobre el mismo corpus dan
// los mismos bytes y git no registra cambios.
//
// Uso: node tools/terminology-import/procedures-treatments/snapshot.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { cacheDir, ensureDir, outDir, writeJson } from './lib/common.mjs';

const DATA = join(dirname(fileURLToPath(import.meta.url)), 'data');
const PART_LIMIT = 45 * 1024 * 1024; // GitHub rechaza > 100 MB y advierte > 50 MB
const RAW_LIMIT = 10 * 1024 * 1024;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const manifest = { generatedFrom: 'build.mjs', files: [], omittedRaw: [] };

function writeGz(rel, buf, extra = {}) {
  const gz = gzipSync(buf, { level: 9 });
  if (gz.length > PART_LIMIT)
    throw new Error(
      `${rel}: ${gz.length} B comprimido supera el límite por parte`,
    );
  const dest = join(DATA, rel);
  ensureDir(dirname(dest));
  writeFileSync(dest, gz);
  manifest.files.push({
    path: rel,
    bytes: gz.length,
    uncompressedBytes: buf.length,
    sha256Uncompressed: sha256(buf),
    ...extra,
  });
}

/** NDJSON partido por líneas para que cada parte comprimida quede bajo el límite. */
function writeNdjsonParts(name) {
  const src = outDir(`${name}.ndjson`);
  if (!existsSync(src)) return;
  const lines = readFileSync(src, 'utf8').split('\n').filter(Boolean);
  const parts = [];
  let cur = [];
  let size = 0;
  for (const l of lines) {
    // Umbral sobre el tamaño SIN comprimir (cota segura: el gzip nunca crece por encima de esto).
    if (size + l.length + 1 > PART_LIMIT && cur.length) {
      parts.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(l);
    size += l.length + 1;
  }
  if (cur.length) parts.push(cur);
  parts.forEach((p, i) => {
    const rel =
      parts.length === 1
        ? `out/${name}.ndjson.gz`
        : `out/${name}.part${String(i + 1).padStart(3, '0')}.ndjson.gz`;
    writeGz(rel, Buffer.from(`${p.join('\n')}\n`), { rows: p.length });
  });
}

rmSync(DATA, { recursive: true, force: true });
for (const name of ['procedures', 'assertions', 'maps']) writeNdjsonParts(name);
for (const name of ['coverage', 'load-plan.dry-run', 'validate-siblings']) {
  const src = outDir(`${name}.json`);
  if (existsSync(src)) writeGz(`out/${name}.json.gz`, readFileSync(src));
}

for (const key of readdirSync(cacheDir()).sort()) {
  const dir = cacheDir(key);
  if (key === '_network.json') {
    writeJson(
      join(DATA, 'sources', '_network.json'),
      JSON.parse(readFileSync(dir, 'utf8')),
    );
    continue;
  }
  if (!statSync(dir).isDirectory() || !existsSync(join(dir, 'meta.json')))
    continue;
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  writeJson(join(DATA, 'sources', `${key}.meta.json`), meta);
  for (const [file, info] of Object.entries(meta.files)) {
    const path = join(dir, file);
    // El límite se mide sobre lo COMPRIMIDO (el NDJSON de ClinicalTrials.gov pesa 18 MB y comprime a ~2 MB;
    // un .gz que ya viene comprimido, como desc2026.gz de MeSH, no se vuelve a comprimir y queda afuera).
    const raw = existsSync(path) ? readFileSync(path) : null;
    if (raw && gzipSync(raw, { level: 9 }).length <= RAW_LIMIT) {
      writeGz(`raw/${key}/${file}.gz`, raw, {
        source: key,
        sha256Original: info.sha256,
      });
    } else {
      manifest.omittedRaw.push({
        source: key,
        file,
        bytes: info.bytes,
        sha256: info.sha256,
        url: info.url,
        reproduce: key === 'clinicaltrials-gov' ? 'node tools/terminology-import/procedures-treatments/fetch-ctgov.mjs (la API cambia a diario: el corpus queda fijado por el dataTimestamp y el sha256 de meta.json)' : `node tools/terminology-import/procedures-treatments/fetch.mjs ${key}`,
      });
    }
  }
}

writeJson(join(DATA, 'MANIFEST.json'), manifest);
console.log(
  JSON.stringify(
    {
      files: manifest.files.length,
      bytes: manifest.files.reduce((n, f) => n + f.bytes, 0),
      omittedRaw: manifest.omittedRaw.map(
        (o) => `${o.source}/${o.file} (${o.bytes} B)`,
      ),
    },
    null,
    2,
  ),
);
