// =============================================================================
// Tablas HL7 que describen la MUESTRA y la SECCIÓN del análisis, desde el
// paquete oficial HL7 Terminology (THO, `hl7.terminology.r4`, CC0-1.0).
//
// No son análisis: son los ejes con los que se describe uno (tipo de muestra,
// aditivo o conservante del tubo, método de recolección, condición de la
// muestra, sección del servicio diagnóstico). Se copian VERBATIM: código,
// `display`, `definition`, estado y comentario oficial de HL7. THO no trae
// designaciones en castellano (sólo alemán en algunas tablas): el texto queda
// en inglés y la traducción queda pendiente, no se inventa.
// =============================================================================

import { compact, conceptIdFor } from './records.mjs';

/** CodeSystem de THO → code system interno + value set que lo publica. */
export const THO_TABLES = {
  'v2-0487': { codeSystem: 'hl7-v2-0487', valueSet: 'lab-catalog-specimen-types', label: 'HL7 v2 tabla 0487 — Tipo de espécimen' },
  'v2-0371': { codeSystem: 'hl7-v2-0371', valueSet: 'lab-catalog-specimen-additives', label: 'HL7 v2 tabla 0371 — Aditivo/conservante' },
  'v2-0488': { codeSystem: 'hl7-v2-0488', valueSet: 'lab-catalog-specimen-collection-methods', label: 'HL7 v2 tabla 0488 — Método de recolección' },
  'v2-0493': { codeSystem: 'hl7-v2-0493', valueSet: 'lab-catalog-specimen-conditions', label: 'HL7 v2 tabla 0493 — Condición del espécimen' },
  'v2-0074': { codeSystem: 'hl7-v2-0074', valueSet: 'lab-catalog-diagnostic-service-sections', label: 'HL7 v2 tabla 0074 — Sección del servicio diagnóstico' },
  'observation-category': { codeSystem: 'hl7-observation-category', valueSet: 'lab-catalog-observation-categories', label: 'HL7 FHIR — Categoría de la observación' },
};

const propValue = (p) => p.valueCode ?? p.valueString ?? p.valueBoolean ?? p.valueInteger ?? p.valueDateTime ?? null;

/** Aplana la jerarquía de `concept` (THO anida hijos en algunas tablas). */
function* walk(concepts, parent = null) {
  for (const c of concepts ?? []) {
    yield { c, parent };
    yield* walk(c.concept, c);
  }
}

/**
 * Un CodeSystem JSON de THO → registros comunes.
 * @param {object} cs CodeSystem FHIR tal como viene en el paquete.
 * @param {string} key clave de `THO_TABLES` (nombre del archivo sin `CodeSystem-`).
 * @param {object} prov { packageName, packageVersion, file, sha256, retrievedAt, license }
 */
export function thoRecords(cs, key, prov) {
  const table = THO_TABLES[key];
  if (!table) throw new Error(`Tabla THO no soportada: ${key}`);
  if (cs?.resourceType !== 'CodeSystem' || !cs.url) throw new Error(`${key}: no es un CodeSystem FHIR`);
  if (cs.content !== 'complete') throw new Error(`${key}: content=${cs.content}; sólo se cargan code systems completos`);
  const out = [];
  for (const { c, parent } of walk(cs.concept)) {
    const props = Object.fromEntries((c.property ?? []).map((p) => [p.code, propValue(p)]));
    const status = props.status ?? 'active';
    const deprecatedIn = props['v2-table-deprecated'] ?? null;
    out.push({
      id: conceptIdFor(table.codeSystem, c.code),
      codeSystem: table.codeSystem,
      code: c.code,
      display: c.display ?? c.code,
      definition: c.definition && c.definition !== c.display ? c.definition : null,
      lang: 'en',
      selectable: status === 'active' && deprecatedIn == null,
      status,
      category: { scheme: 'hl7-tho', code: key, display: table.label },
      domain: null,
      domainRule: null,
      properties: compact({
        hl7_status: status,
        hl7_deprecated_in: deprecatedIn,
        hl7_comment: props['v2-concCommentAsPub'] ?? props['v2-concComment'] ?? null,
        hl7_concept_id: c.id ?? null,
        hl7_canonical_url: cs.url,
      }),
      designations: [],
      relations: parent ? [{ type: 'is-a', targetCodeSystem: table.codeSystem, targetCode: parent.code, ordinal: null }] : [],
      valueSets: [table.valueSet],
      provenance: {
        source: 'hl7-tho',
        sourceName: `HL7 Terminology (THO) ${prov.packageVersion} — ${cs.title ?? cs.name} (${cs.url}|${cs.version})`,
        sourceId: `${cs.url}#${c.code}`,
        sourceVersion: `${prov.packageName}@${prov.packageVersion}; CodeSystem ${cs.version}`,
        sourceUrl: `https://terminology.hl7.org/${prov.packageVersion}/CodeSystem-${cs.id}.html`,
        sourceFile: prov.file,
        sourceSha256: prov.sha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  return out;
}
