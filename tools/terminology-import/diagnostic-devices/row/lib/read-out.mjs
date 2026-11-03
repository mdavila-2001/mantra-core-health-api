// =============================================================================
// Equipos de diagnóstico · ROW · lectura en streaming de `out/*.ndjson.gz`.
// =============================================================================

import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

import { OUT_DIR, readJson } from './row.mjs';

export function readManifest(outDir = OUT_DIR) {
  return readJson(join(outDir, 'manifest.json'));
}

/** Itera las líneas (texto) de un `.ndjson.gz`, miembro por miembro. */
export async function* gzLines(path) {
  const lines = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity,
  });
  for await (const line of lines) if (line !== '') yield line;
}
