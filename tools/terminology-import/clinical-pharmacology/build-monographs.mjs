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

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { cimaSafetyNotes, cimaSections, groupByAtc5, referenceDocuments } from './lib/cima.mjs';
import { listJson, parseArgs, readJsonIfExists, retrievedAtOf } from './lib/cli.mjs';
import { readAllInputs, readBridge } from './lib/inputs.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from './lib/monograph.mjs';
import { labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from './lib/openfda.mjs';
import { MONOGRAPHS_META, MONOGRAPHS_NDJSON, ftPath, ftSectionPath, notesPath, openFdaDir } from './lib/paths.mjs';

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

/** Itera las etiquetas de cada partición bajada (zip → JSON en memoria, una partición por vez). */
function* openFdaLabels() {
  const dir = join(openFdaDir(), 'label');
  if (!existsSync(dir)) return;
  const zips = readdirSync(dir).filter((n) => n.endsWith('.zip')).sort();
  for (const zip of zips) {
    const path = join(dir, zip);
    const data = JSON.parse(execFileSync('unzip', ['-p', path], { maxBuffer: 1 << 30 }).toString('utf8'));
    const retrievedAt = retrievedAtOf(path);
    for (const label of data.results ?? []) yield { label, partition: zip, retrievedAt };
  }
}

function openFdaByUniiSet(wantedKeys) {
  if (wantedKeys.size === 0) return { refs: new Map(), labels: new Map(), scanned: 0 };
  // Pasada A: identidades de las etiquetas cuyo conjunto de UNII se busca.
  const identities = new Map();
  let scanned = 0;
  for (const { label } of openFdaLabels()) {
    scanned++;
    const id = labelIdentity(label);
    const key = id.unii.join('+');
    if (!wantedKeys.has(key)) continue;
    if (!identities.has(key)) identities.set(key, []);
    identities.get(key).push(id);
  }
  const refs = new Map([...identities.entries()].map(([key, ids]) => [key, referenceLabels(ids, key.split('+'))]));
  // Pasada B: el texto completo sólo de las etiquetas elegidas.
  const chosen = new Set([...refs.values()].flat().map((r) => r.identity.id));
  const labels = new Map();
  for (const { label, retrievedAt } of openFdaLabels()) if (chosen.has(label.id)) labels.set(label.id, { label, retrievedAt });
  return { refs, labels, scanned };
}

async function main() {
  const t0 = Date.now();
  const { products, master, liname, universe } = readAllInputs();
  const names = atcNameIndex({ master, products });
  const { byAtc, withoutAtc5 } = groupByAtc5(products);
  console.log(`=== Monografías: universo ${universe.size} ATC 5; CIMA ${products.length} medicamentos (${withoutAtc5.length} sin ATC 5) ===`);

  const bridges = new Map([...universe.keys()].map((c) => [c, readBridge(c)]));
  const wanted = new Set([...bridges.values()].filter((b) => b?.complete).map((b) => b.unii.join('+')));
  const fda = openFdaByUniiSet(wanted);
  console.log(`[openfda] ${fda.scanned} etiquetas leídas; ${fda.labels.size} de referencia para ${fda.refs.size} conjuntos de UNII`);

  const stats = { cimaDocsMissing: 0, cimaSectionsWithoutVersion: 0, skippedWithoutData: 0, uniiWithoutLabel: 0 };
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
    if (bridge?.complete) {
      const refs = fda.refs.get(bridge.unii.join('+')) ?? [];
      if (refs.length === 0) stats.uniiWithoutLabel++;
      for (const ref of refs) {
        const hit = fda.labels.get(ref.identity.id);
        if (!hit) continue;
        for (const s of openFdaSections(hit.label, ref, hit.retrievedAt)) if (hasVersion(s)) sections.push(assertSection(s));
        const pc = openFdaPharmClasses(hit.label, hit.retrievedAt);
        if (pc) fdaPharmClasses.push(pc);
      }
    }
    if (cimaProducts.length === 0 && sections.length === 0) {
      stats.skippedWithoutData++;
      continue;
    }
    const lin = liname.get(code);
    const fallbackName = lin ? { display: lin.presentations[0].name, source: 'liname-bo' } : null;
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
    openFdaLabelsScanned: fda.scanned,
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
