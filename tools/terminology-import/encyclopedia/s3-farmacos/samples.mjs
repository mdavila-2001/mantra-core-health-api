#!/usr/bin/env node
// =============================================================================
// S3 · muestra de 25 artículos para verificación a mano contra la página de la fuente.
//
//   node samples.mjs --pick      # elige 25 de forma determinista → out/samples-candidates.json
//   node samples.mjs --verify    # baja la sección OFICIAL de CIMA en texto plano (otra
//                                # representación que la JSON que se usó para ensamblar) y la
//                                # página de Wikidata, y compara la oración palabra por palabra
//                                # → out/samples-check.json. 1 petición por segundo.
//
// La decisión PASS/FAIL final es humana: `SAMPLES.md` pega la oración y el enlace.
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { splitSentences, squash } from './lib/blocks.mjs';
import { OUT_DIR } from './lib/paths.mjs';
import { PoliteClient } from './lib/polite-client.mjs';
import { sectionUrl } from './lib/sections.mjs';

const QUOTA = [
  ['indications', 4], ['contraindications', 4], ['interactions', 3], ['pregnancy_lactation', 3],
  ['adverse_effects', 4], ['pharmacologic_class', 1], ['special_populations', 1],
  ['definition', 3], // Wikidata (CC0)
  ['pharmacologic_class@wikidata', 2],
];
const h = (s) => createHash('sha1').update(s).digest('hex');

async function loadArticles(path) {
  const out = [];
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim()) out.push(JSON.parse(line));
  return out;
}

export function pickSentence(text, seed) {
  const sentences = text.split('\n').flatMap(splitSentences).filter((s) => s.length >= 40 && s.length <= 400);
  const pool = sentences.length ? sentences : text.split('\n').flatMap(splitSentences);
  return pool.sort((a, b) => h(seed + a).localeCompare(h(seed + b)))[0] ?? null;
}

export async function pick(articlesPath) {
  const arts = await loadArticles(articlesPath);
  const chosen = [];
  const used = new Set();
  for (const [key, n] of QUOTA) {
    const [kind, src] = key.split('@');
    const pool = arts
      .filter((a) => !used.has(a.conceptRef.slug))
      .flatMap((a) => a.sections.filter((s) => s.kind === kind && (src ? s.source === src : kind === 'definition' ? s.source === 'wikidata' : s.source === 'aemps-cima')).map((s) => ({ a, s })))
      .sort((x, y) => h(`s3:${key}:${x.a.conceptRef.slug}`).localeCompare(h(`s3:${key}:${y.a.conceptRef.slug}`)));
    for (const { a, s } of pool.slice(0, n)) {
      used.add(a.conceptRef.slug);
      chosen.push({
        term: a.conceptRef.slug,
        system: a.conceptRef.system,
        kind: s.kind,
        source: s.source,
        locator: s.locator,
        nregistro: s.nregistro ?? null,
        sourceUrl: s.sourceUrl,
        sourceVersion: s.sourceVersion,
        sentence: pickSentence(s.text, a.conceptRef.slug),
      });
    }
  }
  return chosen;
}

const norm = (s) => squash(s.replace(/\s+/g, ' ')).normalize('NFC');

// Las etiquetas de clase de Wikidata se unen con «; » en el artículo y en la página van separadas.
const pieces = (c) => (c.kind === 'pharmacologic_class' && c.source === 'wikidata' ? c.sentence.split('; ') : [c.sentence]);

async function verify(candidates) {
  const client = new PoliteClient({ minIntervalMs: 1000 });
  const results = [];
  for (const c of candidates) {
    let pageText = '';
    let checkedUrl = c.sourceUrl;
    if (c.source === 'aemps-cima') {
      checkedUrl = sectionUrl(c.nregistro, c.locator.split(' ')[0]);
      const { body } = await client.request(checkedUrl, { accept: 'text/plain' });
      pageText = body.toString('utf8');
    } else {
      // `uselang=es`: sin él Wikidata pinta descripción y etiquetas en inglés.
      checkedUrl = `${c.sourceUrl}?uselang=es`;
      const { body } = await client.request(checkedUrl, { accept: 'text/html' });
      pageText = body.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
    }
    results.push({ ...c, checkedUrl, verbatimInSource: pieces(c).every((piece) => norm(pageText).includes(norm(piece))) });
  }
  return { results, http: client.stats };
}

async function main() {
  const articlesPath = join(OUT_DIR, 'articles.ndjson');
  if (process.argv.includes('--pick')) {
    const chosen = await pick(articlesPath);
    writeFileSync(join(OUT_DIR, 'samples-candidates.json'), JSON.stringify(chosen, null, 2) + '\n');
    console.log(`${chosen.length} muestras`);
  }
  if (process.argv.includes('--verify')) {
    const candidates = JSON.parse(readFileSync(join(OUT_DIR, 'samples-candidates.json'), 'utf8'));
    const out = await verify(candidates);
    writeFileSync(join(OUT_DIR, 'samples-check.json'), JSON.stringify(out, null, 2) + '\n');
    console.log(`${out.results.filter((r) => r.verbatimInSource).length}/${out.results.length} coinciden palabra por palabra`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
