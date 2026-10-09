#!/usr/bin/env node
// Genera `COVERAGE.md` (cifras MEDIDAS, no estimadas) desde `out/stats.json`, la
// semilla y el catálogo de secciones. No hace red.
//   node report-coverage.mjs
// Salida: <EVIDENCE_DIR>/COVERAGE.md

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVIDENCE_DIR, OUT_DIR, S4_CATEGORIES } from './lib/config.mjs';
import { KIND_CATALOG_BY_CATEGORY, SECTION_KINDS } from './lib/contract.mjs';
import { buildUniverse, loadSeedRows } from './lib/terms.mjs';

const stats = JSON.parse(readFileSync(join(OUT_DIR, 'stats.json'), 'utf8'));
const universe = buildUniverse(loadSeedRows());

const pct = (n, d) => (d === 0 ? '—' : `${((100 * n) / d).toFixed(1).replace('.', ',')} %`);
const n = (v) => Number(v).toLocaleString('es-BO').replace(/ /g, ' ');
const table = (header, rows) =>
  [`| ${header.join(' | ')} |`, `|${header.map((_, i) => (i === 0 ? '---' : '---:')).join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

// --- 1. Línea base de la semilla (S4) -----------------------------------------
const base = {};
for (const row of universe.mine) {
  const b = (base[row.categoryKey] ??= { terms: 0, def: 0, img: 0 });
  b.terms++;
  if (row.definition && String(row.definition).trim() !== '') b.def++;
  if (row.imageUrl) b.img++;
}
const baseRows = S4_CATEGORIES.map((c) => [c, n(base[c]?.terms ?? 0), n(base[c]?.def ?? 0), n(base[c]?.img ?? 0)]);
const baseTotals = Object.values(base).reduce((a, b) => ({ terms: a.terms + b.terms, def: a.def + b.def, img: a.img + b.img }), { terms: 0, def: 0, img: 0 });
baseRows.push([`**Total S4**`, `**${n(baseTotals.terms)}**`, `**${n(baseTotals.def)}** (${pct(baseTotals.def, baseTotals.terms)})`, `**${n(baseTotals.img)}** (${pct(baseTotals.img, baseTotals.terms)})`]);

// --- 2. Resultado por categoría ------------------------------------------------
const per = stats.perCategory;
const resultRows = S4_CATEGORIES.map((c) => {
  const p = per[c] ?? { terms: 0, articles: 0, held: 0, withTextSection: 0, withDefinition: 0, withImage: 0, factsOnly: 0, noArticle: 0 };
  return [c, n(p.terms), n(p.articles), n(p.withTextSection), n(p.withDefinition), n(p.withImage), n(p.factsOnly), n(p.held), n(p.noArticle)];
});
const sum = (key) => Object.values(per).reduce((a, p) => a + (p[key] ?? 0), 0);
resultRows.push(['**Total S4**', `**${n(sum('terms'))}**`, `**${n(sum('articles'))}**`, `**${n(sum('withTextSection'))}**`, `**${n(sum('withDefinition'))}**`, `**${n(sum('withImage'))}**`, `**${n(sum('factsOnly'))}**`, `**${n(sum('held'))}**`, `**${n(sum('noArticle'))}**`]);

// --- 2b. Calidad de la definición --------------------------------------------
const quality = ['es-sustancial', 'es-corta', 'solo-en', 'ninguna'];
const qualityRows = S4_CATEGORIES.filter((c) => (per[c]?.articles ?? 0) > 0).map((c) => {
  const q = per[c].definitionQuality ?? {};
  const withArticle = per[c].articles;
  const none = withArticle - quality.slice(0, 3).reduce((a, k) => a + (q[k] ?? 0), 0);
  return [c, n(withArticle), n(q['es-sustancial'] ?? 0), n(q['es-corta'] ?? 0), n(q['solo-en'] ?? 0), n(none)];
});

// --- 3. Por tipo de sección ----------------------------------------------------
const sectionBlocks = [];
for (const [catalogName, kinds] of Object.entries(SECTION_KINDS)) {
  const categories = S4_CATEGORIES.filter((c) => KIND_CATALOG_BY_CATEGORY[c] === catalogName);
  const header = ['Sección', ...categories, 'Total'];
  const rows = kinds.map((kind) => {
    const counts = categories.map((c) => per[c]?.kinds?.[kind] ?? 0);
    return [`\`${kind}\``, ...counts.map(n), `**${n(counts.reduce((a, b) => a + b, 0))}**`];
  });
  sectionBlocks.push(`### ${catalogName}\n\n${table(header, rows)}`);
}

