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
};

export const expectedLabels = () => Object.fromEntries(Object.entries(ID_PROPERTIES).map(([p, s]) => [p, s.label]));

/**
 * Consulta SPARQL de una propiedad. Con `values`, sólo esos identificadores
 * (NCBI Taxonomy: Wikidata tiene millones de taxones y la consulta completa
 * excede el límite de 60 s del servicio; se piden sólo los del corpus).
 */
export function labelsSparql(prop, values = null) {
  const only = values?.length ? `\n  VALUES ?id { ${values.map((v) => JSON.stringify(String(v))).join(' ')} }` : '';
  return `SELECT ?item ?id ?esLabel ?esDesc ?alias WHERE {${only}
  ?item wdt:${prop} ?id ; rdfs:label ?esLabel FILTER(LANG(?esLabel) = "es")
  OPTIONAL { ?item schema:description ?esDesc FILTER(LANG(?esDesc) = "es") }
  OPTIONAL { ?item skos:altLabel ?alias FILTER(LANG(?alias) = "es") }
}`;
}

/** Propiedades que se consultan sólo por los ids del corpus, en lotes. */
export const RESTRICT_TO_CORPUS = { P685: 'ncbitaxon-medical' };

/** Código del corpus → valor del identificador en Wikidata (NCBITaxon:1313 → 1313). */
export const wikidataValue = (code) => String(code).replace(/^[A-Za-z]+:/, '');

/** Valor del identificador en Wikidata → código del corpus (UBERON 0000948 → UBERON:0000948; FMA 7088 → FMA:7088). */
export function corpusCode(prop, raw) {
  const spec = ID_PROPERTIES[prop];
  const v = String(raw).trim();
  if (spec.prefix === 'HGNC' || spec.prefix === 'GO' || spec.prefix === 'SO' || spec.prefix === 'CL') return v.includes(':') ? v : `${spec.prefix}:${v}`;
  return `${spec.prefix}:${v.replace(/^[A-Za-z]+[:_]/, '')}`;
}

/** Bindings SPARQL de una propiedad → filas { codeSystem, code, q, esLabel, esAliases[], esDescription }. */
export function esLabelRows(json, prop, retrievedAt) {
  const by = new Map();
  for (const b of json?.results?.bindings ?? []) {
    const q = b.item?.value?.split('/').pop();
    if (!q || !b.id?.value || !b.esLabel?.value) continue;
    const code = corpusCode(prop, b.id.value);
    const k = `${code}|${q}`;
    const r = by.get(k) ?? { codeSystem: ID_PROPERTIES[prop].codeSystem, code, q, property: prop, esLabel: b.esLabel.value, esAliases: new Set(), esDescription: null, retrievedAt };
    if (b.alias?.value) r.esAliases.add(b.alias.value);
    r.esDescription ??= b.esDesc?.value ?? null;
    by.set(k, r);
  }
  return [...by.values()].map((r) => ({ ...r, esAliases: [...r.esAliases].sort() })).sort((a, b) => a.code.localeCompare(b.code) || a.q.localeCompare(b.q));
}
