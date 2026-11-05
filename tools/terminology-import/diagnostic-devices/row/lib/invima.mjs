// =============================================================================
// INVIMA (Colombia) · registros sanitarios de dispositivos médicos y otras
// tecnologías (datos.gov.co `y4qt-w6tk`) → formato común.
//
// Una línea por registro sanitario × producto × marca × presentación × rol. Se
// agrupa por registro + producto + marca: cada grupo es una fila; las
// presentaciones comerciales y los roles (fabricante, importador,
// acondicionador, apoderado, …) van en `extra`.
//
// - Clasificación propia de INVIMA: `grupo` («REACTIVO DIAGNOSTICO», «REACTIVOS
//   IN VITRO», «MEDICO QUIRURGICOS», «ODONTOLOGICOS») → `co:invima-grupo`.
// - Clase: `nivel_riesgo` verbatim (I, IIa, IIb, III; II y IIA en reactivos) → `co:<nivel>`.
// - Fabricante: el primer rol «FABRICANTE»; si el registro no publica ninguno, va
//   el titular y `extra.manufacturerNameFrom: TITULAR`.
// - El literal «null» de la exportación se toma como vacío.
// - País: tabla cerrada `INVIMA_COUNTRY_ISO`; lo que no está queda en null y el
//   nombre original en `extra`.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

export const INVIMA_COUNTRY_ISO = Object.freeze({
  ALBANIA: 'AL',
  ALEMANIA: 'DE',
  'ARABIA SAUDITA': 'SA',
  ARGELIA: 'DZ',
  ARGENTINA: 'AR',
  AUSTRALIA: 'AU',
  AUSTRIA: 'AT',
  BANGLADESH: 'BD',
  BELGICA: 'BE',
  BIELORRUSIA: 'BY',
  BOLIVIA: 'BO',
  BOSNIA: 'BA',
  BRASIL: 'BR',
  BULGARIA: 'BG',
  CAMBOYA: 'KH',
  CANADA: 'CA',
  CHILE: 'CL',
  CHINA: 'CN',
  CHIPRE: 'CY',
  COLOMBIA: 'CO',
  'COREA DEL NORTE': 'KP',
  'COREA DEL SUR': 'KR',
  'COSTA RICA': 'CR',
  CROACIA: 'HR',
  CUBA: 'CU',
  DINAMARCA: 'DK',
  ECUADOR: 'EC',
  EGIPTO: 'EG',
  'EMIRATOS ARABES UNIDOS': 'AE',
  ESCOCIA: 'GB',
  ESLOVAQUIA: 'SK',
  ESLOVENIA: 'SI',
  ESPAÑA: 'ES',
  'ESTADOS UNIDOS DE AMÉRICA': 'US',
  ESTONIA: 'EE',
  FILIPINAS: 'PH',
  FINLANDIA: 'FI',
  FRANCIA: 'FR',
  GEORGIA: 'GE',
  GERMANY: 'DE',
  'GRAN BRETAñA': 'GB',
  GRECIA: 'GR',
  GUATEMALA: 'GT',
  HOLANDA: 'NL',
  HONDURAS: 'HN',
  'HONG KONG': 'HK',
  HUNGRIA: 'HU',
  INDIA: 'IN',
  INDONESIA: 'ID',
  INGLATERRA: 'GB',
  IRLANDA: 'IE',
  ISLANDIA: 'IS',
  ISRAEL: 'IL',
  ITALIA: 'IT',
  JAPON: 'JP',
  JORDANIA: 'JO',
  KENYA: 'KE',
  LAOS: 'LA',
  LETONIA: 'LV',
  LIBANO: 'LB',
  LIECHTENSTEIN: 'LI',
  LITUANIA: 'LT',
  LUXEMBURGO: 'LU',
  MADAGASCAR: 'MG',
  MALASIA: 'MY',
  MALTA: 'MT',
  MAURITIUS: 'MU',
  MEXICO: 'MX',
  MONACO: 'MC',
  NORUEGA: 'NO',
  'NUEVA ZELANDA': 'NZ',
  'PAISES BAJOS': 'NL',
  PAKISTAN: 'PK',
  PANAMA: 'PA',
  PERU: 'PE',
  POLONIA: 'PL',
  PORTUGAL: 'PT',
  'PUERTO RICO': 'PR',
  'REINO UNIDO': 'GB',
  'REPUBLICA CENTROAFRICANA': 'CF',
  'REPUBLICA CHECA': 'CZ',
  'REPUBLICA DOMINICANA': 'DO',
  RUMANIA: 'RO',
  RUSIA: 'RU',
  SERBIA: 'RS',
  SEYCHELLES: 'SC',
  SINGAPUR: 'SG',
  'SRI LANKA': 'LK',
  SUDAFRICA: 'ZA',
  SUECIA: 'SE',
  SUIZA: 'CH',
  SWAZILAND: 'SZ',
  TAILANDIA: 'TH',
  TAIWAN: 'TW',
  TUNEZ: 'TN',
  TURKEY: 'TR',
  TURQUIA: 'TR',
  UCRANIA: 'UA',
  URUGUAY: 'UY',
  VENEZUELA: 'VE',
  VIETNAM: 'VN',
});

