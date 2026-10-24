#!/usr/bin/env node
// =============================================================================
// Catálogo de enfermedades · reporte de cobertura y saturación (sin red, sin base).
//
// Lee el NDJSON de `build-catalog.mjs` y calcula:
//  - por pasada (orden de PASSES): conceptos nuevos tras deduplicar por código
//    y por cruce publicado. Dos conceptos son «el mismo» si una fuente publica
//    entre ellos (o vía una clave cruzada común: OMIM, UMLS, MeSH, CIE…) un
//    alineamiento de equivalencia o un xref sin semántica declarada; los
//    alineamientos «más amplio/estrecho/inexacto» NO deduplican. Nunca por nombre.
//  - conceptos por sistema y por capítulo/rama de cada clasificación;
//  - cruces publicados por par de sistemas y equivalencia;
//  - cobertura de cada sistema contra MONDO (referencia amplia).
//
// Escribe `<BUILD_DIR>/diseases-coverage.json` y `diseases-coverage.md`.
// Uso: node tools/terminology-import/diseases/coverage-report.mjs
// =============================================================================

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, nowIso, readNdjson, writeJson } from '../lib/glossary-es/common.mjs';
import { SYSTEMS } from './lib/code-systems.mjs';
import { measureGard, measureHetionet, measureMeshC, measureMonarchEdges, measureNando, measureOncotree } from './lib/measure.mjs';
import { readObo } from './lib/obo.mjs';
import { addToSnapshot } from './lib/snapshot.mjs';
import { MEASURE_FILES, NDJSON_DIR, SOURCES_DIR } from './lib/sources.mjs';

/**
 * Orden de las pasadas de saturación (docs/seed-research/diseases.md):
 * `cs` = ontología cargada; `citer` = fuente que cita códigos (claves);
 * `measure` = fuente sólo medida, no cargada.
 */
export const PASSES = [
  { cs: 'mondo' },
  { cs: 'orphanet' },
  { cs: 'doid' },
  { cs: 'ncit-disease' },
  { cs: 'icd11-mms' },
  { cs: 'efo-disease' },
  { citer: 'hpo-annotations' },
  { measure: 'nando' },
  { citer: 'phenopacket-store' },
  { measure: 'oncotree' },
  { measure: 'hetionet' },
  { citer: 'who-icd10-to-icd11', cs: 'icd10-who' },
  { measure: 'mesh-c' },
  { measure: 'gard' },
  { citer: 'hpo-common-diseases' },
  { measure: 'monarch-clingen' },
  { measure: 'monarch-clinvar' },
  { measure: 'monarch-alliance' },
  { measure: 'monarch-cureid' },
];
const SYSTEM_PASSES = PASSES.filter((p) => p.cs && !p.citer).map((p) => p.cs);
const DEDUP_EQUIVALENCES = new Set(['equivalent', null]);

