#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 1h (red): libros de NCBI Bookshelf del gobierno
// de EE. UU. — LactMed (NICHD) y LiverTox (NIDDK).
//
//   1. `file_list.txt` del archivo de literatura de NCBI → ruta y fecha del
//      paquete de cada libro (la vía de descarga masiva que indica LactMed).
//   2. Paquete (tar.gz) a la caché, con sha256; se extraen sólo los `.nxml`.
//   3. E-utilities (esearch + esummary, db=books) → accession NBK de cada
//      capítulo, para citar la URL canónica del registro.
//
// Todo en clinical-pharmacology/cache/<libro>/. Reanudable.
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/clinical-pharmacology/fetch-ncbi-books.mjs [--book lactmed|livertox]
// =============================================================================

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { HttpClient, ensureDir, writeJson } from '../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';
import { LITARCH_FILE_LIST, bookAccessions, bookSearchUrl, bookSummaryUrl } from './lib/ncbi-books.mjs';
import { cpCache } from './lib/paths.mjs';

/** Libro → accession NBK del libro (columna 5 de `file_list.txt`). */
export const NCBI_BOOKS = Object.freeze({ lactmed: 'NBK501922', livertox: 'NBK547852' });
const { opt } = parseArgs();
const ONLY = opt('--book', null);
// E-utilities sin clave: ≤ 3 pedidos/s.
const http = new HttpClient({ concurrency: 1, minDelayMs: 400 });

async function fetchBook(book, nbk, list) {
  const t0 = Date.now();
  const dir = ensureDir(cpCache(book));
  const row = list.split('\n').find((l) => l.split('\t')[4] === nbk);
  if (!row) throw new Error(`${nbk} no figura en ${LITARCH_FILE_LIST}`);
  const [path, title, publisher, , , updated] = row.split('\t');
  const tarUrl = `https://ftp.ncbi.nlm.nih.gov/pub/litarch/${path}`;
  const tarPath = join(dir, `${book}_${nbk}.tar.gz`);
  const tar = await http.getFileCached(tarUrl, tarPath);

  // Sólo los NXML, sin la carpeta de primer nivel. GNU tar rechaza rutas con `..` y quita las absolutas.
  const nxmlDir = ensureDir(join(dir, 'nxml'));
  if (readdirSync(nxmlDir).length === 0) execFileSync('tar', ['-xzf', tarPath, '-C', nxmlDir, '--strip-components=1', '--wildcards', '*.nxml']);
  const nxml = readdirSync(nxmlDir).filter((n) => n.endsWith('.nxml'));

  const search = await http.getJsonCached(bookSearchUrl(book, 0, 10000), join(dir, 'eutils', 'esearch.json'));
  const uids = search?.esearchresult?.idlist ?? [];
  const accessions = new Map();
  for (let i = 0; i < uids.length; i += 200) {
    const sum = await http.getJsonCached(bookSummaryUrl(uids.slice(i, i + 200)), join(dir, 'eutils', `esummary-${String(i / 200).padStart(3, '0')}.json`));
    for (const [k, v] of bookAccessions(sum, book)) accessions.set(k, v);
  }
  writeJson(join(dir, 'accessions.json'), Object.fromEntries([...accessions].sort()), true);
  const meta = {
    source: book,
    book: nbk,
    title,
    publisher,
    litarchUpdated: updated?.trim() ?? null,
    url: tarUrl,
    bytes: tar.length,
    sha256: createHash('sha256').update(tar).digest('hex'),
    nxml: nxml.length,
    eutils: { searchCount: Number(search?.esearchresult?.count ?? 0), uids: uids.length, chapterAccessions: accessions.size },
    nxmlWithoutAccession: nxml.map((n) => n.replace(/\.nxml$/, '')).filter((id) => !accessions.has(id)).length,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(join(dir, 'fetch.meta.json'), meta, true);
  return meta;
}

async function main() {
  const list = (await http.getFileCached(LITARCH_FILE_LIST, join(ensureDir(cpCache('ncbi-litarch')), 'file_list.txt'))).toString('utf8');
  for (const [book, nbk] of Object.entries(NCBI_BOOKS)) {
    if (ONLY && ONLY !== book) continue;
    console.log(JSON.stringify(await fetchBook(book, nbk, list), null, 2));
  }
  console.log(JSON.stringify({ http: http.stats }));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-ncbi-books:', err);
  process.exitCode = 1;
});
