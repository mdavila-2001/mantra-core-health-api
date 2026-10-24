// =============================================================================
// Equivalencias publicadas, para expresar una enfermedad o un sitio en los
// códigos que cargan las sesiones hermanas. Nada se infiere:
//
//  - MONDO → ICD-10 (OMS), ICD-10-CM, MeSH, Orphanet, OMIM, NCIt, DOID, ICD-11
//    Foundation: SOLO los xrefs que MONDO marca `source="MONDO:equivalentTo"`.
//  - Uberon → FMA, NCIt, MeSH: los `xref:` que declara Uberon (sin calificador
//    de equivalencia en la fuente; se guardan con su tipo literal
//    `oboInOwl:hasDbXref`). Uberon no publica xrefs a TA2 en `uberon.obo`.
// =============================================================================

import { fromCurie } from '../common.mjs';
import { headerVersion, splitQualifiers } from '../obo.mjs';
import { mapRecord } from '../records.mjs';

const MONDO_TARGETS = new Set([
  'icd10',
  'icd10cm',
  'mesh',
  'orphanet',
  'omim',
  'ncit',
  'doid',
  'icd11-foundation',
]);
const UBERON_TARGETS = new Set(['fma', 'ncit', 'mesh']);
const purl = (curie) =>
  `http://purl.obolibrary.org/obo/${curie.replace(':', '_')}`;

/** Lee las stanzas de una ontología OBO y devuelve sus xrefs crudos por término vigente. */
export async function readXrefs(stanzas, prefix) {
  const xrefs = new Map();
  let version = null;
  for await (const st of stanzas) {
    if (st.type === 'header') version = headerVersion(st);
    if (
      st.type !== 'Term' ||
      !st.id?.startsWith(`${prefix}:`) ||
      st.tags.is_obsolete?.[0] === 'true'
    )
      continue;
    xrefs.set(st.id, (st.tags.xref ?? []).map(splitQualifiers));
  }
  return { xrefs, version };
}

function curieRef(raw) {
  if (raw.startsWith('icd11.foundation:'))
    return {
      system: 'icd11-foundation',
      code: raw.slice('icd11.foundation:'.length),
    };
  return fromCurie(raw);
}

/** Solo para los términos pedidos (`wanted`), para no volcar 26 000 enfermedades que nadie consulta. */
export function mondoMaps(read, meta, wanted) {
  const out = [];
  for (const id of wanted) {
    for (const { value, qualifiers } of read.xrefs.get(id) ?? []) {
      if (
        !qualifiers.some(
          ([k, v]) => k === 'source' && v === 'MONDO:equivalentTo',
        )
      )
        continue;
      const to = curieRef(value);
      if (!to || !MONDO_TARGETS.has(to.system)) continue;
      out.push(
        mapRecord({
          from: { system: 'mondo', code: id },
          to,
          mapType: 'MONDO:equivalentTo',
          sourceRecordId: `${id} xref ${value}`,
          uri: purl(id),
          meta,
        }),
      );
    }
  }
  return out;
}

/** Índice inverso NCIt anatomía → Uberon, y Uberon → FMA/MeSH, solo para los códigos pedidos. */
export function uberonMaps(
  read,
  meta,
  { wantedUberon = new Set(), wantedNcit = new Set() },
) {
  const out = [];
  for (const [id, list] of read.xrefs) {
    for (const { value } of list) {
      const to = curieRef(value);
      if (!to || !UBERON_TARGETS.has(to.system)) continue;
      if (
        !wantedUberon.has(id) &&
        !(to.system === 'ncit' && wantedNcit.has(to.code))
      )
        continue;
      out.push(
        mapRecord({
          from: { system: 'uberon', code: id },
          to,
          mapType: 'oboInOwl:hasDbXref',
          sourceRecordId: `${id} xref ${value}`,
          uri: purl(id),
          meta,
        }),
      );
    }
  }
  return out;
}

export { headerVersion };
