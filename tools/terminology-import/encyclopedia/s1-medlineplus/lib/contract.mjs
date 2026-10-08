// =============================================================================
// Validador del contrato `articles.ndjson` (TAREA-41 §12.3). Lo corre la
// canalización sobre cada artículo antes de escribirlo y lo reutilizan las
// pruebas: si el contrato se rompe, la corrida falla en vez de publicar.
// =============================================================================

import { isAllowedImageUrl, allowedLicense } from './images.mjs';
import { KINDS_BY_FAMILY } from './kinds.mjs';

const ALL_KINDS = new Set(Object.values(KINDS_BY_FAMILY).flat());
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SECTION_REQUIRED = ['kind', 'text', 'lang', 'source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator'];
const IMAGE_REQUIRED = ['url', 'thumbUrl', 'kind', 'altText', 'altTextQuality', 'author', 'license', 'sourcePage', 'retrievedAt'];

const present = (v) => typeof v === 'string' && v.trim() !== '';

/** @returns {string[]} errores (vacío = el artículo cumple el contrato) */
export function validateArticle(article) {
  const errors = [];
  const at = (where, msg) => errors.push(`${article?.conceptRef?.slug ?? '?'} · ${where}: ${msg}`);
  const ref = article?.conceptRef;
  for (const k of ['system', 'code', 'slug']) if (!present(ref?.[k])) at('conceptRef', `falta ${k}`);
  if (article?.lang !== 'es') at('lang', 'debe ser «es»');
  if (!Array.isArray(article?.sections) || article.sections.length === 0) at('sections', 'sin secciones');

  const kinds = new Set();
  for (const s of article?.sections ?? []) {
    for (const k of SECTION_REQUIRED) if (!present(s[k])) at(`sections[${s.kind}]`, `falta ${k}`);
    if (!ALL_KINDS.has(s.kind)) at(`sections[${s.kind}]`, 'kind fuera del catálogo cerrado');
    if (kinds.has(s.kind)) at(`sections[${s.kind}]`, 'kind repetido');
    kinds.add(s.kind);
    if (s.lang !== 'es') at(`sections[${s.kind}]`, 'lang debe ser «es» (sin traducción automática)');
    for (const d of ['retrievedAt', 'sourceVersion']) if (present(s[d]) && !ISO_DATE.test(s[d])) at(`sections[${s.kind}]`, `${d} no es una fecha ISO`);
    if (present(s.sourceUrl) && !/^https:\/\/medlineplus\.gov\//.test(s.sourceUrl)) at(`sections[${s.kind}]`, 'sourceUrl fuera de medlineplus.gov');
    if (s.items !== undefined && !(Array.isArray(s.items) && s.items.every(present))) at(`sections[${s.kind}]`, 'items inválidos');
  }

  for (const img of article?.images ?? []) {
    for (const k of IMAGE_REQUIRED) if (!present(img[k])) at('images', `falta ${k}`);
    for (const u of [img.url, img.thumbUrl]) if (!isAllowedImageUrl(u)) at('images', `host fuera de la CSP: ${u}`);
    if (!allowedLicense(img.license)) at('images', `licencia no permitida: ${img.license}`);
    if (!['caption', 'generic'].includes(img.altTextQuality)) at('images', 'altTextQuality inválido');
    if (img.altTextQuality === 'caption' && img.captionLang !== 'es') at('images', 'altText «caption» solo con pie en castellano');
    if (img.license && allowedLicense(img.license)?.family !== 'public-domain' && !present(img.licenseUrl)) at('images', 'falta licenseUrl');
  }

  for (const f of article?.facts ?? []) for (const k of ['label', 'value', 'source', 'sourceUrl']) if (!present(f[k])) at('facts', `falta ${k}`);
  for (const r of article?.references ?? []) for (const k of ['title', 'url', 'source']) if (!present(r[k])) at('references', `falta ${k}`);
  return errors;
}
