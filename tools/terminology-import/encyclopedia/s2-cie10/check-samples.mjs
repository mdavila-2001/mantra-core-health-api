#!/usr/bin/env node
// =============================================================================
// F9 · S2 — verificación de muestra contra la PÁGINA/API VIVA de cada fuente.
//
//   node check-samples.mjs --articles <articles.ndjson> --hpo-articles <articles con --hpo-license-ack> \
//        --cache-dir <dir> [--out SAMPLES.md]
//
// Elige 25 artículos de forma determinista (hash del código, sin azar) repartidos por fuente y
// compara la oración del artículo, palabra por palabra, con lo que hoy sirve la fuente por una vía
// DISTINTA a la del volcado que usó la canalización:
//   · MONDO y DOID  → API de OLS4 (EBI), no el mondo.json/doid.obo bajado.
//   · MeSH          → lookup `id.nlm.nih.gov/mesh/<concepto>.json`, no el SPARQL.
//   · HPO           → API de ontology.jax.org (conteo por frecuencia, no la etiqueta en castellano).
//   · Imágenes      → HTML de la página del archivo en Commons.
//   · Orphanet      → la web de Orphanet exige una prueba de trabajo anti-bot (no se evade):
//                     se compara contra el XML publicado, leído como TEXTO CRUDO (sin el parser).
// 1 petición por segundo, User-Agent identificable. Cualquier diferencia es FAIL.
// =============================================================================

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpClient, decodeEntities } from '../../lib/glossary-es/common.mjs';
import { parseArgs } from './lib/cli.mjs';

const OLS = 'https://www.ebi.ac.uk/ols4/api/ontologies';
const sha = (s) => createHash('sha1').update(s).digest('hex');
const squash = (s) => String(s).replace(/\s+/g, ' ').trim();
const readNdjson = (p) => readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

/** Reparte N muestras por una clave de orden estable (hash), sin azar. */
export function pickDeterministic(candidates, n, key) {
  return [...candidates].sort((a, b) => sha(key(a)).localeCompare(sha(key(b)))).slice(0, n);
}

async function olsDescriptions(http, ontology, iri) {
  const url = `${OLS}/${ontology}/terms?iri=${encodeURIComponent(iri)}`;
  const json = JSON.parse((await http.get(url, { accept: 'application/json' })).body.toString('utf8'));
  const term = json._embedded?.terms?.[0];
  return { url, texts: [...(term?.description ?? []), ...(term?.annotation?.definition ?? [])].map(squash) };
}

async function meshScopeNote(http, descriptorId) {
  const d = JSON.parse((await http.get(`https://id.nlm.nih.gov/mesh/${descriptorId}.json`, { accept: 'application/json' })).body.toString('utf8'));
  const concept = [].concat(d.preferredConcept)[0].replace('http://id.nlm.nih.gov/mesh/', '');
  const url = `https://id.nlm.nih.gov/mesh/${concept}.json`;
  const c = JSON.parse((await http.get(url, { accept: 'application/json' })).body.toString('utf8'));
  return { url, texts: [squash(c.scopeNote?.['@value'] ?? '')] };
}

function rawOrphanetDefinition(xml, orpha) {
  const start = xml.indexOf(`<OrphaCode>${orpha}</OrphaCode>`);
  const block = xml.slice(start, xml.indexOf('</Disorder>', start));
  const m = block.match(/<Contents>([\s\S]*?)<\/Contents>/);
  return m ? squash(decodeEntities(m[1])) : null;
}

const first = (s, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s);

