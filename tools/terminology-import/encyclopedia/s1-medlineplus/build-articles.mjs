#!/usr/bin/env node
// =============================================================================
// F9 · Corte S1 — artículos enciclopédicos de MedlinePlus en español.
//
// Lee el corpus que ya descargó `import-medlineplus-es.mjs` (XML de temas del
// 2026-09-30 y guías de pruebas), la semilla del glosario y las páginas
// verificadas, y escribe:
//   articles.ndjson   un artículo por término, contrato de TAREA-41 §12.3
//   rejected.ndjson   todo lo que NO se publicó, con su motivo (artículo, sección o imagen)
//   manifest.json     versiones, hashes y conteos de esta corrida
//   pages-verification.ndjson   resultado de la verificación página por página
//   images-trace.ndjson         de qué MeSH/Q-id sale cada imagen y por qué se aceptó o no
//
// NO carga nada a ninguna base. Es idempotente: con las mismas entradas y la
// misma caché, `articles.ndjson` sale byte a byte igual.
//
// Uso:  node build-articles.mjs [--fetch-commons] [--limit N] [--out DIR]
//   --fetch-commons  consulta la API de Commons (1 petición/s, caché en disco)
//                    para los archivos que falten en caché; sin esta opción
//                    solo se usa lo ya cacheado y el resto queda «no verificado».
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpClient, ensureDir, readNdjson, sha256File, writeJson, writeNdjson } from '../../lib/glossary-es/common.mjs';
import { parseTopics } from '../../lib/glossary-es/medlineplus.mjs';
import { LAB_SOURCE, TOPIC_SOURCE, buildLabArticle, buildTopicArticle } from './lib/article.mjs';
import { DEFAULTS, S1_USER_AGENT } from './lib/config.mjs';
import { measureCoverage, plain } from './lib/coverage.mjs';
import { buildImage, commonsRequestUrl, imageCandidate, indexMeshImages, parseCommonsResponse } from './lib/images.mjs';
import { isoFromSpanishDate, parseTopicPage, topicPageCachePath } from './lib/pages.mjs';

const MEDLINEPLUS_SOURCES = new Set([TOPIC_SOURCE, LAB_SOURCE]);
const COMMONS_BATCH = 50;

function readSeedTerms(shardsDir) {
  const terms = new Map();
  for (const dir of readdirSync(shardsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of readdirSync(join(shardsDir, dir.name))) {
      if (!/^page-\d+\.json$/.test(file)) continue;
      for (const row of JSON.parse(readFileSync(join(shardsDir, dir.name, file), 'utf8'))) {
        if (MEDLINEPLUS_SOURCES.has(row.source)) terms.set(row.slug, row);
      }
    }
  }
  return terms;
}

function latestTopicsXml(dir) {
  const files = readdirSync(dir).filter((f) => /^mplus_topics_\d{4}-\d{2}-\d{2}\.xml$/.test(f)).sort();
  if (!files.length) throw new Error(`No hay mplus_topics_<fecha>.xml en ${dir}`);
  const file = files.at(-1);
  return { path: join(dir, file), version: file.match(/(\d{4}-\d{2}-\d{2})/)[1] };
}

/**
 * Metadatos de Commons para `files`, de a 50 por pedido. Cada lote se guarda en
 * disco como `{ retrievedAt, requestUrl, response }`: la fecha de consulta forma
 * parte del dato (la usa `images[].retrievedAt`) y la corrida es reproducible con
 * la misma caché. Sin `online`, lo que no esté en caché queda en `missing`.
 */
