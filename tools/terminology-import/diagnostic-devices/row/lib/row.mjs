// =============================================================================
// Equipos de diagnóstico · ROW · fila del formato común y utilidades.
//
// El formato lo define `../../README.md` (sesión master). Acá vive la ÚNICA
// puerta para armar una fila: si el formato cambia, cambia acá. Nada se deduce:
// lo que la fuente no trae queda en `null`.
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Carpeta de la región dentro del repo (`row/`). */
export const ROW_DIR = resolve(HERE, '..');
/** Salida versionada: `row/out/`. */
export const OUT_DIR = resolve(ROW_DIR, 'out');
/** Crudos fuera de git: `<repo>/../dx-devices-build/row/` salvo `DX_DEVICES_BUILD_DIR`. */
export const BUILD_DIR =
  process.env.DX_DEVICES_BUILD_DIR ??
  resolve(ROW_DIR, '../../../../..', 'dx-devices-build', 'row');

/** Campos obligatorios, en el orden del README común. */
export const REQUIRED_FIELDS = Object.freeze([
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

/** Los que además no pueden ser `null`. */
const NON_NULL_FIELDS = new Set([
  'source',
  'sourceRecordId',
  'sourceUrl',
  'sourceVersion',
  'retrievedAt',
  'manufacturerName',
]);

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

/**
 * Texto verbatim recortado en los extremos, o `null` si quedó vacío. No toca el
 * interior (espacios dobles, espacios de ancho completo U+3000, saltos de línea):
 * la normalización la hace `master/`.
 */
export function textOrNull(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/** `dd/mm/aaaa` → `aaaa-mm-dd`; cualquier otra cosa → `null`. */
export function dmyToIso(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? '').trim());
  if (m === null) return null;
  const [, d, mo, y] = m;
  return validIso(`${y}-${mo}-${d}`);
}

/** `aaaa-mm-dd` (con o sin hora) → `aaaa-mm-dd` si es una fecha real; si no, `null`. */
export function isoDateOrNull(value) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? '').trim());
  return m === null ? null : validIso(m[1]);
}

function validIso(text) {
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
    ? null
    : text;
}

/**
 * Arma una fila del formato común completando con `null` lo que falte.
 * Lanza si falta un campo que no admite `null`: una fila sin cita no existe.
 */
export function makeRow(input) {
  const row = {};
  for (const field of REQUIRED_FIELDS) row[field] = input[field] ?? null;
  if (input.extra !== undefined && Object.keys(input.extra).length > 0)
    row.extra = input.extra;
  assertRow(row);
  return row;
}

/** Valida una fila contra el formato común. Devuelve la lista de errores (vacía = válida). */
export function rowErrors(row) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!(field in row)) errors.push(`falta el campo ${field}`);
    else if (row[field] !== null && typeof row[field] !== 'string')
      errors.push(`${field} no es string ni null`);
    else if (
      NON_NULL_FIELDS.has(field) &&
      (row[field] === null || row[field] === '')
    )
      errors.push(`${field} vacío`);
  }
  if (
    row.authorizationDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(row.authorizationDate)
  )
    errors.push('authorizationDate no es aaaa-mm-dd');
  if (row.manufacturerCountry && !/^[A-Z]{2}$/.test(row.manufacturerCountry))
    errors.push('manufacturerCountry no es ISO alfa-2');
  if (row.retrievedAt && Number.isNaN(Date.parse(row.retrievedAt)))
    errors.push('retrievedAt no es ISO 8601');
  if (
    'extra' in row &&
    (typeof row.extra !== 'object' ||
      row.extra === null ||
      Array.isArray(row.extra))
  )
    errors.push('extra no es objeto');
  return errors;
}

export function assertRow(row) {
  const errors = rowErrors(row);
  if (errors.length > 0)
    throw new Error(
      `fila inválida (${row.source}:${row.sourceRecordId}): ${errors.join('; ')}`,
    );
}

export function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256File(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolvePromise(hash.digest('hex')))
      .on('error', reject);
  });
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Nombres de país tal como los escribe ANVISA (`NOME_PAIS_FABRIC`) → ISO 3166-1
 * alfa-2. Tabla cerrada: un nombre que no esté acá queda sin país (`null`) y el
 * nombre original va igual en `extra.manufacturerCountryName`.
 */
