#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1h (red): LactMed (NICHD/NLM).
//
//   1. `file_list.txt` del archivo de literatura de NCBI → ruta y fecha del
//      paquete `lactmed_NBK501922.tar.gz` (la vía de descarga masiva que la
//      propia LactMed indica).
//   2. Paquete (tar.gz) a la caché, con sha256; se extraen sólo los `.nxml`.
//   3. E-utilities (esearch + esummary, db=books) → accession NBK de cada
//      capítulo, para citar la URL canónica del registro.
//
// Todo en clinical-pharmacology/cache/lactmed/. Reanudable.
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-lactmed.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { HttpClient, ensureDir, writeJson } from '../lib/glossary-es/common.mjs';
import { LACTMED_LITARCH_LIST, accessionsFromSummary, lactmedSearchUrl, lactmedSummaryUrl } from './lib/lactmed.mjs';
import { cpCache } from './lib/paths.mjs';

const BOOK = 'NBK501922';
// E-utilities sin clave: ≤ 3 pedidos/s.
const http = new HttpClient({ concurrency: 1, minDelayMs: 400 });

async function main() {
  const t0 = Date.now();
  const dir = ensureDir(cpCache('lactmed'));
  const list = (await http.getFileCached(LACTMED_LITARCH_LIST, join(dir, 'litarch-file_list.txt'))).toString('utf8');
  const row = list.split('\n').find((l) => l.split('\t')[4] === BOOK);
  if (!row) throw new Error(`${BOOK} no figura en ${LACTMED_LITARCH_LIST}`);
  const [path, title, publisher, , , updated] = row.split('\t');
  const tarUrl = `https://ftp.ncbi.nlm.nih.gov/pub/litarch/${path}`;
  const tarPath = join(dir, 'lactmed_NBK501922.tar.gz');
  const tar = await http.getFileCached(tarUrl, tarPath);

  // Sólo los NXML, sin la carpeta de primer nivel. GNU tar rechaza rutas con `..` y quita las absolutas.
  const nxmlDir = ensureDir(join(dir, 'nxml'));
  if (readdirSync(nxmlDir).length === 0) execFileSync('tar', ['-xzf', tarPath, '-C', nxmlDir, '--strip-components=1', '--wildcards', '*.nxml']);
  const nxml = readdirSync(nxmlDir).filter((n) => n.endsWith('.nxml'));

  const search = await http.getJsonCached(lactmedSearchUrl(0, 10000), join(dir, 'eutils', 'esearch.json'));
  const uids = search?.esearchresult?.idlist ?? [];
  const accessions = new Map();
  for (let i = 0; i < uids.length; i += 200) {
    const sum = await http.getJsonCached(lactmedSummaryUrl(uids.slice(i, i + 200)), join(dir, 'eutils', `esummary-${String(i / 200).padStart(3, '0')}.json`));
    for (const [k, v] of accessionsFromSummary(sum)) accessions.set(k, v);
  }
  writeJson(join(dir, 'accessions.json'), Object.fromEntries([...accessions].sort()), true);

  const meta = {
    source: 'nlm-lactmed',
    book: BOOK,
    title,
    publisher,
    litarchUpdated: updated?.trim() ?? null,
    url: tarUrl,
    bytes: tar.length,
    sha256: createHash('sha256').update(tar).digest('hex'),
    nxml: nxml.length,
    eutils: { searchCount: Number(search?.esearchresult?.count ?? 0), uids: uids.length, chapterAccessions: accessions.size },
    nxmlWithoutAccession: nxml.map((n) => n.replace(/\.nxml$/, '')).filter((id) => !accessions.has(id)).length,
    http: http.stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(dir, 'fetch.meta.json'), meta, true);
  console.log(JSON.stringify(meta, null, 2));
  if (!existsSync(tarPath)) process.exitCode = 1;
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-lactmed:', err);
  process.exitCode = 1;
});
