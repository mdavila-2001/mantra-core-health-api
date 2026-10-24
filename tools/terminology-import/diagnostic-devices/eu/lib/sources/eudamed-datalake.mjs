// =============================================================================
// EUDAMED Public API v1.0 (Data Lake de DG SANTE).
//
// Contrato verificado contra:
//  - el OpenAPI v1.0 oficial (servidor api.datalake.sante.service.ec.europa.eu/eudamed;
//    operaciones GET /udi, /actors, /reference; filtros en mayúsculas; format=json|csv),
//    copia en Arya012-UvA/Eudamed_Lookup@fe5bd47 docs/eudamed-public-openapi-v1.0.json;
//  - @t4dhg/mcp-eudamed@0.1.1 (MIT), que fija el sobre {value:[…], nextLink}, el
//    parámetro api-version=v1.0 y los nombres de campo observados en respuestas
//    reales (PRIMARY_DI, BASIC_UDI, TRADE_NAME, DEVICE_MODEL, MF_SRN, …).
// El OpenAPI oficial no declara esquemas de respuesta: por eso cada campo se
// lee por su nombre exacto y lo desconocido se conserva sin interpretar.
// =============================================================================

import { clean, makeDeviceRecord, makeManufacturerRecord } from '../common.mjs';

export const SOURCE = 'EUDAMED';
export const BASE_URL = (
  process.env.EUDAMED_BASE_URL ??
  'https://api.datalake.sante.service.ec.europa.eu/eudamed'
).replace(/\/$/, '');
export const API_VERSION = process.env.EUDAMED_API_VERSION ?? 'v1.0';

export function buildUrl(endpoint, params = {}, base = BASE_URL) {
  const url = new URL(`${base}/${endpoint}`);
  for (const k of Object.keys(params).sort())
    if (params[k] !== null && params[k] !== undefined && params[k] !== '')
      url.searchParams.set(k, String(params[k]));
  url.searchParams.set('format', 'json');
  url.searchParams.set('api-version', API_VERSION);
  return url.toString();
}

/** Valida el sobre de una página; cualquier otra forma es un cambio de esquema. */
export function parsePage(body) {
  if (!body || !Array.isArray(body.value))
    throw new Error(
      `Respuesta del Data Lake sin arreglo «value»: ${JSON.stringify(body).slice(0, 200)}`,
    );
  const next = body.nextLink ?? null;
  if (next !== null && typeof next !== 'string')
    throw new Error('nextLink con tipo inesperado');
  return { rows: body.value, nextLink: next };
}

/** El enlace de continuación tiene que apuntar al mismo origen y ruta, sin cambiar la consulta. */
export function assertSafeNext(nextLink, previousUrl) {
  const prev = new URL(previousUrl);
  const next = new URL(nextLink);
  if (next.origin !== prev.origin || next.pathname !== prev.pathname)
    throw new Error(`nextLink fuera de la consulta original: ${nextLink}`);
  for (const [k, v] of prev.searchParams)
    if (next.searchParams.get(k) !== v)
      throw new Error(`nextLink cambió el parámetro ${k}`);
  return next.toString();
}

/** /reference → mapa `${CODE}|${ID}` → VALUE (CODE es el nombre del campo, p. ej. RISK_CLASS_ID). */
export function buildReferenceIndex(rows) {
  const idx = new Map();
  for (const r of rows) {
    if (r.CODE === undefined || r.ID === undefined || r.VALUE === undefined)
      throw new Error(
        `Fila de /reference sin CODE/ID/VALUE: ${JSON.stringify(r)}`,
      );
    idx.set(`${r.CODE}|${r.ID}`, r.VALUE);
  }
  return idx;
}

function decode(reference, field, id) {
  if (id === null || id === undefined) return null;
  return reference?.get(`${field}|${id}`) ?? `${field}:${id}`;
}

