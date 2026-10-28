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
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import {
  cacheDir,
  ensureDir,
  outDir,
  readLines,
  writeJson,
} from './lib/common.mjs';
import { ctgovStudies } from './lib/sources/ctgov.mjs';
import { pubmedRecords } from './lib/sources/pubmed.mjs';

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

/**
 * NDJSON partido por líneas para que cada parte comprimida quede bajo el límite.
 * Se lee en streaming: `assertions.ndjson` pasa de 300 MB y no cabe entero en el heap.
 */
async function writeNdjsonParts(name) {
  const src = outDir(`${name}.ndjson`);
  if (!existsSync(src)) return;
  const partRel = (i) =>
    `out/${name}.part${String(i).padStart(3, '0')}.ndjson.gz`;
  let cur = [];
  let size = 0;
  let n = 0;
  const flush = () => {
    n += 1;
    writeGz(partRel(n), Buffer.from(`${cur.join('\n')}\n`), {
      rows: cur.length,
    });
    cur = [];
    size = 0;
  };
  for await (const l of readLines(src)) {
    if (!l) continue;
    // Umbral sobre el tamaño SIN comprimir (cota segura: el gzip nunca crece por encima de esto).
    if (size + l.length + 1 > PART_LIMIT && cur.length) flush();
    cur.push(l);
    size += l.length + 1;
  }
  if (cur.length) flush();
  if (n === 1) {
    // Una sola parte: nombre sin sufijo, como antes.
    const entry = manifest.files.find((f) => f.path === partRel(1));
    entry.path = `out/${name}.ndjson.gz`;
    renameSync(join(DATA, partRel(1)), join(DATA, entry.path));
  }
}

/** Líneas NDJSON → partes gzip bajo el límite (umbral sobre el tamaño sin comprimir). */
function writeNdjsonGzParts(base, lines, extra = {}) {
  const parts = [];
  let cur = [];
  let size = 0;
  for (const l of lines) {
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
        ? `${base}.ndjson.gz`
        : `${base}.part${String(i + 1).padStart(3, '0')}.ndjson.gz`;
    writeGz(rel, Buffer.from(`${p.join('\n')}\n`), {
      rows: p.length,
      ...extra,
    });
  });
}

rmSync(DATA, { recursive: true, force: true });
for (const name of ['procedures', 'assertions', 'maps'])
  await writeNdjsonParts(name);
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
  if (key.startsWith('pubmed-')) {
    const pagesDir = join(dir, 'pages');
    const pagesBytes = readdirSync(pagesDir).reduce(
      (n, f) => n + statSync(join(pagesDir, f)).size,
      0,
    );
    if (pagesBytes > RAW_LIMIT) {
      // Crudo pesado (p. ej. 673 366 ensayos aleatorizados, 57 MB comprimidos): no
      // se sube; el corpus normalizado sí. meta.json guarda la búsqueda exacta y
      // sus particiones por fecha de alta para repetir la descarga.
      manifest.omittedRaw.push({
        source: key,
        file: 'pages/*.json.gz',
        bytes: pagesBytes,
        records: meta.records,
        query: meta.query,
        retrievedAt: meta.retrievedAt,
        reproduce: `node tools/terminology-import/procedures-treatments/fetch-pubmed.mjs --subset ${key.slice('pubmed-'.length)} (PubMed agrega registros a diario: otra fecha da otro corpus)`,
      });
      continue;
    }
    // Metadatos compactos (PMID, tipos de publicación, MeSH) tal como se descargaron.
    const lines = [...pubmedRecords(join(dir, 'pages'))].map((r) =>
      JSON.stringify(r),
    );
    writeNdjsonGzParts(`raw/${key}/records`, lines, { source: key });
    continue;
  }
  if (key === 'ctgov') {
    // ~70 MB de páginas que la API reemplaza a diario: no se suben, y volver a
    // bajarlas no reproduce este corpus. Se sube el extracto exacto que usa el
    // normalizador (ids tal cual los publica la fuente) para poder rehacer el build.
    const lines = [];
    for (const st of ctgovStudies(join(dir, 'pages'))) {
      const p = st.protocolSection ?? {};
      lines.push(
        JSON.stringify({
          nct: p.identificationModule?.nctId,
          studyType: p.designModule?.studyType ?? null,
          interventionMeshes: (
            st.derivedSection?.interventionBrowseModule?.meshes ?? []
          ).map((m) => m.id),
          conditionMeshes: (
            st.derivedSection?.conditionBrowseModule?.meshes ?? []
          ).map((m) => m.id),
        }),
      );
    }
    writeNdjsonGzParts('raw/ctgov/studies-mesh', lines, { source: key });
    manifest.omittedRaw.push({
      source: key,
      file: 'pages/*.json.gz',
      pages: meta.pages,
      studies: meta.studies,
      dataTimestamp: meta.dataTimestamp,
      reproduce:
        'node tools/terminology-import/procedures-treatments/fetch-ctgov.mjs (la API se actualiza a diario: otra fecha da otro corpus)',
    });
    continue;
  }
  for (const [file, info] of Object.entries(meta.files)) {
    const path = join(dir, file);
    if (info.bytes <= RAW_LIMIT && existsSync(path)) {
      writeGz(`raw/${key}/${file}.gz`, readFileSync(path), {
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
        reproduce: `node tools/terminology-import/procedures-treatments/fetch.mjs ${key}`,
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
