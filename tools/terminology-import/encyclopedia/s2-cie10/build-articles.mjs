#!/usr/bin/env node
// =============================================================================
// F9 · S2 — canalización de artículos para las enfermedades de la CIE-10-ES.
//
//   node --max-old-space-size=4096 build-articles.mjs \
//        [--seed-dir <shards>] [--cache-dir <dir>] [--out-dir <dir>] \
//        [--offline] [--hpo-license-ack] [--include-wikipedia-cited] [--wikidata-bridge]
//
// Salida (en --out-dir): articles.ndjson · rejected.ndjson · sources.json ·
// stats.json · COVERAGE.md. Determinista: con la misma caché produce los mismos
// bytes (el orden es el del código CIE-10; no hay marcas de tiempo propias).
//
// NO carga nada a ninguna base ni escribe en el VPS. `--offline` prohíbe la red y
// falla si falta algo en la caché. Sin `--hpo-license-ack` las secciones de
// síntomas (HPO) NO se emiten: su licencia primaria no se pudo leer (ver LICENSES.md). Sin
// `--include-wikipedia-cited` se retienen las definiciones de MONDO/DOID que citan a Wikipedia
// (CC BY-SA): regla §12.2.8, decisión del propietario.
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpClient, ensureDir, writeJson, writeNdjson } from '../../lib/glossary-es/common.mjs';
import { articleKind, buildArticle, meshIdsFor } from './lib/article.mjs';
import { defaultCacheDir, defaultOutDir, defaultSeedDir, parseArgs } from './lib/cli.mjs';
import { SOURCES } from './lib/config.mjs';
import { computeBridges } from './lib/bridge.mjs';
import { computeStats, renderCoverage } from './lib/coverage.mjs';
import { parseTabular } from './lib/icd10cm.mjs';
import { parseDoid } from './lib/doid.mjs';
import { parseBabelon, parseHpJson, parseHpoa } from './lib/hpo.mjs';
import { resolveIdentities } from './lib/identity.mjs';
import { indexIcd10 as indexMondoIcd10, parseMondo } from './lib/mondo.mjs';
import { indexIcd10 as indexOrphaIcd10, parseAges, parseHeader, parsePrevalence, parseProduct1 } from './lib/orphanet.mjs';
import { fetchCommonsInfo, fetchMeshScopeNotes, fetchWikidataBridge } from './lib/remote.mjs';
import { identityReviewRows, renderReviewTsv } from './lib/review.mjs';
import { loadCieTerms } from './lib/seed.mjs';
import { resolveWikidata } from './lib/wikidata.mjs';

/** Cliente que jamás sale a la red: si falta algo en la caché, falla. */
class OfflineHttp {
  async getJsonCached(url, cachePath) {
    if (!existsSync(cachePath)) throw new Error(`--offline y falta la caché: ${cachePath}`);
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }
}

/** Fecha de la consulta a MeSH/Wikidata/Commons: se fija en la primera corrida en línea y se reutiliza (salida determinista). */
function remoteRetrievedAt(cacheDir, offline) {
  const stamp = join(cacheDir, 'remote-retrieved-at.txt');
  if (existsSync(stamp)) return readFileSync(stamp, 'utf8').trim();
  if (offline) throw new Error(`--offline y falta ${stamp}`);
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(stamp, `${today}\n`);
  return today;
}

const read = (dir, file) => readFileSync(join(dir, 'files', file), 'utf8');