class UnionFind {
  constructor() {
    this.p = new Map();
  }
  find(x) {
    if (!this.p.has(x)) this.p.set(x, x);
    let r = x;
    while (this.p.get(r) !== r) r = this.p.get(r);
    while (this.p.get(x) !== r) {
      const n = this.p.get(x);
      this.p.set(x, r);
      x = n;
    }
    return r;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

const key = (cs, code) => `${cs}|${code}`;

/** Descendientes (incluido el propio) de cada raíz, sobre `parents` de un sistema. */
function descendantsOf(records, roots) {
  const children = new Map();
  for (const r of records) for (const p of r.parents) (children.get(p) ?? children.set(p, []).get(p)).push(r.code);
  const out = {};
  for (const root of roots) {
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
      const c = stack.pop();
      if (seen.has(c)) continue;
      seen.add(c);
      stack.push(...(children.get(c) ?? []));
    }
    out[root] = seen;
  }
  return out;
}

export function computeCoverage(bySystem, citations = {}, measured = {}) {
  const active = (cs) => (bySystem[cs] ?? []).filter((r) => r.status === 'active');
  const uf = new UnionFind();
  const crosses = {};
  for (const rows of Object.values(bySystem)) {
    for (const r of rows) {
      uf.find(key(r.cs, r.code));
      for (const x of r.xrefs) {
        if (x.resolution === 'unresolved' || x.resolution === 'external') continue;
        const pair = `${r.cs} → ${x.cs}`;
        crosses[pair] ??= {};
        crosses[pair][x.equivalence ?? 'sin equivalencia declarada'] = (crosses[pair][x.equivalence ?? 'sin equivalencia declarada'] ?? 0) + 1;
        if (r.status === 'active' && DEDUP_EQUIVALENCES.has(x.equivalence ?? null)) uf.union(key(r.cs, r.code), key(x.cs, x.code));
      }
    }
  }

  // Un código retirado se sigue por su reemplazo publicado (`replaced_by`); uno
  // retirado sin reemplazo ya está en el catálogo como obsoleto: no es nuevo.
  const replacement = new Map();
  const retired = new Set();
  for (const rows of Object.values(bySystem)) {
    for (const r of rows) {
      if (r.status === 'active') continue;
      if (r.replacedBy) replacement.set(key(r.cs, r.code), key(r.cs, r.replacedBy));
      else retired.add(key(r.cs, r.code));
    }
  }
  const current = (k) => replacement.get(k) ?? k;
  const seenComponents = new Set();
  const passes = PASSES.map((p, i) => {
    const label = p.citer ?? p.measure ?? p.cs;
    let items;
    let version = null;
    if (p.measure) {
      // Ítem nuevo si ninguno de sus cruces cae en un componente ya visto.
      items = measured[p.measure] ?? [];
      const known = (l) => {
        const k = current(key(l.cs, l.code));
        return retired.has(k) || (uf.p.has(k) && seenComponents.has(uf.find(k)));
      };
      const fresh = items.filter((it) => !it.links.some(known)).length;
      return { pass: i + 1, source: label, kind: 'medida (no se carga)', version, items: items.length, newConcepts: fresh, newEntities: fresh };
    }
    if (p.citer) {
      const cited = p.citer === 'who-icd10-to-icd11' ? (bySystem['icd10-who'] ?? []).filter((r) => r.properties.disease_xref_key?.citedBy?.[p.citer]) : (citations[p.citer] ?? []);
      items = cited.map((c) => ({ cs: c.cs, code: c.code }));
    } else {
      items = active(p.cs);
      version = items[0]?.provenance.version ?? null;
    }
    let newConcepts = 0;
    const newComponents = new Set();
    const newByChapter = {};
    for (const it of items) {
      const k = p.citer ? current(key(it.cs, it.code)) : key(it.cs, it.code);
      // Una cita a un código que ninguna ontología cargó es un concepto nuevo y sin componente.
      const c = uf.p.has(k) ? uf.find(k) : k;
      if (!(p.citer && retired.has(k)) && !seenComponents.has(c)) {
        newConcepts += 1;
        newComponents.add(c);
        const ch = it.properties?.icd11_classification?.chapterNo;
        if (ch) newByChapter[ch] = (newByChapter[ch] ?? 0) + 1;
      }
    }
    newComponents.forEach((c) => seenComponents.add(c));
    return {
      pass: i + 1,
      source: label,
      kind: p.citer ? 'claves citadas' : 'ontología',
      version,
      items: items.length,
      newConcepts,
      newEntities: newComponents.size,
      ...(Object.keys(newByChapter).length ? { newByChapter } : {}),
    };
  });

  // Cobertura contra MONDO: concepto vigente de cada sistema cuyo componente contiene un MONDO vigente.
  const mondoComponents = new Set(active('mondo').map((r) => uf.find(key('mondo', r.code))));
  const vsMondo = Object.fromEntries(
    SYSTEM_PASSES.filter((cs) => cs !== 'mondo').map((cs) => {
      const rows = active(cs);
      const linked = rows.filter((r) => mondoComponents.has(uf.find(key(r.cs, r.code)))).length;
      return [cs, { active: rows.length, linkedToMondo: linked, pct: rows.length ? Math.round((1000 * linked) / rows.length) / 10 : null }];
    }),
  );
  const mondoLinked = active('mondo').filter((r) => r.xrefs.some((x) => x.resolution === 'internal' && x.equivalence === 'equivalent')).length;

  // Por capítulo / rama.
  const chapters = {};
  const icd = active('icd11-mms');
  const chapterTitle = new Map(icd.filter((r) => r.properties.icd11_classification.classKind === 'chapter').map((r) => [r.properties.icd11_classification.chapterNo, r.display]));
  chapters['icd11-mms'] = {};
  for (const r of icd) {
    const c = r.properties.icd11_classification;
    const k = `${c.chapterNo} ${chapterTitle.get(c.chapterNo) ?? ''}`.trim();
    const e = (chapters['icd11-mms'][k] ??= { chapter: 0, block: 0, category: 0, linkedToMondo: 0 });
    e[c.classKind] += 1;
    if (c.classKind === 'category' && mondoComponents.has(uf.find(key(r.cs, r.code)))) e.linkedToMondo += 1;
  }
  chapters.orphanet = {};
  for (const r of active('orphanet')) {
    for (const cl of r.properties.orphanet_classification?.classifications ?? []) chapters.orphanet[cl.name] = (chapters.orphanet[cl.name] ?? 0) + 1;
  }
  const branch = (cs, roots) => {
    const rows = active(cs);
    const name = new Map(rows.map((r) => [r.code, r.display]));
    const d = descendantsOf(rows, roots);
    return Object.fromEntries(roots.map((root) => [`${root} ${name.get(root) ?? ''}`.trim(), d[root].size]));
  };
  const childrenOf = (cs, parent) => active(cs).filter((r) => r.parents.includes(parent)).map((r) => r.code);
  chapters.mondo = branch('mondo', [...childrenOf('mondo', 'MONDO:7770006'), 'MONDO:7770007', 'MONDO:7770008']);
  chapters.doid = branch('doid', childrenOf('doid', 'DOID:4'));
  chapters['ncit-disease'] = branch('ncit-disease', childrenOf('ncit-disease', 'C2991'));

  const systems = Object.fromEntries(
    Object.entries(bySystem).map(([cs, rows]) => [
      cs,
      {
        name: SYSTEMS[cs]?.name ?? cs,
        keyOnly: Boolean(SYSTEMS[cs]?.keyOnly),
        concepts: rows.length,
        active: rows.filter((r) => r.status === 'active').length,
        withSpanishName: rows.filter((r) => r.designations.some((d) => d.lang === 'es')).length,
        withDefinition: rows.filter((r) => r.definition).length,
        withSpanishDefinition: rows.filter((r) => r.definitionLang === 'es').length,
      },
    ]),
  );
  return { passes, systems, chapters, crosses, vsMondo, mondoWithEquivalentInAnotherSystem: mondoLinked };
}

function toMarkdown(c) {
  const lines = ['## Pasadas (nuevos = sin cruce publicado de equivalencia hacia una pasada anterior)', '', '| Pasada | Fuente | Tipo | Versión | Ítems | Conceptos nuevos | Entidades nuevas |', '|---|---|---|---|---:|---:|---:|'];
  for (const p of c.passes) lines.push(`| ${p.pass} | \`${p.source}\` | ${p.kind} | ${p.version ?? '—'} | ${p.items} | ${p.newConcepts} | ${p.newEntities} |`);
  lines.push('', '## Conceptos por sistema', '', '| Sistema | Clave cruzada | Conceptos | Vigentes | Con nombre ES | Con definición | Definición ES |', '|---|---|---:|---:|---:|---:|---:|');
  for (const [cs, s] of Object.entries(c.systems)) lines.push(`| \`${cs}\` | ${s.keyOnly ? 'sí' : 'no'} | ${s.concepts} | ${s.active} | ${s.withSpanishName} | ${s.withDefinition} | ${s.withSpanishDefinition} |`);
  lines.push('', '## Cobertura contra MONDO', '', '| Sistema | Vigentes | Enlazados a MONDO | % |', '|---|---:|---:|---:|');
  for (const [cs, v] of Object.entries(c.vsMondo)) lines.push(`| \`${cs}\` | ${v.active} | ${v.linkedToMondo} | ${v.pct} |`);
  lines.push('', `MONDO vigentes con al menos una equivalencia publicada hacia otro sistema cargado: ${c.mondoWithEquivalentInAnotherSystem}.`);
  lines.push('', '## CIE-11 MMS por capítulo', '', '| Capítulo | Bloques | Categorías | Categorías enlazadas a MONDO |', '|---|---:|---:|---:|');
  for (const [k, v] of Object.entries(c.chapters['icd11-mms'])) lines.push(`| ${k} | ${v.block} | ${v.category} | ${v.linkedToMondo} |`);
  for (const cs of ['orphanet', 'mondo', 'doid', 'ncit-disease']) {
    lines.push('', `## ${cs} por rama (un concepto puede estar en varias)`, '', '| Rama | Conceptos |', '|---|---:|');
    for (const [k, v] of Object.entries(c.chapters[cs]).sort((a, b) => b[1] - a[1])) lines.push(`| ${k} | ${v} |`);
  }
  lines.push('', '## Cruces publicados (origen → destino, por equivalencia)', '', '| Par | Equivalencias |', '|---|---|');
  for (const [pair, eq] of Object.entries(c.crosses).sort()) lines.push(`| ${pair} | ${Object.entries(eq).map(([k, v]) => `${k}: ${v}`).join(' · ')} |`);
  return lines.join('\n') + '\n';
}

async function main() {
  const bySystem = {};
  for (const f of readdirSync(NDJSON_DIR).filter((n) => n.endsWith('.ndjson'))) bySystem[f.replace(/\.ndjson$/, '')] = readNdjson(join(NDJSON_DIR, f));
  const { citations } = JSON.parse(readFileSync(join(BUILD_DIR, 'diseases-citations.json'), 'utf8'));
  const measuredPath = (k) => join(SOURCES_DIR, MEASURE_FILES.find((f) => f.key === k).file);
  const measured = {
    nando: measureNando(measuredPath('nando'), bySystem.mondo),
    oncotree: measureOncotree(measuredPath('oncotree'), bySystem.mondo),
    hetionet: measureHetionet(measuredPath('hetionet'), bySystem.doid),
    gard: measureGard(measuredPath('gard'), bySystem.doid, bySystem.orphanet),
    ...Object.fromEntries(['monarch-clingen', 'monarch-clinvar', 'monarch-alliance', 'monarch-cureid'].map((k) => [k, measureMonarchEdges(measuredPath(k), bySystem.doid)])),
  };
  const meshTerms = [];
  await readObo(measuredPath('mesh-c'), (t) => t.id.startsWith('mesh:D') && meshTerms.push(t));
  const mesh = measureMeshC(meshTerms);
  if (mesh.missingHeads.length) console.warn(`[mesh-c] cabezas del árbol C sin verificar por nombre: ${mesh.missingHeads.join(', ')}`);
  measured['mesh-c'] = mesh.items;
  const coverage = computeCoverage(bySystem, citations, measured);
  writeJson(join(BUILD_DIR, 'diseases-coverage.json'), { generatedAt: nowIso(), ...coverage }, true);
  writeFileSync(join(BUILD_DIR, 'diseases-coverage.md'), toMarkdown(coverage));
  addToSnapshot('diseases-coverage.json', join(BUILD_DIR, 'diseases-coverage.json'));
  addToSnapshot('diseases-coverage.md', join(BUILD_DIR, 'diseases-coverage.md'));
  console.table(coverage.passes);
  console.log(JSON.stringify(coverage.vsMondo, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('coverage-report.mjs')) {
  main().catch((err) => {
    console.error('ERROR FATAL en coverage-report:', err);
    process.exitCode = 1;
  });
}
