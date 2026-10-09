#!/usr/bin/env node
// =============================================================================
// Vuelca a Markdown las cifras MEDIDAS de una corrida (`output/`): las tablas de
// COVERAGE.md y los conteos de GAPS.md. No interpreta ni redacta: cuenta.
//
// Uso:  node render-evidence.mjs [<dir de salida>] > tablas.md
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readNdjson } from '../../lib/glossary-es/common.mjs';
import { DEFAULTS } from './lib/config.mjs';
import { KIND_ORDER } from './lib/kinds.mjs';

const out = process.argv[2] ?? DEFAULTS.outDir;
const articles = readNdjson(join(out, 'articles.ndjson'));
const rejected = readNdjson(join(out, 'rejected.ndjson'));
const trace = readNdjson(join(out, 'images-trace.ndjson'));
const checks = readNdjson(join(out, 'pages-verification.ndjson'));
const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));

const cats = manifest.coverage.byCategory;
const order = ['disease', 'other', 'signs-symptoms', 'treatment', 'procedure', 'diagnostic-test', 'lab'];
const label = { disease: 'Enfermedades', other: 'Otros', 'signs-symptoms': 'Signos y síntomas', treatment: 'Tratamientos', procedure: 'Procedimientos', 'diagnostic-test': 'Pruebas diagnósticas', lab: 'Laboratorio' };
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1).replace('.', ',')} %` : '—');
const md = [];

md.push('### Términos y artículos por categoría\n');
md.push('| Categoría | Términos | Con artículo | Sin artículo | % con artículo | Secciones | Con imagen |');
md.push('|---|---:|---:|---:|---:|---:|---:|');
let T = 0; let A = 0; let S = 0; let I = 0;
for (const c of order) {
  const r = cats[c];
  if (!r) continue;
  md.push(`| ${label[c]} | ${r.terms} | ${r.withArticle} | ${r.withoutArticle} | ${pct(r.withArticle, r.terms)} | ${r.sectionsTotal} | ${r.withImage} |`);
  T += r.terms; A += r.withArticle; S += r.sectionsTotal; I += r.withImage;
}
md.push(`| **Total** | **${T}** | **${A}** | **${T - A}** | **${pct(A, T)}** | **${S}** | **${I}** |\n`);

md.push('### Secciones por tipo y categoría (términos con al menos una sección de ese `kind`)\n');
const usedCats = order.filter((c) => cats[c]);
md.push(`| \`kind\` | ${usedCats.map((c) => `${label[c]} (${cats[c].withArticle})`).join(' | ')} | Total términos |`);
md.push(`|---|${usedCats.map(() => '---:').join('|')}|---:|`);
for (const kind of KIND_ORDER) {
  const per = usedCats.map((c) => cats[c].kinds[kind] ?? 0);
  if (!per.some(Boolean)) continue;
  md.push(`| \`${kind}\` | ${per.map((n, i) => `${n} (${pct(n, cats[usedCats[i]].withArticle)})`).join(' | ')} | ${per.reduce((a, b) => a + b, 0)} |`);
}
md.push('');
const sections = articles.flatMap((a) => a.sections);
md.push(`Secciones publicadas: **${sections.length}** (${sections.filter((s) => s.excerpt).length} como extracto, ${sections.filter((s) => s.table).length} con tabla). \`additional_information\` (encabezado sin regla más específica): **${sections.filter((s) => s.kind === 'additional_information').length}** (${pct(sections.filter((s) => s.kind === 'additional_information').length, sections.length)}).\n`);

md.push('### Rechazos por alcance y motivo (todo lo que NO se publicó)\n');
const reasons = new Map();
for (const r of rejected) reasons.set(`${r.scope} · ${r.reason}`, (reasons.get(`${r.scope} · ${r.reason}`) ?? 0) + 1);
md.push('| Alcance · motivo | Casos |');
md.push('|---|---:|');
for (const [k, n] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${n} |`);
md.push('');

md.push('### Imágenes\n');
const outcomes = new Map();
for (const t of trace) outcomes.set(`${t.outcome}${t.reason ? ` · ${t.reason}` : ''}`, (outcomes.get(`${t.outcome}${t.reason ? ` · ${t.reason}` : ''}`) ?? 0) + 1);
md.push('| Resultado de la selección | Términos |');
md.push('|---|---:|');
for (const [k, n] of [...outcomes.entries()].sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${n} |`);
md.push('');
const images = articles.flatMap((a) => a.images);
const count = (fn) => images.reduce((m, i) => m.set(fn(i), (m.get(fn(i)) ?? 0) + 1), new Map());
md.push('| Licencia declarada en Commons | Imágenes |');
md.push('|---|---:|');
for (const [k, n] of [...count((i) => i.license).entries()].sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${n} |`);
md.push('');
md.push('| Host (original · miniatura) | Imágenes |');
md.push('|---|---:|');
for (const [k, n] of [...count((i) => `${new URL(i.url).hostname} · ${new URL(i.thumbUrl).hostname}`).entries()]) md.push(`| ${k} | ${n} |`);
md.push('');
md.push(`Imágenes fuera de la CSP: **${images.filter((i) => !['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es'].includes(new URL(i.url).hostname) || !['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es'].includes(new URL(i.thumbUrl).hostname)).length}** de ${images.length}.\n`);

md.push('### Verificación de páginas\n');
const verified = checks.filter((c) => c.verified).length;
md.push(`Páginas verificadas: **${verified}** de ${checks.length}. Con mención de A.D.A.M. en la página: **${checks.filter((c) => c.adamInPage).length}**; en el resumen: **${checks.filter((c) => c.adamInSummary).length}**. Resúmenes con enlaces a artículos de la enciclopedia (\`/ency/\`, A.D.A.M.): **${checks.filter((c) => c.encyLinks > 0).length}** temas (${checks.reduce((n, c) => n + (c.encyLinks ?? 0), 0)} enlaces; se publica el texto de la NLM, nunca el artículo enlazado).\n`);

console.log(md.join('\n'));