export async function loadCommons(files, { cacheDir, online, nowIso = () => new Date().toISOString() }) {
  const sorted = [...new Set(files)].sort();
  const http = new HttpClient({ concurrency: 1, minDelayMs: 1000, headers: { 'User-Agent': S1_USER_AGENT } });
  const merged = new Map();
  const missing = [];
  for (let i = 0; i < sorted.length; i += COMMONS_BATCH) {
    const batch = sorted.slice(i, i + COMMONS_BATCH);
    const key = createHash('sha1').update(batch.join('\n')).digest('hex').slice(0, 16);
    const cachePath = join(cacheDir, 'commons', `batch-${key}.json`);
    let entry;
    if (existsSync(cachePath)) {
      entry = JSON.parse(readFileSync(cachePath, 'utf8'));
    } else if (online) {
      const requestUrl = commonsRequestUrl(batch);
      const { body } = await http.get(requestUrl, { accept: 'application/json' });
      entry = { retrievedAt: nowIso(), requestUrl, response: JSON.parse(body.toString('utf8')) };
      writeJson(cachePath, entry, true);
    } else {
      missing.push(...batch);
      continue;
    }
    for (const [name, data] of parseCommonsResponse(entry.response)) merged.set(name, { ...data, retrievedAt: entry.retrievedAt.slice(0, 10) });
  }
  return { commons: merged, missing, http: http.stats };
}

