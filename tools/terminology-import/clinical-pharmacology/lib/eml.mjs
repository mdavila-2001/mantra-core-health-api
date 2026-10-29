// =============================================================================
// OMS — Lista electrónica de Medicamentos Esenciales (eEML,
// https://list.essentialmeds.org/) → REFERENCIAS a cada recomendación vigente.
// Funciones puras sobre el JSON-LD que publica la propia eEML por recomendación
// (`/recommendations/<id>.jsonld`).
//
// SOLO REFERENCIAS (decisión del propietario, 2026-10-26, issue 824): de cada
// recomendación se guardan identificadores y enlaces —id, URL, URL del JSON-LD,
// fecha de la decisión, ATC 5 que asigna la OMS, ids de los medicamentos, código
// CIE-11 y su URI—. NO se copia su texto (indicación, descripción, formulaciones,
// nombres), porque la licencia CC BY 3.0 IGO excluye el uso «in conjunction with
// the advertising or promotion of commercial products» y que la app quede fuera
// de ese supuesto no está confirmado con la OMS. No hay filas de sección de la
// eEML: la referencia viaja en `externalDocuments`, igual que los SPL de
// DailyMed cuyo texto no se redistribuye.
//
// - Universo: las recomendaciones enlazadas desde la portada de la eEML, que
//   muestra la lista vigente.
// - Enlace por código: el ATC que la OMS asigna a la recomendación
//   (`guidelineSubject.code[]` con `codingSystem: "ATC"`). Sólo ATC 5 válidos;
//   nunca por nombre.
// - Código CIE-11 de la indicación: identificador (código y URI), no el título.
// - Fecha: `guidelineDate` (decisión del Comité de Expertos más reciente).
//
// Licencia (página «Licensing» de la eEML, leída el 2026-10-24): CC BY 3.0 IGO,
// uso comercial permitido salvo publicidad o promoción de productos comerciales
// o sugerir respaldo de la OMS. Cada referencia lleva el nombre de la licencia y
// el enlace a su página.
// =============================================================================

import { isAtc5 } from './cima.mjs';

export const EML_SOURCE = 'who-eeml';
export const EML_SOURCE_NAME = 'WHO Electronic Essential Medicines List (eEML)';
export const EML_ROOT = 'https://list.essentialmeds.org';
export const EML_LICENSE_NAME = 'CC BY 3.0 IGO';
export const EML_LICENSE_URL = `${EML_ROOT}/licencing`;
export const EML_TEXT_WITHHELD =
  'Texto no copiado: la licencia de la eEML (CC BY 3.0 IGO) excluye su uso «In conjunction with the advertising or promotion of commercial products» ' +
  'y no está confirmado con la OMS que esta aplicación quede fuera de ese supuesto. Se guardan sólo identificadores y enlaces a la recomendación.';

export const emlRecommendationUrl = (id) => `${EML_ROOT}/recommendations/${id}`;
export const emlRecommendationJsonUrl = (id) => `${EML_ROOT}/recommendations/${id}.jsonld`;

