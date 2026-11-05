// =============================================================================
// Italia — Banca dati e Repertorio dei dispositivi medici (BD/RDM) y CND.
//
// Verificado el 2026-10-24 contra el CSV oficial (ZIP `_csv` de
// dati.salute.gov.it, separador `;`, UTF-8, ~2,4 millones de filas, una por
// dispositivo en su versión vigente) y el diccionario v2.0 del Ministero. El
// mapeo vive en `it-bdrdm.columns.json`. Clave del registro:
// `tipologia_dm` + `progressivo_dm_ass` (1 = de clase e IVD, 2 = ensamblado).
//
// Minimización de datos: `cod_fiscale` solo se publica cuando tiene 11 dígitos
// (persona jurídica). Un código de 16 caracteres es el de una persona física y
// codifica nombre, fecha de nacimiento y sexo: se descarta.
// =============================================================================

import { createReadStream, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { clean, isoDate, makeDeviceRecord, parseCsv } from '../common.mjs';

export const SOURCE = 'it-salute-bdrdm';
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

const COMPANY_FISCAL_CODE = /^\d{11}$/;

/** Ids del fabricante con esquema: `it-cf:` (código fiscal de empresa) y `vat:` (Partita IVA verbatim, sin país). */
export function bdrdmManufacturerIds(fiscalCode, vatNumber) {
  const ids = [];
  if (fiscalCode && COMPANY_FISCAL_CODE.test(fiscalCode))
    ids.push(`it-cf:${fiscalCode}`);
  if (vatNumber && /^[A-Za-z0-9]+$/.test(vatNumber))
    ids.push(`vat:${vatNumber}`);
  return ids;
}

/**
 * Una fila del CSV → registro común. `map.columns` dice qué columna alimenta
 * cada campo común; las no mapeadas quedan en null.
 */
export function normalizeBdrdmRow(row, map, ctx) {
  const c = map.columns;
  const get = (k) => (c[k] ? clean(row[c[k]]) : null);
  const recordId = `${get('recordType')}:${get('recordNumber')}`;
  const ids = bdrdmManufacturerIds(get('fiscalCode'), get('vatNumber'));
  const versionEnd = isoDate(get('versionEndDate'));
  return makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: recordId,
    sourceUrl: ctx.sourceUrl,
    sourceVersion: ctx.sourceVersion,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: get('cndCode'),
    deviceTypeSystem: get('cndCode') ? 'cnd' : null,
    deviceTypeName: get('cndName'),
    manufacturerName: get('manufacturerName'),
    manufacturerCountry: get('manufacturerCountry'),
    manufacturerRegistryId: ids[0] ?? null,
    brandName: get('brandName'),
    model: get('model'),
    udiDi: get('udiDi'),
    riskClass: get('riskClass') ? `it-bdrdm:${get('riskClass')}` : null,
    authorizationId: null,
    authorizationDate: isoDate(get('registrationDate')),
    status: get('status'),
    extra: {
      manufacturerIds: ids.length > 1 ? ids.slice(1) : null,
      recordType: get('recordType'),
      repertorio: get('repertorio'),
      versionStartDate: isoDate(get('versionStartDate')),
      // 9999-12-31 es el valor ficticio de «vigente» (diccionario v2.0).
      versionEndDate: versionEnd === '9999-12-31' ? null : versionEnd,
      endOfMarketingDate: isoDate(get('endOfMarketingDate')),
      referenceRecord: get('referenceRecord'),
      similarGroup: get('similarGroup'),
    },
  });
}

/**
 * Lee el CSV en streaming (pesa ~525 MB: no entra como un solo string) y
 * entrega lotes `{header, records}` con las filas como objetos.
 * El separador se detecta en la primera línea.
 */
export async function* readBdrdmCsv(file, { batchLines = 50_000 } = {}) {
  const rl = createInterface({
    input: createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let headerLine = null;
  let delimiter = ';';
  let buf = [];
  let pending = '';
  const flush = () => {
    const { header, records } = parseCsv(`${headerLine}\n${buf.join('\n')}`, {
      delimiter,
    });
    buf = [];
    return { header, records };
  };
  for await (const line of rl) {
    if (headerLine === null) {
      headerLine = line.replace(/^\uFEFF/, '');
      delimiter =
        headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';
      continue;
    }
    // Un campo entre comillas con salto de línea queda partido: se reúne.
    const joined = pending ? `${pending}\n${line}` : line;
    if ((joined.match(/"/g)?.length ?? 0) % 2 === 1) {
      pending = joined;
      continue;
    }
    pending = '';
    buf.push(joined);
    if (buf.length >= batchLines) yield flush();
  }
  if (pending) buf.push(pending);
  if (buf.length) yield flush();
}
