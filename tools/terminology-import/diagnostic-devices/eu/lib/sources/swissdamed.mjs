// =============================================================================
// swissdamed (Swissmedic), módulo público UDI. DESACTIVADO por defecto: ver
// SOURCES.SWISSDAMED.terms (las condiciones del sitio de Swissmedic prohíben
// la extracción automatizada sin autorización; falta confirmar si rigen para
// swissdamed). El adaptador queda listo para cuando el propietario confirme.
//
// Contrato verificado contra zdavatz/swissdamed2sqlite@45cd947 (GPL-3.0):
//  POST https://swissdamed.ch/public/udi/basic-udis?page=N&size=M, cuerpo {}
//    → { values: [ { basicUdiDiCode, companyName, deviceName, deviceType,
//                    riskClass, udiDis: [ { id, udiDiCode, marketStatus,
//                    lastModifiedAt, tradeNames: [{language, textValue}] } ] } ] }
//  GET  https://swissdamed.ch/public/udi/udi-dis/{id}/details
//    → { basicUdi: {…}, udiDi: { nomenclatureCodes: [{code, term}], … } }
// =============================================================================

import { clean, makeDeviceRecord } from '../common.mjs';

export const SOURCE = 'swissmedic-swissdamed';
export const LIST_URL = 'https://swissdamed.ch/public/udi/basic-udis';
export const detailsUrl = (id) =>
  `https://swissdamed.ch/public/udi/udi-dis/${encodeURIComponent(id)}/details`;

/** Nombre comercial: el de inglés si existe; si no, el primero publicado. Todos quedan en extra. */
export function pickTradeName(tradeNames) {
  const list = (Array.isArray(tradeNames) ? tradeNames : [])
    .map((t) => ({
      language: clean(t?.language) ?? 'ANY',
      text: clean(t?.textValue ?? t?.value),
    }))
    .filter((t) => t.text);
  const en = list.find((t) => t.language.toUpperCase() === 'EN');
  return { brandName: (en ?? list[0])?.text ?? null, all: list };
}

/**
 * Un elemento de la lista de basic-udis → un registro común por UDI-DI.
 * @param {object} item
 * @param {{ retrievedAt: string, detailsById?: Map<string, object> }} ctx
 */
export function normalizeBasicUdi(item, ctx) {
  const udis = Array.isArray(item?.udiDis) ? item.udiDis : [];
  return udis
    .filter((u) => clean(u?.id))
    .map((u) => {
      const detail = ctx.detailsById?.get(String(u.id)) ?? null;
      const noms = Array.isArray(detail?.udiDi?.nomenclatureCodes)
        ? detail.udiDi.nomenclatureCodes
            .map((n) => ({ code: clean(n?.code), term: clean(n?.term) }))
            .filter((n) => n.code)
        : [];
      const { brandName, all } = pickTradeName(u.tradeNames);
      return makeDeviceRecord({
        source: SOURCE,
        sourceRecordId: String(u.id),
        sourceUrl: detailsUrl(u.id),
        sourceVersion: clean(u.lastModifiedAt)
          ? `lastModifiedAt=${clean(u.lastModifiedAt)}`
          : 'swissdamed-public-api',
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: noms[0]?.code ?? null,
        deviceTypeSystem: noms[0] ? 'emdn' : null,
        deviceTypeName: noms[0]?.term ?? null,
        manufacturerName: item.companyName,
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName,
        model: null,
        udiDi: u.udiDiCode,
        riskClass: clean(item.riskClass)
          ? `swissdamed:${clean(item.riskClass)}`
          : null,
        authorizationId: null,
        authorizationDate: null,
        status: clean(detail?.udiDi?.marketStatus) ?? clean(u.marketStatus),
        extra: {
          basicUdiDi: clean(item.basicUdiDiCode),
          deviceName: clean(item.deviceName),
          legislation: clean(item.deviceType),
          deviceTypes:
            noms.length > 1
              ? noms
                  .slice(1)
                  .map((n) => ({ system: 'emdn', code: n.code, name: n.term }))
              : null,
          tradeNames: all.length > 1 ? all : null,
        },
      });
    });
}
