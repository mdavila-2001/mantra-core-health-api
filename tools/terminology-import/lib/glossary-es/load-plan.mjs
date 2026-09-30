// =============================================================================
// Plan de carga (puro, sin base): de las filas normalizadas a las tuplas que se
// insertan en `terminology.*`. Separarlo del ejecutor permite probarlo sin
// Postgres y correr `load-glossary-es.mjs --dry-run`.
//
// Identificadores:
//  - Filas propias de esta importación: `md5('mantra:glossary-es:<tipo>:<clave>')::uuid`
//    (calculado igual en JS: el hex del md5 con guiones), mismo patrón que el
//    resto de `tools/terminology-import/`.
//  - Value sets del glosario y conceptos internos (idioma, tipo de designación,
//    estado, tipos de relación): se REUSAN los ids que ya siembra el backend
//    (`deterministicId`, UUIDv5 de `src/common/constants/concepts.ts`), porque las
//    membresías tienen que colgar de esas mismas filas.
// =============================================================================

import { createHash } from 'node:crypto';
import { deterministicId } from './common.mjs';

export function md5uuid(key) {
  const h = createHash('md5').update(key, 'utf8').digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Conceptos internos del backend (claves de `CONCEPT_DEFS`). */
export const CONCEPT = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  LANG_ES: deterministicId('terminology:language:es'),
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
};

export const RELATION_TYPE = {
  RELATED_TERM: deterministicId('terminology:relationship:related-term'),
  DISEASE: deterministicId('terminology:relationship:disease'),
  PROCEDURE: deterministicId('terminology:relationship:procedure'),
  TREATMENT: deterministicId('terminology:relationship:treatment'),
  ANATOMY: deterministicId('terminology:relationship:anatomy'),
  DIAGNOSTIC_TEST: deterministicId('terminology:relationship:diagnostic-test'),
};

/** Ids de value set / versión / miembro, idénticos a `dynamic-enum-catalog.ts`. */
export const valueSetId = (code) => deterministicId(`seed:value-set:${code}`);
export const valueSetVersionId = (code) => deterministicId(`seed:value-set-version:${code}:1`);
export const valueSetMemberId = (code, conceptId) => deterministicId(`seed:value-set-member:${code}:${conceptId}`);

/**
 * Una fuente/code system por `codeSystem` de las filas. Las URL canónicas son
 * internas (mantracore.health): ninguna de estas fuentes publica una URL FHIR
 * propia para su edición en castellano, y no se inventa una ajena.
 */
export const CODE_SYSTEMS = {
  'cie10es-diagnosticos-2026': {
    sourceCode: 'SANIDAD_CIE10ES',
    sourceName: 'CIE-10-ES (Ministerio de Sanidad de España)',
    owner: 'Ministerio de Sanidad — Unidad Técnica de Codificación CIE-10-ES',
    officialUrl: 'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/home.htm',
    name: 'CIE-10-ES Diagnósticos 2026 (6.ª ed.)',
    version: '2026',
  },
  'cie10es-procedimientos-2026': {
    sourceCode: 'SANIDAD_CIE10ES',
    sourceName: 'CIE-10-ES (Ministerio de Sanidad de España)',
    owner: 'Ministerio de Sanidad — Unidad Técnica de Codificación CIE-10-ES',
    officialUrl: 'https://www.sanidad.gob.es/estadEstudios/estadisticas/normalizacion/home.htm',
    name: 'CIE-10-ES Procedimientos 2026 (6.ª ed.)',
    version: '2026',
  },
  'cima-vtm': {
    sourceCode: 'AEMPS_CIMA',
    sourceName: 'CIMA — AEMPS',
    owner: 'Agencia Española de Medicamentos y Productos Sanitarios (AEMPS)',
    officialUrl: 'https://cima.aemps.es/cima/publico/home.html',
    name: 'CIMA — principios activos (VTM) con medicamentos autorizados',
    version: null, // se fija con la fecha de la corrida
  },
  'medlineplus-es': {
    sourceCode: 'NLM_MEDLINEPLUS_ES',
    sourceName: 'MedlinePlus en español (NLM)',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://medlineplus.gov/spanish/',
    name: 'MedlinePlus en español — temas de salud',
    version: null,
  },
  'medlineplus-es-lab': {
    sourceCode: 'NLM_MEDLINEPLUS_ES',
    sourceName: 'MedlinePlus en español (NLM)',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://medlineplus.gov/spanish/pruebas-de-laboratorio/',
    name: 'MedlinePlus en español — pruebas médicas',
    version: null,
  },
  'wikidata-anatomia': {
    sourceCode: 'WIKIDATA',
    sourceName: 'Wikidata (Wikimedia Foundation, CC0)',
    owner: 'Comunidad de Wikidata / Wikimedia Foundation',
    officialUrl: 'https://www.wikidata.org/',
    name: 'Wikidata — anatomía con identificador TA98/TA2',
    version: null,
  },
  'loinc-es': {
    sourceCode: 'REGENSTRIEF_LOINC_ES',
    sourceName: 'LOINC — variante lingüística en castellano (Regenstrief)',
    owner: 'Regenstrief Institute, Inc.',
    officialUrl: 'https://loinc.org/international/',
    name: 'LOINC — nombres en castellano',
    version: null,
  },
};

