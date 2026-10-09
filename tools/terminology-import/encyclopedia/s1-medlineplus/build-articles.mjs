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
import { parseTopics, topicRows as topicRowsFromXml } from '../../lib/glossary-es/medlineplus.mjs';
import { LAB_SOURCE, TOPIC_SOURCE, buildLabArticle, buildTopicArticle } from './lib/article.mjs';
import { DEFAULTS, S1_USER_AGENT } from './lib/config.mjs';
import { validateArticle } from './lib/contract.mjs';
import { measureCoverage, plain } from './lib/coverage.mjs';
import {
  MAX_IMAGES_PER_ARTICLE, buildImage, commonsRequestUrl, entitiesRequestUrl, entityMatchesTopic, imageCandidates, indexMeshImages, parseCommonsResponse, parseEntities,
} from './lib/images.mjs';
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
 * Pedidos por lotes con caché en disco. Cada lote se guarda como `{ retrievedAt, requestUrl, response }`
 * (la fecha de consulta es parte del dato). Primero se lee TODO lo ya cacheado en `subdir`, sin importar
 * con qué lote se pidió; solo lo que falte se pide (si `online`), de a `batchSize`, 1 por segundo y con
 * User-Agent identificable. Lo que siga faltando queda en `missing`.
 * `parse(response)` devuelve un Map(clave → dato); `items` son las claves que se necesitan.
 */
async function cachedBatches(items, { cacheDir, subdir, batchSize, requestUrl, parse, online, nowIso = () => new Date().toISOString() }) {
  const dir = join(cacheDir, subdir);
  const known = new Map();
  const absorb = (entry) => {
    for (const [key, data] of parse(entry.response)) known.set(key, { ...data, retrievedAt: entry.retrievedAt.slice(0, 10) });
  };
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => /^batch-.*\.json$/.test(f)).sort()) absorb(JSON.parse(readFileSync(join(dir, file), 'utf8')));
  }
  const http = new HttpClient({ concurrency: 1, minDelayMs: 1000, headers: { 'User-Agent': S1_USER_AGENT } });
  let toAsk = [...new Set(items)].filter((item) => !known.has(item)).sort();
  if (online) {
    for (let i = 0; i < toAsk.length; i += batchSize) {
      const batch = toAsk.slice(i, i + batchSize);
      const key = createHash('sha1').update(batch.join('\n')).digest('hex').slice(0, 16);
      const url = requestUrl(batch);
      const { body } = await http.get(url, { accept: 'application/json' });
      const entry = { retrievedAt: nowIso(), requestUrl: url, response: JSON.parse(body.toString('utf8')) };
      writeJson(join(dir, `batch-${key}.json`), entry, true);
      absorb(entry);
    }
    toAsk = toAsk.filter((item) => !known.has(item));
  }
  return { known, missing: toAsk, http: http.stats };
}

/** Metadatos de Commons para `files` (50 por pedido). Un archivo que Commons ya no devuelve queda en `missing`. */
export async function loadCommons(files, opts) {
  const { known, missing, http } = await cachedBatches(files, { ...opts, subdir: 'commons', batchSize: COMMONS_BATCH, requestUrl: commonsRequestUrl, parse: parseCommonsResponse });
  return { commons: known, missing, http };
}

/** Etiquetas y alias de Wikidata para `qids` (50 por pedido). */
export async function loadEntities(qids, opts) {
  const { known, missing, http } = await cachedBatches(qids, { ...opts, subdir: 'wikidata-entities', batchSize: 50, requestUrl: entitiesRequestUrl, parse: parseEntities });
  return { entities: known, missing, http };
}

