// =============================================================================
// Reglas mecánicas sobre el grafo del glosario, después de aplicar las capas y
// las aristas de Wikidata. Ninguna agrega conocimiento clínico: una copia la
// jerarquía oficial de CIE-10 y la otra propaga etiquetas por vínculos ya
// declarados. Las dos dejan su regla escrita en la fila.
// =============================================================================

import { dxParentCode } from './cie10es.mjs';

const DX_SYSTEM = 'cie10es-diagnosticos-2026';

function addRelation(row, type, targetSlug, provenance) {
  row.relations ??= [];
  if (row.relations.some((r) => r.type === type && r.targetSlug === targetSlug)) return false;
  row.relations.push({ type, targetSlug, provenance });
  return true;
}

/**
 * Subcategoría ↔ categoría de CIE-10 (J45.0 ↔ J45), en los dos sentidos, como
 * RELATED_TERM. Es la jerarquía de la propia clasificación; sólo entre fichas
 * que están en el glosario.
 */
export function applyDxHierarchy(rows) {
  const byCode = new Map(rows.filter((r) => r.codeSystem === DX_SYSTEM).map((r) => [r.code.toUpperCase(), r]));
  let links = 0;
  for (const child of byCode.values()) {
    const parentCode = dxParentCode(child.code.toUpperCase());
    const parent = parentCode ? byCode.get(parentCode) : null;
    if (!parent) continue;
    const prov = `cie10es:jerarquía ${child.code} ⊂ ${parent.code}`;
    if (addRelation(child, 'RELATED_TERM', parent.slug, prov)) links++;
    addRelation(parent, 'RELATED_TERM', child.slug, prov);
  }
  return links;
}

/**
 * Capítulo de la Terminologia Anatomica 1998 (prefijo del código TA98) →
 * etiqueta. A01 (anatomía general), A07 (cavidad torácica), A09.0/A09.5
 * (aparato reproductor en general, periné), A10 (cavidad abdominopélvica) y el
 * resto de A15 no nombran un sistema que tenga etiqueta: quedan sin ella.
 */
const TA98_TAGS = [
  ['A02', 'musculoskeletal'], // huesos
  ['A03', 'musculoskeletal'], // articulaciones
  ['A04', 'musculoskeletal'], // músculos
  ['A05', 'digestive'], // aparato digestivo
  ['A06', 'respiratory'], // aparato respiratorio
  ['A08', 'renal'], // aparato urinario
  ['A09.1', 'gyn-ob'], // órganos genitales femeninos internos
  ['A09.2', 'gyn-ob'], // órganos genitales femeninos externos
  ['A09.3', 'urologic'], // órganos genitales masculinos internos
  ['A09.4', 'urologic'], // órganos genitales masculinos externos
  ['A11', 'endocrine'], // glándulas endocrinas
  ['A12', 'cardiovascular'], // sistema cardiovascular
  ['A13', 'hematologic'], // sistema linfoide
  ['A14', 'neurologic'], // sistema nervioso
  ['A15.2', 'ophthalmologic'], // ojo y estructuras relacionadas
  ['A15.3', 'ent'], // oído
  ['A16', 'dermatologic'], // tegumento común
];

/** Anatomía: etiqueta por capítulo TA98 de sus códigos. */
export function tagAnatomyByTa98(rows) {
  let tagged = 0;
  for (const row of rows) {
    if (row.categoryKey !== 'anatomy') continue;
    const tags = new Set(row.tagKeys);
    for (const code of row.externalIds?.ta98 ?? []) {
      for (const [prefix, tag] of TA98_TAGS) if (code.startsWith(prefix)) tags.add(tag);
    }
    if (tags.size === row.tagKeys.length) continue;
    row.tagKeys = [...tags].sort();
    row.categoryRule = 'etiqueta por capítulo de la Terminologia Anatomica 1998 (código TA98)';
    tagged++;
  }
  return tagged;
}

/**
 * Filas sin etiqueta que están vinculadas a enfermedades (relación DISEASE)
 * heredan las etiquetas que comparten MÁS DE LA MITAD de esas enfermedades.
 * Las enfermedades llevan la etiqueta de su capítulo CIE-10, así que la cadena
 * entera es estructural.
 */
export function inheritTagsFromDiseases(rows) {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  let tagged = 0;
  for (const row of rows) {
    if (row.tagKeys.length) continue;
    const diseases = (row.relations ?? []).filter((r) => r.type === 'DISEASE').map((r) => bySlug.get(r.targetSlug)).filter(Boolean);
    if (!diseases.length) continue;
    const counts = new Map();
    for (const d of diseases) for (const t of d.tagKeys) counts.set(t, (counts.get(t) ?? 0) + 1);
    const majority = [...counts].filter(([, n]) => n * 2 > diseases.length).map(([t]) => t).sort();
    if (!majority.length) continue;
    row.tagKeys = majority;
    row.categoryRule = `etiquetas compartidas por más de la mitad de sus ${diseases.length} enfermedades vinculadas`;
    tagged++;
  }
  return tagged;
}
