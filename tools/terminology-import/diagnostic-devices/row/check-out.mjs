#!/usr/bin/env node
// =============================================================================
// Equipos de diagnóstico · ROW · verificación de `out/` contra el formato común.
//
// Falla (salida 1) si: falta un archivo del manifiesto, un `.gz` pesa 50 MB o
// más, el sha256 o el número de filas no coincide, una fila no cumple el
// formato, una fila está en el archivo de otra fuente o `source` +
// `sourceRecordId` se repite. Sin red.
//
// Uso: node tools/terminology-import/diagnostic-devices/row/check-out.mjs
// =============================================================================

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { gzLines, readManifest } from './lib/read-out.mjs';
import { OUT_DIR, rowErrors, sha256File } from './lib/row.mjs';

const LIMIT_BYTES = 50 * 1000 * 1000;
const MAX_REPORTED = 20;

async function main() {
  const manifest = readManifest();
  const errors = [];
  const report = (message) => {
    if (errors.length < MAX_REPORTED) console.error(`  ✗ ${message}`);
    errors.push(message);
  };
  const keys = new Set();
  let total = 0;

  const listed = new Set(manifest.files.map((f) => f.path));
  for (const name of readdirSync(OUT_DIR))
    if (name.endsWith('.ndjson.gz') && !listed.has(name))
      report(`${name} no está en el manifiesto`);

  for (const file of manifest.files) {
    const path = join(OUT_DIR, file.path);
    if (!existsSync(path)) {
      report(`${file.path} no existe`);
      continue;
    }
    const size = statSync(path).size;
    if (size >= LIMIT_BYTES)
      report(`${file.path} pesa ${size} bytes (límite ${LIMIT_BYTES})`);
    const sha = await sha256File(path);
    if (sha !== file.sha256)
      report(`${file.path} sha256 ${sha} ≠ manifiesto ${file.sha256}`);
    let rows = 0;
    for await (const line of gzLines(path)) {
      rows += 1;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        report(`${file.path}:${rows} no es JSON`);
        continue;
      }
      for (const e of rowErrors(row)) report(`${file.path}:${rows} ${e}`);
      if (row.source !== file.source)
        report(`${file.path}:${rows} source ${row.source} ≠ ${file.source}`);
      const key = `${row.source}\u0000${row.sourceRecordId}`;
      if (keys.has(key))
        report(
          `${file.path}:${rows} id repetido ${row.source}:${row.sourceRecordId}`,
        );
      keys.add(key);
    }
    if (rows !== file.rows)
      report(
        `${file.path} tiene ${rows} filas; el manifiesto dice ${file.rows}`,
      );
    total += rows;
    console.log(`  ${file.path}: ${rows} filas, ${(size / 1e6).toFixed(1)} MB`);
  }

  if (errors.length > 0) {
    console.error(`FALLA: ${errors.length} errores en ${total} filas`);
    process.exit(1);
  }
  console.log(
    `OK: ${total} filas en ${manifest.files.length} archivos, 0 errores`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
