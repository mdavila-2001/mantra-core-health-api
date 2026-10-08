// =============================================================================
// MONDO (CC BY 4.0) → conceptos con sus equivalencias DECLARADAS.
//
// Solo cuentan los `skos:exactMatch` de `meta.basicPropertyValues`. Los `xrefs`
// planos y los `closeMatch`/`broadMatch`/`relatedMatch` NO se usan para unir
// (contrato §11: «`exact` solo si la fuente lo declara como equivalencia»).
// =============================================================================

const EXACT_MATCH = 'http://www.w3.org/2004/02/skos/core#exactMatch';
const MONDO_IRI = 'http://purl.obolibrary.org/obo/MONDO_';

const EXACT_PATTERNS = [
  ['icd10cm', /^http:\/\/purl\.bioontology\.org\/ontology\/ICD10CM\/(.+)$/],
  ['icd10who', /^https:\/\/icd\.who\.int\/browse10\/2019\/en#\/(.+)$/],
  ['orpha', /^http:\/\/www\.orpha\.net\/ORDO\/Orphanet_(\d+)$/],
  ['omim', /^https:\/\/omim\.org\/entry\/(\d+)$/],
  ['mesh', /^http:\/\/identifiers\.org\/mesh\/([A-Z]\d+)$/],
  ['doid', /^http:\/\/purl\.obolibrary\.org\/obo\/DOID_(\d+)$/],
  ['umls', /^http:\/\/linkedlifedata\.com\/resource\/umls\/id\/(C\d+)$/],
];

/** Un nodo de mondo.json → concepto normalizado; null si no es una clase MONDO vigente. */
export function toMondoConcept(node) {
  if (!node?.id?.startsWith(MONDO_IRI) || node.type !== 'CLASS') return null;
  const meta = node.meta ?? {};
  if (meta.deprecated) return null;
  const exact = Object.fromEntries(EXACT_PATTERNS.map(([k]) => [k, []]));
  for (const b of meta.basicPropertyValues ?? []) {
    if (b.pred !== EXACT_MATCH) continue;
    for (const [key, re] of EXACT_PATTERNS) {
      const m = b.val.match(re);
      if (m) exact[key].push(m[1]);
    }
  }
  return {
    id: `MONDO:${node.id.slice(MONDO_IRI.length)}`,
    label: node.lbl ?? null,
    definition: meta.definition?.val?.trim() || null,
    definitionXrefs: meta.definition?.xrefs ?? [],
    exact,
  };
}

/** mondo.json (objeto ya parseado) → {version, license, concepts: Map<id, concepto>}. */
export function parseMondo(json) {
  const graph = json.graphs?.[0];
  if (!graph) throw new Error('mondo.json sin graphs[0]');
  const props = graph.meta?.basicPropertyValues ?? [];
  const concepts = new Map();
  for (const node of graph.nodes) {
    const c = toMondoConcept(node);
    if (c) concepts.set(c.id, c);
  }
  return {
    version: graph.meta?.version?.match(/releases\/([\d-]+)\//)?.[1] ?? null,
    license: props.find((p) => p.pred === 'http://purl.org/dc/terms/license')?.val ?? null,
    concepts,
  };
}

/** Código CIE-10 → ids MONDO que lo declaran `exactMatch` (CM y OMS, sin duplicados). */
export function indexIcd10(concepts) {
  const byCode = new Map();
  for (const c of concepts.values()) {
    for (const code of new Set([...c.exact.icd10cm, ...c.exact.icd10who])) {
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(c.id);
    }
  }
  return byCode;
}

/** Sistema(s) CIE-10 por el que MONDO declara el código ('icd10cm', 'icd10who'). */
export function icdSystemsFor(concept, code) {
  return [concept.exact.icd10cm.includes(code) && 'icd10cm', concept.exact.icd10who.includes(code) && 'icd10who'].filter(Boolean);
}
