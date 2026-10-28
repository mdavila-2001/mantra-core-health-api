// =============================================================================
// Catálogo de alergias · plan de carga (puro, sin base).
//
// De los registros comunes (`catalog.mjs`) a las tuplas de `terminology.*`.
// Mismo patrón que `glossary-es/load-plan.mjs` y `medicine-catalog/load-plan.mjs`:
// ids deterministas (md5 de una clave propia, o el UUIDv5 del backend cuando la
// fila tiene que colgar de algo que siembra la API), para que la carga sea
// idempotente con `ON CONFLICT DO NOTHING`.
// =============================================================================

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { CONCEPT, md5uuid, valueSetId, valueSetMemberId, valueSetVersionId } from '../../lib/glossary-es/load-plan.mjs';
import { conceptIdOf, hl7Code } from './catalog.mjs';
import { OPEN_CODE_SYSTEMS, OPEN_VALUE_SETS } from './open-sources.mjs';
import { CODE_SYSTEMS, RXNORM_LEXICAL_GROUPS, VALUE_SETS } from './sources.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Correspondencia enumeración interna ↔ código HL7, compartida con el seed de la API. */
export const ENUM_CODES_PATH = join(HERE, '../../../../src/common/seed/data/allergies/fhir-allergy-enum-codes.json');

/** Conceptos internos del backend que la carga necesita (siembra de la API). */
export const INTERNAL = {
  TERM_ACTIVE: CONCEPT.TERM_ACTIVE,
  LANG_ES: CONCEPT.LANG_ES,
  LANG_EN: deterministicId('terminology:language:en'),
  DESIG_PREFERRED: CONCEPT.DESIG_PREFERRED,
  DESIG_SYNONYM: CONCEPT.DESIG_SYNONYM,
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
  EQUIV_EQUIVALENT: deterministicId('terminology:equivalence:equivalent'),
};

const LANG = { es: INTERNAL.LANG_ES, en: INTERNAL.LANG_EN };

/** Todos los value sets que crea la carga (los fijos + un grupo léxico RxNorm por regla). */
export function allValueSets() {
  return {
    ...VALUE_SETS,
    ...OPEN_VALUE_SETS,
    ...Object.fromEntries(
      RXNORM_LEXICAL_GROUPS.map((g) => [
        `allergy-substances-rxnorm-${g.key}`,
        { name: `Alergias · ${g.name} (RxNorm, regla léxica)`, description: `Ingredientes RxNorm cuyo nombre coincide con ${g.pattern}. Es navegación, no clasificación clínica.` },
      ]),
    ),
  };
}

/** Versión de un code system: las versiones de origen distintas de sus registros, ordenadas. */
function versionOf(records) {
  const parts = new Set(records.map((r) => `${r.provenance.artifact}@${r.provenance.sourceVersion ?? r.provenance.artifactVersion}`));
  return [...parts].sort().join('+').slice(0, 250);
}

/** Los registros de la tanda 2 llevan `pass >= 21`; los de la tanda 1, no. */
const originOf = (r) => ((r.pass ?? 0) >= 21 ? 'open' : 'base');

/**
 * Un plan por (code system, tanda): cada tanda trae su propia versión de origen. La de la tanda 1 conserva
 * el id y el texto de versión de siempre (así nada ya cargado cambia); la de la tanda 2 es otra
 * `code_system_version` del mismo code system.
 */
export function codeSystemPlans(records) {
  const groups = new Map();
  for (const r of records) {
    const key = `${r.codeSystem}\u0000${originOf(r)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, recs]) => {
      const [internalCode, origin] = key.split('\u0000');
      const def = CODE_SYSTEMS[internalCode] ?? OPEN_CODE_SYSTEMS[internalCode];
      if (!def) throw new Error(`code system sin definición: ${internalCode}`);
      const version = versionOf(recs);
      const licenses = [...new Set(recs.map((r) => r.provenance.license))].join(' · ');
      return {
        internalCode,
        origin,
        records: recs,
        source: { id: md5uuid(`mantra:allergy-catalog:source:${def.sourceCode}`), code: def.sourceCode, name: def.name, owner: def.owner, officialUrl: def.officialUrl, license: licenses },
        codeSystem: { id: md5uuid(`mantra:allergy-catalog:cs:${internalCode}`), internalCode, name: def.name, canonicalUrl: `https://mantracore.health/fhir/CodeSystem/${internalCode}` },
        version: { id: md5uuid(`mantra:allergy-catalog:csv:${internalCode}:${version}`), version },
      };
    });
}

const prop = (conceptId, code, dataType, value) => ({ id: md5uuid(`mantra:allergy-catalog:property:${code}:${conceptId}`), conceptId, code, dataType, value });

