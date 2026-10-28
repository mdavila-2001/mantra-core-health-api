#!/usr/bin/env node
// =============================================================================
// Etapa 1 · raw/ → corpus normalizado y versionado en data/ (gzip determinista, partes < 45 MB).
//
//   node tools/terminology-import/interop-vocab/build-interop-vocab.mjs [--out <dir>] [--clean]
//
//   --out    carpeta de salida (por defecto data/ del dominio; usar otra para comparar dos builds)
//   --clean  borra raw/ del GLOSSARY_BUILD_DIR cuando terminó de escribir (los crudos no se versionan)
//
// Salidas: interop-vocab-codesystems.ndjson.gz · interop-vocab-concepts.part-NN.ndjson.gz ·
// interop-vocab-valuesets.ndjson.gz · interop-vocab-conceptmaps.ndjson.gz · interop-vocab-coverage.json ·
// interop-vocab.meta.json · SHA256SUMS. Mismo raw/ → mismos bytes (no hay fechas de proceso en los datos).
// =============================================================================

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DATA_DIR, RAW_DIR, canonical, ensureDir, readJson, sha256Buf, writeJson } from './lib/common.mjs';
import { buildCorpus } from './lib/corpus.mjs';
import { NOT_LOADED } from './lib/sources.mjs';

const args = process.argv.slice(2);
const OUT = args.includes('--out') ? resolve(args[args.indexOf('--out') + 1]) : DATA_DIR;
const CLEAN = args.includes('--clean');
const MAX_PART_BYTES = 40 * 1024 * 1024; // sin comprimir por parte: muy por debajo de los 45 MB comprimidos

const manifestPath = join(RAW_DIR, 'manifest.json');
if (!existsSync(manifestPath)) throw new Error(`Falta ${manifestPath}: corré fetch-sources.mjs`);
const manifest = readJson(manifestPath).files;

const corpus = buildCorpus(RAW_DIR, manifest);
corpus.systems.sort((a, b) => (a.meta.internalCode + '\u0000' + a.meta.version < b.meta.internalCode + '\u0000' + b.meta.version ? -1 : 1));
for (const s of corpus.systems) s.concepts.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

ensureDir(OUT);
for (const f of readdirSync(OUT)) if (f.startsWith('interop-vocab') || f === 'SHA256SUMS') rmSync(join(OUT, f));

const gz = (name, lines) => {
  const buf = gzipSync(Buffer.from(lines.join(''), 'utf8'), { level: 9 });
  writeFileSync(join(OUT, name), buf);
  return { file: name, bytes: buf.length, sha256: sha256Buf(buf), lines: lines.length };
};
const ndjson = (o) => JSON.stringify(canonical(o)) + '\n';
const files = [];

files.push(gz('interop-vocab-codesystems.ndjson.gz', corpus.systems.map((s) => ndjson({ kind: 'codesystem', ...s.meta }))));

// Conceptos en partes por tamaño (determinista: se corta siempre en la misma fila).
let part = 1;
let buf = [];
let size = 0;
const flush = () => {
  if (!buf.length) return;
  files.push(gz(`interop-vocab-concepts.part-${String(part).padStart(2, '0')}.ndjson.gz`, buf));
  part++;
  buf = [];
  size = 0;
};
for (const s of corpus.systems) {
  for (const c of s.concepts) {
    const line = ndjson({ kind: 'concept', cs: s.meta.internalCode, version: s.meta.version, ...c });
    if (size + line.length > MAX_PART_BYTES) flush();
    buf.push(line);
    size += line.length;
  }
}
flush();

files.push(gz('interop-vocab-valuesets.ndjson.gz', corpus.valueSets.map((v) => ndjson({ kind: 'valueset', ...v.meta, members: v.members }))));
files.push(gz('interop-vocab-conceptmaps.ndjson.gz', corpus.conceptMaps.map(ndjson)));

const count = (arr, f) => arr.reduce((o, x) => ((o[f(x)] = (o[f(x)] ?? 0) + 1), o), {});
const cov = corpus.coverage;
const summary = {
  codeSystems: corpus.systems.length,
  concepts: corpus.systems.reduce((a, s) => a + s.concepts.length, 0),
  valueSets: corpus.valueSets.length,
  valueSetMembers: corpus.valueSets.reduce((a, v) => a + v.members.length, 0),
  conceptMapPairs: corpus.conceptMaps.length,
  conceptsByLayer: count(corpus.systems.flatMap((s) => s.concepts.map(() => s.meta.provenance.source)), (x) => x),
};
const coverage = {
  summary,
  codeSystemDecisions: count(cov.codeSystems, (x) => `${x.package}: ${x.decision}`),
  valueSetDecisions: count(cov.valueSets, (x) => `${x.package}: ${x.decision}`),
  codeSystemsNotLoaded: cov.codeSystems.filter((x) => x.decision !== 'cargado').map(({ url, version, package: p, content, decision, reason }) => ({ url, version, package: p, content, decision, reason })),
  valueSetsNotLoaded: cov.valueSets.filter((x) => x.decision === 'omitido').map(({ url, version, package: p, reason }) => ({ url, version, package: p, reason })),
  conceptMaps: { elements: cov.conceptMaps.elements, byRelation: cov.conceptMaps.byRelation, maps: cov.conceptMaps.maps },
  oidsApplied: cov.oidsApplied,
  namingSystemsSkipped: cov.namingSystemsSkipped,
  sourcesNotLoaded: NOT_LOADED,
  notes: cov.notes,
};
writeJson(join(OUT, 'interop-vocab-coverage.json'), canonical(coverage), true);
const sources = Object.fromEntries(
  Object.entries(manifest)
    .filter(([, m]) => m.sha256)
    .map(([k, m]) => [k, { url: m.url, file: m.file, bytes: m.bytes, sha256: m.sha256, retrievedAt: m.retrievedAt, lastModified: m.lastModified, etag: m.etag, name: m.name, version: m.version, packageLicense: m.packageLicense ?? null, npmIntegrity: m.npmIntegrity ?? null }]),
);
writeJson(join(OUT, 'interop-vocab.meta.json'), canonical({ summary, files, sources }), true);

const sums = readdirSync(OUT)
  .filter((f) => f.startsWith('interop-vocab'))
  .sort()
  .map((f) => `${sha256Buf(readFileSync(join(OUT, f)))}  ${f}\n`);
writeFileSync(join(OUT, 'SHA256SUMS'), sums.join(''));

console.log(JSON.stringify(summary, null, 2));
console.log(`Escrito en ${OUT}: ${files.length} archivos NDJSON, ${files.reduce((a, f) => a + f.bytes, 0)} bytes comprimidos`);
if (CLEAN) {
  rmSync(RAW_DIR, { recursive: true, force: true });
  console.log(`Crudos borrados: ${RAW_DIR}`);
}