export async function buildAll({ seedDir, cacheDir, outDir, offline = false, hpoAck = false, includeWikipediaCited = false, wikidataBridge = false, limit = null, http: injected = null }) {
  const manifest = JSON.parse(readFileSync(join(cacheDir, 'sources-manifest.json'), 'utf8'));
  const day = (name) => manifest[name].retrievedAt;
  const http = injected ?? (offline ? new OfflineHttp() : new HttpClient({ concurrency: 1, minDelayMs: 1000 }));

  console.log('[1/7] términos del glosario (CIE-10-ES)');
  let terms = loadCieTerms(seedDir);
  if (limit) terms = terms.slice(0, limit);

  console.log('[2/7] Orphanet (es_product1, prevalencia, edad de inicio)');
  const product1 = read(cacheDir, manifest['orphanet-es'].file);
  const orphanet = {
    header: parseHeader(product1),
    concepts: parseProduct1(product1),
    prevalence: parsePrevalence(read(cacheDir, manifest['orphanet-prevalence'].file)),
    ages: parseAges(read(cacheDir, manifest['orphanet-ages'].file)),
  };
  const orphaIdx = indexOrphaIcd10(orphanet.concepts);

  console.log('[3/7] MONDO y Disease Ontology');
  const mondo = parseMondo(JSON.parse(read(cacheDir, manifest.mondo.file)));
  const doid = parseDoid(read(cacheDir, manifest['disease-ontology'].file));
  const mondoByCode = indexMondoIcd10(mondo.concepts);

  console.log('[4/7] HPO (etiquetas, traducción oficial y anotaciones)');
  const hpo = {
    en: parseHpJson(JSON.parse(read(cacheDir, manifest['hpo-ontology'].file))).labels,
    es: parseBabelon(read(cacheDir, manifest['hpo-es'].file)),
    hpoa: parseHpoa(read(cacheDir, manifest['hpo-annotations'].file)),
  };

  const icd10cm = manifest['icd10cm-tabular'] ? { ...parseTabular(read(cacheDir, manifest['icd10cm-tabular'].file)), label: 'FY2025' } : null;

  console.log('[5/7] identidad por código CIE-10 exacto');
  const identities = resolveIdentities(terms, {
    orphaConcepts: orphanet.concepts, orphaByCode: orphaIdx.exact, mondoConcepts: mondo.concepts, mondoByCode,
  });

  console.log('[6/7] MeSH (notas de alcance), Wikidata y Commons');
  const bridge = await fetchWikidataBridge(http, cacheDir);
  const wikidata = resolveWikidata(terms, bridge, identities);
  const bridges = wikidataBridge ? computeBridges(terms, identities, wikidata, { orphaConcepts: orphanet.concepts, mondoConcepts: mondo.concepts }) : new Map();
  const meshIds = [...new Set([
    ...[...identities.values()].flatMap((id) => meshIdsFor(id)),
    ...[...bridges.values()].flatMap((b) => [...(b.mondo?.exact.mesh ?? []), ...(b.orpha?.xrefs ?? []).filter((x) => x.source === 'MeSH' && x.exact).map((x) => x.reference), b.meshId].filter(Boolean)),
  ])];
  const mesh = await fetchMeshScopeNotes(http, meshIds, cacheDir);
  const files = [...wikidata.values()].flatMap((w) => w.files);
  const commons = await fetchCommonsInfo(http, files, cacheDir);

  console.log('[7/7] ensamblado');
  const today = remoteRetrievedAt(cacheDir, offline);
  const ctx = {
    hpoAck, includeWikipediaCited, icd10cm, bridges,
    orphanet, mondo, doid, mesh, hpo, commons,
    retrievedAt: {
      'orphanet-es': day('orphanet-es'), 'orphanet-epidemiology-es': day('orphanet-prevalence'), mondo: day('mondo'),
      'disease-ontology': day('disease-ontology'), 'icd10cm-tabular': manifest['icd10cm-tabular']?.retrievedAt ?? today, 'nlm-mesh': today, hpo: day('hpo-annotations'), wikidata: today,
    },
  };
  const articles = [];
  const rejected = [];
  const perTerm = [];
  const flagsAll = { hpoBlockedTerms: 0, wikipediaWithheldSections: 0 };
  for (const term of terms) {
    const identity = identities.get(term.code);
    const wd = wikidata.get(term.code);
    const out = buildArticle(term, identity, wd, ctx);
    if (out.article) articles.push(out.article);
    rejected.push(...out.rejected);
    if (out.flags.hpoBlocked) flagsAll.hpoBlockedTerms++;
    flagsAll.wikipediaWithheldSections += out.flags.wikipediaWithheld;
    perTerm.push({ term, identity, wd, article: out.article, kind: articleKind(out.article) });
  }

  const sources = Object.fromEntries(
    Object.entries(SOURCES).map(([id, s]) => [id, { ...s, retrievedAt: ctx.retrievedAt[id] ?? null }]),
  );
  const stats = computeStats({
    perTerm, rejected, orphanet, orphaIdx, mondoByCode, mesh, hpo, bridge, hpoAck, includeWikipediaCited, bridges, icd10cm, flags: flagsAll,
  });
  const review = identityReviewRows(perTerm);
  stats.identityReview = {
    orphanetLinkedTerms: review.length,
    nameOverlapZero: review.filter((r) => r.overlap === 0).length,
    nameOverlapBelow20pct: review.filter((r) => r.overlap < 0.2).length,
  };
  stats.files = Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, { file: v.file, url: v.url, bytes: v.bytes, sha256: v.sha256, retrievedAt: v.retrievedAt }]));
  stats.versions = {
    orphadata: orphanet.header.date, orphadataVersion: orphanet.header.version, mondo: mondo.version, doid: doid.version,
    hpoa: hpo.hpoa.version, hpoaHpoVersion: hpo.hpoa.hpoVersion,
  };

  ensureDir(outDir);
  await writeNdjson(join(outDir, 'articles.ndjson'), articles);
  await writeNdjson(join(outDir, 'rejected.ndjson'), rejected);
  writeJson(join(outDir, 'sources.json'), sources, true);
  writeJson(join(outDir, 'stats.json'), stats, true);
  writeFileSync(join(outDir, 'COVERAGE.md'), renderCoverage(stats));
  writeFileSync(join(outDir, 'identity-review.tsv'), renderReviewTsv(review));
  console.log(`[ok] ${articles.length} artículos · ${rejected.length} filas en rejected.ndjson → ${outDir}`);
  return { articles, rejected, stats };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  await buildAll({
    seedDir: args['seed-dir'] ?? defaultSeedDir(),
    cacheDir: args['cache-dir'] ?? defaultCacheDir(),
    outDir: args['out-dir'] ?? defaultOutDir(),
    offline: Boolean(args.offline),
    hpoAck: Boolean(args['hpo-license-ack']),
    includeWikipediaCited: Boolean(args['include-wikipedia-cited']),
    wikidataBridge: Boolean(args['wikidata-bridge']),
    limit: args.limit ? Number(args.limit) : null,
  });
}
