// =============================================================================
// Reporte de cobertura del corpus de síntomas (puro): términos por sistema,
// relaciones por fuente y enfermedades con y sin síntomas enlazados, medidas
// contra el universo de enfermedades de Mondo (que declara la equivalencia con
// OMIM, Orphanet, DOID, MeSH y DECIPHER).
// =============================================================================

import { diseaseIdentity } from './crosswalk.mjs';
import { descendants, childrenIndex } from './obo.mjs';

const count = (rows, fn) => rows.reduce((acc, r) => {
  const k = fn(r) ?? '(vacío)';
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

function termsBySystem(rows, labelOf) {
  const out = {};
  for (const r of rows) {
    for (const s of r.systems.length ? r.systems : ['(raíz)']) {
      const e = (out[s] ??= { code: s, name: labelOf(s) ?? r.systemLabels?.[s] ?? null, terms: 0, withSpanish: 0, withDefinition: 0 });
      e.terms++;
      if (r.esName) e.withSpanish++;
      if (r.definition) e.withDefinition++;
    }
  }
  return Object.values(out).sort((a, b) => b.terms - a.terms);
}

function termStats(rows) {
  return {
    terms: rows.length,
    withSpanishName: rows.filter((r) => r.esName).length,
    withDefinition: rows.filter((r) => r.definition).length,
    synonymsEn: rows.reduce((n, r) => n + r.synonyms.length, 0),
    isAEdges: rows.reduce((n, r) => n + r.parents.length, 0),
  };
}

function relationStats(rows) {
  const positive = rows.filter((r) => !r.negated);
  return {
    rows: rows.length,
    positive: positive.length,
    negated: rows.length - positive.length,
    diseases: new Set(rows.map((r) => r.disease.curie)).size,
    diseasesByPrefix: count([...new Map(rows.map((r) => [r.disease.curie, r])).values()], (r) => r.disease.prefix),
    phenotypes: new Set(rows.map((r) => r.phenotype)).size,
    byAspect: count(rows, (r) => r.aspect),
    byEvidence: count(rows, (r) => r.evidence),
    byFrequencyKind: count(rows, (r) => r.frequency?.kind ?? null),
  };
}

export function coverageReport({ hpo, symp, ncit, relations, toMondo, mondoTerms, hpoTerms }) {
  const hpoLabel = new Map(hpoTerms.map((r) => [r.code, { en: r.enName, es: r.esName }]));
  const sympLabel = new Map(symp.rows.map((r) => [r.code, r.enName]));
  const ncitLabel = new Map(ncit.rows.map((r) => [r.code, r.enName]));

  // Universo de enfermedades humanas de Mondo: descendientes de MONDO:0700096
  // «human disease» (o de MONDO:0000001 «disease» si la release no la trae).
  const live = new Map([...mondoTerms].filter(([, t]) => !t.obsolete && t.id.startsWith('MONDO:')));
  const kids = childrenIndex(live);
  const root = live.has('MONDO:0700096') ? 'MONDO:0700096' : 'MONDO:0000001';
  const universe = descendants(kids, [root]);

  const linked = new Map(); // MONDO id → Set(fuentes)
  const unresolvedByPrefix = {};
  for (const [source, rows] of Object.entries(relations)) {
    for (const r of rows) {
      if (r.negated || (r.aspect && r.aspect !== 'P')) continue;
      const id = diseaseIdentity(r.disease.curie, toMondo);
      if (!id.startsWith('MONDO:')) {
        unresolvedByPrefix[r.disease.prefix] ??= new Set();
        unresolvedByPrefix[r.disease.prefix].add(r.disease.curie);
        continue;
      }
      if (!linked.has(id)) linked.set(id, new Set());
      linked.get(id).add(source);
    }
  }
  const inUniverse = [...linked.keys()].filter((id) => universe.has(id));
  const bySourceCombo = count(inUniverse.map((id) => ({ k: [...linked.get(id)].sort().join('+') })), (x) => x.k);

  const phenotypesLinked = new Set();
  for (const rows of Object.values(relations)) for (const r of rows) if (!r.negated && r.phenotypeSystem === 'hpo') phenotypesLinked.add(r.phenotype);
  const hpoAbnormal = hpo.rows.filter((r) => r.subontology === 'HP:0000118');

  return {
    terms: {
      hpo: { ...termStats(hpo.rows), version: hpo.version, bySubontology: count(hpo.rows, (r) => r.subontology), bySystem: termsBySystem(hpoAbnormal, (s) => hpoLabel.get(s)) },
      symp: { ...termStats(symp.rows), bySystem: termsBySystem(symp.rows, (s) => sympLabel.get(s)) },
      ncit: { ...termStats(ncit.rows), bySystem: termsBySystem(ncit.rows, (s) => ncitLabel.get(s)) },
    },
    relations: Object.fromEntries(Object.entries(relations).map(([k, rows]) => [k, relationStats(rows)])),
    diseases: {
      universe: { root, mondoHumanDiseases: universe.size },
      withPhenotypes: inUniverse.length,
      withoutPhenotypes: universe.size - inUniverse.length,
      coveragePct: Math.round((inUniverse.length / universe.size) * 1000) / 10,
      bySourceCombination: bySourceCombo,
      annotatedCodesWithoutMondoEquivalence: Object.fromEntries(Object.entries(unresolvedByPrefix).map(([k, v]) => [k, v.size])),
    },
    phenotypes: {
      hpoPhenotypicAbnormalityTerms: hpoAbnormal.length,
      hpoTermsWithAtLeastOneDisease: [...phenotypesLinked].filter((c) => hpoLabel.has(c)).length,
    },
  };
}
