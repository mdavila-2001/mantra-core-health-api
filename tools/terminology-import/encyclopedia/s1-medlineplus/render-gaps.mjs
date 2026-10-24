#!/usr/bin/env node
// =============================================================================
// Vuelca a Markdown los HUECOS medidos de una corrida (`output/`): qué no se publicó
// completo y por qué. No interpreta: agrupa y cuenta.
//
// Uso:  node render-gaps.mjs [<dir de salida>] > huecos.md
// =============================================================================

import { join } from 'node:path';
import { readNdjson } from '../../lib/glossary-es/common.mjs';
import { DEFAULTS } from './lib/config.mjs';

const out = process.argv[2] ?? DEFAULTS.outDir;
const articles = readNdjson(join(out, 'articles.ndjson'));
const rejected = readNdjson(join(out, 'rejected.ndjson'));
const trace = readNdjson(join(out, 'images-trace.ndjson'));
const md = [];
const by = (rows, key) => rows.reduce((m, r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]), new Map());
const top = (m, n) => [...m.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, n);

// 1. Términos sin artículo.
const articleLevel = rejected.filter((r) => r.scope === 'article');
md.push(`### Términos sin artículo (${articleLevel.length})\n`);
md.push(articleLevel.length ? articleLevel.map((r) => `${r.term} (\`${r.conceptRef?.slug}\`, ${r.category}) — ${r.reason}`).join('\n') : 'Ninguno.');
md.push('');

// 2. Extractos (secciones publicadas con párrafos omitidos).
const sections = articles.flatMap((a) => a.sections.map((s) => ({ ...s, slug: a.conceptRef.slug })));
const excerpts = sections.filter((s) => s.excerpt);
md.push(`### Secciones publicadas como extracto (${excerpts.length} en ${new Set(excerpts.map((s) => s.slug)).size} términos)\n`);
md.push('| Motivo del párrafo omitido | Secciones | Párrafos omitidos |');
md.push('|---|---:|---:|');
for (const reason of new Set(excerpts.flatMap((s) => s.omitted.map((o) => o.reason)))) {
  const rows = excerpts.filter((s) => s.omitted.some((o) => o.reason === reason));
  md.push(`| ${reason} | ${rows.length} | ${rows.reduce((n, s) => n + s.omitted.filter((o) => o.reason === reason).reduce((m, o) => m + o.paragraphs, 0), 0)} |`);
}
md.push('');
md.push('| `kind` del extracto | Secciones |');
md.push('|---|---:|');
for (const [k, rows] of top(by(excerpts, (s) => s.kind), 8)) md.push(`| ${k} | ${rows.length} |`);
md.push('');

// 3. Secciones sin kind específico.
const generic = sections.filter((s) => s.kind === 'additional_information');
md.push(`### Secciones en \`additional_information\` (${generic.length} de ${sections.length}): encabezado sin regla más específica\n`);
md.push('Aparecen con su pregunta exacta en `locator`. Encabezados más repetidos (primeras tres palabras):\n');
md.push('| Encabezado (inicio) | Secciones | Ejemplo literal |');
md.push('|---|---:|---|');
for (const [k, list] of top(by(generic, (s) => s.locator.replace(/\s+/g, ' ').split(' ').slice(0, 3).join(' ')), 15)) {
  md.push(`| ${k} … | ${list.length} | ${list[0].locator.replace(/\s+/g, ' ').replace(/\|/g, '\\|')} |`);
}
md.push('');

// 4. Secciones rechazadas.
const dropped = rejected.filter((r) => r.scope === 'section');
md.push(`### Secciones no publicadas (${dropped.length})\n`);
md.push('| Motivo | Secciones | Dónde |');
md.push('|---|---:|---|');
for (const [k, list] of top(by(dropped, (r) => r.reason), 8)) md.push(`| ${k} | ${list.length} | ${[...new Set(list.map((r) => `${r.term} → ${r.locator}`))].slice(0, 6).join(' · ')} |`);
md.push('');

// 5. Imágenes.
const outcome = by(trace, (t) => `${t.outcome} · ${t.tier}${t.reason ? ` · ${t.reason}` : ''}`);
md.push('### Imágenes: resultado de la selección (por archivo candidato)\n');
md.push('| Resultado | Archivos |');
md.push('|---|---:|');
for (const [k, list] of top(outcome, 12)) md.push(`| ${k} | ${list.length} |`);
md.push('');
const images = rejected.filter((r) => r.scope === 'image');
md.push(`Rechazadas tras consultar Commons (${images.length}):\n`);
md.push('| Motivo · detalle | Imágenes |');
md.push('|---|---:|');
for (const [k, list] of top(by(images, (r) => `${r.reason} · ${r.detail}`), 10)) md.push(`| ${k} | ${list.length} |`);
md.push('');

console.log(md.join('\n'));
