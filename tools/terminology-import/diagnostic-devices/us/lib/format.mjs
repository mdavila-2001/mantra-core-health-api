// =============================================================================
// Formato de intercambio común de equipos de diagnóstico (las 4 sesiones:
// us / eu / row / master). Lo define `tools/terminology-import/diagnostic-devices/README.md`
// (rama `justin/seed-dx-devices-master`, formatVersion 1); acá sólo se valida.
//
// Una fila = un registro de un modelo en una fuente. Los 18 campos de
// `FIELDS` aparecen siempre (valor `null` si la fuente no lo da); `extra` es
// opcional.
// =============================================================================

import { createHash } from 'node:crypto';

export const FIELDS = Object.freeze([
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'deviceTypeCode',
  'deviceTypeSystem',
  'deviceTypeName',
  'manufacturerName',
  'manufacturerCountry',
  'manufacturerRegistryId',
  'brandName',
  'model',
  'udiDi',
  'riskClass',
  'authorizationId',
  'authorizationDate',
  'status',
]);

/** Campos que nunca pueden faltar: sin ellos la fila no es trazable. */
/** Nunca `null`: procedencia y razón social (obligatoria en el README común). */
export const REQUIRED_NON_NULL = Object.freeze(['source', 'sourceRecordId', 'sourceUrl', 'sourceVersion', 'retrievedAt', 'manufacturerName']);

export const FORMAT_VERSION = 1;

/** `deviceTypeSystem` usados por esta región (tabla del README común). */
export const DEVICE_TYPE_SYSTEMS = Object.freeze(['fda-product-code', 'gmdn', 'gmdn-pt']);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Clase FDA con el esquema del README común: `fda:` + valor verbatim de la
 * fuente (`1`, `2`, `3`, `U` sin clasificar, `N` no clasificado, `f` HDE).
 */
export function fdaRiskClass(raw) {
  const v = String(raw ?? '').trim();
  return /^[123UNf]$/.test(v) ? `fda:${v}` : null;
}

/** Verbatim salvo espacios en los extremos; `null` si queda vacío. */
export function verbatim(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Texto con espacios colapsados o `null` (para códigos y claves, no para nombres). */
export function clean(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s.length ? s : null;
}

/** Fecha ISO `AAAA-MM-DD` o `null`. Acepta `AAAAMMDD`, `MM/DD/AAAA` y ISO con hora. */
export function isoDate(v) {
  const s = clean(v);
  if (!s) return null;
  if (DATE_RE.test(s.slice(0, 10))) return s.slice(0, 10);
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return null;
}

/**
 * Clave de deduplicación de fabricante: mayúsculas, sin tildes ni puntuación,
 * sin sufijos societarios. Sólo sirve para IGUALDAD exacta (nunca parecido
 * difuso, por orden del propietario).
 */
export function manufacturerKey(name) {
  const s = clean(name);
  if (!s) return null;
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\b(INCORPORATED|INC|LLC|L L C|LTD|LIMITED|CORP|CORPORATION|CO|COMPANY|GMBH|AG|SA|S A|SAS|SRL|SPA|S P A|BV|B V|NV|AB|AS|OY|KK|PLC|PTY|LLP|LP|USA|US)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

/** Clave de modelo: mayúsculas, sin espacios ni puntuación (igualdad exacta). */
export function modelKey(model) {
  const s = clean(model);
  if (!s) return null;
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, '') || null;
}

/** Id estable de una fila: sha1 de `source|sourceRecordId` (no depende del orden ni de la corrida). */
export function recordKey(r) {
  return createHash('sha1').update(`${r.source}|${r.sourceRecordId}`).digest('hex');
}

/**
 * Construye la fila con las 18 claves en orden fijo. Lanza si falta
 * procedencia o si un valor no respeta el formato.
 */
export function makeRecord(fields, extra) {
  const r = {};
  for (const f of FIELDS) r[f] = fields[f] === undefined ? null : fields[f];
  const errors = validateRecord(r);
  if (errors.length) throw new Error(`Fila inválida (${r.source}:${r.sourceRecordId}): ${errors.join('; ')}`);
  if (extra && Object.keys(extra).length) r.extra = extra;
  return r;
}

export function validateRecord(r) {
  const errors = [];
  for (const f of FIELDS) if (!(f in r)) errors.push(`falta la clave ${f}`);
  for (const f of REQUIRED_NON_NULL) if (r[f] === null || r[f] === undefined || r[f] === '') errors.push(`${f} vacío`);
  if (r.sourceUrl && !/^https?:\/\//.test(r.sourceUrl)) errors.push('sourceUrl no es URL');
  if (r.retrievedAt && Number.isNaN(Date.parse(r.retrievedAt))) errors.push('retrievedAt no es fecha');
  if (r.authorizationDate && !DATE_RE.test(r.authorizationDate)) errors.push('authorizationDate no es AAAA-MM-DD');
  if (r.deviceTypeSystem && !/^[a-z0-9:-]+$/.test(r.deviceTypeSystem)) errors.push(`deviceTypeSystem ${r.deviceTypeSystem}`);
  if (r.deviceTypeCode && !r.deviceTypeSystem) errors.push('deviceTypeCode sin deviceTypeSystem');
  if (r.riskClass && !/^[a-z-]+:[A-Za-z0-9]+$/.test(r.riskClass)) errors.push(`riskClass ${r.riskClass}`);
  if (r.manufacturerRegistryId && !/^[a-z0-9-]+:\S+$/.test(r.manufacturerRegistryId)) errors.push(`manufacturerRegistryId ${r.manufacturerRegistryId}`);
  if (!/^[a-z0-9-]+$/.test(r.source ?? '')) errors.push(`source ${r.source}`);
  if (r.manufacturerCountry && !/^[A-Z]{2}$/.test(r.manufacturerCountry)) errors.push(`manufacturerCountry ${r.manufacturerCountry}`);
  return errors;
}
