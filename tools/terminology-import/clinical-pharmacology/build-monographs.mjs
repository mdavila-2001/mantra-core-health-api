#!/usr/bin/env node
// =============================================================================
// Farmacología clínica · etapa 2 (sin red): cachés → monografías NDJSON.
//
// Una monografía por ATC 5 del universo (CIMA ∪ maestra ATC ∪ LINAME ∪
// vademecum) que tenga al menos un medicamento de CIMA o una sección de alguna
// fuente. Cada sección es literal de UN documento de UNA fuente; no se fusiona.
// Lo que falta (sin ficha bajada, sin versión, sin ATC 5, sin UNII) se cuenta
// en el meta para el informe de cobertura.
//
// Salida: clinical-pharmacology/out/monographs.ndjson + monographs.meta.json
// Uso: node tools/terminology-import/clinical-pharmacology/build-monographs.mjs [--granularity route|product]
// =============================================================================

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { readNdjson, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { cimaSafetyNotes, cimaSections, groupByAtc5, referenceDocuments } from './lib/cima.mjs';
import { listJson, parseArgs, readJsonIfExists, retrievedAtOf } from './lib/cli.mjs';
import { buildGsrsIndex, combineLinks, gsrsDisplayFor, linkUniiSet, moietiesOf, rxnavIndex } from './lib/gsrs.mjs';
import { readAllInputs, readBridge } from './lib/inputs.mjs';
import { zipResults } from './lib/json-stream.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from './lib/monograph.mjs';
import { labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from './lib/openfda.mjs';
import { MONOGRAPHS_META, MONOGRAPHS_NDJSON, cpOut, ftPath, ftSectionPath, notesPath, openFdaDir } from './lib/paths.mjs';

const { opt, has } = parseArgs();
const GRANULARITY = opt('--granularity', 'route');
/** `--no-cima`: arma sin CIMA (para medir por separado lo que aporta cada fuente en el registro de pasadas). */
const NO_CIMA = has('--no-cima');

/** Ficha completa + secciones sueltas de respaldo, en ese orden (la completa gana). */
function readCimaDoc(nreg) {
  const path = ftPath(nreg);
  if (!existsSync(path)) return null;
  const parts = [readJsonIfExists(path)];
  const dir = join(ftSectionPath(nreg, 'x'), '..');
  for (const name of listJson(dir)) parts.push(readJsonIfExists(join(dir, name)));
  const retrievedAt = [path, ...listJson(dir).map((n) => join(dir, n))].map(retrievedAtOf).sort().at(-1);
  return { doc: parts.filter(Array.isArray).flat(), retrievedAt };
}

/** Itera las etiquetas de cada partición bajada, en streaming (una etiqueta por vez). */
async function* openFdaLabels() {
  const dir = join(openFdaDir(), 'label');
  if (!existsSync(dir)) return;
  const zips = readdirSync(dir).filter((n) => n.endsWith('.zip')).sort();
  for (const zip of zips) {
    const path = join(dir, zip);
    const retrievedAt = retrievedAtOf(path);
    for await (const label of zipResults(path)) yield { label, partition: zip, retrievedAt };
  }
}

const OPENFDA_TYPES = new Set(['HUMAN PRESCRIPTION DRUG', 'HUMAN OTC DRUG']);

/**
 * Etiquetas de openFDA enlazadas a un ATC 5 SÓLO por código.
 *   1. GSRS (fracción activa + WHO-ATC, `lib/gsrs.mjs#linkUniiSet`).
 *   2. RxNav: ATC 5 → ingrediente(s) → UNII, normalizado a fracción activa con el
 *      GSRS. Sólo cuenta si ese conjunto de fracciones tiene UN único ATC 5 en
 *      RxNav (un ingrediente con varios ATC por vía o uso sigue ambiguo).
 * Reglas de combinación (`lib/gsrs.mjs#combineLinks`): GSRS enlazado + RxNav
 * distinto → conflicto, no se enlaza; GSRS ambiguo + RxNav único dentro de los
 * candidatos → se enlaza; GSRS sin ATC + RxNav único → se enlaza.
 * Pasada A: identidades y enlace; pasada B: texto completo de las de referencia.
 */
async function openFdaLinked({ bridges, gsrs }) {
  const rxnavByMoieties = rxnavIndex(bridges.values(), gsrs);
  const link = {
    scanned: 0,
    humanRxOrOtc: 0,
    withoutUnii: 0,
    gsrs: { unique: 0, 'who-atc-50-series': 0, ambiguous: 0, none: 0, 'unknown-unii': 0 },
    final: {},
    rxnavBridges: { atc5: [...bridges.values()].filter((b) => b?.complete).length, moietySets: rxnavByMoieties.size },
  };
  const groups = new Map(); // atc → Map(uniiKey → { ids, rules:Set })
  const ambiguous = new Map(); // fracciones→candidatos → etiquetas (las que siguen sin enlazar)
  for await (const { label } of openFdaLabels()) {
    link.scanned++;
    const id = labelIdentity(label);
    if (!OPENFDA_TYPES.has(id.productType)) continue;
    link.humanRxOrOtc++;
    if (id.unii.length === 0) {
      link.withoutUnii++;
      continue;
    }
    const key = id.unii.join('+');
    const g = gsrs ? linkUniiSet(id.unii, gsrs) : { status: 'none', atc: null, rule: null, moieties: [], candidates: [] };
    link.gsrs[g.status === 'linked' ? g.rule : g.status]++;
    const moietyKey = moietiesOf(id.unii, gsrs).join('+');
    const decided = combineLinks(g, rxnavByMoieties.get(moietyKey) ?? []);
    link.final[decided.rule] = (link.final[decided.rule] ?? 0) + 1;
    if (!decided.atc) {
      if (g.status === 'ambiguous') {
        const k = `${g.moieties.join('+')}→${g.candidates.join(',')}`;
        ambiguous.set(k, (ambiguous.get(k) ?? 0) + 1);
      }
      continue;
    }
    const targets = new Map([[decided.atc, decided.rule]]);
    for (const [atc, rule] of targets) {
      if (!groups.has(atc)) groups.set(atc, new Map());
      const byKey = groups.get(atc);
      if (!byKey.has(key)) byKey.set(key, { ids: [], rules: new Set() });
      byKey.get(key).ids.push(id);
      byKey.get(key).rules.add(rule);
    }
  }
  const refs = new Map();
  for (const [atc, byKey] of groups) {
    const list = [];
    for (const [key, { ids, rules }] of byKey) {
      for (const ref of referenceLabels(ids, key.split('+'))) {
        list.push({ ...ref, group: { ...ref.group, atc, atcLinkRule: [...rules].sort().join(', ') } });
      }
    }
    refs.set(atc, list);
  }
  const chosen = new Set([...refs.values()].flat().map((r) => r.identity.id));
  const labels = new Map();
  for await (const { label, retrievedAt } of openFdaLabels()) if (chosen.has(label.id)) labels.set(label.id, { label, retrievedAt });
  link.ambiguousTop = [...ambiguous.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k, labels]) => {
      const [moieties, candidates] = k.split('→');
      return { moieties: moieties.split('+').map((u) => ({ unii: u, name: gsrs?.byUnii.get(u)?.name ?? null })), candidates: candidates.split(','), labels };
    });
  return { refs, labels, link };
}

