// =============================================================================
// Plan de carga del catálogo de enfermedades (puro, sin base): de los registros
// comunes a las tuplas de `terminology.*`. Mismo patrón que
// `lib/medicine-catalog/load-plan.mjs`, más designaciones, jerarquía y mapeos.
//
// Ids deterministas (`md5('mantra:diseases:<tipo>:…')`), así la segunda corrida
// inserta 0. Los conceptos internos (estado, idioma, tipo de designación,
// relación is-a, equivalencias) se REUSAN de `src/common/constants/concepts.ts`
// vía `deterministicId`, porque así los lee la API.
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { EXTERNAL_TARGETS, SYSTEMS, canonicalUrl, codeSystemId, conceptId, sourceId, versionId } from './code-systems.mjs';

export const INTERNAL = {
  TERM_ACTIVE: deterministicId('terminology:state:active'),
  TERM_DRAFT: deterministicId('terminology:state:draft'),
  TERM_DEPRECATED: deterministicId('terminology:state:deprecated'),
  LANG: { es: deterministicId('terminology:language:es'), en: deterministicId('terminology:language:en') },
  DESIG_PREFERRED: deterministicId('terminology:designation-type:preferred'),
  DESIG_SYNONYM: deterministicId('terminology:designation-type:synonym'),
  REL_IS_A: deterministicId('terminology:relationship:is-a'),
  EQUIV: {
    equivalent: deterministicId('terminology:equivalence:equivalent'),
    wider: deterministicId('terminology:equivalence:wider'),
    narrower: deterministicId('terminology:equivalence:narrower'),
    inexact: deterministicId('terminology:equivalence:inexact'),
  },
};

/** Fuente, code system y versión de un sistema del catálogo. */
export function systemPlan(cs, version) {
  const def = SYSTEMS[cs];
  if (!def) throw new Error(`code system de enfermedades sin definición: ${cs}`);
  return {
    source: { id: sourceId(def.sourceCode), code: def.sourceCode, name: def.owner, owner: def.owner, officialUrl: def.officialUrl, license: def.license },
    codeSystem: { id: codeSystemId(cs), internalCode: cs, name: def.name, canonicalUrl: canonicalUrl(cs) },
    version: { id: versionId(cs, version), version },
  };
}

const prop = (r, code, dataType, value) => [md5uuid(`mantra:diseases:property:${r.cs}:${r.code}:${code}`), conceptId(r.cs, r.code), code, dataType, JSON.stringify(value)];

export function propertiesFor(r) {
  const out = [prop(r, 'disease_provenance', 'json', r.provenance)];
  for (const [code, value] of Object.entries(r.properties ?? {})) {
    out.push(prop(r, code, typeof value === 'string' ? 'string' : 'json', value));
  }
  if (r.definitionRefs?.length) out.push(prop(r, 'disease_definition_refs', 'json', r.definitionRefs));
  if (r.definitionLang) out.push(prop(r, 'disease_definition_lang', 'string', r.definitionLang));
  if (r.replacedBy) out.push(prop(r, 'disease_replaced_by', 'string', r.replacedBy));
  return out;
}

export function designationsFor(r) {
  const cid = conceptId(r.cs, r.code);
  return r.designations.map((d) => [
    md5uuid(`mantra:diseases:designation:${r.cs}:${r.code}:${d.lang}:${d.preferred ? 'p' : 's'}:${d.value}`),
    cid,
    INTERNAL.LANG[d.lang],
    d.preferred ? INTERNAL.DESIG_PREFERRED : INTERNAL.DESIG_SYNONYM,
    d.value,
    d.preferred,
  ]);
}

export function relationshipsFor(r) {
  return r.parents.map((p, i) => [md5uuid(`mantra:diseases:rel:is-a:${r.cs}:${r.code}:${p}`), conceptId(r.cs, r.code), conceptId(r.cs, p), INTERNAL.REL_IS_A, i]);
}

/**
 * Mapeos de un registro. `internal`/`key` apuntan a conceptos de este catálogo;
 * `external` a conceptos de otros importadores (icd10cm, CIE-10-ES del
 * glosario) y el cargador sólo los inserta si el destino existe.
 */
export function mapsFor(r, version) {
  const internal = [];
  const external = [];
  for (const x of r.xrefs) {
    if (x.resolution === 'unresolved') continue;
    const state = x.draft ? INTERNAL.TERM_DRAFT : INTERNAL.TERM_ACTIVE;
    const equivalence = x.equivalence ? INTERNAL.EQUIV[x.equivalence] : null;
    if (x.resolution === 'external') {
      for (const [target, idOf] of Object.entries(EXTERNAL_TARGETS)) {
        if (target !== x.cs && !(x.cs === 'icd10cm' && target === 'cie10es-dx')) continue;
        const context = target === 'cie10es-dx' ? `${x.context} (CIE-10-ES = ICD-10-CM traducida)` : x.context;
        external.push([md5uuid(`mantra:diseases:map:${r.cs}:${r.code}:${target}:${x.code}:${x.context}`), conceptId(r.cs, r.code), idOf(x.code), equivalence, context, version, state]);
      }
      continue;
    }
    internal.push([md5uuid(`mantra:diseases:map:${r.cs}:${r.code}:${x.cs}:${x.code}:${x.context}`), conceptId(r.cs, r.code), conceptId(x.cs, x.code), equivalence, x.context, version, state]);
  }
  return { internal, external };
}

/**
 * Plan completo de un code system. Los conceptos vigentes van antes que los
 * obsoletos para que `replaced_by_concept_id` (FK inmediata) apunte siempre a
 * una fila ya insertada; si el reemplazo es otro obsoleto, queda sólo en la
 * propiedad `disease_replaced_by`.
 */
export function planFor(cs, version, records) {
  const base = systemPlan(cs, version);
  const ordered = [...records.filter((r) => r.status === 'active'), ...records.filter((r) => r.status !== 'active')];
  const activeCodes = new Set(records.filter((r) => r.status === 'active').map((r) => r.code));
  const concepts = ordered.map((r) => {
    const replacedBy = r.replacedBy && activeCodes.has(r.replacedBy) ? conceptId(cs, r.replacedBy) : null;
    const state = r.status === 'active' ? INTERNAL.TERM_ACTIVE : INTERNAL.TERM_DEPRECATED;
    return [conceptId(cs, r.code), base.version.id, r.code, r.display, r.definition ?? null, r.status === 'active', replacedBy, state];
  });
  const maps = records.map((r) => mapsFor(r, version));
  // Una arista sólo si el padre también es concepto del sistema (FK inmediata).
  const codes = new Set(records.map((r) => r.code));
  const relationships = records.flatMap((r) => relationshipsFor({ ...r, parents: r.parents.filter((p) => codes.has(p)) }));
  return {
    ...base,
    records,
    concepts,
    designations: records.flatMap(designationsFor),
    properties: records.flatMap(propertiesFor),
    relationships,
    maps: maps.flatMap((m) => m.internal),
    externalMaps: maps.flatMap((m) => m.external),
  };
}
