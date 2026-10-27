// =============================================================================
// Pasadas del protocolo de saturación y reporte de cobertura (puro).
//
// Una pasada = un conjunto de fuentes NUEVAS e independientes. El reporte
// cuenta, por pasada, los pares fármaco–enfermedad que no había aportado
// ninguna pasada anterior (por clave canónica de código, nunca por nombre).
// Las fuentes evaluadas y descartadas de cada pasada (bloqueo de red,
// licencia, sin códigos) están en `docs/seed-research/drug-treatments.md`.
// =============================================================================

import { RELATION_TYPES } from './sources.mjs';

export const PASSES = [
  { number: 1, sources: ['labeledin', 'pharmacotherapydb', 'drugcentral-2016', 'drugmechdb'] },
  { number: 2, sources: ['maxo'] },
  // Pasadas del 2026-10-27 (fuentes que antes devolvían 403 del proxy). Las pasadas 3 a 5 del registro
  // histórico (docs/seed-research/drug-treatments.md) midieron fuentes que no se cargaron.
  { number: 6, sources: ['medrt'] },
  { number: 7, sources: ['chembl', 'drugcentral', 'wikidata'] },
  { number: 8, sources: ['eeml', 'ema', 'opentargets'] },
  { number: 9, sources: ['civic', 'clinicaltrials'] },
];

const inc = (obj, key, n = 1) => (obj[key] = (obj[key] ?? 0) + n);

export function coverage(assertions) {
  const byType = {};
  const bySource = {};
  const byPolarity = {};
  const pairsSeen = new Set();
  const passes = PASSES.map((p) => ({ number: p.number, sources: p.sources, assertions: 0, newPairs: 0 }));
  const passOf = new Map(PASSES.flatMap((p) => p.sources.map((s) => [s, p.number])));
  const conditionsPositive = new Set();
  const conditionsAny = new Set();
  const drugs = new Set();
  let drugWithAtc = 0;
  let conditionWithMondo = 0;
  let drugWithDrugCentral = 0;
  for (const a of assertions) {
    inc(byType, a.relation.type);
    inc(bySource, a.source.key);
    inc(byPolarity, a.relation.polarity);
    const [drugKey, conditionKey] = a.pairKey.split('|');
    conditionsAny.add(conditionKey);
    if (a.relation.polarity === 'positive') conditionsPositive.add(conditionKey);
    drugs.add(drugKey);
    const allDrug = [...a.drug.codes, ...a.crosswalk.drug];
    if (allDrug.some((c) => c.system === 'ATC')) drugWithAtc++;
    if (allDrug.some((c) => c.system === 'DRUGCENTRAL')) drugWithDrugCentral++;
    if ([...a.condition.codes, ...a.crosswalk.condition].some((c) => c.system === 'MONDO')) conditionWithMondo++;
  }
  // Pares nuevos por pasada, en orden de pasada.
  const ordered = [...assertions].sort((x, y) => passOf.get(x.source.key) - passOf.get(y.source.key));
  for (const a of ordered) {
    const pass = passes.find((p) => p.number === passOf.get(a.source.key));
    pass.assertions++;
    if (a.relation.polarity !== 'positive') continue;
    if (!pairsSeen.has(a.pairKey)) {
      pairsSeen.add(a.pairKey);
      pass.newPairs++;
    }
  }
  return {
    assertions: assertions.length,
    byType: Object.fromEntries(Object.entries(byType).map(([k, n]) => [k, { n, polarity: RELATION_TYPES[k].polarity }])),
    bySource,
    byPolarity,
    passes,
    distinctPositivePairs: pairsSeen.size,
    distinctConditions: conditionsAny.size,
    conditionsWithPositiveRelation: conditionsPositive.size,
    conditionsOnlyNegative: [...conditionsAny].filter((c) => !conditionsPositive.has(c)).length,
    distinctDrugs: drugs.size,
    assertionsWithDrugCentralDrug: drugWithDrugCentral,
    assertionsWithMondoCondition: conditionWithMondo,
    assertionsWithAtc: drugWithAtc,
  };
}
