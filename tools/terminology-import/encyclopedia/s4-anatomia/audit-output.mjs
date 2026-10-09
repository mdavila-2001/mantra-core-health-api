#!/usr/bin/env node
// Auditoría INDEPENDIENTE de la salida: relee `articles.ndjson` (y `held.ndjson`)
// desde disco y vuelve a comprobar el contrato, sin pasar por el armado.
//   node audit-output.mjs
// Sale con código 1 si encuentra una sola violación. Comprueba:
//  - cada `conceptRef` resuelve contra la semilla (sistema + código + slug) y no es de S1;
//  - cada sección: kind en el catálogo de su categoría, seis campos de procedencia,
//    sin posible dosis, idioma es|en, `items` solo de texto;
//  - cada imagen: host en la CSP, licencia permitida, autor y URL de licencia donde
//    la licencia los exige, fecha ISO;
//  - sin precios de INLASA en ningún hecho;
//  - sin líneas duplicadas por término.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR } from './lib/config.mjs';
import { licenseFamily, isAllowedImageHost } from './lib/commons.mjs';
import { allowedKinds, looksLikeDose, validateFact, validateSection } from './lib/contract.mjs';
import { buildUniverse, loadSeedRows, resolveConceptRef } from './lib/terms.mjs';

const readLines = (file) =>
  readFileSync(join(OUT_DIR, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const universe = buildUniverse(loadSeedRows());
const violations = [];
const fail = (slug, what) => violations.push(`${slug}: ${what}`);

const counts = { articles: 0, sections: 0, images: 0, facts: 0, byHost: {}, byFamily: {} };
const seen = new Set();

for (const file of ['articles.ndjson', 'held.ndjson']) {
  for (const article of readLines(file)) {
    const slug = article.conceptRef?.slug ?? '?';
    counts.articles++;
    const row = resolveConceptRef(article.conceptRef, universe);
    if (!row) {
      fail(slug, 'conceptRef no resuelve contra la semilla de S4 (o es de S1)');
      continue;
    }
    if (seen.has(slug)) fail(slug, 'término duplicado');
    seen.add(slug);
    if (article.lang !== 'es') fail(slug, `lang de artículo inválido ${article.lang}`);

    for (const section of article.sections) {
      counts.sections++;
      for (const problem of validateSection(section, row.categoryKey)) fail(slug, `sección ${section.kind}: ${problem}`);
      if (!allowedKinds(row.categoryKey).includes(section.kind)) fail(slug, `kind ${section.kind} fuera del catálogo`);
    }
    for (const fact of article.facts) {
      counts.facts++;
      for (const problem of validateFact(fact)) fail(slug, problem);
      if (/arancel|precio|\bBs\.?\b/i.test(`${fact.label} ${fact.value}`) && row.codeSystem === 'inlasa-aranceles-2026') fail(slug, `INLASA: hecho con precio «${fact.label}»`);
      if (looksLikeDose(fact.value)) fail(slug, `hecho con posible dosis «${fact.label}»`);
    }
    for (const image of article.images) {
      counts.images++;
      const host = new URL(image.url).hostname;
      counts.byHost[host] = (counts.byHost[host] ?? 0) + 1;
      if (!isAllowedImageHost(image.url)) fail(slug, `imagen fuera de la CSP: ${image.url}`);
      if (!isAllowedImageHost(image.thumbUrl)) fail(slug, `miniatura fuera de la CSP: ${image.thumbUrl}`);
      const family = licenseFamily(image.license);
      if (!family) fail(slug, `licencia de imagen no permitida: ${image.license}`);
      else counts.byFamily[family] = (counts.byFamily[family] ?? 0) + 1;
      if ((family === 'cc by' || family === 'cc by-sa') && (!image.author || !image.licenseUrl)) fail(slug, `imagen ${family} sin autor o sin URL de licencia`);
      if (!['photo', 'diagram', 'histology', 'imaging'].includes(image.kind)) fail(slug, `kind de imagen inválido ${image.kind}`);
      if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(image.sourcePage ?? '')) fail(slug, `sin página de origen de Commons: ${image.sourcePage}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(image.retrievedAt ?? '')) fail(slug, 'imagen sin retrievedAt ISO');
      if (image.altTextQuality === 'caption' && image.altText !== image.caption) fail(slug, 'altText de calidad «caption» distinto del caption');
      if (image.altTextQuality === 'generic' && !image.altText.startsWith('Imagen de ')) fail(slug, 'altText genérico mal formado');
    }
  }
}

console.log(JSON.stringify(counts, null, 2));
if (violations.length > 0) {
  console.error(`AUDITORÍA: ${violations.length} violaciones`);
  for (const v of violations.slice(0, 50)) console.error(' -', v);
  process.exit(1);
}
console.log('AUDITORÍA: 0 violaciones');
