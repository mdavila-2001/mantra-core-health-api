// =============================================================================
// Catálogo de alergias · tanda 2 · ejecutor de pasadas (puro: recibe el manifiesto
// y el catálogo de la tanda 1; lee archivos de `openDir`, sin red ni base).
// =============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { parseChebiObo } from './parse-open.mjs';
import * as P from './passes-open.mjs';

/** Orden de las pasadas de esta tanda (continúa la numeración de `PASSES` de la tanda 1). */
export const OPEN_PASSES = [
  { n: 21, key: 'iuis-sources', title: 'WHO/IUIS — fuentes biológicas (especies) y su agrupación taxonómica', run: P.passIuisSources },
  { n: 22, key: 'iuis-allergens', title: 'WHO/IUIS — moléculas alergénicas con nomenclatura oficial', run: P.passIuisAllergens },
  { n: 23, key: 'iuis-isoallergens', title: 'WHO/IUIS — isoalérgenos', run: P.passIuisIsoallergens },
  { n: 24, key: 'uniprot-kw0020', title: 'UniProtKB — palabra clave KW-0020 «Allergen»', run: P.passUniprot },
  { n: 25, key: 'cdc-cvx', title: 'CDC — CVX completo con estado oficial', run: P.passCdcCvx },
  { n: 26, key: 'cdc-cvx-tradenames', title: 'CDC — nombres comerciales de vacunas (tradename.txt)', run: P.passCdcCvxTradenames },
  { n: 27, key: 'rxnorm-current', title: 'RxNorm vigente (IN/PIN/MIN) vía RxNav', run: P.passRxnormCurrent },
  { n: 28, key: 'rxclass', title: 'RxClass — clases MED-RT/EPC/VA vigentes y miembros EPC', run: P.passRxclass },
  { n: 29, key: 'chebi-full', title: 'ChEBI 256 completo — rol «allergen» y sus roles descendientes', run: P.passChebiFull },
  { n: 30, key: 'ncit', title: 'NCI Thesaurus — Allergen (C62651) e Hypersensitivity (C3114)', run: P.passNcit },
  { n: 31, key: 'eu-1169-annex-ii', title: 'Reglamento (UE) 1169/2011, anexo II — 14 grupos (castellano e inglés oficiales)', run: P.passEuAllergens },
  { n: 32, key: 'eu-1333-additives', title: 'Reglamento (CE) 1333/2008, anexo II parte B — aditivos con número E', run: P.passEuAdditives },
  { n: 33, key: 'us-major-allergens', title: 'FDCA §201(qq) — alérgenos alimentarios mayores de EE. UU.', run: P.passUsMajorAllergens },
  { n: 34, key: 'fda-unii-allergenics', title: 'FDA — sustancias activas (UNII) de extractos alergénicos (openFDA NDC + DailyMed SPL + GSRS)', run: P.passFdaUnii },
  { n: 35, key: 'ebs-patch-test', title: 'Serie basal europea (ESCD) — artículos abiertos de Europa PMC', run: P.passEbs },
  { n: 36, key: 'true-test', title: 'T.R.U.E. TEST — etiqueta SPL de DailyMed', run: P.passTrueTest },
  { n: 37, key: 'mesh', title: 'MeSH — Allergens (D23.050.063) e Hypersensitivity (C20.543)', run: P.passMesh },
  { n: 38, key: 'wikidata-es', title: 'Wikidata (CC0) — etiquetas en castellano por identificador exacto', run: P.passWikidataEs },
];

/**
 * @param {{manifest:object, baseRecords:object[], openDir:string, passes?:object[]}} input
 * @returns {{lines:object[], report:object[], notes:object, discarded:object[], totals:object}}
 */