/** SRN = «XX-MF-000000000»: XX es el país del actor (formato de SRN de EUDAMED). */
export function countryFromSrn(srn) {
  const m = /^([A-Z]{2})-(MF|AR|IM|PR)-\d{9}$/.exec(clean(srn) ?? '');
  return m ? m[1] : null;
}

/** NOMENCLATURE_CODE puede traer más de un código: se separan sin reinterpretarlos. */
export function splitNomenclature(value) {
  return (clean(value) ?? '')
    .split(/[\s,;|]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Fila de GET /udi → registro común.
 * @param {object} row
 * @param {{ reference?: Map, emdnByCode?: Map, sourceUrl: string, retrievedAt: string }} ctx
 */
export function normalizeUdiRow(row, ctx) {
  const emdnCodes = splitNomenclature(row.NOMENCLATURE_CODE);
  const primary = emdnCodes[0] ?? null;
  const model = clean(row.DEVICE_MODEL);
  const reference = clean(row.REFERENCE);
  const mfSrn = clean(row.MF_SRN);
  const recordId =
    clean(row.UUID) ??
    (row.ID !== null && row.ID !== undefined ? `ID:${row.ID}` : null);
  return makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: recordId,
    sourceUrl: ctx.sourceUrl,
    sourceVersion:
      row.VERSION_NUMBER !== null && row.VERSION_NUMBER !== undefined
        ? String(row.VERSION_NUMBER)
        : null,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: primary,
    deviceTypeSystem: primary ? 'EMDN' : null,
    deviceTypeName: primary
      ? (ctx.emdnByCode?.get(primary)?.display ?? null)
      : null,
    manufacturerName: row.MF_NAME,
    manufacturerCountry: countryFromSrn(mfSrn),
    manufacturerRegistryId: mfSrn,
    brandName: row.TRADE_NAME,
    model: model ?? reference,
    udiDi: row.PRIMARY_DI,
    riskClass: decode(ctx.reference, 'RISK_CLASS_ID', row.RISK_CLASS_ID),
    authorizationId: null,
    authorizationDate: null,
    status: decode(
      ctx.reference,
      'DEVICE_STATUS_TYPE_ID',
      row.DEVICE_STATUS_TYPE_ID ?? null,
    ),
    extensions: {
      basicUdiDi: clean(row.BASIC_UDI),
      deviceName: clean(row.DEVICE_NAME),
      reference,
      modelSource: model ? 'DEVICE_MODEL' : reference ? 'REFERENCE' : null,
      emdnCodes: emdnCodes.length > 1 ? emdnCodes : null,
      legislation: decode(
        ctx.reference,
        'APPLICABLE_LEGISLATION_ID',
        row.APPLICABLE_LEGISLATION_ID,
      ),
      placedOnTheMarket: decode(
        ctx.reference,
        'PLACED_ON_THE_MARKET_ID',
        row.PLACED_ON_THE_MARKET_ID,
      ),
      recordStatus: decode(ctx.reference, 'STATUS_ID', row.STATUS_ID),
      authorisedRepresentativeSrn: clean(row.AR_SRN),
      authorisedRepresentativeName: clean(row.AR_NAME),
      manufacturerCountrySource: countryFromSrn(mfSrn) ? 'prefijo-SRN' : null,
    },
  });
}

/** Fila de GET /actors → registro de fabricante. */
export function normalizeActorRow(row, ctx) {
  return makeManufacturerRecord({
    source: SOURCE,
    sourceRecordId: row.ACTOR_ID,
    sourceUrl: ctx.sourceUrl,
    sourceVersion: null,
    retrievedAt: ctx.retrievedAt,
    manufacturerRegistryId: row.ACTOR_ID,
    manufacturerName: row.NAME,
    manufacturerCountry:
      clean(row.ACT_COUNTRY_ISO2_CODE)?.toUpperCase() ?? null,
    actorRole: row.ACTOR_TYPE,
    extensions: {
      abbreviatedName: clean(row.ABBREVIATED_NAME),
      actorStatus: clean(row.STATUS),
    },
  });
}