async function main() {
  const t0 = Date.now();
  const inputs = readAllInputs();
  const { liname } = inputs;
  const products = NO_CIMA ? [] : inputs.products;
  const master = NO_CIMA ? [] : inputs.master;
  const universe = NO_CIMA ? new Map([...inputs.universe].map(([c, o]) => [c, o.filter((x) => !x.startsWith('cima-'))]).filter(([, o]) => o.length)) : inputs.universe;
  const names = atcNameIndex({ master, products });
  const { byAtc, withoutAtc5 } = groupByAtc5(products);
  console.log(`=== Monografías: universo ${universe.size} ATC 5; CIMA ${products.length} medicamentos (${withoutAtc5.length} sin ATC 5) ===`);

  const bridges = new Map([...universe.keys()].map((c) => [c, readBridge(c)]));
  const gsrs = existsSync(cpOut('gsrs-entries.ndjson')) ? buildGsrsIndex(readNdjson(cpOut('gsrs-entries.ndjson'))) : null;
  const fda = await openFdaLinked({ bridges, gsrs });
  console.log(`[openfda] ${fda.link.scanned} etiquetas leídas; ${fda.labels.size} de referencia en ${fda.refs.size} ATC 5`);
  for (const code of [...fda.refs.keys()].sort()) if (!universe.has(code)) universe.set(code, ['openfda-gsrs']);

  const stats = { cimaDocsMissing: 0, cimaSectionsWithoutVersion: 0, skippedWithoutData: 0, uniiWithoutLabel: 0, fdaRefsWithoutLabel: 0, fdaRefsWithoutMappedSections: 0, fdaSectionsWithoutVersion: 0 };
  const out = [];
  for (const [code, origin] of universe) {
    const cimaProducts = byAtc.get(code) ?? [];
    const sections = [];
    const safetyNotes = [];
    for (const ref of referenceDocuments(cimaProducts, GRANULARITY)) {
      const nreg = ref.product.nregistro;
      const read = readCimaDoc(nreg);
      if (!read) {
        stats.cimaDocsMissing++;
        continue;
      }
      for (const s of cimaSections(read.doc, ref, read.retrievedAt)) {
        if (hasVersion(s)) sections.push(assertSection(s));
        else stats.cimaSectionsWithoutVersion++;
      }
      if (existsSync(notesPath(nreg))) safetyNotes.push(...cimaSafetyNotes(readJsonIfExists(notesPath(nreg)), ref.product, retrievedAtOf(notesPath(nreg))));
    }
    const bridge = bridges.get(code);
    const fdaPharmClasses = [];
    const refs = fda.refs.get(code) ?? [];
    if (bridge?.complete && refs.length === 0) stats.uniiWithoutLabel++;
    for (const ref of refs) {
      const hit = fda.labels.get(ref.identity.id);
      if (!hit) {
        stats.fdaRefsWithoutLabel++;
        continue;
      }
      const rows = openFdaSections(hit.label, ref, hit.retrievedAt);
      if (rows.length === 0) stats.fdaRefsWithoutMappedSections++;
      for (const s of rows) {
        if (hasVersion(s)) sections.push(assertSection(s));
        else stats.fdaSectionsWithoutVersion++;
      }
      const pc = openFdaPharmClasses(hit.label, hit.retrievedAt);
      if (pc) fdaPharmClasses.push(pc);
    }
    if (cimaProducts.length === 0 && sections.length === 0) {
      stats.skippedWithoutData++;
      continue;
    }
    const lin = liname.get(code);
    const fallbackName = lin ? { display: lin.presentations[0].name, source: 'liname-bo', language: 'es' } : gsrs ? gsrsDisplayFor(code, gsrs) : null;
    out.push({ ...buildMonograph({ code, names, cimaProducts, sections, safetyNotes, rxnorm: bridge, fdaPharmClasses, fallbackName }), universeOrigin: origin });
  }

  await writeNdjson(MONOGRAPHS_NDJSON(), out);
  const meta = {
    generatedAt: new Date().toISOString(),
    granularity: GRANULARITY,
    sources: NO_CIMA ? 'sin CIMA (--no-cima)' : 'todas',
    universe: universe.size,
    monographs: out.length,
    sections: out.reduce((n, m) => n + m.sections.length, 0),
    sectionsBySource: out.flatMap((m) => m.sections).reduce((acc, s) => ({ ...acc, [s.source]: (acc[s.source] ?? 0) + 1 }), {}),
    cimaProductsWithoutAtc5: withoutAtc5.length,
    openFda: fda.link,
    gsrsIndex: gsrs ? { substances: gsrs.byUnii.size, atc5: gsrs.moietiesByAtc.size } : null,
    ...stats,
    segundos: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(MONOGRAPHS_META(), meta, true);
  console.log(JSON.stringify(meta, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-monographs:', err);
  process.exitCode = 1;
});
