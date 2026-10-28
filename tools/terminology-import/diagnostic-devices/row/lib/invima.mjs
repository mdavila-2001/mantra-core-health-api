// =============================================================================
// Colombia · INVIMA · «Registros sanitarios de dispositivos médicos y otras
// tecnologías» (datos.gov.co, Socrata y4qt-w6tk, CC BY-SA 4.0) → formato común.
//
// El conjunto trae una línea por registro × rol (fabricante, importador,
// acondicionador, almacenador…). `fetch-official.mjs` ya excluyó los roles que
// son personas físicas (apoderado, representante legal, químico farmacéutico,
// responsable): `nombre_rol` en esos roles sería un dato personal.
//
// Una fila = un registro sanitario (+ expediente). Fabricante = las líneas con
// rol FABRICANTE (la primera por orden de aparición; las demás en
// `extra.otherManufacturers`); si el registro no tiene ninguna, el titular con
// `extra.manufacturerNameFrom = 'titular'`. Tipo: `grupo` (publicado por INVIMA:
// «REACTIVO DIAGNOSTICO», «REACTIVOS  IN VITRO», «MEDICO QUIRURGICOS»,
// «ODONTOLOGICOS») bajo el sistema `co:invima-grupo`, solo nombre.
// Marca: `marca`; el texto «null» que escribe la fuente se trata como ausente
// y entonces va el nombre del producto (`prodcuto`, sic) con `extra.brandFrom`.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

/** Nombres de país tal como los escribe INVIMA → ISO 3166-1 alfa-2 (tabla cerrada). */
export const INVIMA_COUNTRY_ISO = Object.freeze({
  ALBANIA: 'AL', ALEMANIA: 'DE', 'ARABIA SAUDITA': 'SA', ARGELIA: 'DZ', ARGENTINA: 'AR',
  AUSTRALIA: 'AU', AUSTRIA: 'AT', BANGLADESH: 'BD', BELGICA: 'BE', BIELORRUSIA: 'BY',
  BOLIVIA: 'BO', BOSNIA: 'BA', BRASIL: 'BR', BULGARIA: 'BG', CAMBOYA: 'KH', CANADA: 'CA',
  CHILE: 'CL', CHINA: 'CN', CHIPRE: 'CY', COLOMBIA: 'CO', 'COREA DEL NORTE': 'KP',
  'COREA DEL SUR': 'KR', 'COSTA RICA': 'CR', CROACIA: 'HR', CUBA: 'CU', DINAMARCA: 'DK',
  ECUADOR: 'EC', EGIPTO: 'EG', 'EMIRATOS ARABES UNIDOS': 'AE', ESCOCIA: 'GB',
  ESLOVAQUIA: 'SK', ESLOVENIA: 'SI', 'ESPAÑA': 'ES', 'ESTADOS UNIDOS DE AMÉRICA': 'US',
  ESTONIA: 'EE', FILIPINAS: 'PH', FINLANDIA: 'FI', FRANCIA: 'FR', GEORGIA: 'GE',
  GERMANY: 'DE', 'GRAN BRETAñA': 'GB', GRECIA: 'GR', GUATEMALA: 'GT', HOLANDA: 'NL',
  HONDURAS: 'HN', 'HONG KONG': 'HK', HUNGRIA: 'HU', INDIA: 'IN', INDONESIA: 'ID',
  INGLATERRA: 'GB', IRLANDA: 'IE', ISLANDIA: 'IS', ISRAEL: 'IL', ITALIA: 'IT', JAPON: 'JP',
  JORDANIA: 'JO', KENYA: 'KE', LAOS: 'LA', LETONIA: 'LV', LIBANO: 'LB', LIECHTENSTEIN: 'LI',
  LITUANIA: 'LT', LUXEMBURGO: 'LU', MADAGASCAR: 'MG', MALASIA: 'MY', MALTA: 'MT',
  MAURITIUS: 'MU', MEXICO: 'MX', MONACO: 'MC', NORUEGA: 'NO', 'NUEVA ZELANDA': 'NZ',
  'PAISES BAJOS': 'NL', PAKISTAN: 'PK', PANAMA: 'PA', PERU: 'PE', POLONIA: 'PL',
  PORTUGAL: 'PT', 'PUERTO RICO': 'PR', 'REINO UNIDO': 'GB',
  'REPUBLICA CENTROAFRICANA': 'CF', 'REPUBLICA CHECA': 'CZ', 'REPUBLICA DOMINICANA': 'DO',
  RUMANIA: 'RO', RUSIA: 'RU', SERBIA: 'RS', SEYCHELLES: 'SC', SINGAPUR: 'SG',
  'SRI LANKA': 'LK', SUDAFRICA: 'ZA', SUECIA: 'SE', SUIZA: 'CH', SWAZILAND: 'SZ',
  TAILANDIA: 'TH', TAIWAN: 'TW', TUNEZ: 'TN', TURKEY: 'TR', TURQUIA: 'TR', UCRANIA: 'UA',
  URUGUAY: 'UY', VENEZUELA: 'VE', VIETNAM: 'VN',
});