/** Ids de recomendación enlazados desde la portada (HTML), ordenados numéricamente. */
export function recommendationIdsFromHome(html) {
  return [...new Set([...String(html).matchAll(/\/recommendations\/(\d+)\b/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
}

/**
 * JSON-LD de una recomendación → registro normalizado. Sólo identificadores y enlaces: no se extrae el
 * título de la indicación, su descripción, las formulaciones (`drugUnit`), el rótulo de la sección de la
 * lista ni los nombres de los medicamentos (ver la decisión del encabezado).
 */
export function emlRecommendation(id, json) {
  const subject = json?.guidelineSubject ?? {};
  const atcRaw = (subject.code ?? []).filter((c) => c?.codingSystem === 'ATC').map((c) => String(c.codeValue ?? '').trim());
  const icd = subject.indication?.code ?? null;
  return {
    id: String(id),
    url: emlRecommendationUrl(id),
    jsonUrl: emlRecommendationJsonUrl(id),
    guidelineDate: /^\d{4}-\d{2}-\d{2}$/.test(json?.guidelineDate ?? '') ? json.guidelineDate : null,
    atcRaw,
    atc5: [...new Set(atcRaw.filter(isAtc5))].sort(),
    medicines: (subject.drug ?? []).map((d) => ({ id: d['@id'] ?? null })),
    icd11: icd?.codingSystem === 'ICD-11' ? { code: icd.codeValue ?? null, uri: icd.sameAs ?? null } : null,
    list: json?.list ?? null,
    includedInEmlc: json?.includedInEmlc ?? null,
    status: json?.statusForIndication ?? null,
  };
}

/** Recomendaciones vigentes: las que la OMS marca como agregadas a la lista. */
export const isCurrentRecommendation = (r) => r.status === 'AddedToEml';

/**
 * Recomendación → referencia citable SIN texto. Sólo identificadores y enlaces:
 * id y URL de la recomendación, URL del JSON-LD, fecha de la decisión, ATC 5 de
 * la OMS, ids de los medicamentos, código CIE-11 con su URI y los rótulos de
 * lista (`list`, `includedInEmlc`). No lleva título, indicación, descripción,
 * formulaciones ni nombres de medicamentos.
 */
export function emlReference(r, retrievedAt) {
  return {
    source: EML_SOURCE,
    sourceName: EML_SOURCE_NAME,
    document: {
      type: 'eml-recommendation',
      id: r.id,
      url: r.url,
      jsonUrl: r.jsonUrl,
      effectiveDate: r.guidelineDate,
      list: r.list,
      includedInEmlc: r.includedInEmlc,
    },
    atc5: r.atc5,
    medicineIds: r.medicines.map((m) => m.id).filter(Boolean),
    icd11: r.icd11,
    license: EML_LICENSE_NAME,
    licenseUrl: EML_LICENSE_URL,
    textWithheld: EML_TEXT_WITHHELD,
    retrievedAt,
  };
}

/**
 * Filas de sección de la eEML de un corpus anterior a la decisión (con texto) → referencias sin texto.
 * Agrupa por recomendación; de cada fila sólo toma identificadores y enlaces. Las recomendaciones que la
 * fila anota en `document.alsoIn` (misma sección repetida) pasan a ser referencias mínimas (id y enlaces).
 */
export function emlReferencesFromSections(sections) {
  const byId = new Map();
  const upsert = (id, patch) => {
    const prev = byId.get(id) ?? emlReference({ id, url: emlRecommendationUrl(id), jsonUrl: emlRecommendationJsonUrl(id), guidelineDate: null, list: null, includedInEmlc: null, atc5: [], medicines: [], icd11: null }, null);
    byId.set(id, { ...prev, ...patch, document: { ...prev.document, ...(patch.document ?? {}) } });
  };
  for (const s of sections.filter((x) => x.source === EML_SOURCE)) {
    const id = String(s.document.id);
    const code = (s.codes ?? []).find((c) => c.system === 'ICD-11');
    upsert(id, {
      document: { effectiveDate: s.document.effectiveDate ?? null, list: s.document.list ?? null, includedInEmlc: s.document.includedInEmlc ?? null },
      atc5: s.selection?.group?.atc ?? [],
      icd11: code ? { code: code.code ?? null, uri: code.uri ?? null } : (byId.get(id)?.icd11 ?? null),
      retrievedAt: s.retrievedAt ?? null,
    });
    for (const other of s.document.alsoIn ?? []) if (!byId.has(String(other))) upsert(String(other), { atc5: s.selection?.group?.atc ?? [], retrievedAt: s.retrievedAt ?? null });
  }
  return [...byId.values()].sort((a, b) => Number(a.document.id) - Number(b.document.id));
}
