// =============================================================================
// Contrato del artículo (ficha TAREA-41 §12.3) y guardas de contenido.
//
// - Catálogo CERRADO de `kind` por tipo de término (agregar uno exige actualizar
//   la ficha).
// - Seis campos de procedencia obligatorios por sección (§12.2.3).
// - Guarda de dosis (§12.2.5): ninguna sección que parezca dosis o posología
//   se publica; va a `rejected.ndjson`.
// =============================================================================

export const SECTION_KINDS = Object.freeze({
  anatomy: ['definition', 'location', 'structure', 'function', 'blood_supply', 'innervation', 'clinical_relevance', 'related_structures'],
  symptoms: ['definition', 'overview', 'associated_conditions', 'red_flags', 'when_to_seek_care', 'self_care'],
  tests: ['definition', 'purpose', 'preparation', 'procedure_description', 'risks', 'interpretation', 'reference_values'],
  procedures: ['definition', 'purpose', 'procedure_description', 'risks', 'recovery', 'alternatives'],
  specialties: ['definition', 'scope', 'conditions_treated', 'subspecialties', 'training'],
});

/** Tipo de término del catálogo §12.3 según la categoría de la semilla. */
export const KIND_CATALOG_BY_CATEGORY = Object.freeze({
  anatomy: 'anatomy',
  'signs-symptoms': 'symptoms',
  specialty: 'specialties',
  lab: 'tests',
  'diagnostic-test': 'tests',
  imaging: 'tests',
  treatment: 'procedures',
  procedure: 'procedures',
  care: 'procedures',
});

export function allowedKinds(categoryKey) {
  const catalog = KIND_CATALOG_BY_CATEGORY[categoryKey];
  return catalog ? SECTION_KINDS[catalog] : [];
}

const PROVENANCE_FIELDS = ['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Cantidad + unidad de medida (dosis), mg/kg, UI, posología y dosificación.
const DOSE_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|μg|ug|g|kg|ml|mL|l|UI|IU|mEq|mmol|U)\b(?!\/(?:dl|l)\b)/i,
  /\b(?:posolog[ií]a|dosificaci[oó]n|dosage|posology)\b/i,
  /\b(?:dosis|dose|doses)\b/i,
];

/** ¿El texto parece una dosis o posología? (conservador: ante la duda, se rechaza). */
export function looksLikeDose(text) {
  return typeof text === 'string' && DOSE_PATTERNS.some((re) => re.test(text));
}

/**
 * Valida una sección contra el contrato. Devuelve la lista de problemas
 * (vacía = válida). No corrige nada: lo inválido no se publica.
 */
export function validateSection(section, categoryKey) {
  const problems = [];
  if (!allowedKinds(categoryKey).includes(section.kind)) problems.push(`kind-fuera-de-catalogo:${section.kind}`);
  if (typeof section.text !== 'string' || section.text.trim() === '') problems.push('texto-vacio');
  if (section.items !== undefined && (!Array.isArray(section.items) || section.items.some((i) => typeof i !== 'string' || i === ''))) problems.push('items-invalidos');
  if (section.lang !== 'es' && section.lang !== 'en') problems.push(`idioma-invalido:${section.lang}`);
  for (const field of PROVENANCE_FIELDS) if (typeof section[field] !== 'string' || section[field].trim() === '') problems.push(`falta-${field}`);
  if (typeof section.sourceUrl === 'string' && !/^https?:\/\//.test(section.sourceUrl)) problems.push('sourceUrl-no-http');
  if (typeof section.retrievedAt === 'string' && !ISO_DATE.test(section.retrievedAt)) problems.push('retrievedAt-no-ISO');
  const doseTarget = [section.text, ...(section.items ?? [])];
  if (doseTarget.some(looksLikeDose)) problems.push('posible-dosis');
  return problems;
}

export function validateFact(fact) {
  const problems = [];
  for (const field of ['label', 'value', 'source', 'sourceUrl']) if (typeof fact[field] !== 'string' || fact[field].trim() === '') problems.push(`fact-falta-${field}`);
  if (typeof fact.sourceUrl === 'string' && !/^https?:\/\//.test(fact.sourceUrl)) problems.push('fact-sourceUrl-no-http');
  return problems;
}
