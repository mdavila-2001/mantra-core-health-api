#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · informe de cobertura (sin red, sin base).
//
// Lee las monografías, su meta, el universo de ATC 5 y —si existen— los NDJSON
// del catálogo de productos (`medicines-<fuente>.ndjson` de
// build-medicine-catalog.mjs) y escribe out/coverage.json + out/coverage.md:
//   · principios activos por nivel ATC
//   · secciones completas e incompletas por fuente
//   · ATC 5 sin match con el catálogo de productos (en los dos sentidos)
//   · huecos (esenciales de Bolivia sin monografía, fichas sin bajar, etc.)
//
// Uso: node tools/terminology-import/clinical-pharmacology/coverage-report.mjs
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, writeJson } from '../lib/glossary-es/common.mjs';
import { readJsonIfExists } from './lib/cli.mjs';
import { streamNdjson } from './lib/ndjson-stream.mjs';
import { readAllInputs } from './lib/inputs.mjs';
import { COVERAGE_JSON, MONOGRAPHS_META, MONOGRAPHS_NDJSON, cpOut } from './lib/paths.mjs';
import { REQUIRED_SECTIONS, SECTION_KEYS } from './lib/sections.mjs';

const MEDICINE_SOURCES = ['cima', 'invima', 'anvisa'];

function productAtc5() {
  const bySource = {};
  for (const src of MEDICINE_SOURCES) {
    const path = join(BUILD_DIR, 'ndjson', `medicines-${src}.ndjson`);
    if (!existsSync(path)) continue;
    const set = new Set();
    for (const line of readFileSync(path, 'utf8').split('\n')) if (line.trim()) for (const a of JSON.parse(line).atc ?? []) set.add(a);
    bySource[src] = set;
  }
  return bySource;
}

export function coverage({ monographs, meta, universe, liname, products }) {
  const byCode = new Map(monographs.map((m) => [m.code, m]));
  const levels = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
  for (const m of monographs) for (const p of m.atcPath) levels[p.level].add(p.code);
  const namedLevels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const seen = new Set();
  for (const m of monographs) for (const p of m.atcPath) if (p.name && !seen.has(p.code)) (seen.add(p.code), namedLevels[p.level]++);

  const sources = {};
  for (const m of monographs) {
    for (const [src, cov] of Object.entries(m.coverage)) {
      sources[src] ??= { monographs: 0, complete: 0, incomplete: 0, byRequirement: Object.fromEntries(Object.keys(REQUIRED_SECTIONS).map((k) => [k, 0])), sectionsByKey: {}, missingExamples: [] };
      const s = sources[src];
      s.monographs++;
      const missing = Object.entries(cov).filter(([, ok]) => !ok).map(([k]) => k);
      for (const [k, ok] of Object.entries(cov)) if (ok) s.byRequirement[k]++;
      if (missing.length === 0) s.complete++;
      else {
        s.incomplete++;
        if (s.missingExamples.length < 25) s.missingExamples.push({ code: m.code, display: m.display, missing });
      }
    }
    for (const sec of m.sections) {
      const s = sources[sec.source];
      s.sectionsByKey[sec.key] = (s.sectionsByKey[sec.key] ?? 0) + 1;
    }
  }

  const productMatch = {};
  for (const [src, set] of Object.entries(products)) {
    const withoutMonograph = [...set].filter((c) => !byCode.has(c)).sort();
    productMatch[src] = {
      atc5InCatalog: set.size,
      atc5WithMonograph: set.size - withoutMonograph.length,
      atc5WithoutMonograph: withoutMonograph.length,
      withoutMonographCodes: withoutMonograph,
    };
  }
  const anyProduct = new Set(Object.values(products).flatMap((s) => [...s]));
  const monographsWithoutProduct = Object.keys(products).length ? monographs.filter((m) => !anyProduct.has(m.code)).map((m) => m.code).sort() : null;

  const essentialWithout = [...liname.keys()].filter((c) => !byCode.has(c)).sort();
  const universeWithout = [...universe.entries()].filter(([c]) => !byCode.has(c));

  return {
    generatedAt: new Date().toISOString(),
    universe: { atc5: universe.size, byOrigin: [...universe.values()].flat().reduce((a, o) => ({ ...a, [o]: (a[o] ?? 0) + 1 }), {}) },
    monographs: monographs.length,
    atcLevels: Object.fromEntries(Object.entries(levels).map(([l, s]) => [`level${l}`, { codes: s.size, withOfficialName: namedLevels[l] }])),
    languages: monographs.flatMap((m) => m.sections).reduce((a, s) => ({ ...a, [s.language]: (a[s.language] ?? 0) + 1 }), {}),
    sources,
    sectionKeys: Object.keys(SECTION_KEYS),
    productMatch,
    monographsWithoutProductInCatalog: monographsWithoutProduct,
    gaps: {
      linameEssentialWithoutMonograph: essentialWithout,
      universeWithoutMonograph: universeWithout.length,
      universeWithoutMonographByOrigin: universeWithout.flatMap(([, o]) => o).reduce((a, o) => ({ ...a, [o]: (a[o] ?? 0) + 1 }), {}),
      fromBuild: meta ?? null,
    },
  };
}

