#!/usr/bin/env node
// =============================================================================
// Revisiones sistemáticas Cochrane indexadas en MEDLINE (PubMed E-utilities).
//
// La Cochrane Library responde 403 a este entorno; sus revisiones están en
// PubMed («Cochrane Database Syst Rev»[Journal]) con la indexación MeSH que
// hacen los indexadores de NLM. Solo se guardan los METADATOS que usa el
// normalizador, tal cual los publica NLM: PMID, estado MEDLINE, fecha de
// revisión, tipos de publicación y encabezados MeSH (descriptor + calificadores).
// Ningún texto de la revisión (resumen, conclusiones) se copia.
//
// Una página = 200 PMID, gzip en caché, reanudable. < 3 pedidos por segundo
// (límite de NCBI sin API key).
//
// Uso: node tools/terminology-import/procedures-treatments/fetch-pubmed-cochrane.mjs
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { cacheDir, ensureDir, nowIso, writeJson } from './lib/common.mjs';
import { parsePubmedArticle } from './lib/sources/cochrane.mjs';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TERM = '"Cochrane Database Syst Rev"[Journal]';
const BATCH = 200;
const DIR = ensureDir(cacheDir('pubmed-cochrane', 'pages'));

function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const out = execFileSync(
        'curl',
        ['-sS', '--fail', '--max-time', '180', url],
        {
          encoding: 'utf8',
          maxBuffer: 1 << 30,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      execFileSync('sleep', ['0.4']);
      return out;
    } catch (err) {
      if (attempt >= 6)
        throw new Error(
          `E-utilities falló tras ${attempt} intentos: ${url}\n${err.stderr ?? err.message}`,
        );
      execFileSync('sleep', [String(3 * attempt)]);
    }
  }
}

// E-utilities no entrega más allá del registro 10 000 de una búsqueda con
// historial: se parte por fecha de publicación (rangos disjuntos, < 10 000 cada uno).
const PARTITIONS = [
  ['a', '"1900"[PDAT] : "2012"[PDAT]'],
  ['b', '"2013"[PDAT] : "2018"[PDAT]'],
  ['c', '"2019"[PDAT] : "3000"[PDAT]'],
];
const total = Number(JSON.parse(get(`${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(TERM)}&retmax=0&retmode=json`)).esearchresult.count);
const retrievedAt = nowIso();
let count = 0;
let saved = 0;
for (const [tag, range] of PARTITIONS) {
  const term = `${TERM} AND (${range})`;
  const search = JSON.parse(get(`${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&usehistory=y&retmax=0&retmode=json`)).esearchresult;
  const n = Number(search.count);
  if (n >= 10000) throw new Error(`La partición ${range} tiene ${n} registros: E-utilities no entrega más de 10 000; partir más fino`);
  count += n;
  for (let start = 0; start < n; start += BATCH) {
    const file = join(DIR, `${tag}-p${String(start / BATCH + 1).padStart(4, '0')}.json.gz`);
    if (existsSync(file)) {
      saved += JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')).length;
      continue;
    }
    const xml = get(`${EUTILS}/efetch.fcgi?db=pubmed&query_key=${search.querykey}&WebEnv=${search.webenv}&retstart=${start}&retmax=${BATCH}&retmode=xml`);
    const records = [...xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)].map((m) => parsePubmedArticle(m[1])).filter(Boolean);
    writeFileSync(file, gzipSync(JSON.stringify(records)));
    saved += records.length;
    if ((start / BATCH) % 10 === 0) console.log(`[pubmed-cochrane] ${tag} ${saved}/${total}`);
  }
}
if (count !== total) throw new Error(`Las particiones suman ${count} y la búsqueda completa ${total}: revisar los rangos`);

writeJson(cacheDir('pubmed-cochrane', 'meta.json'), {
  source: 'pubmed-cochrane',
  name: 'Revisiones Cochrane en MEDLINE/PubMed (metadatos e indexación MeSH de NLM)',
  publisher:
    'U.S. National Library of Medicine (indexación MeSH); Cochrane (revisiones)',
  license:
    'Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); no se copia texto de las revisiones',
  licenseUrl:
    'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
  homepage: 'https://pubmed.ncbi.nlm.nih.gov/',
  query: TERM,
  partitions: PARTITIONS.map(([, r]) => r),
  esearchCount: total,
  records: saved,
  retrievedAt,
});
console.log(JSON.stringify({ total, saved }));