const val = (v) => {
  const t = textOrNull(v);
  return t === null || t.toLowerCase() === 'null' ? null : t;
};

export function invimaRows(input, ctx, stats = {}) {
  const groups = new Map();
  stats.inputRows = 0;
  for (const line of input) {
    if (!('registro_sanitario' in line) || !('expediente' in line))
      throw new Error('INVIMA: faltan registro_sanitario / expediente');
    stats.inputRows += 1;
    const registro = val(line.registro_sanitario);
    if (registro === null) continue;
    const key = `${registro}|${val(line.expediente) ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }
  stats.groups = groups.size;
  stats.withoutManufacturerRole = 0;
  stats.withoutAnyName = 0;
  stats.unmappedCountries = {};
  const rows = [];
  for (const [key, lines] of groups) {
    const first = lines[0];
    const holder = val(first.titular);
    const makers = [];
    const seen = new Set();
    for (const l of lines) {
      if (val(l.rol) !== 'FABRICANTE') continue;
      const name = val(l.nombre_rol);
      if (name === null) continue;
      const k = `${name}|${val(l.pais_rol)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      makers.push({ name, countryName: val(l.pais_rol) });
    }
    let manufacturerName;
    let countryName;
    let from = null;
    if (makers.length) {
      ({ name: manufacturerName, countryName } = makers[0]);
    } else if (holder !== null) {
      manufacturerName = holder;
      countryName = val(first.pais_titular);
      from = 'titular';
      stats.withoutManufacturerRole += 1;
    } else {
      stats.withoutAnyName += 1;
      continue;
    }
    const iso = countryName === null ? null : (INVIMA_COUNTRY_ISO[countryName] ?? null);
    if (countryName !== null && iso === null)
      stats.unmappedCountries[countryName] = (stats.unmappedCountries[countryName] ?? 0) + 1;
    const brand = val(first.marca);
    const product = val(first.prodcuto);
    const group = val(first.grupo);
    const risk = val(first.nivel_riesgo);
    const [registro, expediente] = key.split('|');
    rows.push(
      makeRow({
        source: 'invima-registros',
        sourceRecordId: expediente ? key : registro,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem: group === null ? null : 'co:invima-grupo',
        deviceTypeName: group,
        manufacturerName,
        manufacturerCountry: iso,
        manufacturerRegistryId: null,
        brandName: brand ?? product,
        model: null,
        udiDi: null,
        riskClass: risk === null ? null : `co:${risk}`,
        authorizationId: registro,
        authorizationDate: null,
        status: val(first.estado_registro),
        extra: {
          ...(brand === null && product !== null ? { brandFrom: 'prodcuto' } : {}),
          ...(brand !== null && product !== null ? { productName: product } : {}),
          expediente: expediente || null,
          expiryDate: isoDateOrNull(first.fecha_vencimiento),
          holder: holder === null ? null : { name: holder, ...(val(first.pais_titular) ? { countryName: val(first.pais_titular) } : {}) },
          ...(from ? { manufacturerNameFrom: from } : {}),
          ...(countryName !== null && iso === null ? { manufacturerCountryName: countryName } : {}),
          ...(makers.length > 1 ? { otherManufacturers: makers.slice(1) } : {}),
          modality: val(first.modalidad),
          official: ctx.official,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return rows;
}