export function codeSystemPlan(codeSystem, rows) {
  const def = CODE_SYSTEMS[codeSystem];
  if (!def) throw new Error(`codeSystem sin definición de carga: ${codeSystem}`);
  const version = def.version ?? rows.map((r) => r.sourceRetrievedAt.slice(0, 10)).sort().at(-1);
  const license = rows[0]?.sourceLicense ?? null;
  return {
    source: { id: md5uuid(`mantra:glossary-es:source:${def.sourceCode}`), code: def.sourceCode, name: def.sourceName, owner: def.owner, officialUrl: def.officialUrl, license },
    codeSystem: {
      id: md5uuid(`mantra:glossary-es:cs:${codeSystem}`),
      internalCode: codeSystem,
      name: def.name,
      canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${codeSystem}`,
    },
    version: { id: md5uuid(`mantra:glossary-es:csv:${codeSystem}:${version}`), version },
  };
}

export const conceptId = (slug) => md5uuid(`mantra:glossary-es:concept:${slug}`);

function prop(slug, code, dataType, value) {
  return { id: md5uuid(`mantra:glossary-es:property:${code}:${slug}`), conceptId: conceptId(slug), code, dataType, value };
}

/** Propiedades (`concept_properties`) de una fila. `value_json` nunca va nulo. */
export function propertiesFor(row) {
  const out = [prop(row.slug, 'glossary-slug', 'string', row.slug)];
  if (row.definition) out.push(prop(row.slug, 'glossary-clinical-definition', 'json', { es: row.definition }));
  out.push(
    // Nombre y licencia de la fuente viven una vez en `terminology_sources`
    // (no se repiten en cada una de las ~185 000 filas).
    prop(row.slug, 'glossary-provenance', 'json', {
      source: row.source,
      sourceUrl: row.sourceUrl,
      retrievedAt: row.sourceRetrievedAt,
      reviewStatus: row.reviewStatus,
      definitionSource: row.definitionSource ?? null,
      categoryRule: row.categoryRule ?? null,
    }),
  );
  if (row.imageUrl) {
    // Contrato declarado en glossary.constants.ts: { source, license, attribution, alt, status }.
    out.push(
      prop(row.slug, 'glossary-image', 'json', {
        source: row.imageUrl,
        thumbnail: row.imageThumbUrl,
        license: row.imageLicense,
        licenseUrl: row.imageLicenseUrl ?? null,
        attribution: row.imageAttribution,
        sourcePage: row.imageSourcePage,
        origin: row.imageOrigin,
        alt: row.esName,
        status: row.reviewStatus,
      }),
    );
  }
  if (row.images?.length) out.push(prop(row.slug, 'glossary-images', 'json', row.images));
  if (row.hierarchy?.length) out.push(prop(row.slug, 'glossary-hierarchy', 'json', row.hierarchy));
  if (row.flags && Object.keys(row.flags).length) out.push(prop(row.slug, 'glossary-source-flags', 'json', row.flags));
  const ext = Object.fromEntries(Object.entries(row.externalIds ?? {}).filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0)));
  if (Object.keys(ext).length) out.push(prop(row.slug, 'glossary-external-ids', 'json', ext));
  if (row.definitionHtml) out.push(prop(row.slug, 'glossary-definition-html', 'json', { es: row.definitionHtml }));
  if (row.drugFacts) {
    out.push(prop(row.slug, 'glossary-drug-facts', 'json', row.drugFacts));
    // Mismos códigos que lee el front (`GlossaryDrugFacts.drugFactsFrom`) y que
    // escribe import-ndc.mjs. Valores = unión de lo que CIMA declara para el VTM.
    out.push(prop(row.slug, 'active_ingredients', 'json', [row.drugFacts.vtmName]));
    if (row.drugFacts.dosageForms.length) out.push(prop(row.slug, 'dosage_form', 'string', row.drugFacts.dosageForms.join(' · ')));
    if (row.drugFacts.routes.length) out.push(prop(row.slug, 'route', 'json', row.drugFacts.routes));
  }
  return out;
}

export function designationsFor(row) {
  const cid = conceptId(row.slug);
  const out = [{ id: md5uuid(`mantra:glossary-es:designation:preferred:${row.slug}`), conceptId: cid, value: row.esName, type: CONCEPT.DESIG_PREFERRED, preferred: true }];
  row.esSynonyms.forEach((s, i) => out.push({ id: md5uuid(`mantra:glossary-es:designation:synonym:${row.slug}:${i}`), conceptId: cid, value: s, type: CONCEPT.DESIG_SYNONYM, preferred: false }));
  return out;
}

/** Códigos de value set de los que la fila es miembro: paraguas + categoría + etiquetas. */
export function valueSetCodesFor(row) {
  return ['glossary-all-terms', `glossary-category-${row.categoryKey}`, ...row.tagKeys.map((t) => `glossary-tag-${t}`)];
}

export function membershipsFor(row) {
  const cid = conceptId(row.slug);
  return valueSetCodesFor(row).map((code) => ({ id: valueSetMemberId(code, cid), versionId: valueSetVersionId(code), conceptId: cid, code }));
}

export function relationshipsFor(row) {
  return (row.relations ?? []).map((rel, i) => ({
    id: md5uuid(`mantra:glossary-es:relationship:${row.slug}:${rel.type}:${rel.targetSlug}`),
    source: conceptId(row.slug),
    target: conceptId(rel.targetSlug),
    type: RELATION_TYPE[rel.type],
    ordinal: i,
  }));
}
