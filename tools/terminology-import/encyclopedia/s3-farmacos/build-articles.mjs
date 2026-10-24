#!/usr/bin/env node
// =============================================================================
// S3 · etapa 2: ensambla `articles.ndjson` y `rejected.ndjson` (contrato §12.3).
//
// Entradas (todas ya en disco, solo lectura):
//   - semilla del glosario (los 2 833 términos de farmacología → `conceptRef`);
//   - `cima.ndjson` (principios activos, productos, fotos) → `slimVtm`;
//   - caché de secciones de `fetch-cima.mjs` (lista blanca; jamás la 4.2);
//   - caché de `fetch-wikidata.mjs`;
//   - `wikidata-images.ndjson` (metadatos de licencia de Commons).
//
// Idempotente y determinista: el mismo insumo produce el mismo archivo, byte a
// byte (no hay marcas de tiempo propias). No carga nada a ninguna base.
//
// Uso: node build-articles.mjs [--limit N] [--out DIR]
// =============================================================================

import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { buildCimaArticle, buildWikidataArticle, validateArticle } from './lib/article.mjs';
import { isoDay, loadSeedPharmacology, loadVtmIndex } from './lib/corpus.mjs';
import { commonsRowToImage } from './lib/images.mjs';
import { CACHE_DIR, GLOSSARY_NDJSON_DIR, OUT_DIR, SEED_PHARMACOLOGY_DIR } from './lib/paths.mjs';
import { ALLOWED_SECTIONS, assertAllowedSection } from './lib/sections.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};

const fold = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ')
    .replace(/\s+/g, ' ')
    .trim();

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const stripQuery = (u) => (u ?? '').split('?')[0];

async function loadCommonsRows(path) {
  const byUrl = new Map();
  const byQ = new Map();
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    byUrl.set(stripQuery(r.imageUrl), r);
    if (!byQ.has(r.wikidataId)) byQ.set(r.wikidataId, []);
    byQ.get(r.wikidataId).push(r);
  }
  return { byUrl, byQ };
}

function readSectionsFor(manifest, nregistro, revisionDates) {
  const out = {};
  for (const code of ALLOWED_SECTIONS) {
    const p = join(CACHE_DIR, 'sections', String(nregistro), `${assertAllowedSection(code)}.json`);
    const meta = manifest[nregistro]?.[code];
    if (!existsSync(p) || !meta) continue;
    const response = readJson(p);
    if (response == null) continue;
    const rev = revisionDates[nregistro];
    out[code] = meta.fichaDate
      ? { response, retrievedAt: meta.retrievedAt, fichaDate: meta.fichaDate, fichaDateOrigin: 'cima-api-docs-fecha' }
      : { response, retrievedAt: meta.retrievedAt, fichaDate: rev?.value ?? null, fichaDateOrigin: rev?.origin };
  }
  return out;
}

function loadWikidata() {
  const dir = join(CACHE_DIR, 'wikidata');
  const entities = {};
  const classLabels = {};
  if (!existsSync(dir)) return { entities, classLabels, retrievedAt: null };
  for (const f of readdirSync(dir).sort()) {
    if (/^entities-\d+\.json$/.test(f)) Object.assign(entities, readJson(join(dir, f)).entities);
    if (/^classes-\d+\.json$/.test(f)) {
      for (const [q, e] of Object.entries(readJson(join(dir, f)).entities)) {
        classLabels[q] = { es: e.labels?.es?.value ?? null, en: e.labels?.en?.value ?? null };
      }
    }
  }
  const sum = join(dir, 'fetch-summary.json');
  return { entities, classLabels, retrievedAt: existsSync(sum) ? readJson(sum).at : null };
}

