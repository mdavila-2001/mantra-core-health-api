// =============================================================================
// Enriquecimiento de filas con imágenes de Wikidata/Commons. Pura: recibe las
// filas de términos y las de `wikidata-images.ndjson` y devuelve filas nuevas.
//
// Reglas de unión (un código idéntico declarado por Wikidata, nunca parecido):
//  - CIE-10-ES Diagnósticos: P4229 (ICD-10-CM) con el mismo código; si no hay,
//    P494 (CIE-10 OMS) con el mismo código.
//  - MedlinePlus temas: P486 (MeSH) = descriptor MeSH del tema.
//  - CIMA: P267 (ATC nivel 5) → P18; si no, P117 (estructura química). La foto
//    oficial de CIMA, si existe, sigue siendo la principal; la de Commons se suma
//    a `images`.
// Con varios ítems para el mismo código se elige el de Q-id numérico menor
// (determinista, sin juicio).
// =============================================================================

function qNum(id) {
  return Number(String(id).replace(/^Q/, '')) || Number.MAX_SAFE_INTEGER;
}

export function indexImages(imageRows) {
  const idx = new Map();
  for (const r of imageRows) {
    const key = `${r.matchProperty}|${r.imageProperty}|${r.code}`;
    const cur = idx.get(key);
    if (!cur || qNum(r.wikidataId) < qNum(cur.wikidataId) || (qNum(r.wikidataId) === qNum(cur.wikidataId) && r.file < cur.file)) idx.set(key, r);
  }
  return idx;
}

function lookup(idx, prop, imgProp, codes) {
  for (const c of codes) {
    const hit = idx.get(`${prop}|${imgProp}|${c}`);
    if (hit) return hit;
  }
  return null;
}

function candidatesFor(row, idx) {
  if (row.codeSystem === 'cie10es-diagnosticos-2026') {
    return lookup(idx, 'P4229', 'P18', [row.code]) ?? lookup(idx, 'P494', 'P18', [row.code]);
  }
  if (row.codeSystem === 'medlineplus-es') {
    return lookup(idx, 'P486', 'P18', row.externalIds?.mesh ?? []);
  }
  if (row.codeSystem === 'cima-vtm') {
    const atc = row.externalIds?.atc ?? [];
    return lookup(idx, 'P267', 'P18', atc) ?? lookup(idx, 'P267', 'P117', atc);
  }
  return null;
}

function imageObject(hit) {
  return {
    kind: hit.imageProperty === 'P117' ? 'estructura-quimica' : 'imagen',
    url: hit.imageUrl,
    thumbUrl: hit.imageThumbUrl,
    attribution: hit.imageAttribution,
    license: hit.imageLicense,
    licenseUrl: hit.imageLicenseUrl,
    sourcePage: hit.imageSourcePage,
    origin: 'wikimedia-commons',
    wikidataId: hit.wikidataId,
    matchProperty: `${hit.matchProperty} (${hit.matchPropertyName}) = ${hit.code}`,
  };
}

/** Devuelve una fila nueva con la imagen aplicada (o la misma si no hay coincidencia). */
export function applyImage(row, idx) {
  const hit = candidatesFor(row, idx);
  if (!hit) return row;
  const img = imageObject(hit);
  const next = {
    ...row,
    externalIds: { ...(row.externalIds ?? {}), wikidata: hit.wikidataId },
    wikidataDescriptionEs: hit.esDescription ?? null,
    images: [...(row.images ?? []), img],
  };
  // Resumen breve: sólo si la fila no trae uno de su propia fuente y el ítem de
  // Wikidata tiene descripción ES; con su procedencia (CC0, comunidad).
  if (!row.plainSummaryEs && hit.esDescription && row.categoryKey !== 'anatomy') {
    next.plainSummaryEs = hit.esDescription;
    next.plainSummarySource = { name: `Wikidata ${hit.wikidataId} — descripción en castellano (comunidad de Wikidata, CC0)`, url: `https://www.wikidata.org/wiki/${hit.wikidataId}`, retrievedAt: hit.retrievedAt ?? null, kind: 'wikidata-description' };
  }
  if (!row.imageUrl) {
    Object.assign(next, {
      imageUrl: img.url,
      imageThumbUrl: img.thumbUrl,
      imageAttribution: img.attribution,
      imageLicense: img.license,
      imageLicenseUrl: img.licenseUrl,
      imageSourcePage: img.sourcePage,
      imageOrigin: 'wikimedia-commons',
      imageMatch: img.matchProperty,
    });
  }
  return next;
}
