// =============================================================================
// Health Canada · MDALL (Medical Devices Active Licence Listing) → formato común.
//
// El espejo guarda la descarga de la API de MDALL del 2020-02-07
// (`last_refresh_dt`): licencias activas y archivadas, compañías e
// identificadores de dispositivo. Una fila = un identificador de dispositivo
// (número de modelo o de catálogo) dentro de una licencia; las licencias sin
// identificadores salen igual, con `model: null`.
//
// - `licence_name` es el nombre de la licencia (marca o familia), verbatim.
// - MDALL no publica nomenclatura de tipo: `deviceType*` en null; el tipo de
//   licencia (System, Test Kit, …) va en `extra.licenceType`.
// - Clase: `appl_risk_class` 1–4 → `ca:I`…`ca:IV`.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** Índices por clave para unir licencias, compañías e identificadores. */
export function indexMdall({
  activeLicences,
  archiveLicences,
  companies,
  devices = [],
}) {
  const licences = new Map();
  for (const l of archiveLicences)
    licences.set(l.original_licence_no, { ...l, file: 'archive' });
  // Si una licencia figura en los dos archivos, gana la activa.
  for (const l of activeLicences)
    licences.set(l.original_licence_no, { ...l, file: 'active' });
  const companyById = new Map(companies.map((c) => [c.company_id, c]));
  const deviceNames = new Map(devices.map((d) => [d.device_id, d.trade_name]));
  return { licences, companyById, deviceNames };
}

function licenceFields(licence, company, ctx) {
  const country = textOrNull(company?.country_cd);
  const riskClass = ROMAN[licence.appl_risk_class] ?? null;
  return {
    sourceUrl: ctx.sourceUrl,
    sourceVersion: ctx.sourceVersion,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: null,
    deviceTypeSystem: null,
    deviceTypeName: null,
    manufacturerName: textOrNull(company?.company_name),
    manufacturerCountry:
      country !== null && /^[A-Z]{2}$/.test(country) ? country : null,
    manufacturerRegistryId:
      licence.company_id === undefined || licence.company_id === null
        ? null
        : `hc-company:${licence.company_id}`,
    brandName: textOrNull(licence.licence_name),
    udiDi: null,
    riskClass: riskClass === null ? null : `ca:${riskClass}`,
    authorizationId: String(licence.original_licence_no),
    authorizationDate: isoDateOrNull(licence.first_licence_status_dt),
    status: textOrNull(licence.licence_status),
  };
}

function licenceExtra(licence, company, ctx) {
  const address = company
    ? [
        company.addr_line_1,
        company.addr_line_2,
        company.addr_line_3,
        company.city,
        company.region_cd,
        company.postal_code,
        company.country_cd,
      ]
        .map(textOrNull)
        .filter((v) => v !== null)
        .join(', ')
    : null;
  return {
    licenceFile: licence.file,
    ...(textOrNull(licence.licence_type_desc)
      ? { licenceType: textOrNull(licence.licence_type_desc) }
      : {}),
    ...(isoDateOrNull(licence.end_date)
      ? { licenceEndDate: isoDateOrNull(licence.end_date) }
      : {}),
    ...(address ? { manufacturerAddress: address } : {}),
    ...(ctx.mirror ? { mirror: ctx.mirror } : {}),
    ...(ctx.official ? { official: ctx.official } : {}),
    officialPortal: ctx.officialPortal,
  };
}

/**
 * Genera las filas sin cargarlas todas en memoria.
 * @param {{licences: Map, companyById: Map}} index
 * @param {Iterable<object>} identifiers  active + archive device identifiers
 */
export function* mdallRows(index, identifiers, ctx, stats = {}) {
  const withDevices = new Set();
  const seen = new Set();
  stats.orphanIdentifiers = 0;
  stats.duplicateIdentifiers = 0;
  // Sin razón social no hay fila: el id de compañía no reemplaza al nombre.
  stats.withoutCompany = 0;
  for (const d of identifiers) {
    const licence = index.licences.get(d.original_licence_no);
    if (licence === undefined) {
      stats.orphanIdentifiers += 1;
      continue;
    }
    const id = `${d.original_licence_no}:${d.device_id}:${d.device_identifier}`;
    if (seen.has(id)) {
      stats.duplicateIdentifiers += 1;
      continue;
    }
    seen.add(id);
    withDevices.add(d.original_licence_no);
    const company = index.companyById.get(licence.company_id);
    if (textOrNull(company?.company_name) === null) {
      stats.withoutCompany += 1;
      continue;
    }
    // El archivo oficial de `device` trae el nombre comercial de cada
    // dispositivo (`trade_name`): es la marca; el nombre de la licencia queda
    // en `extra.licenceName`.
    const tradeName = textOrNull(index.deviceNames?.get(d.device_id));
    const fields = licenceFields(licence, company, ctx);
    if (tradeName !== null) {
      stats.withDeviceTradeName = (stats.withDeviceTradeName ?? 0) + 1;
      if (tradeName !== fields.brandName) fields.licenceName = fields.brandName;
      fields.brandName = tradeName;
    }
    const { licenceName, ...common } = fields;
    yield makeRow({
      source: 'hc-mdall',
      sourceRecordId: id,
      model: textOrNull(d.device_identifier),
      ...common,
      extra: {
        ...(licenceName ? { licenceName } : {}),
        deviceId: d.device_id,
        ...(isoDateOrNull(d.first_licence_dt)
          ? { deviceFirstLicenceDate: isoDateOrNull(d.first_licence_dt) }
          : {}),
        ...(isoDateOrNull(d.end_date)
          ? { deviceEndDate: isoDateOrNull(d.end_date) }
          : {}),
        ...licenceExtra(licence, company, ctx),
      },
    });
  }
  stats.licencesWithoutDevices = 0;
  for (const licence of index.licences.values()) {
    if (withDevices.has(licence.original_licence_no)) continue;
    const company = index.companyById.get(licence.company_id);
    if (textOrNull(company?.company_name) === null) {
      stats.withoutCompany += 1;
      continue;
    }
    stats.licencesWithoutDevices += 1;
    yield makeRow({
      source: 'hc-mdall',
      sourceRecordId: `${licence.original_licence_no}::`,
      model: null,
      ...licenceFields(licence, company, ctx),
      extra: licenceExtra(licence, company, ctx),
    });
  }
}
