// =============================================================================
// Plan de carga (puro, sin base): filas normalizadas → tuplas de `terminology.*`.
//
// Ids propios: `md5('mantra:nursing-care:<tipo>:<clave>')::uuid`, el mismo
// patrón de `tools/terminology-import/` (la clave es el código de la fuente, así
// que el id es estable entre corridas y entre máquinas).
// Conceptos internos, value sets del glosario y tipos de relación: se REUSAN los
// ids del backend (`deterministicId`), igual que `load-glossary-es.mjs`.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid, valueSetMemberId, valueSetVersionId } from '../../lib/glossary-es/load-plan.mjs';
import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { CODE_SYSTEM } from './ckm.mjs';
import { MSSSI_CODE_SYSTEM } from './msssi.mjs';
import { OMAHA_CITATION, OMAHA_CODE_SYSTEM } from './omaha.mjs';
import { REGISTRY_CODE_SYSTEM } from './registry.mjs';

export const NS = 'mantra:nursing-care';
export const id = (type, key) => md5uuid(`${NS}:${type}:${key}`);

export const LANG_EN = deterministicId('terminology:language:en');
export const REL_PART_OF = deterministicId('terminology:relationship:part-of');
export const REL_IS_A = deterministicId('terminology:relationship:is-a');

/** Value set propio con los arquetipos del subconjunto de enfermería. */
export const NURSING_VALUE_SET = {
  code: 'nursing-care-clinical-models',
  name: 'Cuidados de enfermería — modelos clínicos (openEHR CKM y CMDIC del Ministerio de Sanidad)',
  canonicalUrl: 'https://mantracore.health/fhir/ValueSet/nursing-care-clinical-models',
  description: 'Arquetipos que cumplen alguna regla N1–N11 (openEHR CKM, lib/ckm.mjs) o M1–M3 (CMDIC, lib/msssi.mjs) de tools/terminology-import/nursing-care. Navegación, no juicio clínico.',
};

export const SOURCES = {
  [CODE_SYSTEM]: {
    code: 'OPENEHR_CKM',
    name: 'openEHR Clinical Knowledge Manager (CKM)',
    owner: 'openEHR Foundation (y custodios por arquetipo: Clinical Models UK/Apperta, Nasjonal IKT)',
    officialUrl: 'https://github.com/openEHR/CKM-mirror',
    license: 'Arquetipos bajo Creative Commons Attribution-ShareAlike (3.0 o 4.0 según el arquetipo; ver propiedad source_license). El contenido de instrumentos de terceros puede tener copyright propio: ver propiedad content_license.',
    csName: 'openEHR CKM — arquetipos clínicos (arquetipo, elemento y respuesta)',
  },
  [MSSSI_CODE_SYSTEM]: {
    code: 'ES_MSSSI_CMDIC',
    name: 'Ministerio de Sanidad (España) — arquetipos ISO 13606 del CMDIC',
    owner: 'Ministerio de Sanidad de España (elaborados por la Universitat Politècnica de València con VeraTech e Indizen)',
    officialUrl: 'https://www.sanidad.gob.es/profesionales/hcdsns/areaRecursosSem/Rec_mod_clinico_arquetipos.htm',
    license: 'Aviso legal del Ministerio de Sanidad (leído el 2026-10-27): la información del sitio, salvo indicación expresa en contrario, es reutilizable (reproducción, modificación, distribución y comunicación, usos comerciales y no comerciales) con tres condiciones: no desnaturalizar el contenido, citar la fuente y mencionar la fecha de la última actualización. La página de los arquetipos no declara excepción. El fichero oficial Arquetipos_13606.zip da los mismos 617 conceptos que el corpus (copia de github.com/openEHR/adl-archetypes). Los archivos ADL no llevan licencia propia. Base legal adicional: RD 1093/2010; art. 13 TRLPI.',
    csName: 'CMDIC (RD 1093/2010) — arquetipos UNE-EN ISO 13606 del Ministerio de Sanidad',
  },
  [OMAHA_CODE_SYSTEM]: {
    code: 'OMAHA_SYSTEM',
    name: 'Omaha System (Omaha System Partnership / Martin, 2005)',
    owner: 'Omaha System (Health Connections Press; términos y estructura en el dominio público desde 1975)',
    officialUrl: 'https://www.omahasystem.org/',
    license: `Dominio público para términos, definiciones y códigos (FAQ oficial, pregunta 1); deben usarse con la estructura del libro de 2005 y citarlo o citar el sitio: ${OMAHA_CITATION} Definiciones y signos/síntomas de 18 problemas: Minnesota Omaha System Users Group (2010), «may be used without permission», citando a los autores. DECISIÓN DEL PROPIETARIO pendiente: la FAQ pide contactar a la editorial a quien vende software basado en Omaha; el cargador omite este code system salvo --owner-approved=omaha-system.`,
    csName: 'Omaha System — esquema de clasificación de problemas, esquema de intervenciones y escala de calificación de resultados (PRSO)',
  },
  [REGISTRY_CODE_SYSTEM]: {
    code: 'HL7_THO',
    name: 'HL7 Terminology (THO)',
    owner: 'HL7 International — Vocabulary Work Group',
    officialUrl: 'https://terminology.hl7.org',
    license: 'CC0-1.0 (paquete npm hl7.terminology)',
    csName: 'Registro de terminologías de enfermería reconocidas por la ANA (identificadores de HL7 THO)',
  },
};

