#!/usr/bin/env node
// =============================================================================
// S3 · informe de cobertura MEDIDO (no estimado) sobre `out/articles.ndjson`,
// `out/rejected.ndjson` y la semilla del glosario. Escribe `out/coverage.json`.
// =============================================================================

import { createReadStream, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { loadSeedPharmacology } from './lib/corpus.mjs';
import { OUT_DIR, SEED_PHARMACOLOGY_DIR } from './lib/paths.mjs';

async function readLines(file, fn) {
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim()) fn(JSON.parse(line));
}

const inc = (o, k, n = 1) => {
  o[k] = (o[k] ?? 0) + n;
};

export async function coverage(outDir = OUT_DIR) {
  const seed = loadSeedPharmacology(SEED_PHARMACOLOGY_DIR);
  const seedBySlug = new Map(seed.map((r) => [r.slug, r]));
  const rows = {};
  const row = (cs) =>
    (rows[cs] ??= {
      terms: 0, baselineWithDefinition: 0, baselineWithImage: 0,
      articles: 0, withTextSection: 0, factsOnly: 0, withImage: 0,
      noDefinitionBefore_gainsTextSection: 0, noImageBefore_gainsImage: 0,
      sectionsByKind: {},
    });
  for (const r of seed) {
    const c = row(r.codeSystem);
    c.terms++;
    if (r.definition && r.definition.trim()) c.baselineWithDefinition++;
    if (r.imageUrl) c.baselineWithImage++;
  }
  const total = row('TOTAL');
  total.terms = seed.length;
  total.baselineWithDefinition = Object.values(rows).reduce((n, c) => n + (c === total ? 0 : c.baselineWithDefinition), 0);
  total.baselineWithImage = Object.values(rows).reduce((n, c) => n + (c === total ? 0 : c.baselineWithImage), 0);

  const licenses = {};
  const hosts = {};
  const imageKinds = {};
  const sectionVersionOrigin = {};
  const sectionVersionPrecision = { day: 0, month: 0 };
  let omitted = 0;
  const articleSlugs = new Set();
  await readLines(join(outDir, 'articles.ndjson'), (a) => {
    const seedRow = seedBySlug.get(a.conceptRef.slug);
    articleSlugs.add(a.conceptRef.slug);
    for (const c of [row(a.conceptRef.system), total]) {
      c.articles++;
      const text = a.sections.some((s) => s.kind !== 'presentations');
      if (text) c.withTextSection++;
      else c.factsOnly++;
      if (a.images.length) c.withImage++;
      if (text && !(seedRow?.definition && seedRow.definition.trim())) c.noDefinitionBefore_gainsTextSection++;
      if (a.images.length && !seedRow?.imageUrl) c.noImageBefore_gainsImage++;
      for (const s of a.sections) inc(c.sectionsByKind, s.kind);
    }
    for (const s of a.sections) {
      omitted += s.omittedSentences ?? 0;
      if (s.sourceVersionOrigin) inc(sectionVersionOrigin, s.sourceVersionOrigin);
      if (s.source === 'aemps-cima') inc(sectionVersionPrecision, /^\d{4}-\d{2}-\d{2}$/.test(s.sourceVersion) ? 'day' : 'month');
    }
    for (const img of a.images) {
      inc(licenses, img.license);
      inc(hosts, new URL(img.url).hostname);
      inc(imageKinds, img.kind);
    }
  });

  const rejectedReasons = {};
  const sentenceStats = {};
  const droppedByPattern = {};
  const sectionLoss = {};
  await readLines(join(outDir, 'rejected.ndjson'), (r) => {
    inc(rejectedReasons, `${r.scope}:${r.reason}`);
    if (r.scope === 'sentences') {
      const s = (sentenceStats[r.section] ??= { sentences: 0, dropped: 0, sectionsAffected: 0 });
      s.sentences += r.sentenceCount;
      s.dropped += r.droppedCount;
      s.sectionsAffected++;
      for (const [k, v] of Object.entries(r.byReason)) inc(droppedByPattern, k, v);
    }
    if (r.scope === 'section') inc(sectionLoss, `${r.section}:${r.reason}`);
  });

  const out = {
    seedTerms: seed.length,
    byCodeSystem: rows,
    termsWithoutArticle: seed.filter((r) => !articleSlugs.has(r.slug)).length,
    images: { byLicense: licenses, byHost: hosts, byKind: imageKinds },
    omittedSentencesInPublishedSections: omitted,
    sentenceStatsBySection: sentenceStats,
    droppedByPattern,
    sectionsLostBeforePublishing: sectionLoss,
    rejectedReasons,
    sourceVersionOrigin: sectionVersionOrigin,
    sourceVersionPrecision: sectionVersionPrecision,
  };
  writeFileSync(join(outDir, 'coverage.json'), JSON.stringify(out, null, 2) + '\n');
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  coverage(process.argv[2] ?? OUT_DIR).then((r) => console.log(JSON.stringify(r, null, 2)));
}
