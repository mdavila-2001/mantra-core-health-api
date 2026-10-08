// =============================================================================
// Guardas del contrato (TAREA-41 §12.2–12.3): dosis, procedencia, kinds,
// licencia y host de imagen. Puras y sin red: cada una devuelve el motivo del
// rechazo o null.
// =============================================================================

import {
  ALLOWED_IMAGE_LICENSE, DISEASE_SECTION_KINDS, FORBIDDEN_IMAGE_LICENSE, IMAGE_HOSTS, REJECT_REASONS, SECTION_PROVENANCE_FIELDS,
} from './config.mjs';

/**
 * §12.2.5 — cero dosis y cero posología, para cualquier fuente. Es deliberadamente
 * conservadora: ante la duda el texto se rechaza (y se cuenta en `rejected.ndjson`).
 */
const DOSE_QUANTITY = /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|μg|ug|g|kg|ml|mL|UI|IU|gotas|comprimidos|tabletas|cápsulas)(?![A-Za-zÀ-ÿ])/;
const DOSE_WORDS = /\b(?:dosis|posolog[ií]a|dosage|dose|doses|dosing)\b/i;

export function dosePattern(text) {
  if (!text) return null;
  return DOSE_QUANTITY.exec(text)?.[0] ?? DOSE_WORDS.exec(text)?.[0] ?? null;
}

/** Todos los textos de una sección (texto libre e ítems). */
const sectionTexts = (s) => [s.text, ...(s.items ?? [])].filter((t) => typeof t === 'string');

/** Devuelve {reason, detail} si la sección no se puede publicar, o null. */
export function sectionProblem(section) {
  if (!DISEASE_SECTION_KINDS.includes(section.kind)) return { reason: `kind_fuera_del_catalogo`, detail: section.kind };
  const missing = SECTION_PROVENANCE_FIELDS.filter((f) => section[f] == null || section[f] === '');
  if (missing.length) return { reason: REJECT_REASONS.MISSING_PROVENANCE, detail: missing.join(',') };
  if (!['es', 'en'].includes(section.lang)) return { reason: 'lang_invalido', detail: String(section.lang) };
  if (!section.text && !(section.items?.length > 0)) return { reason: 'seccion_vacia', detail: section.kind };
  for (const t of sectionTexts(section)) {
    const hit = dosePattern(t);
    if (hit) return { reason: REJECT_REASONS.DOSE_PATTERN, detail: hit };
  }
  return null;
}

export function imageHostOk(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

const MAX_AUTHOR_LENGTH = 160;
/** El campo `Artist` de Commons a veces trae párrafos de cita; la atribución es la primera línea. */
const firstLine = (s) => (s ? (s.split('\n').map((l) => l.trim()).find(Boolean) ?? null) : null);
/** Quita los parámetros de seguimiento `utm_*` de la URL de Commons; el archivo es el mismo. */
export const stripTracking = (url) => (url ? url.replace(/\?utm_[^#]*$/, '') : url);

/**
 * Metadatos de Commons → imagen publicable o motivo de rechazo.
 * Solo `public domain`, CC0, CC BY y CC BY-SA; NC/ND/GFDL/sin licencia fuera.
 * CC BY y CC BY-SA exigen autor (atribución) y URL de licencia.
 */
export function pickImage(info, { termName, retrievedAt }) {
  const license = info.license?.trim() ?? '';
  if (!license || FORBIDDEN_IMAGE_LICENSE.test(license) || !ALLOWED_IMAGE_LICENSE.test(license)) {
    return { ok: false, reason: REJECT_REASONS.IMAGE_LICENSE, detail: license || 'sin licencia' };
  }
  if (!imageHostOk(info.url) || (info.thumbUrl && !imageHostOk(info.thumbUrl))) {
    return { ok: false, reason: REJECT_REASONS.IMAGE_HOST, detail: info.url };
  }
  const needsAttribution = /^CC[ -]BY/i.test(license);
  const author = firstLine(info.artist) ?? firstLine(info.credit);
  if (author && author.length > MAX_AUTHOR_LENGTH) return { ok: false, reason: REJECT_REASONS.IMAGE_NO_AUTHOR, detail: `autor ilegible (${author.length} caracteres): ${info.file}` };
  if (needsAttribution && !author) return { ok: false, reason: REJECT_REASONS.IMAGE_NO_AUTHOR, detail: info.file };
  if (needsAttribution && !info.licenseUrl) return { ok: false, reason: REJECT_REASONS.IMAGE_LICENSE, detail: `${license} sin URL de licencia` };
  return {
    ok: true,
    image: {
      url: stripTracking(info.url),
      thumbUrl: stripTracking(info.thumbUrl ?? info.url),
      kind: 'image',
      caption: null,
      altText: `Imagen de ${termName}`,
      altTextQuality: 'generic',
      author,
      license,
      licenseUrl: info.licenseUrl,
      sourcePage: info.pageUrl,
      retrievedAt,
    },
  };
}