export function codeSystemPlan(codeSystem, version) {
  const s = SOURCES[codeSystem];
  if (!s) throw new Error(`codeSystem sin definición: ${codeSystem}`);
  return {
    source: { id: id('source', s.code), code: s.code, name: s.name, owner: s.owner, officialUrl: s.officialUrl, license: s.license },
    codeSystem: { id: id('cs', codeSystem), internalCode: codeSystem, name: s.csName, canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${codeSystem}` },
    version: { id: id('csv', `${codeSystem}:${version}`), version },
  };
}

export const conceptId = (row) => id('concept', `${row.codeSystem}:${row.code}`);

/** Slug del glosario para un arquetipo con nombre en castellano. */
export function glossarySlug(row) {
  return `${slugify(row.nameEs)}-${slugify(row.archetypeId.replace(/^openEHR-EHR-/, '').replace(/\./g, '-'))}`;
}

/** El arquetipo entra al glosario (categoría «Cuidados de enfermería»). */
export const inGlossary = (row) => row.kind === 'archetype' && Boolean(row.nameEs) && row.nursingRules?.length > 0 && row.glossaryEligible !== false;

export function displayOf(row) {
  return row.nameEs ?? row.nameOriginal;
}

export function definitionOf(row) {
  return row.nameEs ? row.descriptionEs ?? null : row.descriptionOriginal ?? null;
}

export function designationsFor(row) {
  const cid = conceptId(row);
  const out = [];
  if (row.nameEs) out.push({ id: id('designation', `es:${row.codeSystem}:${row.code}`), conceptId: cid, lang: CONCEPT.LANG_ES, type: CONCEPT.DESIG_PREFERRED, value: row.nameEs, preferred: true });
  if (row.nameOriginal && row.originalLanguage === 'en') out.push({ id: id('designation', `en:${row.codeSystem}:${row.code}`), conceptId: cid, lang: LANG_EN, type: CONCEPT.DESIG_PREFERRED, value: row.nameOriginal, preferred: !row.nameEs });
  return out;
}

function prop(row, code, dataType, value) {
  return { id: id('property', `${code}:${row.codeSystem}:${row.code}`), conceptId: conceptId(row), code, dataType, value };
}

export function propertiesFor(row) {
  const str = (code, v) => (v == null || v === '' ? [] : [prop(row, code, 'string', String(v))]);
  const js = (code, v) => (v == null || (Array.isArray(v) && v.length === 0) ? [] : [prop(row, code, 'json', v)]);
  const p = row.provenance;
  const out = [
    ...str('code_system', row.codeSystem),
    ...str('source', p.source),
    ...str('source_id', p.sourceId),
    ...str('source_version', p.version),
    ...str('source_url', p.uri),
    ...str('source_retrieved_at', p.retrievedAt),
    ...str('display_language', row.nameEs ? row.esLanguage : row.originalLanguage),
    // Procedencia completa en la raíz (arquetipo o terminología); en nodos y respuestas,
    // lo justo para ubicar la fila en la fuente (el resto cuelga del arquetipo por PART_OF).
    ...js('nursing-provenance', row.kind === 'node' || row.kind === 'value' ? { source: p.source, sourceId: `${row.archetypeId}::${row.atCode}`, version: p.version, commit: p.commit, path: p.path, uri: p.uri } : p),
  ];
  if (row.ownerApproval || row.contentOwnerApproval) out.push(prop(row, 'owner_approval_required', 'string', row.ownerApproval ?? row.contentOwnerApproval));
  if (row.codeSystem === OMAHA_CODE_SYSTEM) {
    // la procedencia completa va en `omaha-provenance`; `nursing-provenance` (pensada para CKM) sobra
    out.splice(0, out.length, ...out.filter((x) => x.code !== 'nursing-provenance'));
    out.push(
      ...str('source_license', p.license?.status),
      ...str('omaha_kind', row.kind),
      ...js('omaha-provenance', p),
      ...(row.sourceOrder != null ? [prop(row, 'source_order', 'json', row.sourceOrder)] : []),
      ...(row.ordinalValue != null ? [prop(row, 'ordinal_value', 'json', row.ordinalValue)] : []),
      ...js('definition_source', row.definitionSource ?? null),
      ...(row.descriptionOriginal ? [prop(row, 'definition_original', 'json', { [row.originalLanguage]: row.descriptionOriginal })] : []),
    );
    return out;
  }
  if (row.codeSystem === REGISTRY_CODE_SYSTEM) {
    out.push(...str('source_license', p.packageLicense), ...js('hl7_naming_system', row.hl7), ...js('terminology_license', row.license), ...js('ana_recognition', row.anaRecognition));
    if (row.descriptionOriginal) out.push(prop(row, 'definition_original', 'json', { [row.originalLanguage]: row.descriptionOriginal }));
    return out;
  }
  out.push(
    ...str('source_license', p.archetypeLicence),
    ...str('openehr_kind', row.kind),
    ...str('openehr_rm_type', row.rmType),
    ...js('openehr_data_types', row.dataTypes ?? null),
    ...js('content_license', row.kind === 'archetype' ? { ...row.contentLicense, contentLoaded: row.contentLoaded } : { status: row.contentLicense.status, contentLoaded: true }),
    ...js('nursing_rules', row.nursingRules),
  );
  if (row.ordinalValue !== null && row.ordinalValue !== undefined) out.push(prop(row, 'ordinal_value', 'json', row.ordinalValue));
  if (row.slotIncludes) out.push(prop(row, 'slot_archetypes', 'json', { includes: row.slotIncludes, excludes: row.slotExcludes ?? [] }));
  if (row.nameEs && row.esTranslator) out.push(prop(row, 'translation', 'json', { language: row.esLanguage, ...row.esTranslator, status: 'traducción publicada en openEHR CKM; no es una traducción oficial del instrumento' }));
  if (row.descriptionOriginal) out.push(prop(row, 'definition_original', 'json', { [row.originalLanguage]: row.descriptionOriginal }));
  if (row.kind === 'archetype') {
    out.push(...js('archetype_details', { es: row.detailsEs, [row.originalLanguage]: row.detailsOriginal }));
    if (row.specialises) out.push(prop(row, 'specialises', 'string', row.specialises));
    if (row.licenseVerification) out.push(prop(row, 'license_verification', 'json', row.licenseVerification));
  }
  const loinc = row.bindings.filter((b) => /^(LOINC|LNC)/i.test(b.terminology));
  const omitted = row.bindings.length - loinc.length;
  if (loinc.length) out.push(prop(row, 'loinc_bindings', 'json', loinc.map((b) => b.code ?? b.uri)));
  if (omitted) out.push(prop(row, 'other_bindings_omitted', 'json', { count: omitted, reason: 'SNOMED CT: Bolivia no es miembro de SNOMED International; no se guardan sus códigos.' }));
  if (inGlossary(row)) {
    const slug = glossarySlug(row);
    out.push(
      prop(row, 'glossary-slug', 'string', slug),
      ...(row.descriptionEs ? [prop(row, 'glossary-clinical-definition', 'json', { es: row.descriptionEs })] : []),
      prop(row, 'source_name', 'string', 'openEHR CKM'),
      prop(row, 'glossary-provenance', 'json', { reviewStatus: 'external-source', categoryRule: row.nursingRules.join(', ') }),
    );
  }
  return out;
}

/** Relaciones publicadas por la fuente: contención (PART_OF) y especialización (IS_A). */
export function relationshipsFor(row, codesInCorpus) {
  const out = [];
  if (row.parentCode) {
    const parent = { codeSystem: row.codeSystem, code: row.parentCode };
    out.push({ id: id('relationship', `part-of:${row.codeSystem}:${row.code}`), source: conceptId(row), target: conceptId(parent), type: REL_PART_OF, ordinal: null });
  }
  if (row.kind === 'archetype' && row.specialises && codesInCorpus.has(row.specialises)) {
    out.push({ id: id('relationship', `is-a:${row.codeSystem}:${row.code}`), source: conceptId(row), target: conceptId({ codeSystem: row.codeSystem, code: row.specialises }), type: REL_IS_A, ordinal: null });
  }
  return out;
}

/** Membresías: value set propio de enfermería + glosario (paraguas y categoría «care»). */
export function membershipsFor(row) {
  const cid = conceptId(row);
  const out = [];
  if (row.kind === 'archetype' && row.nursingRules?.length) out.push({ id: id('member', `${NURSING_VALUE_SET.code}:${row.code}`), versionId: id('vsv', `${NURSING_VALUE_SET.code}:1`), conceptId: cid, valueSet: NURSING_VALUE_SET.code });
  if (inGlossary(row)) {
    for (const code of ['glossary-all-terms', 'glossary-category-care']) out.push({ id: valueSetMemberId(code, cid), versionId: valueSetVersionId(code), conceptId: cid, valueSet: code, glossary: true });
  }
  return out;
}

/** Enlaces LOINC pedidos (se resuelven contra la base por código). */
export function loincRequestsFor(row) {
  return (row.bindings ?? [])
    .filter((b) => /^(LOINC|LNC)/i.test(b.terminology) && b.code)
    .map((b) => ({ id: id('map', `${row.codeSystem}:${row.code}:loinc:${b.code}`), source: conceptId(row), loincCode: b.code, context: `openEHR term_binding ${b.terminology} (${row.code})`, version: row.provenance.version }));
}
