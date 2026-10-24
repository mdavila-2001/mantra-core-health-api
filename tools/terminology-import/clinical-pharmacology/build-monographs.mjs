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
import { buildGsrsIndex, gsrsDisplayFor, linkUniiSet } from './lib/gsrs.mjs';
import { readAllInputs, readBridge } from './lib/inputs.mjs';
import { zipResults } from './lib/json-stream.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from './lib/monograph.mjs';
import { labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from './lib/openfda.mjs';
import { MONOGRAPHS_META, MONOGRAPHS_NDJSON, cpOut, ftPath, ftSectionPath, notesPath, openFdaDir } from './lib/paths.mjs';

const { opt } = parseArgs();
const GRANULARITY = opt('--granularity', 'route');

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
 * Etiquetas de openFDA enlazadas a un ATC 5 SÓLO por código: por el GSRS
 * (fracción activa + WHO-ATC, `lib/gsrs.mjs#linkUniiSet`) y/o por el puente
 * RxNav (conjunto exacto de UNII). Pasada A: identidades y enlace; pasada B:
 * texto completo sólo de las etiquetas de referencia.
 */
async function openFdaLinked({ bridges, gsrs }) {
  const rxnavByKey = new Map();
  for (const b of bridges.values()) {
    if (!b?.complete) continue;
    const key = b.unii.join('+');
    if (!rxnavByKey.has(key)) rxnavByKey.set(key, []);
    rxnavByKey.get(key).push(b.atc);
  }
  const link = { scanned: 0, humanRxOrOtc: 0, withoutUnii: 0, gsrs: { unique: 0, 'who-atc-50-series': 0, ambiguous: 0, none: 0, 'unknown-unii': 0 }, rxnav: 0 };
  const groups = new Map(); // atc → Map(uniiKey → { ids, rules:Set })
  const ambiguous = new Map(); // fracciones→candidatos → etiquetas
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
    const targets = new Map();
    if (gsrs) {
      const r = linkUniiSet(id.unii, gsrs);
      if (r.status === 'linked') {
        link.gsrs[r.rule]++;
        targets.set(r.atc, `gsrs:${r.rule}`);
      } else {
        link.gsrs[r.status]++;
        if (r.status === 'ambiguous') {
          const k = `${r.moieties.join('+')}→${r.candidates.join(',')}`;
          ambiguous.set(k, (ambiguous.get(k) ?? 0) + 1);
        }
      }
    }
    for (const atc of rxnavByKey.get(key) ?? []) {
      link.rxnav++;
      targets.set(atc, targets.has(atc) ? `${targets.get(atc)}+rxnav` : 'rxnav:exact-unii');
    }
    for (const [atc, rule] of targets) {
      if (!groups.has(atc)) groups.set(atc, new Map());
      const g = groups.get(atc);
      if (!g.has(key)) g.set(key, { ids: [], rules: new Set() });
      g.get(key).ids.push(id);
      g.get(key).rules.add(rule);
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
  const { products, master, liname, universe } = readAllInputs();
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
