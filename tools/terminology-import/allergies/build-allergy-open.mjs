#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · tanda 2 · etapa 1 (descargas HTTP → NDJSON). Sin red.
//
// Lee `allergy-sources/open/` + `manifest-open.json` (los escribe
// `fetch-allergy-open-sources.mjs`) y el catálogo de la tanda 1
// (`data/allergy-catalog.ndjson.gz`, para no repetir lo ya cargado), corre las
// pasadas 21+ de `lib/passes-open.mjs` y escribe, en `<GLOSSARY_BUILD_DIR>/ndjson/`:
//   allergy-catalog-open.ndjson        conceptos NUEVOS y parches (`"patch":true`)
//   allergy-catalog-open.meta.json     pasadas, descartes, notas y totales
// Con `--pack` copia el NDJSON comprimido (gzip determinista) y el informe a `data/`,
// en partes de < 45 MB, con `SHA256SUMS`.
//
// Uso: node tools/terminology-import/allergies/build-allergy-open.mjs [--pack]
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import { ensureDir, nowIso } from '../lib/glossary-es/common.mjs';
import { runOpenPasses } from './lib/open-runner.mjs';
import { OPEN_DIR, OPEN_MANIFEST } from './lib/open-sources.mjs';
import { NDJSON_DIR } from './lib/sources.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'data');
const PART_BYTES = 40 * 1024 * 1024;
const sha = (b) => createHash('sha256').update(b).digest('hex');

const manifest = JSON.parse(readFileSync(OPEN_MANIFEST, 'utf8'));
const baseRecords = gunzipSync(readFileSync(join(DATA, 'allergy-catalog.ndjson.gz')))
  .toString('utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const t0 = Date.now();
const { lines, report, notes, discarded, totals } = runOpenPasses({ manifest, baseRecords, openDir: OPEN_DIR });

ensureDir(NDJSON_DIR);
const body = lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
const out = join(NDJSON_DIR, 'allergy-catalog-open.ndjson');
writeFileSync(out, body);
const meta = {
  generatedAt: nowIso(),
  baseConcepts: baseRecords.length,
  sources: Object.fromEntries(Object.entries(manifest.sources).map(([k, s]) => [k, { version: s.version, retrievedAt: s.retrievedAt, license: s.license, files: s.files?.length ?? null, digest: s.digest ?? s.splDigest ?? null }])),
  passes: report,
  discarded,
  notes,
  totals,
  ndjsonSha256: sha(body),
  seconds: Math.round((Date.now() - t0) / 1000),
};
writeFileSync(join(NDJSON_DIR, 'allergy-catalog-open.meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.table(report.map(({ n, key, read, added, duplicates, patches }) => ({ n, key, read, added, duplicates, patches })));
console.log(JSON.stringify({ totals, ndjsonSha256: meta.ndjsonSha256, discarded }, null, 2));
console.log(`→ ${out}`);

if (process.argv.includes('--pack')) {
  mkdirSync(DATA, { recursive: true });
  for (const f of readdirSync(DATA)) if (/^allergy-catalog-open\.part-\d+\.ndjson\.gz$/.test(f)) rmSync(join(DATA, f));
  // partes por líneas completas; gzip determinista (Node escribe mtime 0)
  const parts = [];
  let cur = [];
  let size = 0;
  for (const l of body.split('\n').filter(Boolean)) {
    if (size + l.length > PART_BYTES * 4 && cur.length > 0) {
      parts.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(l);
    size += l.length;
  }
  if (cur.length > 0) parts.push(cur);
  const sums = [];
  parts.forEach((p, i) => {
    const gz = gzipSync(Buffer.from(p.join('\n') + '\n'), { level: 9 });
    const name = `allergy-catalog-open.part-${String(i + 1).padStart(2, '0')}.ndjson.gz`;
    writeFileSync(join(DATA, name), gz);
    sums.push(`${sha(gz)}  ${name}`);
  });
  const metaText = readFileSync(join(NDJSON_DIR, 'allergy-catalog-open.meta.json'));
  writeFileSync(join(DATA, 'allergy-catalog-open.meta.json'), metaText);
  sums.push(`${meta.ndjsonSha256}  allergy-catalog-open.ndjson (descomprimido, partes concatenadas)`);
  sums.push(`${sha(metaText)}  allergy-catalog-open.meta.json`);
  const manifestText = readFileSync(OPEN_MANIFEST);
  writeFileSync(join(DATA, 'allergy-open-sources.manifest.json'), manifestText);
  sums.push(`${sha(manifestText)}  allergy-open-sources.manifest.json`);
  writeFileSync(join(DATA, 'SHA256SUMS-open'), sums.join('\n') + '\n');
  console.log(`empaquetado: ${parts.length} parte(s) en ${DATA}`);
}
