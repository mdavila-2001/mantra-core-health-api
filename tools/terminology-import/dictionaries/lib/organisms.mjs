// =============================================================================
// Organismos de interés médico (NCBI Taxonomy) y aristas enfermedad → organismo.
//
// Criterio de selección, publicado por las fuentes (no elegido a mano): un
// taxón entra si Mondo o el Disease Ontology lo DECLARAN como agente
// infeccioso o vector de alguna enfermedad, y entran también sus ancestros por
// is_a para que la jerarquía llegue a la raíz. Las etiquetas salen de los
// módulos de importación de NCBITaxon que cada proyecto publica:
//  - Mondo: `imports/ncbitaxon_import.obo` + aristas de `mondo-edit.obo`
//    (`disease_has_infectious_agent` RO:0014001 y subpropiedades, también en
//    `intersection_of`; `transmitted_by` RO:0002451).
//  - DOID: `doid-merged.json` (obographs): aristas `has material basis in`
//    (IDO:0000664) cuyo objeto es un NCBITaxon —así modela DOID el agente— y
//    `transmitted by` (RO:0002451).
//
// Las enfermedades NO se cargan acá (son de la sesión de enfermedades): se
// guardan su id y sus xrefs para enlazarlas por código en la carga.
// =============================================================================

import { canonicalPredicate, LOADED_PREDICATES, assertPredicateLabels, provenance } from './terms.mjs';
import { typedefIndex } from './obo.mjs';

const OBO = 'http://purl.obolibrary.org/obo/';
const curie = (iri) => (String(iri).startsWith(OBO) ? String(iri).slice(OBO.length).replace('_', ':') : String(iri));

/** Prefijos de xref de una enfermedad que sirven para enlazarla con lo ya cargado. */
const DISEASE_LINK_PREFIXES = ['ICD10CM', 'ICD10WHO', 'ICD10', 'MESH', 'DOID', 'MONDO'];

/** Taxones de un módulo OBO de importación → mapa id → taxón. */
export function taxaFromObo(parsed, origin) {
  const out = new Map();
  for (const t of parsed.terms) {
    if (!t.id?.startsWith('NCBITaxon:') || t.obsolete || !t.name) continue;
    out.set(t.id, {
      id: t.id,
      name: t.name,
      parents: t.isA.map((x) => x.target).filter((x) => x.startsWith('NCBITaxon:')),
      exact: t.synonyms.filter((s) => s.scope === 'EXACT' && s.value !== t.name).map((s) => s.value),
      other: t.synonyms.filter((s) => s.scope !== 'EXACT' && s.value !== t.name).map((s) => ({ value: s.value, scope: s.scope, ...(s.type ? { type: s.type } : {}) })),
      rank: t.propertyValues.find((p) => p.property === 'has_rank')?.value?.replace(/^NCBITaxon:/, '') ?? null,
      origin,
    });
  }
  return out;
}

/** Taxones de un obographs JSON (nodos NCBITaxon con su is_a). */
export function taxaFromObographs(json, origin) {
  const g = json.graphs[0];
  const out = new Map();
  for (const n of g.nodes ?? []) {
    const id = curie(n.id);
    if (!id.startsWith('NCBITaxon:') || !n.lbl || n.meta?.deprecated) continue;
    const syns = n.meta?.synonyms ?? [];
    out.set(id, {
      id,
      name: n.lbl,
      parents: [],
      exact: syns.filter((s) => s.pred === 'hasExactSynonym' && s.val !== n.lbl).map((s) => s.val),
      other: syns.filter((s) => s.pred !== 'hasExactSynonym' && s.val !== n.lbl).map((s) => ({ value: s.val, scope: s.pred.replace(/^has|Synonym$/g, '').toUpperCase() })),
      rank: null,
      origin,
    });
  }
  for (const e of g.edges ?? []) {
    if (e.pred !== 'is_a') continue;
    const sub = curie(e.sub);
    const obj = curie(e.obj);
    if (out.has(sub) && obj.startsWith('NCBITaxon:')) out.get(sub).parents.push(obj);
  }
  return out;
}

/** Une dos mapas de taxones: gana `primary` (la versión más nueva), se anota el otro origen. */
export function mergeTaxa(primary, secondary) {
  const out = new Map();
  const conflicts = [];
  for (const [id, t] of primary) out.set(id, { ...t, origins: [t.origin] });
  for (const [id, t] of secondary) {
    const have = out.get(id);
    if (!have) { out.set(id, { ...t, origins: [t.origin] }); continue; }
    have.origins.push(t.origin);
    if (have.name !== t.name) conflicts.push({ id, kept: have.name, other: t.name, otherOrigin: t.origin });
    if (!have.parents.length) have.parents = t.parents;
    if (!have.rank && t.rank) have.rank = t.rank;
    have.exact = [...new Set([...have.exact, ...t.exact])].filter((s) => s !== have.name);
  }
  return { taxa: out, conflicts };
}

/** Mapa id → padres, para `humanLineage`. */
export const parentsMap = (taxa) => new Map([...taxa].map(([id, t]) => [id, t.parents]));

