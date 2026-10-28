// =============================================================================
// Nombres en castellano para los conceptos de los diccionarios desde Wikidata
// (CC0): un ítem que DECLARA el identificador de la ontología (P1554 UBERON ID,
// P7963 Cell Ontology ID, P354 HGNC ID, P685 NCBI taxonomy ID, P1402 FMA ID…)
// aporta su etiqueta, alias y descripción en castellano a ESE concepto. El
// vínculo es el código idéntico que declara Wikidata, nunca un nombre parecido.
//
// Son nombres de la comunidad de Wikidata, no traducciones oficiales: se cargan
// como designaciones ES con su procedencia (ítem Q, fecha), no como el nombre
// oficial del concepto.
//
// Puro: el importador (import-wikidata-es-labels.mjs) baja los bindings SPARQL.
// =============================================================================

/** Propiedad de Wikidata → code system del corpus + etiqueta inglesa esperada (se verifica en cada corrida). */
export const ID_PROPERTIES = {
  P1554: { codeSystem: 'uberon', prefix: 'UBERON', label: 'UBERON ID' },
  P7963: { codeSystem: 'cl', prefix: 'CL', label: 'Cell Ontology ID' },
  P1402: { codeSystem: 'fma', prefix: 'FMA', label: 'Foundational Model of Anatomy ID' },
  P354: { codeSystem: 'hgnc', prefix: 'HGNC', label: 'HGNC ID' },
  P685: { codeSystem: 'ncbitaxon', prefix: 'NCBITaxon', label: 'NCBI taxonomy ID' },
  P686: { codeSystem: 'gene-ontology', prefix: 'GO', label: 'Gene Ontology ID' },
  P3986: { codeSystem: 'sequence-ontology', prefix: 'SO', label: 'Sequence Ontology ID' },
  // Carril C7 (2026-10-27): code systems nuevos del corpus. NCIt y MeSH usan el código sin prefijo, como EVS y NLM.
  P683: { codeSystem: 'chebi', prefix: 'CHEBI', label: 'ChEBI ID' },
  P1748: { codeSystem: 'ncit-general', prefix: null, label: 'NCI Thesaurus ID' },
  P486: { codeSystem: 'mesh', prefix: null, label: 'MeSH descriptor ID' },
};

/** Propiedades cuya consulta se acota a los ids del corpus (hay millones de ítems con esa propiedad). */
export const VALUES_PROPERTIES = new Set(['P685']);

export const expectedLabels = () => Object.fromEntries(Object.entries(ID_PROPERTIES).map(([p, s]) => [p, s.label]));

/**
 * Consulta SPARQL mínima: ítem ↔ identificador de la ontología ↔ etiqueta en castellano, sin
 * ORDER BY, GROUP BY ni OPTIONAL (query.wikidata.org corta con 504 las consultas con esas
 * cláusulas aun para propiedades chicas, y durante sus caídas limita a 1 pedido por minuto).
 * Los alias y las descripciones se piden después a la API de entidades (lotes de 50).
 */
export const labelsSparql = (prop) => `SELECT ?item ?id ?esLabel WHERE { ?item wdt:${prop} ?id ; rdfs:label ?esLabel . FILTER(LANG(?esLabel) = "es") }`;

/** Igual, para los ids pedidos (propiedades con millones de ítems, como NCBI Taxonomy). */
export const labelsSparqlFor = (prop, ids) => `SELECT ?item ?id ?esLabel WHERE { VALUES ?id { ${ids.map((i) => JSON.stringify(String(i))).join(' ')} } ?item wdt:${prop} ?id ; rdfs:label ?esLabel . FILTER(LANG(?esLabel) = "es") }`;

/** Propiedades cuyos alias/descripciones no se piden a la API (42 mil genes: sólo el nombre; los alias de un gen son su símbolo). */
export const NO_ENRICH = new Set(['P354']);

/** Bindings de la consulta → [{ q, code, esLabel }]; descarta lo que no es un ítem Q. */
export function labelPairs(json, prop) {
  const out = [];
  for (const b of json?.results?.bindings ?? []) {
    const q = b.item?.value?.split('/').pop();
    if (!/^Q\d+$/.test(q ?? '') || b.id?.value === undefined || !b.esLabel?.value) continue;
    out.push({ q, code: corpusCode(prop, b.id.value), esLabel: b.esLabel.value });
  }
  return out;
}

export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

/** wbgetentities para un lote de ítems, sólo etiqueta, alias y descripción en castellano. */
export const entitiesUrl = (qids) => `${WIKIDATA_API}?action=wbgetentities&format=json&props=labels%7Caliases%7Cdescriptions&languages=es&ids=${qids.join('%7C')}`;

/** Valor del identificador en Wikidata → código del corpus (UBERON 0000948 → UBERON:0000948; FMA 7088 → FMA:7088). */
export function corpusCode(prop, raw) {
  const spec = ID_PROPERTIES[prop];
  const v = String(raw).trim();
  if (spec.prefix === null) return v; // NCIt (C1000), MeSH (D000001): el código es el id tal cual
  // Wikidata guarda el id como «0000948» (Uberon), «CL_0000540» (Cell Ontology), «HGNC:5», «15377» (ChEBI): se normaliza al código del corpus.
  return `${spec.prefix}:${v.replace(/^[A-Za-z]+[:_]/, '')}`;
}

/**
 * Pares (ítem, código, etiqueta) + respuesta de wbgetentities (opcional: alias y descripción) → filas
 * { codeSystem, code, q, property, esLabel, esAliases[], esDescription, retrievedAt }.
 */
export function esLabelRows(pairs, entitiesJson, prop, retrievedAt) {
  const rows = [];
  for (const { q, code, esLabel } of pairs) {
    const e = entitiesJson?.entities?.[q];
    rows.push({
      codeSystem: ID_PROPERTIES[prop].codeSystem,
      code,
      q,
      property: prop,
      esLabel: e?.labels?.es?.value ?? esLabel,
      esAliases: [...new Set((e?.aliases?.es ?? []).map((a) => a.value))].sort(),
      esDescription: e?.descriptions?.es?.value ?? null,
      retrievedAt,
    });
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code) || a.q.localeCompare(b.q));
}
