// Reporte de cobertura del corpus de diccionarios: por fuente y por dominio,
// con lo que se carga por defecto separado de lo opt-in. Incremental (una fila
// por vez) para no tener todo el corpus en memoria a la vez: ChEBI + NCIt + PRO
// + FMA juntos no caben en 2,5 GB.
import { DOMAINS } from './sources.mjs';
import { isDefaultLoaded } from './load-plan.mjs';

/** Acumulador por fuente: `add(row)` por cada fila y `finish(stats)` al final. */
export function layerCoverage(source) {
  const acc = {
    concepts: 0, loaded: 0, withDefinition: 0, exactSynonyms: 0, otherSynonyms: 0, otherRelations: 0, xrefs: 0,
    relTypes: {}, xrefPrefixes: {}, rowDomains: {},
  };
  return {
    add(r) {
      acc.concepts++;
      const byDefault = isDefaultLoaded(source, r);
      if (byDefault) acc.loaded++;
      if (r.definition) acc.withDefinition++;
      acc.exactSynonyms += r.synonymsExact.length;
      acc.otherSynonyms += r.synonymsOther.length;
      acc.otherRelations += r.otherRelations.length;
      acc.xrefs += r.xrefs.length;
      for (const x of r.relations) acc.relTypes[x.type] = (acc.relTypes[x.type] ?? 0) + 1;
      for (const x of r.xrefs) { const p = x.id.split(':')[0]; acc.xrefPrefixes[p] = (acc.xrefPrefixes[p] ?? 0) + 1; }
      const d = (acc.rowDomains[r.domain] ??= { concepts: 0, conceptsLoadedByDefault: 0 });
      d.concepts++;
      if (byDefault) d.conceptsLoadedByDefault++;
    },
    finish(stats) {
      return {
        source: source.id,
        codeSystem: source.codeSystem,
        domain: source.domain,
        ...(Object.keys(acc.rowDomains).some((d) => d !== source.domain) ? { rowDomains: acc.rowDomains } : {}),
        load: source.load,
        license: source.license,
        productQuery: source.productQuery,
        concepts: acc.concepts,
        conceptsLoadedByDefault: acc.loaded,
        withDefinition: acc.withDefinition,
        exactSynonyms: acc.exactSynonyms,
        otherSynonyms: acc.otherSynonyms,
        relationsByType: acc.relTypes,
        relationsResolvedInCorpus: stats.relations?.resolved ?? 0,
        relationsUnresolved: stats.relations?.unresolved ?? 0,
        otherRelations: acc.otherRelations,
        xrefs: acc.xrefs,
        xrefPrefixesTop: Object.fromEntries(Object.entries(acc.xrefPrefixes).sort((a, b) => b[1] - a[1]).slice(0, 12)),
        stats,
      };
    },
  };
}

/** Une los reportes por fuente en totales y dominios. */
export function combineCoverage(perSource, edges, { missing = [] } = {}) {
  const perDomain = {};
  for (const s of perSource) {
    // Una fuente con dominios por fila (ChEBI, NCIt, MeSH) reparte sus conceptos entre dominios.
    const parts = s.rowDomains ?? { [s.domain]: { concepts: s.concepts, conceptsLoadedByDefault: s.conceptsLoadedByDefault } };
    for (const [domain, n] of Object.entries(parts)) {
      const d = (perDomain[domain] ??= { name: DOMAINS[domain], concepts: 0, conceptsLoadedByDefault: 0, sources: [] });
      d.concepts += n.concepts;
      d.conceptsLoadedByDefault += n.conceptsLoadedByDefault;
      if (!d.sources.includes(s.source)) d.sources.push(s.source);
    }
  }
  const sum = (k) => perSource.reduce((n, s) => n + s[k], 0);
  return {
    totals: {
      sources: perSource.length,
      concepts: sum('concepts'),
      conceptsLoadedByDefault: sum('conceptsLoadedByDefault'),
      exactSynonyms: sum('exactSynonyms'),
      relationsTyped: perSource.reduce((n, s) => n + Object.values(s.relationsByType).reduce((a, b) => a + b, 0), 0),
      relationsResolvedInCorpus: sum('relationsResolvedInCorpus'),
      otherRelations: sum('otherRelations'),
      xrefs: sum('xrefs'),
      diseaseAgentEdges: edges.length,
      missingSources: missing,
    },
    perDomain,
    perSource,
  };
}