/** Aristas enfermedad → taxón declaradas en mondo-edit.obo. */
export function mondoAgentEdges(parsed) {
  const typedefs = typedefIndex(parsed.typedefs);
  assertPredicateLabels(typedefs, 'mondo');
  const edges = [];
  for (const t of parsed.terms) {
    if (!t.id?.startsWith('MONDO:') || t.obsolete) continue;
    const pairs = [
      ...t.relationships.map((r) => [r.predicate, r.target, 'relationship']),
      ...t.intersectionOf.filter((x) => x.length >= 2).map((x) => [x[0], x[1], 'intersection_of']),
    ];
    for (const [pred, target, axiom] of pairs) {
      if (!target?.startsWith('NCBITaxon:')) continue;
      const { canonical, label } = canonicalPredicate(pred, typedefs);
      const spec = LOADED_PREDICATES[canonical];
      if (!spec || (spec.type !== 'INFECTIOUS_AGENT' && spec.type !== 'TRANSMITTED_BY')) continue;
      edges.push({
        diseaseSystem: 'mondo',
        diseaseId: t.id,
        diseaseLabel: t.name,
        diseaseXrefs: t.xrefs
          .filter((x) => DISEASE_LINK_PREFIXES.includes(x.id.split(':')[0]))
          .map((x) => ({ id: x.id, equivalent: [].concat(x.qualifiers?.source ?? []).includes('MONDO:equivalentTo') })),
        type: spec.type,
        predicate: canonical,
        predicateLabel: label,
        axiom,
        target,
      });
    }
  }
  return dedupeEdges(edges);
}

/** Aristas enfermedad → taxón de doid-merged.json. */
export function doidAgentEdges(json) {
  const g = json.graphs[0];
  const nodes = new Map((g.nodes ?? []).map((n) => [curie(n.id), n]));
  const PRED = {
    'IDO:0000664': { type: 'INFECTIOUS_AGENT', label: 'has material basis in' },
    'RO:0002451': { type: 'TRANSMITTED_BY', label: 'transmitted by' },
  };
  // Se verifica la etiqueta de las propiedades en el propio grafo.
  for (const [id, spec] of Object.entries(PRED)) {
    const n = nodes.get(id);
    if (n && n.lbl && n.lbl !== spec.label) throw new Error(`[doid] ${id} se llama «${n.lbl}», se esperaba «${spec.label}»`);
  }
  const edges = [];
  for (const e of g.edges ?? []) {
    const sub = curie(e.sub);
    const obj = curie(e.obj);
    const spec = PRED[curie(e.pred)];
    if (!spec || !sub.startsWith('DOID:') || !obj.startsWith('NCBITaxon:')) continue;
    const n = nodes.get(sub);
    if (!n || n.meta?.deprecated) continue;
    edges.push({
      diseaseSystem: 'doid',
      diseaseId: sub,
      diseaseLabel: n.lbl ?? null,
      // DOID publica sus xrefs como mapeos de la misma enfermedad (no los califica).
      diseaseXrefs: (n.meta?.xrefs ?? []).map((x) => x.val).filter((x) => DISEASE_LINK_PREFIXES.includes(String(x).split(':')[0])).map((id) => ({ id, equivalent: false })),
      type: spec.type,
      predicate: curie(e.pred),
      predicateLabel: spec.label,
      axiom: 'subClassOf some',
      target: obj,
    });
  }
  return dedupeEdges(edges);
}

function dedupeEdges(edges) {
  const seen = new Map();
  for (const e of edges) {
    const k = `${e.diseaseId}|${e.type}|${e.target}`;
    if (!seen.has(k)) seen.set(k, e);
  }
  return [...seen.values()].sort((a, b) => a.diseaseId.localeCompare(b.diseaseId) || a.target.localeCompare(b.target));
}

/** Taxones seleccionados: destinos de aristas + linaje completo. */
export function selectTaxa(taxa, edges) {
  const selected = new Set();
  const missing = new Set();
  const queue = [...new Set(edges.map((e) => e.target))];
  for (const t of queue) if (!taxa.has(t)) missing.add(t);
  while (queue.length) {
    const t = queue.shift();
    if (selected.has(t) || !taxa.has(t)) continue;
    selected.add(t);
    for (const p of taxa.get(t).parents) queue.push(p);
  }
  return { selected, missingLabels: [...missing].sort() };
}

/** Fila del corpus para un taxón. `files` = { primary, secondary } con url/sha/fecha. */
export function taxonRow(t, source, files, agentOf) {
  const fileFor = (origin) => files[origin];
  const primary = fileFor(t.origins[0]);
  return {
    key: `${source.codeSystem}|${t.id}`,
    codeSystem: source.codeSystem,
    code: t.id,
    domain: source.domain,
    lang: 'en',
    display: t.name,
    definition: null,
    definitionXrefs: [],
    synonymsExact: t.exact,
    synonymsOther: t.other,
    xrefs: [],
    subsets: [],
    namespace: 'ncbi_taxonomy',
    altIds: [],
    relations: t.parents.map((p) => ({ type: 'IS_A', predicate: 'is_a', target: p })),
    otherRelations: [],
    extra: {
      rank: t.rank,
      taxonOrigins: t.origins.map((o) => ({ origin: o, fileUrl: fileFor(o).url, version: fileFor(o).version })),
      ...(agentOf?.length ? { declaredAgentOrVectorOf: agentOf } : {}),
    },
    provenance: { ...provenance({ ...source, version: primary.version }, t.id, { file: primary }), uri: source.termUri(t.id) },
  };
}