export const ANVISA_COUNTRY_ISO = Object.freeze({
  ALEMANHA: 'DE',
  ARGENTINA: 'AR',
  ARGÉLIA: 'DZ',
  AUSTRÁLIA: 'AU',
  BANGLADESH: 'BD',
  BARBADOS: 'BB',
  BIELORRÚSSIA: 'BY',
  BOLÍVIA: 'BO',
  BRASIL: 'BR',
  BULGÁRIA: 'BG',
  BÉLGICA: 'BE',
  'BÓSNIA-HERZEGOVINA': 'BA',
  CAMBOJA: 'KH',
  CANADÁ: 'CA',
  CATAR: 'QA',
  CHILE: 'CL',
  'CHINA, REPÚBLICA POPULAR': 'CN',
  CHIPRE: 'CY',
  'CINGAPURA, REPÚBLICA DA': 'SG',
  COLÔMBIA: 'CO',
  'CORÉIA DO SUL': 'KR',
  'COSTA RICA': 'CR',
  CROÁCIA: 'HR',
  CUBA: 'CU',
  DINAMARCA: 'DK',
  'DOMINICANA, REPÚBLICA': 'DO',
  EGITO: 'EG',
  'EMIRADOS ÁRABES UNIDOS': 'AE',
  'ESCÓCIA (REINO UNIDO)': 'GB',
  ESLOVÁQUIA: 'SK',
  ESLOVÊNIA: 'SI',
  ESPANHA: 'ES',
  'ESTADOS UNIDOS DA AMÉRICA': 'US',
  ESTÔNIA: 'EE',
  FILIPINAS: 'PH',
  FINLÂNDIA: 'FI',
  FRANÇA: 'FR',
  GEÓRGIA: 'GE',
  GRÉCIA: 'GR',
  'HOLANDA (PAÍSES BAIXOS)': 'NL',
  HONDURAS: 'HN',
  'HONG KONG': 'HK',
  HUNGRIA: 'HU',
  INDONÉSIA: 'ID',
  'INGLATERRA (REINO UNIDO)': 'GB',
  IRLANDA: 'IE',
  'IRLANDA DO NORTE (REINO UNIDO)': 'GB',
  IRÃ: 'IR',
  ISLÂNDIA: 'IS',
  ISRAEL: 'IL',
  ITÁLIA: 'IT',
  JAPÃO: 'JP',
  JORDÂNIA: 'JO',
  LETÔNIA: 'LV',
  LIECHTENSTEIN: 'LI',
  LITUÂNIA: 'LT',
  LUXEMBURGO: 'LU',
  LÍBANO: 'LB',
  MALTA: 'MT',
  MALÁSIA: 'MY',
  'MAURÍCIO, REPÚBLICA DE': 'MU',
  MÉXICO: 'MX',
  MÔNACO: 'MC',
  NORUEGA: 'NO',
  'NOVA ZELÂNDIA': 'NZ',
  PAQUISTÃO: 'PK',
  PARAGUAI: 'PY',
  PERU: 'PE',
  POLÔNIA: 'PL',
  'PORTO RICO (ESTADOS UNIDOS)': 'PR',
  PORTUGAL: 'PT',
  QUÊNIA: 'KE',
  'REINO UNIDO': 'GB',
  ROMÊNIA: 'RO',
  'RÚSSIA (FEDERAÇÃO RUSSA)': 'RU',
  'SAN MARINO, REPÚBLICA': 'SM',
  'SRI LANKA': 'LK',
  SUÉCIA: 'SE',
  SUÍÇA: 'CH',
  'SÉRVIA, REPÚBLICA DA': 'RS',
  'TAILÂNDIA, REINO DA': 'TH',
  TAIWAN: 'TW',
  'TCHECA, REPÚBLICA': 'CZ',
  TURQUIA: 'TR',
  UCRÂNIA: 'UA',
  URUGUAI: 'UY',
  VENEZUELA: 'VE',
  VIETNÃ: 'VN',
  'ÁFRICA DO SUL, REPÚBLICA DA': 'ZA',
  ÁUSTRIA: 'AT',
  ÍNDIA: 'IN',
});
