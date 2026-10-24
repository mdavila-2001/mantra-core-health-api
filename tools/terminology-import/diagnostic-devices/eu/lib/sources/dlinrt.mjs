// =============================================================================
// EUDAMED vía la réplica DLinRT-eu/dlinrteu-website:
// docs/audits/eudamed/2026-09-22-eudamed-emdn-discovery.csv. Cada fila es un
// dispositivo devuelto por el portal de EUDAMED al consultar un código EMDN
// (columna query_url) y su ficha Basic UDI-DI (columna detail_url).
// Columnas verificadas en el archivo: cnd_code, cnd_term, trade_name,
// device_name, device_model, manufacturer_name, manufacturer_srn, risk_class,
// legislation, device_status, basic_udi, primary_di, certificate_numbers,
// notified_bodies, query_url, detail_url.
// =============================================================================

import { clean, makeDeviceRecord } from '../common.mjs';

export const SOURCE = 'eudamed-udi';

const REQUIRED = [
  'cnd_code',
  'trade_name',
  'manufacturer_name',
  'manufacturer_srn',
  'primary_di',
  'basic_udi',
  'detail_url',
];

export function assertDlinrtHeader(header) {
  const missing = REQUIRED.filter((h) => !header.includes(h));
  if (missing.length)
    throw new Error(
      `CSV de DLinRT sin columnas ${missing.join(', ')}. Encabezados reales: ${JSON.stringify(header)}`,
    );
}

/** «class-iib» del portal → eu-mdr:IIb solo si la legislación lo dice; si no, verbatim. */
export function dlinrtRiskClass(riskClass, legislation) {
  const rc = clean(riskClass);
  if (!rc) return null;
  const m = /^class-(i{1,3}|iia|iib|a|b|c|d)$/i.exec(rc);
  const leg = clean(legislation)?.toLowerCase() ?? '';
  const scheme =
    /mdr/.test(leg) && !/ivdr/.test(leg)
      ? 'eu-mdr'
      : /ivdr/.test(leg)
        ? 'eu-ivdr'
        : null;
  if (m && scheme) {
    const k = m[1].toUpperCase();
    return `${scheme}:${k === 'IIA' ? 'IIa' : k === 'IIB' ? 'IIb' : k}`;
  }
  return `eudamed:${rc}`;
}

/**
 * Identidad de la fila: el UUID del UDI-DI de EUDAMED, que detail_url trae en
 * `/devices/basicUdiData/udiDiData/{uuid}` (el mismo UUID que usa
 * eudamed2firstbase, así ambas réplicas deduplican por fila).
 */
export function dlinrtRecordId(row) {
  return (
    /\/udiDiData\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(
      row.detail_url ?? '',
    )?.[1] ?? null
  );
}

export function normalizeDlinrtRow(row, ctx) {
  const srn = clean(row.manufacturer_srn);
  const prefix = /^([A-Z]{2})-(MF|PR)-\d{9}$/.exec(srn ?? '');
  const certs = (clean(row.certificate_numbers) ?? '')
    .split(/\s*[;|]\s*/)
    .filter(Boolean);
  return makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: dlinrtRecordId(row),
    sourceUrl: clean(row.detail_url),
    sourceVersion: `eudamed-portal-api;via=dlinrteu-website@${ctx.mirror.commit.slice(0, 8)};queried=2026-09-22`,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: clean(row.cnd_code),
    deviceTypeSystem: clean(row.cnd_code) ? 'emdn' : null,
    deviceTypeName: clean(row.cnd_term),
    manufacturerName: row.manufacturer_name,
    manufacturerCountry: prefix ? prefix[1] : null,
    manufacturerRegistryId: srn ? `srn:${srn}` : null,
    brandName: clean(row.trade_name) ?? clean(row.device_name),
    model: row.device_model,
    udiDi: row.primary_di,
    riskClass: dlinrtRiskClass(row.risk_class, row.legislation),
    authorizationId: certs[0] ?? null,
    authorizationDate: null,
    status: row.device_status,
    extra: {
      basicUdiDi: clean(row.basic_udi),
      deviceName: clean(row.device_name),
      brandNameSource: clean(row.trade_name)
        ? 'trade_name'
        : clean(row.device_name)
          ? 'device_name'
          : null,
      legislation: clean(row.legislation),
      certificateNumbers: certs.length > 1 ? certs : null,
      notifiedBodies: clean(row.notified_bodies),
      queryUrl: clean(row.query_url),
      manufacturerCountrySource: prefix ? 'prefijo-SRN' : null,
      mirror: ctx.mirror,
    },
  });
}
