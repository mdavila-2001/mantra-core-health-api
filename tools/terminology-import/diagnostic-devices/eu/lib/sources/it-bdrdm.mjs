// =============================================================================
// Italia — Banca dati e Repertorio dei dispositivi medici (BD/RDM) y CND.
//
// Lo verificado sin abrir el archivo (diccionario v2.0 del Ministero, leído
// vía buscador): el registro se identifica por `progressivo_dm_ass` junto con
// `tipologia_dm` (1 = dispositivo de clase/IVD, 2 = ensamblado). El resto de
// los encabezados del CSV NO se vio desde esta sesión (host bloqueado), así
// que el mapeo de columnas vive en `it-bdrdm.columns.json` con
// `verified: false`: build.mjs no normaliza nada hasta que alguien lo
// complete mirando el encabezado real (build.mjs lo imprime).
// =============================================================================

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clean, makeDeviceRecord } from '../common.mjs';

export const SOURCE = 'IT_BDRDM';
const HERE = dirname(fileURLToPath(import.meta.url));

export function loadColumnMap(path = join(HERE, 'it-bdrdm.columns.json')) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Falla si el mapeo no está verificado o si una columna mapeada no existe en el encabezado real. */
export function assertColumnMap(map, header) {
  if (!map.verified)
    throw new Error(
      `Mapeo de columnas de la BD/RDM sin verificar. Encabezados reales: ${JSON.stringify(header)}`,
    );
  const missing = Object.entries(map.columns)
    .filter(([, col]) => col !== null && !header.includes(col))
    .map(([k, col]) => `${k}→${col}`);
  if (missing.length)
    throw new Error(
      `Columnas mapeadas que no están en el CSV: ${missing.join(', ')}`,
    );
  for (const k of ['recordNumber', 'recordType'])
    if (!map.columns[k])
      throw new Error(`El mapeo necesita «${k}» (clave del registro)`);
}

/**
 * Una fila del CSV → registro común. `map.columns` dice qué columna alimenta
 * cada campo común; las no mapeadas quedan en null.
 */
export function normalizeBdrdmRow(row, map, ctx) {
  const c = map.columns;
  const get = (k) => (c[k] ? clean(row[c[k]]) : null);
  const recordId = `${get('recordType')}:${get('recordNumber')}`;
  return makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: recordId,
    sourceUrl: ctx.sourceUrl,
    sourceVersion: ctx.sourceVersion,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: get('cndCode'),
    deviceTypeSystem: get('cndCode') ? 'CND' : null,
    deviceTypeName: get('cndName'),
    manufacturerName: get('manufacturerName'),
    manufacturerCountry: get('manufacturerCountry'),
    manufacturerRegistryId: get('manufacturerRegistryId'),
    brandName: get('brandName'),
    model: get('model'),
    udiDi: get('udiDi'),
    riskClass: get('riskClass'),
    authorizationId: null,
    authorizationDate: get('registrationDate'),
    status: get('status'),
    extensions: {
      recordType: get('recordType'),
      repertorio: get('repertorio'),
      endOfMarketingDate: get('endOfMarketingDate'),
    },
  });
}
