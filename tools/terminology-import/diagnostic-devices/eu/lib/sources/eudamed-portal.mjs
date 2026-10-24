// =============================================================================
// EUDAMED, API interna del portal público: solo para COMPLETAR certificado y
// organismo notificado de equipos ya obtenidos por el Data Lake (que no los
// publica). No se descarga en bloque (ver SOURCES.EUDAMED_PORTAL.terms).
//
// Contrato documentado por la comunidad en openregulatory/eudamed-api (MIT):
// GET /devices/basicUdiData/{uuid}?languageIso2Code=en → deviceCertificateInfoList[]
// con certificateNumber, certificateRevision, certificateExpiry, issueDate,
// certificateType.code, status.code y notifiedBody {srn, name, countryIso2Code}.
// La auditoría openregulatory/eudamed-audit documenta que la misma lista viene
// duplicada y con uuids repetidos: por eso se deduplica por número + revisión.
// =============================================================================

import { clean, isoDate } from '../common.mjs';

export const PORTAL_BASE = 'https://ec.europa.eu/tools/eudamed/api';

export const basicUdiDataUrl = (uuid) =>
  `${PORTAL_BASE}/devices/basicUdiData/${encodeURIComponent(uuid)}?languageIso2Code=en`;

/** Certificados de un basicUdiData, deduplicados por número + revisión. */
export function extractCertificates(basicUdiData) {
  const list = Array.isArray(basicUdiData?.deviceCertificateInfoList)
    ? basicUdiData.deviceCertificateInfoList
    : [];
  const byKey = new Map();
  for (const c of list) {
    const number = clean(c?.certificateNumber);
    if (!number) continue;
    const key = `${number}|${clean(c.certificateRevision) ?? ''}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      certificateNumber: number,
      certificateRevision: clean(c.certificateRevision),
      certificateType: clean(c.certificateType?.code),
      status: clean(c.status?.code),
      issueDate: isoDate(c.issueDate),
      startingValidityDate: isoDate(c.startingValidityDate),
      expiryDate: isoDate(c.certificateExpiry),
      notifiedBodySrn: clean(c.notifiedBody?.srn),
      notifiedBodyName: clean(c.notifiedBody?.name),
      notifiedBodyCountry: clean(c.notifiedBody?.countryIso2Code),
    });
  }
  return [...byKey.values()];
}

/**
 * Completa un registro común con el certificado: authorizationId toma el
 * primer certificado (orden de la fuente) y la lista completa queda en
 * extra.certificates. No cambia ningún otro campo.
 */
export function enrichWithCertificates(record, basicUdiData, certSourceUrl) {
  const certs = extractCertificates(basicUdiData);
  if (!certs.length) return record;
  return {
    ...record,
    authorizationId: certs[0].certificateNumber,
    authorizationDate: certs[0].issueDate ?? certs[0].startingValidityDate,
    extra: {
      ...record.extra,
      certificates: certs,
      certificatesSourceUrl: certSourceUrl,
    },
  };
}
