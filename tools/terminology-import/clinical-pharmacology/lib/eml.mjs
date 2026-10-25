// =============================================================================
// OMS — Lista electrónica de Medicamentos Esenciales (eEML,
// https://list.essentialmeds.org/) → indicación y formulaciones literales de
// cada recomendación vigente. Funciones puras sobre el JSON-LD que publica la
// propia eEML por recomendación (`/recommendations/<id>.jsonld`).
//
// - Universo: las recomendaciones enlazadas desde la portada de la eEML, que
//   muestra la lista vigente.
// - Enlace por código: el ATC que la OMS asigna a la recomendación
//   (`guidelineSubject.code[]` con `codingSystem: "ATC"`). Sólo ATC 5 válidos;
//   nunca por nombre.
// - Indicación: título CIE-11 de la recomendación, con su código y URI.
// - Formulaciones (`drugUnit`): una línea por formulación, tal cual.
// - Fecha: `guidelineDate` (decisión del Comité de Expertos más reciente).
//
// Licencia (página «Licensing» de la eEML, leída el 2026-10-24): CC BY 3.0 IGO,
// uso comercial permitido salvo publicidad o promoción de productos comerciales
// o sugerir respaldo de la OMS; atribución obligatoria en cada reproducción, que
// se copia en cada fila. Advertencia de la propia eEML («Caveats»): la versión
// PDF de la EML es la vinculante; también va en cada fila.
// =============================================================================

import { isAtc5 } from './cima.mjs';
import { literalFromParagraphs } from './literal.mjs';

export const EML_SOURCE = 'who-eeml';
export const EML_SOURCE_NAME = 'WHO Electronic Essential Medicines List (eEML)';
export const EML_ROOT = 'https://list.essentialmeds.org';
export const EML_LICENSE =
  'Atribución exigida por la OMS (https://list.essentialmeds.org/licencing, leída el 2026-10-24): «WHO electronic Essential Medicines List (eEML), ' +
  'World Health Organization, 2020. https://list.essentialmeds.org/ (beta version 1.0). Licence: CC BY 3.0 IGO.» La licencia no permite su uso ' +
  '«In conjunction with the advertising or promotion of commercial products, including proprietary medicines» ni «In any manner that suggests that WHO endorses any specific organisation or products».';
export const EML_CAVEAT =
  'Advertencia de la eEML (https://list.essentialmeds.org/caveats): «The eEML does NOT substitute for 2025 EML and EMLc (published as PDF documents on the WHO website: ' +
  'EML 2025: https://iris.who.int/handle/10665/382243 EMLc 2025: https://iris.who.int/handle/10665/382242 There might be differences between the electronic and the PDF versions ' +
  'of the EML and EML for children. The PDF versions are the binding versions.»';

export const emlRecommendationUrl = (id) => `${EML_ROOT}/recommendations/${id}`;
export const emlRecommendationJsonUrl = (id) => `${EML_ROOT}/recommendations/${id}.jsonld`;

/** Ids de recomendación enlazados desde la portada (HTML), ordenados numéricamente. */
export function recommendationIdsFromHome(html) {
  return [...new Set([...String(html).matchAll(/\/recommendations\/(\d+)\b/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
}

/** JSON-LD de una recomendación → registro normalizado (sin texto inventado: campos tal cual). */
export function emlRecommendation(id, json) {
  const subject = json?.guidelineSubject ?? {};
  const atcRaw = (subject.code ?? []).filter((c) => c?.codingSystem === 'ATC').map((c) => String(c.codeValue ?? '').trim());
  const ind = subject.indication ?? null;
  const icd = ind?.code ?? null;
  return {
    id: String(id),
    url: emlRecommendationUrl(id),
    jsonUrl: emlRecommendationJsonUrl(id),
    guidelineDate: /^\d{4}-\d{2}-\d{2}$/.test(json?.guidelineDate ?? '') ? json.guidelineDate : null,
    atcRaw,
    atc5: [...new Set(atcRaw.filter(isAtc5))].sort(),
    medicines: (subject.drug ?? []).map((d) => ({ id: d['@id'] ?? null, name: d.name ?? null })),
    indication: ind?.name ?? null,
    indicationDescription: ind?.disambiguatingDescription ?? null,
    icd11: icd?.codingSystem === 'ICD-11' ? { code: icd.codeValue ?? null, uri: icd.sameAs ?? null } : null,
    section: json?.section?.name ?? null,
    drugUnit: (json?.drugUnit ?? []).filter((u) => typeof u === 'string' && u.trim() !== ''),
    list: json?.list ?? null,
    includedInEmlc: json?.includedInEmlc ?? null,
    status: json?.statusForIndication ?? null,
  };
}

/** Recomendaciones vigentes: las que la OMS marca como agregadas a la lista. */
export const isCurrentRecommendation = (r) => r.status === 'AddedToEml';

function emlSection(r, key, field, literal, retrievedAt, extra = {}) {
  return {
    key,
    source: EML_SOURCE,
    sourceName: EML_SOURCE_NAME,
    language: 'en',
    audience: 'professional',
    document: {
      type: 'eml-recommendation',
      id: r.id,
      title: r.medicines.map((m) => m.name).filter(Boolean).join(' + ') || null,
      version: null,
      effectiveDate: r.guidelineDate,
      emlSection: r.section,
      list: r.list,
      includedInEmlc: r.includedInEmlc,
      url: r.url,
      pageUrl: r.url,
    },
    section: { number: field, title: null, url: r.url, apiUrl: r.jsonUrl },
    ...literal,
    ...extra,
    retrievedAt,
    license: EML_LICENSE,
    disclaimer: EML_CAVEAT,
    citation:
      `World Health Organization. WHO Electronic Essential Medicines List (eEML), recomendación ${r.id}` +
      `${r.section ? ` («${r.section}»)` : ''}, decisión del ${r.guidelineDate ?? '?'}, campo «${field}». ${r.url} (consultado el ${retrievedAt.slice(0, 10)}).`,
    selection: { criterion: 'Todas las recomendaciones vigentes de la eEML con ese ATC 5 asignado por la propia OMS.', group: { atc: r.atc5, atcRaw: r.atcRaw } },
  };
}

/** Recomendación → filas de sección literales (inglés): indicación (CIE-11) y formulaciones. */
export function emlSections(r, retrievedAt) {
  const out = [];
  const ind = literalFromParagraphs([r.indication, r.indicationDescription]);
  if (ind) out.push(emlSection(r, 'indications', 'guidelineSubject.indication', ind, retrievedAt, { codes: r.icd11 ? [{ system: 'ICD-11', ...r.icd11 }] : [] }));
  const forms = r.drugUnit.length ? literalFromParagraphs(r.drugUnit) : null;
  if (forms) out.push(emlSection(r, 'pharmaceutical_form', 'drugUnit', forms, retrievedAt));
  return out;
}