export async function buildAll(opts) {
  const o = { ...DEFAULTS, xmlDir: join(DEFAULTS.corpusDir, '..', 'cache', 'medlineplus'), limit: Infinity, fetchCommons: false, ...opts };
  const meta = JSON.parse(readFileSync(join(o.corpusDir, 'medlineplus-es.meta.json'), 'utf8'));
  const xml = latestTopicsXml(o.xmlDir);
  const xmlSha = sha256File(xml.path);
  if (meta.topicsXml?.sha256 && meta.topicsXml.sha256 !== xmlSha) {
    throw new Error(`El XML ${xml.path} no coincide con el sha256 de medlineplus-es.meta.json (${xmlSha} ≠ ${meta.topicsXml.sha256})`);
  }
  const snapshot = { retrievedAt: meta.retrievedAt, xmlVersion: xml.version };

  const seed = readSeedTerms(o.seedShardsDir);
  const topics = parseTopics(readFileSync(xml.path, 'utf8'));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const topicRows = readNdjson(join(o.corpusDir, 'medlineplus-es.ndjson')).slice(0, o.limit);
  const labRows = readNdjson(join(o.corpusDir, 'medlineplus-es-pruebas.ndjson')).slice(0, o.limit);

  const meshIndex = indexMeshImages(o.imageRows ?? []);
  const articles = [];
  const rejected = [];
  const pageChecks = [];
  const imageCandidates = [];
  const termsInScope = [];

  for (const row of topicRows) {
    const seedRow = seed.get(row.slug);
    if (!seedRow) {
      rejected.push({ scope: 'article', conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, reason: 'concept-not-in-glossary' });
      continue;
    }
    termsInScope.push(seedRow);
    const topic = topicById.get(row.code);
    const english = topic?.mapped ? topicById.get(topic.mapped.id) : null;
    const topicView = { ...topic, mesh: english?.mesh ?? [] };
    const pagePath = topicPageCachePath(o.cacheDir, row.code);
    const page = existsSync(pagePath) ? parseTopicPage(readFileSync(pagePath, 'utf8')) : null;
    const result = buildTopicArticle({ seedRow, corpusRow: row, topic: topicView, page, snapshot });
    rejected.push(...result.rejected);
    pageChecks.push({
      slug: row.slug, topicId: row.code, url: row.sourceUrl, verified: Boolean(page), lastUpdated: page?.lastUpdated ?? null,
      attributions: page?.attributions ?? [], adamInPage: page?.adamInPage ?? null, adamInSummary: page?.adamInSummary ?? null,
      encyLinks: page?.encyLinks ?? null, primaryImage: page?.primaryImage ?? null,
      published: Boolean(result.article), articleRejection: result.article ? null : result.rejected.at(-1)?.reason ?? null,
    });
    if (!result.article) continue;
    articles.push(result.article);
    imageCandidates.push({ article: result.article, term: row.esName, candidate: imageCandidate({ mesh: topicView.mesh, enTitle: topic?.mapped?.title ?? null }, meshIndex), seedRow });
  }

  for (const row of labRows) {
    const seedRow = seed.get(row.slug);
    if (!seedRow) {
      rejected.push({ scope: 'article', conceptRef: { system: row.codeSystem, code: row.code, slug: row.slug }, reason: 'concept-not-in-glossary' });
      continue;
    }
    termsInScope.push(seedRow);
    const htmlPath = join(o.labCacheDir, `${row.code}.html`);
    const pageHtml = existsSync(htmlPath) ? readFileSync(htmlPath, 'utf8') : null;
    const result = buildLabArticle({ seedRow, corpusRow: row, pageHtml, updatedIso: isoFromSpanishDate(row.sourceUpdatedAt), snapshot });
    rejected.push(...result.rejected);
    pageChecks.push({ slug: row.slug, topicId: row.code, url: row.sourceUrl, verified: Boolean(pageHtml), lastUpdated: row.sourceUpdatedAt ?? null, published: Boolean(result.article), articleRejection: result.article ? null : result.rejected.at(-1)?.reason ?? null });
    if (result.article) articles.push(result.article);
  }

  // --- Imágenes -----------------------------------------------------------
  const trace = [];
  const wanted = imageCandidates.filter((c) => c.candidate?.tier === 'name-match');
  const { commons, missing, http } = o.imageRows?.length
    ? await loadCommons(wanted.map((c) => c.candidate.row.file), { cacheDir: o.cacheDir, online: o.fetchCommons })
    : { commons: new Map(), missing: [], http: null };
  for (const c of imageCandidates) {
    if (!c.candidate) continue;
    const base = { slug: c.seedRow.slug, meshId: c.candidate.meshId, meshName: c.candidate.meshName, wikidataId: c.candidate.row.wikidataId, file: c.candidate.row.file, tier: c.candidate.tier };
    if (c.candidate.tier !== 'name-match') {
      trace.push({ ...base, outcome: 'withheld', reason: 'mesh-name-differs-from-topic-title' });
      continue;
    }
    const built = buildImage({ commons: commons.get(c.candidate.row.file), term: c.term, wikidataId: c.candidate.row.wikidataId });
    if (built.reject) {
      trace.push({ ...base, outcome: 'rejected', reason: built.reject.reason, detail: built.reject.detail });
      rejected.push({ scope: 'image', conceptRef: { system: c.seedRow.codeSystem, code: c.seedRow.code, slug: c.seedRow.slug }, reason: built.reject.reason, detail: built.reject.detail, file: c.candidate.row.file });
      continue;
    }
    c.article.images.push(built.image);
    trace.push({ ...base, outcome: 'accepted', license: built.image.license, sourcePage: built.image.sourcePage });
  }

  articles.sort((a, b) => a.conceptRef.slug.localeCompare(b.conceptRef.slug));
  const coverage = measureCoverage({ terms: termsInScope, articles, rejected });

  ensureDir(o.outDir);
  await writeNdjson(join(o.outDir, 'articles.ndjson'), articles);
  await writeNdjson(join(o.outDir, 'rejected.ndjson'), rejected);
  await writeNdjson(join(o.outDir, 'pages-verification.ndjson'), pageChecks);
  await writeNdjson(join(o.outDir, 'images-trace.ndjson'), trace);
  const manifest = {
    slice: 'F9-S1-medlineplus',
    sources: { topicsXml: { path: xml.path, version: xml.version, sha256: xmlSha }, corpusRetrievedAt: meta.retrievedAt },
    counts: { termsInScope: termsInScope.length, articles: articles.length, rejected: rejected.length, sections: articles.reduce((n, a) => n + a.sections.length, 0), images: articles.reduce((n, a) => n + a.images.length, 0) },
    commons: { filesRequested: [...new Set(wanted.map((c) => c.candidate.row.file))].length, notInCache: missing.length, http },
    coverage: plain(coverage),
  };
  writeJson(join(o.outDir, 'manifest.json'), manifest, true);
  return { articles, rejected, pageChecks, trace, manifest, coverage };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--fetch-commons') out.fetchCommons = true;
    else if (argv[i] === '--limit') out.limit = Number(argv[++i]);
    else if (argv[i] === '--out') out.outDir = argv[++i];
    else if (argv[i] === '--no-images') out.noImages = true;
    else throw new Error(`Argumento desconocido: ${argv[i]}`);
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = parseArgs(process.argv.slice(2));
  const imageRows = args.noImages || !existsSync(DEFAULTS.imagesNdjson) ? [] : readNdjson(DEFAULTS.imagesNdjson);
  const { manifest } = await buildAll({ ...args, imageRows });
  console.log(JSON.stringify(manifest.counts, null, 2));
}
