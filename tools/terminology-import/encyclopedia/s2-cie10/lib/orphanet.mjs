// =============================================================================
// Orphadata (CC BY 4.0) → conceptos Orphanet. Funciones puras sobre el texto del
// XML. Productos que usa el corte (todos en castellano):
//   es_product1.xml       nomenclatura, definición, referencias externas con su
//                         tipo de correspondencia (E / NTBT / BTNT / ND)
//   es_product9_prev.xml  prevalencia
//   es_product9_ages.xml  edad de inicio y herencia
//
// El XML es de máquina y regular (JDBOR); se lee por bloques `<Disorder>` con
// expresiones regulares, igual que `lib/glossary-es/medlineplus.mjs`, para no
// agregar dependencias.
// =============================================================================

import { decodeEntities } from '../../../lib/glossary-es/common.mjs';
import { ORPHANET_MAPPING_EXACT_ID, ORPHANET_VALIDATED_NAME } from './config.mjs';

const text = (s) => decodeEntities(s).replace(/\s+/g, ' ').trim();

/** Primer `<tag ...>valor</tag>` del bloque, ya decodificado; null si no está o viene vacío. */
export function firstTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  if (!m) return null;
  const v = text(m[1]);
  return v === '' ? null : v;
}

/** Valor de `<Name>` dentro del primer `<tag ...>...</tag>`. */
function nameWithin(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m ? firstTag(m[1], 'Name') : null;
}

function* disorderBlocks(xml) {
  for (const m of xml.matchAll(/<Disorder id="(\d+)">([\s\S]*?)<\/Disorder>/g)) yield { id: m[1], body: m[2] };
}

export function parseHeader(xml) {
  const head = xml.slice(0, 2000);
  return {
    date: head.match(/<JDBOR[^>]*\sdate="([^"]+)"/)?.[1] ?? null,
    version: head.match(/<JDBOR[^>]*\sversion="([^"]+)"/)?.[1] ?? null,
    licenseId: head.match(/<ShortIdentifier>([^<]+)<\/ShortIdentifier>/)?.[1] ?? null,
    licenseLegalCode: head.match(/<LegalCode>([^<]+)<\/LegalCode>/)?.[1] ?? null,
  };
}

/**
 * es_product1 → Map<orphaCode, concepto>. `xrefs[].exact` es verdadero solo si
 * la correspondencia es la «E» de Orphanet (id 21527, «correspondencia exacta»)
 * y está validada. NTBT/BTNT/ND son aproximadas y NO sirven para unir.
 */
export function parseProduct1(xml) {
  const out = new Map();
  for (const { body } of disorderBlocks(xml)) {
    const orpha = firstTag(body, 'OrphaCode');
    if (!orpha) continue;
    const defMatch = body.match(/<TextSection\b[\s\S]*?<\/TextSection>/);
    const defBlock = defMatch ? defMatch[0] : null;
    const xrefs = [];
    for (const er of body.matchAll(/<ExternalReference id="\d+">([\s\S]*?)<\/ExternalReference>/g)) {
      const b = er[1];
      const rel = b.match(/<DisorderMappingRelation id="(\d+)">/);
      const relName = nameWithin(b, 'DisorderMappingRelation');
      const validation = nameWithin(b, 'DisorderMappingValidationStatus');
      xrefs.push({
        source: firstTag(b, 'Source'),
        reference: firstTag(b, 'Reference'),
        exact: rel?.[1] === ORPHANET_MAPPING_EXACT_ID && ORPHANET_VALIDATED_NAME.test(validation ?? ''),
        mappingId: rel?.[1] ?? null,
        mappingName: relName,
        validation,
      });
    }
    out.set(orpha, {
      orpha,
      name: firstTag(body, 'Name'),
      expertLink: firstTag(body, 'ExpertLink'),
      synonyms: [...body.matchAll(/<Synonym\b[^>]*>([\s\S]*?)<\/Synonym>/g)].map((m) => text(m[1])).filter(Boolean),
      type: nameWithin(body, 'DisorderType'),
      group: nameWithin(body, 'DisorderGroup'),
      definition: defBlock ? firstTag(defBlock, 'Contents') : null,
      definitionSectionType: defBlock ? nameWithin(defBlock, 'TextSectionType') : null,
      xrefs,
    });
  }
  return out;
}

/** es_product9_prev → Map<orphaCode, prevalencias validadas (campos literales de la fuente)>. */
export function parsePrevalence(xml) {
  const out = new Map();
  for (const { body } of disorderBlocks(xml)) {
    const orpha = firstTag(body, 'OrphaCode');
    const rows = [];
    for (const p of body.matchAll(/<Prevalence id="\d+">([\s\S]*?)<\/Prevalence>/g)) {
      const b = p[1];
      if (!/^Validated$|^Validado$/i.test(nameWithin(b, 'PrevalenceValidationStatus') ?? '')) continue;
      rows.push({
        type: nameWithin(b, 'PrevalenceType'),
        qualification: nameWithin(b, 'PrevalenceQualification'),
        klass: nameWithin(b, 'PrevalenceClass'),
        mean: firstTag(b, 'ValMoy'),
        geographic: nameWithin(b, 'PrevalenceGeographic'),
        source: firstTag(b, 'Source'),
      });
    }
    if (orpha && rows.length) out.set(orpha, rows);
  }
  return out;
}

/** es_product9_ages → Map<orphaCode, {onset:[…], inheritance:[…]}> con los nombres literales. */
export function parseAges(xml) {
  const out = new Map();
  for (const { body } of disorderBlocks(xml)) {
    const orpha = firstTag(body, 'OrphaCode');
    const onset = [...body.matchAll(/<AverageAgeOfOnset id="\d+">([\s\S]*?)<\/AverageAgeOfOnset>/g)].map((m) => firstTag(m[1], 'Name')).filter(Boolean);
    const inheritance = [...body.matchAll(/<TypeOfInheritance id="\d+">([\s\S]*?)<\/TypeOfInheritance>/g)].map((m) => firstTag(m[1], 'Name')).filter(Boolean);
    if (orpha && (onset.length || inheritance.length)) out.set(orpha, { onset, inheritance });
  }
  return out;
}

/**
 * Índice código CIE-10 → ORPHA con correspondencia exacta (E, validada).
 * Devuelve también las referencias no exactas por si hace falta contarlas.
 */
export function indexIcd10(concepts) {
  const exact = new Map();
  const approximate = new Map();
  for (const c of concepts.values()) {
    for (const x of c.xrefs) {
      if (x.source !== 'ICD-10' || !x.reference) continue;
      const target = x.exact ? exact : approximate;
      if (!target.has(x.reference)) target.set(x.reference, []);
      target.get(x.reference).push(c.orpha);
    }
  }
  return { exact, approximate };
}
