#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · empaquetado de lo NORMALIZADO para versionarlo en git.
//
// Orden del propietario (2026-10-24): nada puede quedar sólo en el contenedor.
// Lo normalizado (monografías NDJSON, metas, cobertura, validación de enlaces)
// se copia comprimido a `clinical-pharmacology/data/`, partido en archivos de
// menos de 45 MB comprimidos (GitHub rechaza > 100 MB y avisa desde 50 MB).
// Los CRUDOS (caché de CIMA, RxNav, particiones de openFDA) no se suben: se
// reproducen con los fetchers, que guardan URL, fecha y sha256 en sus metas.
//
// `data/MANIFEST.json` lista cada archivo con su sha256, bytes y filas.
// Reconstruir: `zcat data/monographs.part-*.ndjson.gz > monographs.ndjson` (ídem `gsrs-entries`).
//
// Uso: node tools/terminology-import/clinical-pharmacology/pack-data.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { ensureDir, sha256File } from '../lib/glossary-es/common.mjs';
import { ndjsonLines } from './lib/cli.mjs';
import { cpCache, cpOut, openFdaDir } from './lib/paths.mjs';

const DATA_DIR = ensureDir(join(dirname(fileURLToPath(import.meta.url)), 'data'));
const MAX_PART_BYTES = 45 * 1024 * 1024;
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Parte un NDJSON por líneas en trozos cuyo gzip queda bajo el tope. Devuelve los buffers comprimidos. */
export function splitNdjson(text, maxBytes = MAX_PART_BYTES) {
  // Acepta el texto entero o un iterable de líneas (archivos > 512 MB no caben en un string).
  const lines = typeof text === 'string' ? text.split('\n').filter((l) => l.trim() !== '') : text;
  const parts = [];
  let chunk = [];
  let rawBytes = 0;
  // El gzip de texto JSON comprime ≥ 3:1; se corta por bytes crudos con margen y se verifica después.
  const rawLimit = maxBytes * 3;
  const flush = () => {
    if (chunk.length === 0) return;
    const gz = gzipSync(chunk.join('\n') + '\n', { level: 9 });
    if (gz.length > maxBytes && chunk.length > 1) {
      const half = Math.ceil(chunk.length / 2);
      const [a, b] = [chunk.slice(0, half), chunk.slice(half)];
      parts.push(...splitNdjson(a.join('\n'), maxBytes), ...splitNdjson(b.join('\n'), maxBytes));
    } else parts.push({ gz, rows: chunk.length });
    chunk = [];
    rawBytes = 0;
  };
  for (const line of lines) {
    if (rawBytes + line.length > rawLimit) flush();
    chunk.push(line);
    rawBytes += line.length + 1;
  }
  flush();
  return parts;
}

function main() {
  for (const name of readdirSync(DATA_DIR)) if (name.endsWith('.gz') || name === 'MANIFEST.json') unlinkSync(join(DATA_DIR, name));
  const manifest = { generatedAt: new Date().toISOString(), note: 'Datos normalizados (no crudos). Ver SOURCES.md y docs/seed-research/clinical-pharmacology.md.', files: [] };
  const add = (name, gz, rows, from) => {
    writeFileSync(join(DATA_DIR, name), gz);
    manifest.files.push({ name, from, bytes: gz.length, sha256: sha256(gz), rows });
  };

  manifest.ndjson = {};
  for (const name of ['monographs', 'gsrs-entries']) {
    const ndjson = cpOut(`${name}.ndjson`);
    if (!existsSync(ndjson)) continue;
    const parts = splitNdjson(ndjsonLines(ndjson));
    parts.forEach((p, i) => add(`${name}.part-${String(i + 1).padStart(3, '0')}.ndjson.gz`, p.gz, p.rows, `out/${name}.ndjson`));
    manifest.ndjson[name] = { sha256: sha256File(ndjson), rows: parts.reduce((n, p) => n + p.rows, 0), parts: parts.length };
  }
  const small = [
    ['out/monographs.meta.json', cpOut('monographs.meta.json')],
    ['out/gsrs-entries.meta.json', cpOut('gsrs-entries.meta.json')],
    ['out/coverage.json', cpOut('coverage.json')],
    ['out/coverage.md', cpOut('coverage.md')],
    ['out/validate-links.json', cpOut('validate-links.json')],
    ['out/load-plan.dry-run.json', cpOut('load-plan.dry-run.json')],
    ['cache/cima/fetch.meta.json', cpCache('cima', 'fetch.meta.json')],
    ['cache/rxnav/fetch.meta.json', cpCache('rxnav', 'fetch.meta.json')],
    ['cache/openfda/fetch.meta.json', join(openFdaDir(), 'fetch.meta.json')],
  ];
  for (const [from, path] of small) {
    if (!existsSync(path)) continue;
    const buf = readFileSync(path);
    if (buf.length > MAX_PART_BYTES) throw new Error(`${from} supera el tope de una parte; partirlo antes de versionarlo.`);
    add(`${from.replace(/^(out|cache)\//, '').replace(/\//g, '__')}.gz`, gzipSync(buf, { level: 9 }), null, from);
  }
  writeFileSync(join(DATA_DIR, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