async function main() {
  const outDir = opt('--out', OUT_DIR);
  const limit = Number(opt('--limit', 0));
  mkdirSync(outDir, { recursive: true });

  const seed = loadSeedPharmacology(SEED_PHARMACOLOGY_DIR);
  const index = await loadVtmIndex(join(GLOSSARY_NDJSON_DIR, 'cima.ndjson'));
  const vtmByCode = new Map(index.map((v) => [v.code, v]));
  const vtmByName = new Map();
  for (const v of index) vtmByName.set(fold(v.esName), [...(vtmByName.get(fold(v.esName)) ?? []), v]);
  const commons = await loadCommonsRows(join(GLOSSARY_NDJSON_DIR, 'wikidata-images.ndjson'));
  const manifestPath = join(CACHE_DIR, 'sections-manifest.json');
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : {};
  const revisionPath = join(CACHE_DIR, 'revision-dates.json');
  const revisionDates = existsSync(revisionPath) ? readJson(revisionPath) : {};
  const wd = loadWikidata();
  const listingDate = isoDay(readJson(join(GLOSSARY_NDJSON_DIR, 'cima.meta.json')).retrievedAt);
  const buildDate = listingDate;

  const articles = [];
  const rejected = [];
  const stats = { terms: 0, articles: 0, withTextSection: 0, factsOnly: 0, noArticle: 0, byCodeSystem: {} };
  const seedRows = limit > 0 ? seed.slice(0, limit) : seed;

  for (const row of seedRows) {
    stats.terms++;
    const cs = (stats.byCodeSystem[row.codeSystem] ??= { terms: 0, articles: 0, withTextSection: 0 });
    cs.terms++;
    let vtm = null;
    let result = null;

    if (row.codeSystem === 'cima-vtm') {
      vtm = vtmByCode.get(row.code) ?? null;
      if (!vtm || row.slug !== `cima-vtm-${row.code}`) {
        rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'article', reason: 'concept-not-resolved' });
        stats.noArticle++;
        continue;
      }
    } else if (row.codeSystem === 'glossary-curated-es') {
      // Término curado a mano: se une al VTM solo si el nombre coincide EXACTO y es único.
      const cands = vtmByName.get(fold(row.esName)) ?? [];
      if (cands.length !== 1) {
        rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'article', reason: cands.length === 0 ? 'no-exact-name-match' : 'ambiguous-name-match', candidates: cands.map((c) => c.code) });
        stats.noArticle++;
        continue;
      }
      vtm = cands[0];
    }

    if (vtm) {
      const sections = readSectionsFor(manifest, vtm.referenceNregistro, revisionDates);
      const extraImages = [];
      if (row.imageOrigin === 'wikimedia-commons') {
        const cRow = commons.byUrl.get(stripQuery(row.imageUrl));
        if (!cRow) rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'image', reason: 'commons-metadata-not-found' });
        else {
          const { image, reason } = commonsRowToImage(cRow, { termName: row.esName, retrievedAt: listingDate });
          if (image) extraImages.push(image);
          else rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'image', reason, url: cRow.imageUrl });
        }
      }
      result = buildCimaArticle({ seedRow: row, vtm, sections, extraImages, listingDate, retrievedAt: buildDate });
    } else if (row.codeSystem === 'wikidata-medicamento') {
      const entity = wd.entities[row.code];
      if (!entity || entity.missing !== undefined) {
        rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'article', reason: 'wikidata-entity-missing' });
        stats.noArticle++;
        continue;
      }
      const images = [];
      const wanted = (commons.byQ.get(row.code) ?? []).sort((a, b) => (a.imageProperty === 'P18' ? 0 : 1) - (b.imageProperty === 'P18' ? 0 : 1)).slice(0, 2);
      for (const cRow of wanted) {
        const { image, reason } = commonsRowToImage(cRow, { termName: row.esName, retrievedAt: isoDay(cRow.retrievedAt) });
        if (image) images.push(image);
        else rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'image', reason, url: cRow.imageUrl });
      }
      result = buildWikidataArticle({ seedRow: row, entity, classLabels: wd.classLabels, images, retrievedAt: wd.retrievedAt });
    } else {
      rejected.push({ conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, scope: 'article', reason: 'unsupported-code-system' });
      stats.noArticle++;
      continue;
    }

    rejected.push(...result.rejected);
    const a = result.article;
    if (a.sections.length === 0 && a.facts.length === 0) {
      rejected.push({ conceptRef: a.conceptRef, scope: 'article', reason: 'no-section-and-no-fact' });
      stats.noArticle++;
      continue;
    }
    articles.push(validateArticle(a));
    stats.articles++;
    cs.articles++;
    if (a.sections.some((s) => s.kind !== 'presentations')) {
      stats.withTextSection++;
      cs.withTextSection++;
    } else stats.factsOnly++;
  }

  writeFileSync(join(outDir, 'articles.ndjson'), articles.map((a) => JSON.stringify(a)).join('\n') + (articles.length ? '\n' : ''));
  writeFileSync(join(outDir, 'rejected.ndjson'), rejected.map((r) => JSON.stringify(r)).join('\n') + (rejected.length ? '\n' : ''));
  writeFileSync(join(outDir, 'build-summary.json'), JSON.stringify({ ...stats, rejectedLines: rejected.length }, null, 2) + '\n');
  console.log(JSON.stringify({ ...stats, rejectedLines: rejected.length }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('ERROR FATAL en build-articles:', err);
    process.exitCode = 1;
  });
}