const out = `# COVERAGE — corte S4 (cifras medidas el ${stats.retrievedAt})

> Generado por \`tools/terminology-import/encyclopedia/s4-anatomia/report-coverage.mjs\` desde
> \`out/stats.json\` (sha256 de \`articles.ndjson\`: \`${stats.sha256.articles}\`). Nada de esto es
> estimación: cada número sale de recorrer la semilla y el \`articles.ndjson\` producido.

## 1. Universo

- Filas de la semilla en las 9 categorías del corte: **${n(stats.universe.total)}**
- Excluidas por ser de S1 (\`codeSystem\` \`medlineplus-es\` o \`medlineplus-es-lab\`): **${n(stats.universe.excludedS1)}**
- **Términos de S4: ${n(stats.universe.s4)}**

### Línea base de la semilla (S4, antes de esta fase)

${table(['Categoría', 'Términos', 'Con definición', 'Con imagen'], baseRows)}

## 2. Resultado

Columnas: **Artículos** = términos con artículo en \`articles.ndjson\`; **Con texto** = artículos con al menos
una sección de texto; **Definición** = con sección \`definition\`; **Imagen** = con al menos una imagen
verificada; **Solo facts** = artículo sin sección ni imagen (solo hechos con fuente); **Retenidos** =
artículo válido que sale a \`held.ndjson\` por licencia sin verificar (INLASA); **Sin artículo** =
\`rejected.ndjson\` con motivo (sin fuente abierta, curado interno, etc.).

${table(['Categoría', 'Términos', 'Artículos', 'Con texto', 'Definición', 'Imagen', 'Solo facts', 'Retenidos', 'Sin artículo'], resultRows)}

### Calidad de la definición (medida)

«Con definición» no es lo mismo que «definido»: Wikidata trae descripciones de dos o tres palabras
(«órgano glandular», «compuesto químico») y MeSH/HPO solo existen en inglés. Se mide la **mejor**
definición de cada artículo: **es sustancial** = castellano de 30 caracteres o más; **es corta** =
castellano de menos de 30; **solo en** = definición solo en inglés (sin traducción oficial, sin traducción
automática); **ninguna** = el artículo no tiene sección \`definition\`.

${table(['Categoría', 'Artículos', 'Es sustancial', 'Es corta', 'Solo en', 'Ninguna'], qualityRows)}

## 3. Artículos por tipo de sección

Un artículo cuenta una vez por tipo de sección, aunque tenga varias (p. ej. dos fuentes de definición).
Las secciones del catálogo §12.3 que no aparecen con cifras **no tienen ninguna fuente abierta** en este
corte (ver \`GAPS.md\`).

${sectionBlocks.join('\n\n')}

## 4. Secciones por fuente e idioma

${table(['Fuente / idioma', 'Secciones'], Object.entries(stats.sectionLanguages).map(([k, v]) => [k, n(v)]))}

## 5. Imágenes

- Total de imágenes en artículos: **${n(stats.images.total)}**

${table(['Licencia', 'Imágenes'], Object.entries(stats.images.byLicense).map(([k, v]) => [k, n(v)]))}

${table(['Host', 'Imágenes'], Object.entries(stats.images.byHost).map(([k, v]) => [k, n(v)]))}

${table(['Tipo (kind)', 'Imágenes'], Object.entries(stats.images.byKind).map(([k, v]) => [k, n(v)]))}

## 6. Rechazos (todos quedan en \`rejected.ndjson\`)

${table(['Nivel:motivo', 'Cantidad'], Object.entries(stats.rejectionReasons).map(([k, v]) => [`\`${k}\``, n(v)]))}
`;

writeFileSync(join(EVIDENCE_DIR, 'COVERAGE.md'), out);
console.log(`COVERAGE.md escrito en ${EVIDENCE_DIR}`);
