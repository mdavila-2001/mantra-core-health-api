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
// Escala (medida el 2026-10-27): las 14 particiones de openFDA descomprimidas
// suman ~8 GB de JSON (262 903 etiquetas) y las monografías resultantes pasan de
// 512 MiB. Por eso todo es en flujo:
//   · pasada A sobre las particiones: sólo la IDENTIDAD de cada etiqueta (UNII, vías,
//     fecha) y su posición (partición, ordinal); se empareja con los ATC por UNII.
//   · pasada B: sólo las etiquetas elegidas se parsean a secciones y van a un archivo
//     temporal con índice de desplazamientos.
//   · las monografías se escriben de a una, sin acumularlas.
//
// Salida: clinical-pharmacology/out/monographs.ndjson + monographs.meta.json
// Uso: node tools/terminology-import/clinical-pharmacology/build-monographs.mjs [--granularity route|product] [--limit-atc N]
// =============================================================================

import { closeSync, existsSync, openSync, readdirSync, readSync, unlinkSync, writeSync } from 'node:fs';
import { join } from 'node:path';

import { writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { cimaSafetyNotes, cimaSections, groupByAtc5, referenceDocuments } from './lib/cima.mjs';
import { parseArgs, readJsonIfExists, retrievedAtOf } from './lib/cli.mjs';
import { readAllInputs, readBridge } from './lib/inputs.mjs';
import { EMA_LICENSE, EMA_SOURCE, emaByAtc5, emaProductsSummary, emaReferenceRecords, emaSections } from './lib/ema.mjs';
import { assertSection, atcNameIndex, buildMonograph, hasVersion } from './lib/monograph.mjs';
import { labelCoversIngredients, labelIdentity, openFdaPharmClasses, openFdaSections, referenceLabels } from './lib/openfda.mjs';
import { parseLabel, streamLabelObjects } from './lib/openfda-stream.mjs';
import { readJsonGz } from './lib/polite-http.mjs';
import { ingredientUnii } from './lib/rxnorm.mjs';
import { MONOGRAPHS_META, MONOGRAPHS_NDJSON, cpOut, ftPath, ftSectionPath, notesPath, openFdaDir } from './lib/paths.mjs';

const { opt } = parseArgs();
const GRANULARITY = opt('--granularity', 'route');
const LIMIT_ATC = Number(opt('--limit-atc', 0));
const FDA_TMP = () => cpOut('fda-label-sections.tmp.ndjson');

/** Ficha completa + secciones sueltas de respaldo, en ese orden (la completa gana). */
function readCimaDoc(nreg) {
  const path = ftPath(nreg);
  if (!existsSync(path)) return null;
  const parts = [readJsonGz(path)];
  const dir = join(ftSectionPath(nreg, 'x'), '..');
  for (const name of listJsonGz(dir)) parts.push(readJsonGz(join(dir, name)));
  const retrievedAt = [path, ...listJsonGz(dir).map((n) => join(dir, n))].map(retrievedAtOf).sort().at(-1);
  return { doc: parts.filter(Array.isArray).flat(), retrievedAt };
}

const listJsonGz = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.json.gz')).sort() : []);

const partitions = () => {
  const dir = join(openFdaDir(), 'label');
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.zip')).sort().map((n) => join(dir, n)) : [];
};

/**
 * Pasada A: ¿qué etiquetas cubren los ingredientes de qué ATC? (por UNII de RxNorm, propio o de sus sales).
 * @returns {{ matches: Map<string, object[]>, scanned: number }} ATC → identidades (con partición y ordinal)
 */
async function matchLabels(bridges) {
  const allowedOf = new Map(); // ATC → [[unii]] por ingrediente
  const index = new Map(); // UNII → Set<ATC>
  for (const [atc, b] of bridges) {
    if (!b?.complete) continue;
    const allowed = b.ingredients.map(ingredientUnii);
    allowedOf.set(atc, allowed);
    for (const u of allowed.flat()) {
      if (!index.has(u)) index.set(u, new Set());
      index.get(u).add(atc);
    }
  }
  const matches = new Map();
  let scanned = 0;
  for (const zip of partitions()) {
    for await (const { ordinal, raw } of streamLabelObjects(zip)) {
      scanned++;
      const id = labelIdentity(parseLabel(raw));
      if (id.unii.length === 0 || !id.id) continue;
      let candidates = null;
      for (const u of id.unii) {
        const set = index.get(u);
        if (!set) {
          candidates = null;
          break;
        }
        candidates = candidates === null ? new Set(set) : new Set([...candidates].filter((a) => set.has(a)));
        if (candidates.size === 0) break;
      }
      if (!candidates?.size) continue;
      const slim = { id: id.id, setId: id.setId, version: id.version, effectiveDate: id.effectiveDate, productType: id.productType, unii: id.unii, routes: id.routes, partition: zip, ordinal };
      for (const atc of candidates) {
        if (!labelCoversIngredients(id.unii, allowedOf.get(atc))) continue;
        if (!matches.has(atc)) matches.set(atc, []);
        matches.get(atc).push(slim);
      }
    }
    console.log(`[openfda] pasada A ${zip.split('/').pop()}: ${scanned} etiquetas leídas; ATC con alguna etiqueta: ${matches.size}`);
  }
  return { matches, scanned };
}

/** Pasada B: las secciones de las etiquetas elegidas, a un temporal con índice (clave → [desplazamiento, largo]). */
async function extractChosen(chosen) {
  const byPartition = new Map();
  for (const c of chosen.values()) {
    if (!byPartition.has(c.partition)) byPartition.set(c.partition, new Map());
    byPartition.get(c.partition).set(c.ordinal, c);
  }
  const path = FDA_TMP();
  if (existsSync(path)) unlinkSync(path);
  const fd = openSync(path, 'a');
  const offsets = new Map();
  let pos = 0;
  for (const [zip, wanted] of byPartition) {
    const retrievedAt = retrievedAtOf(zip);
    for await (const { ordinal, raw } of streamLabelObjects(zip, (o) => wanted.has(o))) {
      const label = parseLabel(raw);
      const sections = openFdaSections(label, null, retrievedAt).filter(hasVersion).map(assertSection);
      const line = Buffer.from(JSON.stringify({ sections, pharmClasses: openFdaPharmClasses(label, retrievedAt) }) + '\n', 'utf8');
      writeSync(fd, line);
      offsets.set(`${zip}:${ordinal}`, [pos, line.length]);
      pos += line.length;
    }
    console.log(`[openfda] pasada B ${zip.split('/').pop()}: ${offsets.size}/${chosen.size} etiquetas`);
  }
  closeSync(fd);
  return { path, offsets };
}

function readChosen({ path, offsets }, c) {
  const at = offsets.get(`${c.partition}:${c.ordinal}`);
  if (!at) return null;
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(at[1]);
    readSync(fd, buf, 0, at[1], at[0]);
    return JSON.parse(buf.toString('utf8'));
  } finally {
    closeSync(fd);
  }
}