function markdown(c) {
  const lines = [`# Cobertura · farmacología clínica (${c.generatedAt.slice(0, 10)})`, ''];
  lines.push(`Universo ATC 5: **${c.universe.atc5}** (${Object.entries(c.universe.byOrigin).map(([k, v]) => `${k} ${v}`).join(', ')}). Monografías: **${c.monographs}**.`, '');
  lines.push('| Nivel ATC | Códigos | Con nombre oficial |', '|---|---:|---:|');
  for (const [l, v] of Object.entries(c.atcLevels)) lines.push(`| ${l.replace('level', '')} | ${v.codes} | ${v.withOfficialName} |`);
  lines.push('');
  for (const [src, s] of Object.entries(c.sources)) {
    lines.push(`## ${src}`, '', `Monografías con al menos una sección: ${s.monographs} · completas: ${s.complete} · incompletas: ${s.incomplete}`, '');
    lines.push('| Requisito | Monografías que lo cubren |', '|---|---:|');
    for (const [k, v] of Object.entries(s.byRequirement)) lines.push(`| ${k} | ${v} |`);
    lines.push('');
  }
  lines.push('## Catálogo de productos', '');
  if (Object.keys(c.productMatch).length === 0) lines.push('No se encontraron `medicines-*.ndjson`: no se midió el cruce.');
  for (const [src, p] of Object.entries(c.productMatch)) lines.push(`- ${src}: ${p.atc5InCatalog} ATC 5 en el catálogo; ${p.atc5WithoutMonograph} sin monografía.`);
  lines.push('', '## Huecos', '', `- LINAME (esenciales de Bolivia) sin monografía: ${c.gaps.linameEssentialWithoutMonograph.length}`, `- Universo sin monografía: ${c.gaps.universeWithoutMonograph}`);
  if (c.gaps.fromBuild) for (const [k, v] of Object.entries(c.gaps.fromBuild)) if (typeof v === 'number') lines.push(`- ${k}: ${v}`);
  return lines.join('\n') + '\n';
}

async function main() {
  // En flujo: el NDJSON pasa de los 512 MiB de una cadena de V8. Del texto sólo se necesitan fuente, clave e idioma.
  const monographs = [];
  if (existsSync(MONOGRAPHS_NDJSON())) {
    for await (const m of streamNdjson(MONOGRAPHS_NDJSON())) {
      monographs.push({ code: m.code, display: m.display, atcPath: m.atcPath, coverage: m.coverage, sections: m.sections.map((x) => ({ source: x.source, key: x.key, language: x.language })) });
    }
  }
  const meta = readJsonIfExists(MONOGRAPHS_META());
  const { universe, liname } = readAllInputs();
  const c = coverage({ monographs, meta, universe, liname, products: productAtc5() });
  writeJson(COVERAGE_JSON(), c, true);
  writeFileSync(cpOut('coverage.md'), markdown(c));
  console.log(markdown(c));
}

main().catch((err) => {
  console.error('ERROR FATAL en coverage-report:', err);
  process.exitCode = 1;
});
