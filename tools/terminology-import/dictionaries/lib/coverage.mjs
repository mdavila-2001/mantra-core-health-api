// Reporte de cobertura del corpus de diccionarios: por fuente y por dominio,
// con lo que se carga por defecto separado de lo opt-in. Puro.
import { DOMAINS } from './sources.mjs';
import { isDefaultLoaded } from './load-plan.mjs';

export function coverageFor(layers, edges, { missing = [] } = {}) {
  const perSource = layers.map((l) => {
    const loaded = l.rows.filter((r) => isDefaultLoaded(l.source, r));
    const relTypes = {};
    for (const r of l.rows) for (const x of r.relations) relTypes[x.type] = (relTypes[x.type] ?? 0) + 1;
    const xrefPrefixes = {};
    for (const r of l.rows) for (const x of r.xrefs) { const p = x.id.split(':')[0]; xrefPrefixes[p] = (xrefPrefixes[p] ?? 0) + 1; }
    return {
      source: l.source.id,
      codeSystem: l.source.codeSystem,
      domain: l.source.domain,
      load: l.source.load,
      license: l.source.license,
      productQuery: l.source.productQuery,
      concepts: l.rows.length,
      conceptsLoadedByDefault: loaded.length,
      withDefinition: l.rows.filter((r) => r.definition).length,
      exactSynonyms: l.rows.reduce((n, r) => n + r.synonymsExact.length, 0),
      otherSynonyms: l.rows.reduce((n, r) => n + r.synonymsOther.length, 0),
      relationsByType: relTypes,
      relationsResolvedInCorpus: l.stats.relations?.resolved ?? 0,
      relationsUnresolved: l.stats.relations?.unresolved ?? 0,
      otherRelations: l.rows.reduce((n, r) => n + r.otherRelations.length, 0),
      xrefs: l.rows.reduce((n, r) => n + r.xrefs.length, 0),
      xrefPrefixesTop: Object.fromEntries(Object.entries(xrefPrefixes).sort((a, b) => b[1] - a[1]).slice(0, 12)),
      stats: l.stats,
    };
  });
  const perDomain = {};
  for (const s of perSource) {
    const d = (perDomain[s.domain] ??= { name: DOMAINS[s.domain], concepts: 0, conceptsLoadedByDefault: 0, sources: [] });
    d.concepts += s.concepts;
    d.conceptsLoadedByDefault += s.conceptsLoadedByDefault;
    d.sources.push(s.source);
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
