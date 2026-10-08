#!/usr/bin/env node
// =============================================================================
// Vuelca a Markdown los HUECOS medidos de una corrida (`output/rejected.ndjson`):
// qué no se publicó y por qué. No interpreta: agrupa y cuenta.
//
// Uso:  node render-gaps.mjs [<dir de salida>] > huecos.md
// =============================================================================

import { join } from 'node:path';
import { readNdjson } from '../../lib/glossary-es/common.mjs';
import { DEFAULTS } from './lib/config.mjs';
import { familyOf } from './lib/kinds.mjs';

const out = process.argv[2] ?? DEFAULTS.outDir;
const rejected = readNdjson(join(out, 'rejected.ndjson'));
const md = [];
const by = (rows, key) => rows.reduce((m, r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]), new Map());
const top = (m, n) => [...m.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, n);

// 1. Encabezados sin regla, por familia, agrupados por sus tres primeras palabras.
const unmapped = rejected.filter((r) => r.reason === 'unmapped-heading');
md.push(`### Secciones con encabezado sin \`kind\` en el catálogo (${unmapped.length})\n`);
for (const [family, rows] of by(unmapped, (r) => familyOf(r.category)).entries()) {
  md.push(`**Familia «${family}»** — ${rows.length} secciones en ${new Set(rows.map((r) => r.conceptRef.slug)).size} términos. Encabezados más repetidos (primeras tres palabras):\n`);
  md.push('| Encabezado (inicio) | Secciones | Ejemplo literal |');
  md.push('|---|---:|---|');
  for (const [k, list] of top(by(rows, (r) => r.heading.replace(/\s+/g, ' ').split(' ').slice(0, 3).join(' ')), 12)) {
    md.push(`| ${k} … | ${list.length} | ${list[0].heading.replace(/\s+/g, ' ').replace(/\|/g, '\\|')} |`);
  }
  md.push('');
}

// 2. Secciones rechazadas por dosis, por patrón.
const dose = rejected.filter((r) => r.reason === 'dose-or-posology');
md.push(`### Secciones rechazadas por la guardia de dosis (${dose.length})\n`);
md.push('| Patrón | Secciones |');
md.push('|---|---:|');
for (const [k, list] of top(by(dose, (r) => r.detail.split(':')[0]), 5)) md.push(`| ${k} | ${list.length} |`);
const doseDefs = dose.filter((r) => r.kind === 'definition');
md.push(`\nDe ellas, **${doseDefs.length}** eran la definición del término.\n`);

// 3. Artículos que no salieron.
const articleLevel = rejected.filter((r) => r.scope === 'article');
md.push(`### Términos sin artículo (${new Set(articleLevel.filter((r) => r.reason !== 'no-publishable-sections').map((r) => r.conceptRef?.slug).concat(articleLevel.map((r) => r.conceptRef?.slug))).size})\n`);
for (const [reason, rows] of by(articleLevel, (r) => r.reason).entries()) {
  md.push(`**${reason}** — ${rows.length} términos:\n`);
  md.push(rows.map((r) => `${r.term} (\`${r.conceptRef?.slug}\`, ${r.category})`).sort((a, b) => a.localeCompare(b, 'es')).join(' · '));
  md.push('');
}

// 4. Otros rechazos de sección.
const rest = rejected.filter((r) => r.scope === 'section' && !['unmapped-heading', 'dose-or-posology'].includes(r.reason));
md.push(`### Otras secciones no publicadas (${rest.length})\n`);
md.push('| Motivo | Secciones |');
md.push('|---|---:|');
for (const [k, list] of top(by(rest, (r) => r.reason), 8)) md.push(`| ${k} | ${list.length} |`);
md.push('');

// 5. Imágenes.
const images = rejected.filter((r) => r.scope === 'image');
md.push(`### Imágenes rechazadas tras consultar Commons (${images.length})\n`);
md.push('| Motivo · detalle | Imágenes |');
md.push('|---|---:|');
for (const [k, list] of top(by(images, (r) => `${r.reason} · ${r.detail}`), 10)) md.push(`| ${k} | ${list.length} |`);
md.push('');

console.log(md.join('\n'));
