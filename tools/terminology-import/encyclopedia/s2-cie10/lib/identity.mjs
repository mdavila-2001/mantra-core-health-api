// =============================================================================
// Identidad: qué concepto de cada fuente ES este término del glosario.
//
// Única vía de unión: el CÓDIGO CIE-10 EXACTO que la fuente declara como
// equivalencia (Orphanet «E» validada; MONDO `skos:exactMatch`). Nunca se une por
// etiqueta ni por similitud, y la etiqueta jamás entra en la decisión.
//
// Un lado (Orphanet o MONDO) solo se usa si es INEQUÍVOCO:
//   1. el código lo declara exactamente un concepto de esa fuente, y
//   2. ese concepto no corresponde, a su vez, a otro término del glosario
//      (si lo hiciera sería un grupo, no el artículo propio de esta categoría).
// Si ambos lados existen, deben corroborarse entre sí; si declaran enfermedades
// distintas, se descartan los dos (un término mal unido es peor que uno sin texto).
// =============================================================================

import { REJECT_REASONS } from './config.mjs';

/** Orphanet declara sus MONDO como `exact`; MONDO declara sus ORPHA como `exactMatch`. */
export function corroborates(orphaConcept, mondoConcept) {
  const orphaNumber = orphaConcept.orpha;
  const mondoNumber = mondoConcept.id.replace('MONDO:', '');
  const orphaSaysMondo = orphaConcept.xrefs.some((x) => x.source === 'MONDO' && x.exact && x.reference === mondoNumber);
  const mondoSaysOrpha = mondoConcept.exact.orpha.includes(orphaNumber);
  return orphaSaysMondo || mondoSaysOrpha;
}

const inverse = (pairs) => {
  const m = new Map();
  for (const [sourceId, code] of pairs) {
    if (!m.has(sourceId)) m.set(sourceId, new Set());
    m.get(sourceId).add(code);
  }
  return m;
};

/**
 * @param {{code:string}[]} terms
 * @param {{orphaConcepts:Map, orphaByCode:Map<string,string[]>, mondoConcepts:Map, mondoByCode:Map<string,string[]>}} idx
 * @returns {Map<string, {code:string, orpha:object|null, mondo:object|null, notes:string[], conflict:boolean}>}
 */
export function resolveIdentities(terms, idx) {
  const codes = new Set(terms.map((t) => t.code));
  const orphaTerms = inverse([...idx.orphaByCode].filter(([c]) => codes.has(c)).flatMap(([c, ids]) => ids.map((id) => [id, c])));
  const mondoTerms = inverse([...idx.mondoByCode].filter(([c]) => codes.has(c)).flatMap(([c, ids]) => ids.map((id) => [id, c])));
  const out = new Map();
  for (const { code } of terms) {
    const notes = [];
    const orphaIds = [...new Set(idx.orphaByCode.get(code) ?? [])];
    const mondoIds = [...new Set(idx.mondoByCode.get(code) ?? [])];
    let orpha = null;
    let mondo = null;
    if (orphaIds.length > 1) notes.push(`${REJECT_REASONS.CODE_MAPS_TO_MANY_SOURCE}:orphanet:${orphaIds.join(',')}`);
    else if (orphaIds.length === 1) {
      if (orphaTerms.get(orphaIds[0]).size > 1) notes.push(`${REJECT_REASONS.SOURCE_CONCEPT_MAPS_TO_MANY}:orphanet:ORPHA:${orphaIds[0]}`);
      else orpha = idx.orphaConcepts.get(orphaIds[0]);
    }
    if (mondoIds.length > 1) notes.push(`${REJECT_REASONS.CODE_MAPS_TO_MANY_SOURCE}:mondo:${mondoIds.join(',')}`);
    else if (mondoIds.length === 1) {
      if (mondoTerms.get(mondoIds[0]).size > 1) notes.push(`${REJECT_REASONS.SOURCE_CONCEPT_MAPS_TO_MANY}:mondo:${mondoIds[0]}`);
      else mondo = idx.mondoConcepts.get(mondoIds[0]);
    }
    let conflict = false;
    if (orpha && mondo && !corroborates(orpha, mondo)) {
      conflict = true;
      notes.push(`${REJECT_REASONS.SOURCE_CONFLICT}:ORPHA:${orpha.orpha}!=${mondo.id}`);
      orpha = null;
      mondo = null;
    }
    out.set(code, { code, orpha, mondo, notes, conflict, orphaDeclared: orphaIds, mondoDeclared: mondoIds });
  }
  return out;
}
