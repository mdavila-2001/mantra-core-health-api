// =============================================================================
// Orphanet product9 → propiedades de la enfermedad (TAREA-41 F3.3, cierre).
// Puro: no toca red ni base.
//
// Edad de inicio, tipo de herencia y prevalencia NO son relaciones: son datos de
// la enfermedad y van a `concept_properties` del concepto que la identidad MONDO
// de F3.1 asigna al código `ORPHA:<n>`:
//
//   orphanet-age-of-onset  { orphanet: [{ orphaCode, values: ['Infancy', …] }] }
//   orphanet-inheritance   { orphanet: [{ orphaCode, values: ['Autosomal recessive'] }] }
//   orphanet-prevalence    { orphanet: [{ orphaCode, entries: [{ type, qualification,
//                            class, meanValue, geographic, validationStatus, source }] }] }
//
// Reglas:
//  - Las etiquetas quedan **en inglés, tal cual** vienen (sin traducción
//    automática). La prevalencia se guarda **con su estado de validación**:
//    quien la lea decide si muestra las no validadas; acá no se descarta nada.
//  - Una enfermedad sin grupo MONDO no se carga (no se adivina por nombre).
//  - Si dos códigos ORPHA caen en el mismo concepto, la propiedad lleva una
//    entrada por código (`orphanet: [...]`), no se pisan.
//  - Una propiedad por (concepto, código): id determinista, la segunda corrida
//    no inserta nada.
// =============================================================================

import { md5uuid } from './load-plan.mjs';
import { decodeXml } from './orphanet.mjs';

export const ORPHANET_PROPERTY_CODES = Object.freeze({
  ageOfOnset: 'orphanet-age-of-onset',
  inheritance: 'orphanet-inheritance',
  prevalence: 'orphanet-prevalence',
});
export const ORPHANET_PRODUCT9_LICENSE = 'CC BY 4.0';

const blocks = (xml) => String(xml).split('<Disorder id="').slice(1);
const orphaCodeOf = (block) => block.match(/^\d+">\s*<OrphaCode>(\d+)<\/OrphaCode>/)?.[1] ?? null;
const text = (value) => (value === undefined || value === null ? null : decodeXml(value).trim() || null);
const firstName = (chunk, tag) => text(chunk.match(new RegExp(`<${tag}(?: id="\\d+")?>\\s*<Name lang="en">([^<]*)</Name>`))?.[1]);
const listNames = (block, tag) => [...block.matchAll(new RegExp(`<${tag} id="\\d+">\\s*<Name lang="en">([^<]*)</Name>`, 'g'))].map((m) => text(m[1])).filter(Boolean);

/** `en_product9_ages.xml` → Map ORPHA → `{ ageOfOnset: string[], inheritance: string[] }`. */
export function parseOrphanetAges(xml) {
  const out = new Map();
  for (const block of blocks(xml)) {
    const code = orphaCodeOf(block);
    if (!code) continue;
    out.set(code, { ageOfOnset: listNames(block, 'AverageAgeOfOnset'), inheritance: listNames(block, 'TypeOfInheritance') });
  }
  return out;
}

/** `en_product9_prev.xml` → Map ORPHA → entradas de prevalencia, con su estado de validación. */
export function parseOrphanetPrevalence(xml) {
  const out = new Map();
  for (const block of blocks(xml)) {
    const code = orphaCodeOf(block);
    if (!code) continue;
    const entries = block
      .split('<Prevalence id="')
      .slice(1)
      .map((chunk) => {
        const meanValue = Number(chunk.match(/<ValMoy>([^<]*)<\/ValMoy>/)?.[1]);
        return {
          type: firstName(chunk, 'PrevalenceType'),
          qualification: firstName(chunk, 'PrevalenceQualification'),
          class: firstName(chunk, 'PrevalenceClass'),
          meanValue: Number.isFinite(meanValue) ? meanValue : null,
          geographic: firstName(chunk, 'PrevalenceGeographic'),
          validationStatus: firstName(chunk, 'PrevalenceValidationStatus'),
          source: text(chunk.match(/<Source>([^<]*)<\/Source>/)?.[1]),
        };
      });
    if (entries.length > 0) out.set(code, entries);
  }
  return out;
}

export const orphanetPropertyId = (conceptId, propertyCode) => md5uuid(`mantra:f3:property:${propertyCode}:${conceptId}`);

/**
 * Datos por código ORPHA → tuplas `[id, concept_id, property_code, 'json', value_json]`
 * de `concept_properties`.
 *
 * @param {{ ages: Map<string, object>, prevalence: Map<string, object[]> }} data
 * @param {{ resolveDisease: (curie: string) => { conceptId: string|null, reason?: string|null }, release: string }} options
 */
export function orphanetPropertyRows({ ages, prevalence }, { resolveDisease, release }) {
  if (!release) throw new Error('orphanetPropertyRows: falta release (fecha del archivo).');
  const stats = { disorders: 0, unresolved: {}, byProperty: {}, rows: 0 };
  const merged = new Map();
  const push = (conceptId, code, entry) => {
    const key = `${conceptId}|${code}`;
    const list = merged.get(key) ?? { conceptId, code, entries: [] };
    list.entries.push(entry);
    merged.set(key, list);
  };

  const codes = [...new Set([...ages.keys(), ...prevalence.keys()])].sort((a, b) => Number(a) - Number(b));
  for (const orphaCode of codes) {
    stats.disorders += 1;
    const disease = resolveDisease(`ORPHA:${orphaCode}`);
    if (!disease?.conceptId) {
      const reason = disease?.reason ?? 'unresolved';
      stats.unresolved[reason] = (stats.unresolved[reason] ?? 0) + 1;
      continue;
    }
    const a = ages.get(orphaCode);
    if (a?.ageOfOnset.length) push(disease.conceptId, ORPHANET_PROPERTY_CODES.ageOfOnset, { orphaCode, values: a.ageOfOnset });
    if (a?.inheritance.length) push(disease.conceptId, ORPHANET_PROPERTY_CODES.inheritance, { orphaCode, values: a.inheritance });
    const p = prevalence.get(orphaCode);
    if (p?.length) push(disease.conceptId, ORPHANET_PROPERTY_CODES.prevalence, { orphaCode, entries: p });
  }

  const rows = [];
  for (const { conceptId, code, entries } of merged.values()) {
    rows.push([
      orphanetPropertyId(conceptId, code), conceptId, code, 'json',
      JSON.stringify({ source: 'Orphadata product9', license: ORPHANET_PRODUCT9_LICENSE, release, orphanet: entries }),
    ]);
    stats.byProperty[code] = (stats.byProperty[code] ?? 0) + 1;
  }
  stats.rows = rows.length;
  return { rows, stats };
}