/** Propiedades de un registro. `value_json` nunca va nulo: lo que no existe no genera fila. */
export function propertiesFor(r) {
  const out = [
    prop(r.id, 'allergy_provenance', 'json', r.provenance),
    prop(r.id, 'source_license', 'string', r.provenance.license),
    ...(r.provenance.artifactUrl ? [prop(r.id, 'source_url', 'string', r.provenance.artifactUrl)] : []),
    prop(r.id, 'source_retrieved_at', 'string', r.provenance.retrievedAt),
    prop(r.id, 'display_language', 'string', r.displayLanguage),
  ];
  for (const [lang, text] of Object.entries(r.definitions)) out.push(prop(r.id, `definition-${lang}`, 'string', text));
  for (const [code, value] of Object.entries(r.properties)) {
    if (value === null || value === undefined) continue;
    out.push(prop(r.id, code, typeof value === 'string' ? 'string' : 'json', value));
  }
  return out;
}

export function designationsFor(r) {
  return r.designations.map((d, i) => ({
    id: md5uuid(`mantra:allergy-catalog:designation:${r.id}:${d.lang}:${d.preferred ? 'p' : 's'}:${i}:${d.value}`),
    conceptId: r.id,
    lang: LANG[d.lang],
    type: d.preferred ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM,
    value: d.value,
    preferred: d.preferred,
  }));
}

export function relationshipsFor(r) {
  const parents = [...r.parents.map((code) => ({ codeSystem: r.codeSystem, code })), ...(r.crossParents ?? [])];
  return parents.map((p, i) => {
    const target = conceptIdOf(p.codeSystem, p.code);
    return { id: md5uuid(`mantra:allergy-catalog:is-a:${r.id}:${target}`), source: r.id, target, type: INTERNAL.REL_IS_A, ordinal: i };
  });
}

export function membershipsFor(r) {
  return r.valueSets.map((code) => ({ id: valueSetMemberId(code, r.id), versionId: valueSetVersionId(code), conceptId: r.id }));
}

/**
 * `concept_maps` de cada concepto interno de las enumeraciones de alergia
 * (sembrado por la API) a su código HL7 cargado acá. La equivalencia es la que
 * declara `fhir-allergy-enum-codes.json`: el concepto interno ES ese código.
 */
export function enumConceptMaps(enumCodes = JSON.parse(readFileSync(ENUM_CODES_PATH, 'utf8'))) {
  const out = [];
  for (const vs of enumCodes.valueSets) {
    const csId = vs.file.replace(/^CodeSystem-/, '').replace(/\.json$/, '');
    for (const m of vs.members) {
      const source = deterministicId(m.conceptKey);
      const target = conceptIdOf('allergy-hl7-fhir', hl7Code(csId, m.code));
      out.push({ id: md5uuid(`mantra:allergy-catalog:map:${source}:${target}`), source, target, equivalence: INTERNAL.EQUIV_EQUIVALENT, context: `enum:${vs.enumCode}`, version: `${vs.package}` });
    }
  }
  return out;
}

/**
 * Parches de la tanda 2 sobre conceptos que ya existen: designaciones nuevas, propiedades nuevas y
 * pertenencia a value sets. Mismos ids deterministas; los que ya estén se ignoran con `ON CONFLICT DO NOTHING`.
 */
export function patchPlan(patches) {
  const designations = [];
  const properties = [];
  const members = [];
  for (const p of patches) {
    p.designations.forEach((d) =>
      designations.push({ id: md5uuid(`mantra:allergy-catalog:designation-patch:${p.id}:${d.lang}:${d.preferred ? 'p' : 's'}:${d.value}`), conceptId: p.id, lang: LANG[d.lang], type: d.preferred ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM, value: d.value, preferred: d.preferred }),
    );
    for (const [code, value] of Object.entries(p.properties)) if (value !== null && value !== undefined) properties.push(prop(p.id, code, typeof value === 'string' ? 'string' : 'json', value));
    for (const vs of p.valueSets) members.push({ id: valueSetMemberId(vs, p.id), versionId: valueSetVersionId(vs), conceptId: p.id });
  }
  return { designations, properties, members };
}

/** Plan completo: lo que se insertaría, sin tocar la base. */
export function buildPlan(records, patches = []) {
  const valueSets = allValueSets();
  const known = new Set(records.map((r) => r.id));
  const relationships = records.flatMap(relationshipsFor);
  const dangling = relationships.filter((x) => !known.has(x.target));
  if (dangling.length > 0) throw new Error(`${dangling.length} relaciones is-a apuntan a conceptos que no se cargan (p. ej. ${dangling[0].source} → ${dangling[0].target})`);
  const members = records.flatMap(membershipsFor);
  const unknownVs = [...new Set(records.flatMap((r) => r.valueSets))].filter((c) => !valueSets[c]);
  if (unknownVs.length > 0) throw new Error(`value sets sin definición: ${unknownVs.join(', ')}`);
  return {
    codeSystems: codeSystemPlans(records),
    designations: records.flatMap(designationsFor),
    properties: records.flatMap(propertiesFor),
    relationships,
    valueSets: Object.entries(valueSets).map(([code, def]) => ({ code, id: valueSetId(code), versionId: valueSetVersionId(code), canonicalUrl: `https://mantracore.health/fhir/ValueSet/${code}`, ...def })),
    members,
    conceptMaps: enumConceptMaps(),
    patches: patchPlan(patches),
  };
}
