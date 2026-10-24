// =============================================================================
// CDSCO (India) · licencias de importación de dispositivos médicos → formato común.
//
// La lista «MD - Medical Devices» de CDSCO (licencias IMP/MD emitidas por la
// autoridad central) trae una fila por dispositivo de cada licencia: importador,
// número y fecha de licencia, nombre del dispositivo, clase A–D, uso previsto,
// marca, números de modelo y los sitios de fabricación (legal y real) con país.
//
// Cosas de la exportación que se resuelven sin inventar:
// - «Model Numbers» largos vienen como `<inicio>... Show More<completo> Show Less`
//   (el botón de la página): se toma el texto completo.
// - Cada sitio viene como `M / s <razón social>,  <dirección>, \nCountry: <país>`:
//   la razón social es lo que va antes del primer «,  » (coma y dos espacios),
//   el separador que la propia exportación usa entre nombre y dirección. Si no
//   aparece, ese sitio no aporta nombre. El texto original queda en `extra`.
// - «NIL» en modelos o marca es vacío.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

export const CDSCO_HEADER = Object.freeze([
  'S No.',
  'Importer Name and address',
  'License Number',
  'Name of Device',
  'Device Class',
  'Intended Use',
  'Brand Name',
  'Model Numbers',
  'Issuing Authority',
  'Action',
  'Address',
  'Intended',
]);

/** Países tal como los escribe CDSCO («Country: …») → ISO 3166-1 alfa-2. Tabla cerrada. */
export const CDSCO_COUNTRY_ISO = Object.freeze({
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Bangladesh: 'BD',
  Barbados: 'BB',
  Belarus: 'BY',
  Belgium: 'BE',
  'Bosnia-Herzegovina': 'BA',
  Brazil: 'BR',
  Bulgaria: 'BG',
  Canada: 'CA',
  Chile: 'CL',
  China: 'CN',
  'Costa Rica': 'CR',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  Denmark: 'DK',
  Dominica: 'DM',
  'Dominican Republic': 'DO',
  Egypt: 'EG',
  Estonia: 'EE',
  Finland: 'FI',
  France: 'FR',
  Georgia: 'GE',
  Germany: 'DE',
  Greece: 'GR',
  'Hong Kong': 'HK',
  Hungary: 'HU',
  India: 'IN',
  Indonesia: 'ID',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Japan: 'JP',
  Latvia: 'LV',
  Liechtenstein: 'LI',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Macedonia: 'MK',
  Malaysia: 'MY',
  Malta: 'MT',
  Mauritius: 'MU',
  Mexico: 'MX',
  Morocco: 'MA',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nicaragua: 'NI',
  Norway: 'NO',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  'Puerto Rico': 'PR',
  Romania: 'RO',
  Russia: 'RU',
  Serbia: 'RS',
  Seychelles: 'SC',
  Singapore: 'SG',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Swaziland: 'SZ',
  Sweden: 'SE',
  Switzerland: 'CH',
  Taiwan: 'TW',
  Thailand: 'TH',
  Tunisia: 'TN',
  Turkey: 'TR',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  Uruguay: 'UY',
  Vietnam: 'VN',
});

const MONTHS = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

/** `Licence no: IMP/MD/2018/000001 Issued on: 16-MAR-2018` → número y fecha ISO. */
export function parseCdscoLicence(text) {
  const m =
    /^Licence no:\s*(\S+)\s+Issued on:\s*(\d{2})-([A-Z]{3})-(\d{4})\s*$/.exec(
      String(text ?? '').trim(),
    );
  if (m === null) return null;
  const month = MONTHS[m[3]];
  return {
    number: m[1],
    date: month ? isoDateOrNull(`${m[4]}-${month}-${m[2]}`) : null,
  };
}

/** Quita el artefacto «… Show More<completo> Show Less» de la página de CDSCO. */
export function expandShowMore(text) {
  const value = textOrNull(text);
  if (value === null) return null;
  const m = /^[\s\S]*?Show More([\s\S]*?)\s?Show Less$/.exec(value);
  return m === null ? value : textOrNull(m[1]);
}

