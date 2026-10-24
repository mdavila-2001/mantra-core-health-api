#!/usr/bin/env node
// =============================================================================
// Reescribe la sección de cobertura de `docs/seed-research/diagnostic-devices-us.md`
// (entre `<!-- coverage:start -->` y `<!-- coverage:end -->`) a partir de
// `out/coverage.json` y `out/fda-product-codes.json`. No inventa cifras: todo
// sale de esos dos archivos.
//
//   node tools/terminology-import/diagnostic-devices/us/coverage-report.mjs
// =============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_ROOT, OUT_DIR } from './lib/paths.mjs';
import { PANELS, SUBPARTS } from './lib/scope.mjs';

const DOC = join(API_ROOT, 'docs/seed-research/diagnostic-devices-us.md');
const cov = JSON.parse(readFileSync(join(OUT_DIR, 'coverage.json'), 'utf8'));
const pcs = JSON.parse(readFileSync(join(OUT_DIR, 'fda-product-codes.json'), 'utf8'));
const fmt = (n) => Number(n).toLocaleString('es-BO').replace(/\./g, ' ');

const lines = [];
const t = cov.totals;
lines.push('## Cobertura (generada por `coverage-report.mjs`)', '');
lines.push('| | Cantidad |', '|---|---|');
lines.push(`| Registros (filas del NDJSON) | ${fmt(t.rows)} |`);
for (const [s, n] of Object.entries(t.bySource)) lines.push(`| · \`${s}\` | ${fmt(n)} |`);
lines.push(`| UDI-DI (con modelo/versión) | ${fmt(t.udiDi)} |`);
lines.push(`| Fabricantes distintos (razón social normalizada exacta) | ${fmt(t.manufacturers)} |`);
lines.push(`| Marcas distintas (fabricante + nombre comercial) | ${fmt(t.brands)} |`);
lines.push(`| Registros con país del fabricante | ${fmt(t.withCountry)} |`);
lines.push(`| Product codes vistos / incluidos / excluidos | ${fmt(cov.productCodes.seen)} / ${fmt(cov.productCodes.included)} / ${fmt(cov.productCodes.excluded)} |`);
lines.push('');

// Product codes por panel: incluidos y excluidos.
lines.push('### Product codes por panel (incluidos / excluidos)', '');
lines.push('| Panel | Incluidos | Excluidos | Registros de equipos |', '|---|---|---|---|');
const byPanel = {};
for (const p of pcs) {
  const k = p.panel ?? '—';
  byPanel[k] ??= { inc: 0, exc: 0 };
  byPanel[k][p.include ? 'inc' : 'exc']++;
}
for (const [k, v] of Object.entries(byPanel).sort((a, b) => b[1].inc - a[1].inc || a[0].localeCompare(b[0]))) {
  lines.push(`| ${k === '—' ? 'sin panel publicado' : `${k} — ${PANELS[k] ?? k}`} | ${v.inc} | ${v.exc} | ${fmt(cov.byPanel[k] ?? 0)} |`);
}
lines.push('');

// Criterio por subparte (incluidas y excluidas), con conteo de códigos.
lines.push('### Criterio: subpartes de 21 CFR incluidas y excluidas', '');
lines.push('| Parte.subparte | Título | ¿Entra? | Product codes |', '|---|---|---|---|');
const byRule = {};
for (const p of pcs) byRule[p.rule] = (byRule[p.rule] ?? 0) + 1;
for (const [part, subs] of Object.entries(SUBPARTS)) {
  for (const [d, sp] of Object.entries(subs)) {
    lines.push(`| ${part}.${d}xxx | ${sp.title} | ${sp.include ? 'sí' : 'no'} | ${byRule[`subpart:${part}.${d}`] ?? 0} |`);
  }
}
lines.push('');
lines.push('Excepciones (regulación o product code), con su motivo:', '');
lines.push('| Regla | ¿Entra? | Motivo | Product codes |', '|---|---|---|---|');
const seen = new Set();
for (const p of pcs) {
  if (!/^(regulation|product_code):/.test(p.rule) || seen.has(p.rule)) continue;
  seen.add(p.rule);
  lines.push(`| \`${p.rule}\` | ${p.include ? 'sí' : 'no'} | ${p.reason} | ${pcs.filter((x) => x.rule === p.rule).map((x) => x.productCode).join(', ')} |`);
}
const unclassified = pcs.filter((p) => p.rule.startsWith('panel:'));
lines.push('');
lines.push(
  `Sin regulación: ${unclassified.filter((p) => p.include).length} product codes entran por panel in vitro; ${unclassified.filter((p) => !p.include).length} quedan fuera (panel no in vitro o sin clasificación publicada). ` +
    `Subpartes no verificadas: ${pcs.filter((p) => p.rule.endsWith(':unverified')).map((p) => `${p.productCode} (${p.regulationNumber})`).join(', ') || 'ninguna'}.`,
);
lines.push('', 'La lista completa, código por código con nombre, panel, clase, regulación, regla y motivo: `tools/terminology-import/diagnostic-devices/us/out/fda-product-codes.json`.', '');

// Top product codes por registros.
lines.push('### Tipos con más registros', '');
lines.push('| Product code | Nombre FDA | Registros |', '|---|---|---|');
const name = Object.fromEntries(pcs.map((p) => [p.productCode, p.deviceName]));
for (const [k, n] of Object.entries(cov.byProductCode).slice(0, 40)) lines.push(`| ${k} | ${name[k] ?? '—'} | ${fmt(n)} |`);
lines.push('');
lines.push('### Fabricantes con más registros', '');
lines.push('| Fabricante (clave normalizada) | Registros |', '|---|---|');
for (const [k, n] of Object.entries(cov.topManufacturers).slice(0, 40)) lines.push(`| ${k} | ${fmt(n)} |`);
lines.push('');
lines.push('### Clase de riesgo y estado', '');
lines.push(`Clase: ${Object.entries(cov.byRiskClass).map(([k, n]) => `\`${k}\` ${fmt(n)}`).join(' · ')}.`, '');
lines.push(`Estado (verbatim de la fuente): ${Object.entries(cov.byStatus).slice(0, 12).map(([k, n]) => `${k} ${fmt(n)}`).join(' · ')}.`, '');
lines.push('### Huecos', '');
lines.push('| Fuente | URL | Motivo |', '|---|---|---|');
for (const g of cov.gaps) lines.push(`| \`${g.source}\` | ${g.url ?? '—'} | ${g.reason} |`);

const doc = readFileSync(DOC, 'utf8');
const block = `<!-- coverage:start -->\n${lines.join('\n')}\n<!-- coverage:end -->`;
const next = doc.includes('<!-- coverage:start -->') ? doc.replace(/<!-- coverage:start -->[\s\S]*<!-- coverage:end -->/, block) : `${doc.trimEnd()}\n\n${block}\n`;
writeFileSync(DOC, next);
console.log(`Cobertura escrita en ${DOC}`);