export async function buildAll(opts) {
  const o = { ...DEFAULTS, limit: Infinity, fetchCommons: false, ...opts };
  const xml = latestTopicsXml(o.xmlDir);
  const xmlSha = sha256File(xml.path);
  // Fecha/huella del XML: su sidecar `.meta.json` (lo escribe fetch-xml.mjs) o, en su defecto,
  // el medlineplus-es.meta.json del corpus que descargó import-medlineplus-es.mjs.
  const sidecarPath = `${xml.path}.meta.json`;
  const xmlMeta = existsSync(sidecarPath)
    ? JSON.parse(readFileSync(sidecarPath, 'utf8'))
    : { retrievedAt: JSON.parse(readFileSync(join(o.corpusDir, 'medlineplus-es.meta.json'), 'utf8')).retrievedAt, sha256: JSON.parse(readFileSync(join(o.corpusDir, 'medlineplus-es.meta.json'), 'utf8')).topicsXml?.sha256, url: `https://medlineplus.gov/xml/mplus_topics_${xml.version}.xml` };
  if (xmlMeta.sha256 && xmlMeta.sha256 !== xmlSha) {
    throw new Error(`El XML ${xml.path} no coincide con su sha256 registrado (${xmlSha} ≠ ${xmlMeta.sha256})`);
  }
  const snapshot = { retrievedAt: xmlMeta.retrievedAt, xmlVersion: xml.version };

  const seed = readSeedTerms(o.seedShardsDir);
  const topics = parseTopics(readFileSync(xml.path, 'utf8'));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  // Las filas de los temas salen del propio XML (mismo normalizador que el importador del glosario).
  const topicRows = topicRowsFromXml(topics, { retrievedAt: xmlMeta.retrievedAt, xmlUrl: xmlMeta.url }).slice(0, o.limit);
  const labRows = readNdjson(join(o.corpusDir, 'medlineplus-es-pruebas.ndjson')).slice(0, o.limit);
  const seedTopicsMissingInXml = [...seed.values()].filter((r) => r.source === TOPIC_SOURCE && !topicById.has(r.code));

  const meshIndex = indexMeshImages(o.imageRows ?? []);
  const articles = [];
  const rejected = [];
  const pageChecks = [];
  const imageWork = [];
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
      published: Boolean(result.article), textFrom: result.textFrom ?? null, articleRejection: result.article ? null : result.rejected.at(-1)?.reason ?? null,
    });
    if (!result.article) continue;
    articles.push(result.article);
    imageWork.push({ article: result.article, term: row.esName, enTitle: topic?.mapped?.title ?? null, candidates: imageCandidates({ mesh: topicView.mesh, enTitle: topic?.mapped?.title ?? null }, meshIndex), seedRow });
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
  // 1) nombre del descriptor MeSH == título del tema ('name-match'); 2) si no, el ítem de Wikidata se
  // llama como el tema en castellano o inglés ('label-match'); 3) si no, queda retenida.
  const trace = [];
  const online = o.fetchCommons;
  const needLabels = imageWork.filter((w) => w.candidates.length && !w.candidates.some((c) => c.nameMatch)).flatMap((w) => w.candidates.map((c) => c.wikidataId));
  const labels = o.imageRows?.length ? await loadEntities(needLabels, { cacheDir: o.cacheDir, online }) : { entities: new Map(), missing: [], http: null };
  const chosen = [];
  for (const w of imageWork) {
    const nameMatch = w.candidates.find((c) => c.nameMatch);
    const labelMatch = nameMatch ? null : w.candidates.find((c) => entityMatchesTopic(labels.entities.get(c.wikidataId), { esName: w.term, enTitle: w.enTitle }));
    const pick = nameMatch ?? labelMatch;
    if (pick) chosen.push({ ...w, pick, tier: nameMatch ? 'name-match' : 'label-match' });
    else if (w.candidates.length) trace.push({ slug: w.seedRow.slug, meshId: w.candidates[0].meshId, meshName: w.candidates[0].meshName, wikidataId: w.candidates[0].wikidataId, file: w.candidates[0].rows[0].file, tier: 'name-differs', outcome: 'withheld', reason: labels.missing.length ? 'wikidata-labels-not-verified' : 'mesh-name-and-wikidata-label-differ-from-topic-title' });
  }
  const wantedFiles = chosen.flatMap((c) => c.pick.rows.slice(0, MAX_IMAGES_PER_ARTICLE).map((r) => r.file));
  const { commons, missing, http } = wantedFiles.length ? await loadCommons(wantedFiles, { cacheDir: o.cacheDir, online }) : { commons: new Map(), missing: [], http: null };
  for (const c of chosen) {
    for (const row of c.pick.rows.slice(0, MAX_IMAGES_PER_ARTICLE)) {
      const base = { slug: c.seedRow.slug, meshId: c.pick.meshId, meshName: c.pick.meshName, wikidataId: c.pick.wikidataId, file: row.file, tier: c.tier };
      const built = buildImage({ commons: commons.get(row.file), term: c.term, wikidataId: c.pick.wikidataId });
      if (built.reject) {
        trace.push({ ...base, outcome: 'rejected', reason: built.reject.reason, detail: built.reject.detail });
        rejected.push({ scope: 'image', conceptRef: { system: c.seedRow.codeSystem, code: c.seedRow.code, slug: c.seedRow.slug }, term: c.seedRow.esName, category: c.seedRow.categoryKey, reason: built.reject.reason, detail: built.reject.detail, file: row.file });
        continue;
      }
      // Decisión del propietario (2026-10-09): `label-match` queda APAGADA por defecto; `name-match` se muestra.
      c.article.images.push({ ...built.image, match: c.tier, enabled: c.tier === 'name-match' });
      trace.push({ ...base, outcome: 'accepted', license: built.image.license, sourcePage: built.image.sourcePage });
    }
  }

  articles.sort((a, b) => a.conceptRef.slug.localeCompare(b.conceptRef.slug));
  const contractErrors = articles.flatMap(validateArticle);
  if (contractErrors.length) throw new Error(`El contrato de §12.3 no se cumple (${contractErrors.length} errores). Primeros: ${contractErrors.slice(0, 5).join(' | ')}`);
  const coverage = measureCoverage({ terms: termsInScope, articles, rejected });

  ensureDir(o.outDir);
  await writeNdjson(join(o.outDir, 'articles.ndjson'), articles);
  await writeNdjson(join(o.outDir, 'rejected.ndjson'), rejected);
  await writeNdjson(join(o.outDir, 'pages-verification.ndjson'), pageChecks);
  await writeNdjson(join(o.outDir, 'images-trace.ndjson'), trace);
  const manifest = {
    slice: 'F9-S1-medlineplus',
    sources: { topicsXml: { path: xml.path, version: xml.version, sha256: xmlSha, retrievedAt: xmlMeta.retrievedAt }, glossaryTopicsMissingInXml: seedTopicsMissingInXml.map((r) => r.slug) },
    counts: { termsInScope: termsInScope.length, articles: articles.length, rejected: rejected.length, sections: articles.reduce((n, a) => n + a.sections.length, 0), images: articles.reduce((n, a) => n + a.images.length, 0) },
    commons: { filesRequested: new Set(wantedFiles).size, notInCache: missing.length, http },
    wikidataLabels: { qidsChecked: new Set(needLabels).size, notInCache: labels.missing.length, http: labels.http },
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