export function runOpenPasses({ manifest, baseRecords, openDir, passes = OPEN_PASSES }) {
  const base = new Map(baseRecords.map((r) => [r.id, r]));
  const loaded = new Map(); // nuevos de esta tanda
  const patches = [];
  const notes = {};
  const discarded = [];
  const cache = {};
  const memo = new Map();
  const ctx = {
    manifest,
    base,
    cache,
    notes,
    discarded,
    known: (id) => base.has(id) || loaded.has(id),
    allRecords: () => [...base.values(), ...loaded.values()],
    record: (id) => base.get(id) ?? loaded.get(id),
    read: (rel) => readFileSync(join(openDir, rel), 'utf8'),
    readJson: (rel) => JSON.parse(readFileSync(join(openDir, rel), 'utf8')),
    exists: (rel) => existsSync(join(openDir, rel)),
    list: (rel) => readdirSync(join(openDir, rel)).sort(),
    chebi: () => {
      if (!memo.has('chebi')) memo.set('chebi', parseChebiObo(gunzipSync(readFileSync(join(openDir, 'chebi-lite/chebi_lite.obo.gz'))).toString('utf8')));
      return memo.get('chebi');
    },
  };

  const report = [];
  for (const pass of passes) {
    const produced = pass.run(ctx);
    let added = 0;
    let duplicates = 0;
    let patchCount = 0;
    for (const item of produced) {
      if (item.patch) {
        const target = ctx.record(item.id);
        if (!target) throw new Error(`Parche huérfano (pasada ${pass.n}): ${item.codeSystem}|${item.code} no existe`);
        const seen = new Set(target.designations.map((d) => `${d.lang}\u0000${d.value}`));
        const designations = item.designations.filter((d) => {
          const k = `${d.lang}\u0000${d.value}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const valueSets = item.valueSets.filter((v) => !target.valueSets.includes(v));
        const properties = Object.fromEntries(Object.entries({ ...item.properties, [`${item.provenanceKey}_provenance`]: item.provenance }).filter(([k, v]) => v !== null && v !== undefined && !(k in target.properties)));
        if (designations.length + valueSets.length + Object.keys(item.properties).filter((k) => k in properties).length === 0) {
          duplicates += 1;
          continue;
        }
        // lo aplicado queda visible para los parches siguientes; un concepto nuevo de esta tanda lo absorbe, uno de la tanda 1 recibe una línea `patch`
        const mine = loaded.has(item.id);
        if (!mine) patches.push({ patch: true, pass: pass.n, id: item.id, codeSystem: item.codeSystem, code: item.code, designations, properties, valueSets });
        target.designations = [...target.designations, ...designations];
        target.valueSets = [...target.valueSets, ...valueSets];
        target.properties = { ...target.properties, ...properties };
        patchCount += 1;
        continue;
      }
      if (base.has(item.id) || loaded.has(item.id)) {
        duplicates += 1;
        continue;
      }
      // procedencia obligatoria por fila: sin licencia no hay carga
      for (const f of ['license', 'artifact', 'retrievedAt']) if (!item.provenance?.[f]) throw new Error(`Registro sin procedencia (${f}): ${item.codeSystem}|${item.code} (pasada ${pass.n})`);
      loaded.set(item.id, { ...item, pass: pass.n });
      added += 1;
    }
    report.push({ n: pass.n, key: pass.key, title: pass.title, read: produced.length, added, duplicates, patches: patchCount });
  }

  const records = [...loaded.values()];
  const byCodeSystem = {};
  const byValueSet = {};
  let spanish = 0;
  for (const r of records) {
    byCodeSystem[r.codeSystem] = (byCodeSystem[r.codeSystem] ?? 0) + 1;
    for (const v of r.valueSets) byValueSet[v] = (byValueSet[v] ?? 0) + 1;
    if (r.displayLanguage === 'es') spanish += 1;
  }
  const patchedBySystem = {};
  for (const p of patches) patchedBySystem[p.codeSystem] = (patchedBySystem[p.codeSystem] ?? 0) + 1;
  const lines = [...records, ...patches];
  return { lines, report, notes, discarded, totals: { newConcepts: records.length, withSpanishDisplay: spanish, patches: patches.length, byCodeSystem, byValueSet, patchedBySystem } };
}
