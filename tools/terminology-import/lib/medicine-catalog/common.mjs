// =============================================================================
// Catálogo universal de medicamentos · esquema común y utilidades.
//
// Cada fuente oficial se normaliza al MISMO registro, sin inventar nada: lo que
// la fuente no trae queda en `null`. Las fuentes NO se fusionan acá — cada
// registro conserva su `codeSystem` y su id de origen; el enlace entre fuentes
// es otro paso y exige igualdad exacta (ver `link-keys.mjs`).
// =============================================================================

import { deterministicId } from '../glossary-es/common.mjs';

/**
 * @typedef {'ACTIVE'|'INACTIVE'|'SUSPENDED'|'REVOKED'} RegulatoryStatus
 *
 * @typedef {Object} CatalogPhoto
 * @property {string} url
 * @property {string|null} thumbUrl
 * @property {string} attribution
 * @property {string} license
 *
 * @typedef {Object} CatalogRecord
 * @property {string} id               uuid v5 determinista (codeSystem + code)
 * @property {string} source           clave corta de la fuente: cima | anvisa | invima
 * @property {string} codeSystem       code system propio de la fuente
 * @property {string} code             id de origen (nº de registro sanitario)
 * @property {string} display          nombre comercial tal cual la fuente
 * @property {string|null} holder      titular del registro
 * @property {string|null} strengthText concentración tal cual la fuente la expresa
 * @property {string|null} dosageForm  forma farmacéutica en el idioma de la fuente
 * @property {string[]} routes         vías de administración
 * @property {boolean|null} requiresPrescription  null = la fuente no lo declara
 * @property {boolean|null} generic    null = la fuente no lo declara
 * @property {{name:string, amount:string|null, unit:string|null}[]} activeIngredients
 * @property {string[]} atc            códigos ATC de nivel 5 (7 caracteres)
 * @property {{code:string|null, name:string, gtin:string|null, active:boolean|null}[]} presentations
 * @property {RegulatoryStatus} regulatoryStatus
 * @property {boolean} selectable      una farmacia puede elegirlo (registro vigente)
 * @property {CatalogPhoto[]} photos
 * @property {string|null} sourceUrl
 * @property {string} sourceName
 * @property {string} sourceLicense
 * @property {string} sourceRetrievedAt
 */

/** ATC de nivel 5: una letra, dos dígitos, dos letras, dos dígitos (p. ej. `N02BE01`). */
const ATC_LEVEL_5 = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/;

export function isAtcLevel5(code) {
  return typeof code === 'string' && ATC_LEVEL_5.test(code.trim().toUpperCase());
}

export function normalizeAtc(code) {
  const upper = String(code ?? '').trim().toUpperCase();
  return isAtcLevel5(upper) ? upper : null;
}

/** Texto limpio o `null` si quedó vacío; no cambia mayúsculas ni contenido. */
export function textOrNull(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

/** `[a, a, b]` → `[a, b]` conservando el orden de aparición. */
export function unique(values) {
  return [...new Set(values.filter((v) => v !== null && v !== undefined && v !== ''))];
}

/** Id estable del registro: mismo (codeSystem, code) → mismo uuid en toda corrida. */
export function recordId(codeSystem, code) {
  return deterministicId(`catalog-medicine:${codeSystem}:${code}`);
}

/**
 * Arma un {@link CatalogRecord} completando lo que falta con `null`/`[]`.
 * Una sola puerta de entrada: si cambia el esquema, cambia acá.
 *
 * @param {Partial<CatalogRecord> & Pick<CatalogRecord,'source'|'codeSystem'|'code'|'display'|'regulatoryStatus'|'sourceName'|'sourceLicense'|'sourceRetrievedAt'>} input
 * @returns {CatalogRecord}
 */
export function makeRecord(input) {
  return {
    id: recordId(input.codeSystem, input.code),
    source: input.source,
    codeSystem: input.codeSystem,
    code: input.code,
    display: input.display,
    holder: input.holder ?? null,
    strengthText: input.strengthText ?? null,
    dosageForm: input.dosageForm ?? null,
    routes: input.routes ?? [],
    requiresPrescription: input.requiresPrescription ?? null,
    generic: input.generic ?? null,
    activeIngredients: input.activeIngredients ?? [],
    atc: input.atc ?? [],
    presentations: input.presentations ?? [],
    regulatoryStatus: input.regulatoryStatus,
    selectable: input.regulatoryStatus === 'ACTIVE',
    photos: input.photos ?? [],
    sourceUrl: input.sourceUrl ?? null,
    sourceName: input.sourceName,
    sourceLicense: input.sourceLicense,
    sourceRetrievedAt: input.sourceRetrievedAt,
  };
}

/**
 * Lector CSV (RFC 4180): comillas dobles, comillas escapadas por duplicación y
 * saltos de línea dentro de un campo entrecomillado. Devuelve filas de objetos
 * por encabezado. No adivina tipos: todo es texto.
 *
 * @param {string} text
 * @param {string} delimiter
 */
export function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  if (header === undefined) return [];
  return body.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}
