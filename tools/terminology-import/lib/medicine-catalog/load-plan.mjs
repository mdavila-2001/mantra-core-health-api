// =============================================================================
// Plan de carga del catálogo universal de medicamentos (puro, sin base).
//
// De los registros comunes (`common.mjs`) a las tuplas de `terminology.*`:
// un `code_system` por fuente, un concepto por registro oficial y sus
// propiedades. Mismo patrón que `glossary-es/load-plan.mjs`, pero SIN
// designaciones, membresías ni relaciones: el catálogo no es un glosario, y el
// ancla con la receta es el ATC nivel 5, que el backend resuelve contra el
// code system `vademecum` (cuyos conceptos tienen el ATC por `code`).
//
// El id del concepto es el `id` del registro (uuid v5 de codeSystem+code): es
// lo que viaja como `catalogProductId` en el alta de un producto de farmacia.
// =============================================================================

import { CONCEPT, md5uuid } from '../glossary-es/load-plan.mjs';

/** Códigos de propiedad que lee el backend (`PharmacyCatalogService`). */
export const PROPERTY = {
  SOURCE: 'medicine_source',
  HOLDER: 'medicine_holder',
  STRENGTH: 'medicine_strength_text',
  DOSAGE_FORM: 'medicine_dosage_form',
  ROUTES: 'medicine_routes',
  REQUIRES_PRESCRIPTION: 'medicine_requires_prescription',
  GENERIC: 'medicine_generic',
  INGREDIENTS: 'medicine_active_ingredients',
  ATC: 'medicine_atc',
  PRESENTATIONS: 'medicine_presentations',
  REGULATORY_STATUS: 'medicine_regulatory_status',
  SELECTABLE: 'medicine_selectable',
  PHOTOS: 'medicine_photos',
  SOURCE_URL: 'source_url',
  SOURCE_NAME: 'source_name',
  SOURCE_LICENSE: 'source_license',
  SOURCE_RETRIEVED_AT: 'source_retrieved_at',
};

/** Una fuente/code system por `codeSystem`. Las URL canónicas son internas, como en el glosario. */
export const MEDICINE_CODE_SYSTEMS = {
  'cima-medicamentos': {
    sourceCode: 'AEMPS_CIMA_MEDICAMENTOS',
    owner: 'Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)',
    officialUrl: 'https://cima.aemps.es/cima/publico/home.html',
    name: 'CIMA — medicamentos autorizados (España)',
  },
  'invima-medicamentos': {
    sourceCode: 'INVIMA_CUM',
    owner: 'Instituto Nacional de Vigilancia de Medicamentos y Alimentos (INVIMA, Colombia)',
    officialUrl: 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/C-DIGO-NICO-DE-MEDICAMENTOS-VIGENTES/i7cb-raxc',
    name: 'INVIMA — registros sanitarios vigentes (Colombia)',
  },
  'anvisa-medicamentos': {
    sourceCode: 'ANVISA_MEDICAMENTOS',
    owner: 'Agência Nacional de Vigilância Sanitária (ANVISA, Brasil)',
    officialUrl: 'https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv',
    name: 'ANVISA — medicamentos registrados (Brasil)',
  },
};

/** Versión del code system = fecha de la descarga (YYYY-MM-DD) más reciente del lote. */
function versionOf(records) {
  return records.map((r) => r.sourceRetrievedAt.slice(0, 10)).sort().at(-1);
}

export function codeSystemPlan(codeSystem, records) {
  const def = MEDICINE_CODE_SYSTEMS[codeSystem];
  if (!def) throw new Error(`codeSystem de medicamentos sin definición de carga: ${codeSystem}`);
  const version = versionOf(records);
  return {
    source: {
      id: md5uuid(`mantra:medicine-catalog:source:${def.sourceCode}`),
      code: def.sourceCode,
      name: def.name,
      owner: def.owner,
      officialUrl: def.officialUrl,
      license: records[0]?.sourceLicense ?? null,
    },
    codeSystem: {
      id: md5uuid(`mantra:medicine-catalog:cs:${codeSystem}`),
      internalCode: codeSystem,
      name: def.name,
      canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${codeSystem}`,
    },
    version: { id: md5uuid(`mantra:medicine-catalog:csv:${codeSystem}:${version}`), version },
  };
}

function property(record, code, dataType, value) {
  return {
    id: md5uuid(`mantra:medicine-catalog:property:${code}:${record.id}`),
    conceptId: record.id,
    code,
    dataType,
    value,
  };
}

/** Propiedades de un registro; lo que la fuente no declara no genera fila (nada de `null` disfrazado). */
export function propertiesFor(record) {
  const text = (code, value) => (value == null || value === '' ? [] : [property(record, code, 'string', String(value))]);
  const flag = (code, value) => (typeof value === 'boolean' ? [property(record, code, 'boolean', value)] : []);
  const list = (code, value) => (!Array.isArray(value) || value.length === 0 ? [] : [property(record, code, 'json', value)]);
  return [
    ...text(PROPERTY.SOURCE, record.source),
    ...text(PROPERTY.HOLDER, record.holder),
    ...text(PROPERTY.STRENGTH, record.strengthText),
    ...text(PROPERTY.DOSAGE_FORM, record.dosageForm),
    ...list(PROPERTY.ROUTES, record.routes),
    ...flag(PROPERTY.REQUIRES_PRESCRIPTION, record.requiresPrescription),
    ...flag(PROPERTY.GENERIC, record.generic),
    ...list(PROPERTY.INGREDIENTS, record.activeIngredients),
    ...list(PROPERTY.ATC, record.atc),
    ...list(PROPERTY.PRESENTATIONS, record.presentations),
    ...text(PROPERTY.REGULATORY_STATUS, record.regulatoryStatus),
    ...flag(PROPERTY.SELECTABLE, record.selectable),
    ...list(PROPERTY.PHOTOS, record.photos),
    ...text(PROPERTY.SOURCE_URL, record.sourceUrl),
    ...text(PROPERTY.SOURCE_NAME, record.sourceName),
    ...text(PROPERTY.SOURCE_LICENSE, record.sourceLicense),
    ...text(PROPERTY.SOURCE_RETRIEVED_AT, record.sourceRetrievedAt),
  ];
}

/** Tupla de `catalog_concepts`: `definition` queda nulo, porque ninguna fuente trae una. */
export function conceptTuple(record, versionId) {
  return [record.id, versionId, record.code, record.display, null, CONCEPT.TERM_ACTIVE];
}

/** Plan completo de una fuente: lo que se insertaría, sin tocar la base. */
export function planFor(codeSystem, records) {
  const base = codeSystemPlan(codeSystem, records);
  return {
    ...base,
    records,
    concepts: records.map((r) => conceptTuple(r, base.version.id)),
    properties: records.flatMap(propertiesFor).map((p) => [p.id, p.conceptId, p.code, p.dataType, JSON.stringify(p.value)]),
  };
}