const nilToNull = (text) => {
  const value = textOrNull(text);
  return value === null || value.toUpperCase() === 'NIL' ? null : value;
};

/** Sitios de fabricación del campo «Address», en el orden de la fuente. */
export function parseCdscoSites(address) {
  const text = String(address ?? '');
  const sites = [];
  const re = /(Legal|Actual) Manufacturing Site\s*:\s*/g;
  const marks = [...text.matchAll(re)];
  marks.forEach((mark, i) => {
    const body = text.slice(
      mark.index + mark[0].length,
      i + 1 < marks.length ? marks[i + 1].index : text.length,
    );
    const afterMs = body.replace(/^M \/ s\s*/, '');
    const cut = afterMs.indexOf(',  ');
    const countryName = textOrNull(/Country:\s*([^\n]*)/.exec(body)?.[1]);
    sites.push({
      role: mark[1].toLowerCase(),
      name: cut > 0 ? textOrNull(afterMs.slice(0, cut)) : null,
      country:
        countryName === null ? null : (CDSCO_COUNTRY_ISO[countryName] ?? null),
      countryName,
    });
  });
  return sites;
}

/**
 * @param {unknown[][]} sheetRows filas del JSONL de `xlsx-to-jsonl.py` (con título y encabezado)
 * @returns {{ rows: object[], skipped: Record<string, number> }}
 */
export function cdscoRows(sheetRows, ctx) {
  const headerIndex = sheetRows.findIndex((cells) => cells[0] === 'S No.');
  const header = sheetRows[headerIndex];
  if (JSON.stringify(header) !== JSON.stringify(CDSCO_HEADER))
    throw new Error(`encabezado CDSCO inesperado: ${JSON.stringify(header)}`);
  const rows = [];
  const skipped = { badLicence: 0, withoutManufacturer: 0 };
  for (const cells of sheetRows.slice(headerIndex + 1)) {
    if (cells.every((c) => c === null)) continue;
    const r = Object.fromEntries(
      header.map((name, i) => [name, cells[i] ?? null]),
    );
    const licence = parseCdscoLicence(r['License Number']);
    if (licence === null) {
      skipped.badLicence += 1;
      continue;
    }
    const sites = parseCdscoSites(r.Address);
    const primary =
      sites.find((s) => s.role === 'legal' && s.name) ??
      sites.find((s) => s.name) ??
      null;
    if (primary === null) {
      skipped.withoutManufacturer += 1;
      continue;
    }
    const classText = textOrNull(r['Device Class']);
    const classMatch =
      classText === null ? null : /^Class ([A-D])$/.exec(classText);
    rows.push(
      makeRow({
        source: 'cdsco-import-licences',
        sourceRecordId: `${licence.number}#${r['S No.']}`,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem:
          textOrNull(r['Name of Device']) === null
            ? null
            : 'in:cdsco-device-name',
        deviceTypeName: textOrNull(r['Name of Device']),
        manufacturerName: primary.name,
        manufacturerCountry: primary.country,
        manufacturerRegistryId: null,
        brandName: nilToNull(r['Brand Name']),
        model: nilToNull(expandShowMore(r['Model Numbers'])),
        udiDi: null,
        riskClass: classMatch ? `in:${classMatch[1]}` : classText,
        authorizationId: licence.number,
        authorizationDate: licence.date,
        status: textOrNull(r.Action),
        extra: {
          rowNumber: r['S No.'],
          manufacturerRole:
            primary.role === 'legal'
              ? 'Legal Manufacturing Site'
              : 'Actual Manufacturing Site',
          ...(primary.countryName
            ? { manufacturerCountryName: primary.countryName }
            : {}),
          manufacturingSites: sites,
          manufacturingSitesText: textOrNull(r.Address),
          importer: textOrNull(r['Importer Name and address']),
          ...(textOrNull(r['Intended Use'])
            ? { intendedUse: textOrNull(r['Intended Use']) }
            : {}),
          issuingAuthority: textOrNull(r['Issuing Authority']),
          mirror: ctx.mirror,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, skipped };
}