async function main() {
  const t0 = Date.now();
  const { products, master, liname, ema, universe: fullUniverse } = readAllInputs();
  const emaIndex = ema ? emaByAtc5(ema.file) : null;
  const names = atcNameIndex({ master, products });
  const { byAtc, withoutAtc5 } = groupByAtc5(products);
  const universe = LIMIT_ATC > 0 ? new Map([...fullUniverse].slice(0, LIMIT_ATC)) : fullUniverse;
  console.log(`=== Monografías: universo ${universe.size} ATC 5; CIMA ${products.length} medicamentos (${withoutAtc5.length} sin ATC 5) ===`);

  const bridges = new Map([...universe.keys()].map((c) => [c, readBridge(c)]));
  const { matches, scanned } = await matchLabels(bridges);
  const refsByAtc = new Map();
  const chosen = new Map();
  for (const [atc, ids] of matches) {
    const refs = referenceLabels(ids, bridges.get(atc).ingredients.map((i) => i.rxcui));
    refsByAtc.set(atc, refs);
    for (const r of refs) chosen.set(`${r.identity.partition}:${r.identity.ordinal}`, r.identity);
  }
  console.log(`[openfda] ${scanned} etiquetas leídas; ${matches.size} ATC con etiquetas; ${chosen.size} etiquetas de referencia`);
  const fda = await extractChosen(chosen);

  const stats = { cimaDocsMissing: 0, cimaSectionsWithoutVersion: 0, skippedWithoutData: 0, uniiWithoutLabel: 0, bridgesComplete: 0, bridgesIncomplete: 0, bridgesMissing: 0 };
  const counts = { monographs: 0, sections: 0, sectionsBySource: {} };
  function* monographs() {
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
      if (!bridge) stats.bridgesMissing++;
      else if (bridge.complete) stats.bridgesComplete++;
      else stats.bridgesIncomplete++;
      const fdaPharmClasses = [];
      if (bridge?.complete) {
        const refs = refsByAtc.get(code) ?? [];
        if (refs.length === 0) stats.uniiWithoutLabel++;
        for (const ref of refs) {
          const hit = readChosen(fda, ref.identity);
          if (!hit) continue;
          for (const s of hit.sections) sections.push({ ...s, selection: { criterion: ref.criterion, group: ref.group } });
          if (hit.pharmClasses) fdaPharmClasses.push(hit.pharmClasses);
        }
      }
      let emaInfo = null;
      const emaRecords = emaIndex?.byAtc.get(code) ?? [];
      if (emaRecords.length > 0) {
        for (const ref of emaReferenceRecords(emaRecords)) for (const s of emaSections(ref.record, ref, ema.provenance)) if (hasVersion(s)) sections.push(assertSection(s));
        emaInfo = { source: EMA_SOURCE, products: emaProductsSummary(emaRecords), retrievedAt: ema.provenance.retrievedAt, fileSha256: ema.provenance.sha256, license: EMA_LICENSE };
      }
      if (cimaProducts.length === 0 && sections.length === 0) {
        stats.skippedWithoutData++;
        continue;
      }
      const lin = liname.get(code);
      const fallbackName = lin ? { display: lin.presentations[0].name, source: 'liname-bo' } : null;
      const m = { ...buildMonograph({ code, names, cimaProducts, sections, safetyNotes, rxnorm: bridge, fdaPharmClasses, fallbackName, ema: emaInfo }), universeOrigin: origin };
      counts.monographs++;
      counts.sections += m.sections.length;
      for (const s of m.sections) counts.sectionsBySource[s.source] = (counts.sectionsBySource[s.source] ?? 0) + 1;
      yield m;
    }
  }

  await writeNdjson(MONOGRAPHS_NDJSON(), monographs());
  unlinkSync(fda.path);
  const meta = {
    generatedAt: new Date().toISOString(),
    granularity: GRANULARITY,
    universe: universe.size,
    ...counts,
    cimaProductsWithoutAtc5: withoutAtc5.length,
    openFdaLabelsScanned: scanned,
    openFdaAtcWithLabels: matches.size,
    openFdaReferenceLabels: chosen.size,
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