export async function checkSamples({ articlesPath, hpoArticlesPath, cacheDir, count = 25 }) {
  const http = new HttpClient({ concurrency: 1, minDelayMs: 1000 });
  const articles = readNdjson(articlesPath);
  const orphanetXml = readFileSync(join(cacheDir, 'files', 'es_product1.xml'), 'utf8');
  const secs = (source) => articles.flatMap((a) => a.sections.filter((s) => s.source === source).map((s) => ({ a, s })));
  const plan = [
    ...pickDeterministic(secs('orphanet-es'), 5, ({ a }) => `o${a.conceptRef.code}`).map((x) => ({ ...x, via: 'orphanet' })),
    ...pickDeterministic(secs('mondo'), 6, ({ a }) => `m${a.conceptRef.code}`).map((x) => ({ ...x, via: 'mondo' })),
    ...pickDeterministic(secs('disease-ontology'), 5, ({ a }) => `d${a.conceptRef.code}`).map((x) => ({ ...x, via: 'doid' })),
    ...pickDeterministic(secs('nlm-mesh'), 5, ({ a }) => `s${a.conceptRef.code}`).map((x) => ({ ...x, via: 'mesh' })),
  ];
  const results = [];
  for (const { a, s, via } of plan) {
    const code = a.conceptRef.code;
    let live = null;
    let url = s.sourceUrl;
    if (via === 'orphanet') {
      const orpha = s.sourceUrl.match(/Expert=(\d+)/)[1];
      live = [rawOrphanetDefinition(orphanetXml, orpha)];
    } else if (via === 'mondo' || via === 'doid') {
      const iri = s.sourceUrl;
      const r = await olsDescriptions(http, via, iri);
      live = r.texts;
      url = r.url;
    } else {
      const id = s.sourceUrl.match(/ui=(D\d+)/)[1];
      const r = await meshScopeNote(http, id);
      live = r.texts;
      url = r.url;
    }
    const ok = live.some((t) => t && t === squash(s.text));
    results.push({ code, name: a.conceptRef.slug, kind: s.kind, source: s.source, sentence: first(squash(s.text)), link: s.sourceUrl, checkedAgainst: url, ok });
  }
  // HPO: conteo de fenotipos por clase de frecuencia contra la API de ontology.jax.org.
  const hpoArticles = hpoArticlesPath ? readNdjson(hpoArticlesPath) : [];
  const hpoSecs = hpoArticles.flatMap((a) => a.sections.filter((s) => s.source === 'hpo').map((s) => ({ a, s })));
  for (const { a, s } of pickDeterministic(hpoSecs, 2, ({ a }) => `h${a.conceptRef.code}`)) {
    const key = s.sourceUrl.split('/browse/disease/')[1];
    const url = `https://ontology.jax.org/api/network/annotation/${key}`;
    const api = JSON.parse((await http.get(url, { accept: 'application/json' })).body.toString('utf8'));
    const live = {};
    // La API mezcla aspectos: el modo de herencia (aspecto I) viene en la categoría «Inheritance»; la sección compara solo fenotipos (aspecto P).
    for (const [category, items] of Object.entries(api.categories ?? {})) if (category !== 'Inheritance') for (const it of items) live[it.metadata.frequency || 'sin frecuencia'] = (live[it.metadata.frequency || 'sin frecuencia'] ?? 0) + 1;
    const mine = s.items.length;
    const liveTotal = Object.values(live).reduce((x, y) => x + y, 0);
    results.push({ code: a.conceptRef.code, name: a.conceptRef.slug, kind: s.kind, source: 'hpo', sentence: `${mine} fenotipos; la API devuelve ${liveTotal} (${JSON.stringify(live)})`, link: s.sourceUrl, checkedAgainst: url, ok: mine === liveTotal });
  }
  // Imágenes: licencia y autor en el HTML de la página del archivo en Commons.
  const imgs = articles.flatMap((a) => a.images.map((i) => ({ a, i })));
  for (const { a, i } of pickDeterministic(imgs, count - results.length, ({ a, i }) => `i${a.conceptRef.code}${i.url}`)) {
    const html = (await http.get(i.sourcePage)).body.toString('utf8');
    const license = i.license.replace('Public domain', 'Public domain');
    const firstAuthorToken = (i.author ?? '').split(/\s+/).slice(0, 2).join(' ');
    const okLicense = html.includes(license) || (/^CC0/.test(license) && html.includes('CC0')) || (/^Public domain/i.test(license) && /public domain|PD-/i.test(html));
    const okAuthor = !i.author || decodeEntities(html).includes(firstAuthorToken);
    results.push({ code: a.conceptRef.code, name: a.conceptRef.slug, kind: 'image', source: 'wikimedia-commons', sentence: `licencia «${i.license}»; autor «${first(i.author ?? '—', 60)}»`, link: i.sourcePage, checkedAgainst: i.sourcePage, ok: okLicense && okAuthor });
  }
  return results;
}

export function renderSamples(results) {
  const rows = results.map((r, n) => `| ${n + 1} | ${r.code} | ${r.kind} · ${r.source} | ${r.sentence.replace(/\|/g, '\\|')} | [fuente](${r.link}) | [${new URL(r.checkedAgainst).host}](${r.checkedAgainst}) | **${r.ok ? 'PASS' : 'FAIL'}** |`);
  const pass = results.filter((r) => r.ok).length;
  return `${[`Resultado: **${pass}/${results.length} PASS** · FAIL: ${results.length - pass}`, '', '| # | Código | Sección · fuente | Oración del artículo (literal) | Enlace | Comparado contra | Veredicto |', '|---|---|---|---|---|---|---|', ...rows].join('\n')}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const results = await checkSamples({ articlesPath: args.articles, hpoArticlesPath: args['hpo-articles'], cacheDir: args['cache-dir'] });
  const md = renderSamples(results);
  if (args.out) writeFileSync(args.out, md);
  else console.log(md);
  process.exitCode = results.every((r) => r.ok) ? 0 : 1;
}