/** Texto de la exportación de INVIMA: vacío y el literal «null» → null. */
export function invimaText(value) {
  const text = textOrNull(value);
  return text === null || text === 'null' ? null : text;
}

/** `07/18/2029 12:00:00 AM` (mm/dd/aaaa) o ISO de la API → `2029-07-18`. */
export function invimaDate(value) {
  const text = invimaText(value);
  if (text === null) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  return m === null
    ? isoDateOrNull(text)
    : isoDateOrNull(`${m[3]}-${m[1]}-${m[2]}`);
}

const country = (name) =>
  name === null ? null : (INVIMA_COUNTRY_ISO[name] ?? null);

/**
 * @param {Iterable<Record<string,string>>} lines filas de las páginas CSV
 * @returns {{ rows: object[], stats: Record<string, number> }}
 */
export function invimaRows(lines, ctx) {
  const groups = new Map();
  for (const line of lines) {
    const registro = invimaText(line.registro_sanitario);
    if (registro === null) continue;
    const key = `${registro}|${line.prodcuto ?? ''}|${line.marca ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }
  const rows = [];
  const stats = {
    groups: groups.size,
    manufacturerFromHolder: 0,
    withoutName: 0,
  };
  for (const [key, group] of groups) {
    const first = group[0];
    const roles = [];
    const seenRoles = new Set();
    for (const line of group) {
      const name = invimaText(line.nombre_rol);
      const role = invimaText(line.rol);
      if (name === null && role === null) continue;
      const k = `${role}|${name}|${line.pais_rol}`;
      if (seenRoles.has(k)) continue;
      seenRoles.add(k);
      const countryName = invimaText(line.pais_rol);
      roles.push({
        role,
        name,
        city: invimaText(line.ciudad_rol),
        countryName,
        country: country(countryName),
      });
    }
    const presentations = [
      ...new Set(
        group.map((l) => invimaText(l.presentacion_comercial)).filter(Boolean),
      ),
    ];
    const maker =
      roles.find((r) => r.role === 'FABRICANTE' && r.name !== null) ?? null;
    const holder = invimaText(first.titular);
    const holderCountryName = invimaText(first.pais_titular);
    const manufacturerName = maker?.name ?? holder;
    if (manufacturerName === null) {
      stats.withoutName += 1;
      continue;
    }
    if (maker === null) stats.manufacturerFromHolder += 1;
    const nivel = invimaText(first.nivel_riesgo);
    const grupo = invimaText(first.grupo);
    rows.push(
      makeRow({
        source: 'invima-dispositivos',
        sourceRecordId: key,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem: grupo === null ? null : 'co:invima-grupo',
        deviceTypeName: grupo,
        manufacturerName,
        manufacturerCountry: maker ? maker.country : country(holderCountryName),
        manufacturerRegistryId: null,
        brandName: invimaText(first.marca),
        model: null,
        udiDi: null,
        riskClass: nivel === null ? null : `co:${nivel}`,
        authorizationId: invimaText(first.registro_sanitario),
        authorizationDate: null,
        status: invimaText(first.estado_registro),
        extra: {
          ...(invimaText(first.prodcuto)
            ? { productName: invimaText(first.prodcuto) }
            : {}),
          ...(presentations.length > 0
            ? { commercialPresentations: presentations }
            : {}),
          ...(invimaText(first.expediente)
            ? { fileNumber: invimaText(first.expediente) }
            : {}),
          ...(invimaDate(first.fecha_vencimiento)
            ? { validUntil: invimaDate(first.fecha_vencimiento) }
            : {}),
          ...(invimaText(first.vida_util)
            ? { shelfLife: invimaText(first.vida_util) }
            : {}),
          ...(invimaText(first.usos)
            ? { intendedUse: invimaText(first.usos) }
            : {}),
          ...(invimaText(first.observaciones)
            ? { observations: invimaText(first.observaciones) }
            : {}),
          ...(invimaText(first.modalidad)
            ? { modality: invimaText(first.modalidad) }
            : {}),
          holder: {
            name: holder,
            city: invimaText(first.ciudad_titular),
            countryName: holderCountryName,
            country: country(holderCountryName),
          },
          ...(maker === null
            ? { manufacturerNameFrom: 'TITULAR' }
            : { manufacturerCountryName: maker.countryName }),
          roles,
          officialFile: ctx.officialFile,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, stats };
}
