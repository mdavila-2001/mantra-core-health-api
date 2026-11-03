// =============================================================================
// EUDAMED vía la réplica zdavatz/eudamed2firstbase (firstbase_json/processed):
// un archivo por UUID de EUDAMED, con el detalle UDI-DI y la Basic UDI-DI ya
// convertidos a GS1 firstbase. Mapeo verificado en el código del convertidor
// (src/transform_detail.rs, src/firstbase.rs, src/mappings.rs @48f93836):
//
//   Gtin (unidad base)                    ← primaryDi de EUDAMED (UDI-DI)
//   AdditionalTradeItemClassification 88  ← cndNomenclatures[].code (EMDN)
//   AdditionalTradeItemClassification 76  ← riskClass MDR/IVDR (85 = MDD/AIMDD/IVDD)
//   GlobalModelNumber                     ← Basic UDI-DI code, 1:1
//   GlobalModelDescription                ← Basic UDI-DI deviceName
//   MODEL_NUMBER                          ← Basic UDI-DI deviceModel (solo ese)
//   MANUFACTURER_PART_NUMBER              ← reference; SI FALTA, el convertidor
//                                           pone el primaryDi → no es un modelo
//   TradeItemDescription                  ← tradeName
//   TradeItemContactInformation EMA/EPP   ← fabricante (SRN + nombre); EAR = mandatario
//   CertificationInformation              ← certificados del Basic UDI-DI + organismo notificado
//   EUMedicalDeviceStatusCode             ← estado del UDI-DI
//
// Advertencia del convertidor: si la Basic UDI-DI faltaba en su caché, pone
// EU_CLASS_I por defecto (src/transform_detail.rs). Esas filas se marcan en
// extra.riskClassMayBeConverterDefault para que nadie tome la clase I como
// dato de EUDAMED sin verificar.
// =============================================================================

import { clean, isoDate, makeDeviceRecord } from '../common.mjs';

export const SOURCE = 'eudamed-udi';
export const detailUrl = (uuid) =>
  `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/${encodeURIComponent(uuid)}?languageIso2Code=en`;

const val = (o) => (o && typeof o === 'object' ? o.Value : o);

/** Unidad base (IsTradeItemABaseUnit) y GTIN de los niveles de empaque. */
export function findBaseUnit(draftItem) {
  const packages = [];
  let base = null;
  const visit = (ti, links) => {
    if (!ti) return;
    if (String(ti.IsTradeItemABaseUnit).toLowerCase() === 'true') base ??= ti;
    else if (ti.Gtin)
      packages.push({
        gtin: ti.Gtin,
        level: val(ti.TradeItemUnitDescriptorCode),
      });
    for (const l of links ?? [])
      visit(
        l?.CatalogueItem?.TradeItem,
        l?.CatalogueItem?.CatalogueItemChildItemLink,
      );
  };
  visit(draftItem?.TradeItem, draftItem?.CatalogueItemChildItemLink);
  return { base, packages };
}

function classifications(ti) {
  return (
    ti?.GdsnTradeItemClassification?.AdditionalTradeItemClassification ?? []
  ).flatMap((c) =>
    (c.AdditionalTradeItemClassificationValue ?? []).map((v) => ({
      system: val(c.AdditionalTradeItemClassificationSystemCode),
      code: clean(v.AdditionalTradeItemClassificationCodeValue),
    })),
  );
}

const pickLang = (list) => {
  const l = (list ?? [])
    .map((x) => ({ lang: clean(x.LanguageCode), text: clean(x.Value) }))
    .filter((x) => x.text);
  return {
    text: (l.find((x) => x.lang === 'en') ?? l[0])?.text ?? null,
    all: l,
  };
};

/** EU_CLASS_IIA + MDR → eu-mdr:IIa; IVDD_* y legados con su esquema; nunca se deduce. */
export function firstbaseRiskClass(code, system, regulatoryAct) {
  const c = clean(code);
  if (!c) return null;
  const act = clean(regulatoryAct)?.toUpperCase();
  const scheme =
    {
      MDR: 'eu-mdr',
      IVDR: 'eu-ivdr',
      MDD: 'eu-mdd',
      AIMDD: 'eu-aimdd',
      IVDD: 'eu-ivdd',
    }[act] ?? null;
  const m = /^EU_CLASS_(I{1,3}|IIA|IIB|A|B|C|D)$/.exec(c);
  if (scheme && m) {
    const k = m[1];
    return `${scheme}:${k === 'IIA' ? 'IIa' : k === 'IIB' ? 'IIb' : k}`;
  }
  return scheme ? `${scheme}:${c}` : `gs1-${system ?? 'x'}:${c}`;
}

/**
 * @param {object} doc JSON firstbase de un archivo
 * @param {{ uuid: string, emdnByCode?: Map, mirror: object, retrievedAt: string }} ctx
 */
export function normalizeFirstbaseDoc(doc, ctx) {
  const draft = doc?.DraftItem;
  const top = draft?.TradeItem;
  const { base, packages } = findBaseUnit(draft);
  const ti = base ?? top;
  const cls = [
    ...classifications(ti),
    ...(base && base !== top ? classifications(top) : []),
  ];
  const emdn = [
    ...new Set(
      cls.filter((c) => c.system === '88' && c.code).map((c) => c.code),
    ),
  ];
  const risk = cls.find((c) => ['76', '85'].includes(c.system));
  const act = clean(
    (ti?.RegulatedTradeItemModule ?? top?.RegulatedTradeItemModule)
      ?.RegulatoryInformation?.[0]?.RegulatoryAct,
  );
  const contacts =
    top?.TradeItemContactInformation ?? ti?.TradeItemContactInformation ?? [];
  const mf = contacts.find((c) =>
    ['EMA', 'EPP'].includes(val(c.ContactTypeCode)),
  );
  const ar = contacts.find((c) => val(c.ContactTypeCode) === 'EAR');
  const srnOf = (c) =>
    clean(
      (c?.AdditionalPartyIdentification ?? []).find(
        (a) => a.AdditionalPartyIdentificationTypeCode === 'SRN',
      )?.Value,
    );
  const mfSrn = srnOf(mf);
  const ids = ti?.AdditionalTradeItemIdentification ?? [];
  const idOf = (t) =>
    clean(
      ids.find((a) => a.AdditionalTradeItemIdentificationTypeCode === t)?.Value,
    );
  const modelNumber = idOf('MODEL_NUMBER');
  const mpnRaw = idOf('MANUFACTURER_PART_NUMBER');
  const udiDi = clean(ti?.Gtin);
  const mpn = mpnRaw && mpnRaw !== udiDi ? mpnRaw : null;
  const trade = pickLang(
    ti?.TradeItemDescriptionModule?.TradeItemDescriptionInformation
      ?.TradeItemDescription,
  );
  const gmi = (top?.GlobalModelInformation ??
    ti?.GlobalModelInformation ??
    [])[0];
  const certs =
    (ti?.CertificationInformationModule ?? top?.CertificationInformationModule)
      ?.CertificationInformation ?? [];
  const certList = certs
    .flatMap((ci) =>
      (ci.Certification ?? []).map((c) => ({
        certificateNumber: clean(c.CertificationValue),
        revision: clean(c.CertificationIdentification),
        standard: clean(ci.CertificationStandard),
        notifiedBodyNumber: clean(
          (ci.AdditionalCertificationOrganisationIdentifier ?? []).find(
            (o) =>
              o.AdditionalPartyIdentificationTypeCode ===
              'EU_NOTIFIED_BODY_NUMBER',
          )?.Value,
        ),
        notifiedBodyName: clean(ci.CertificationAgency),
        startDate: isoDate(c.CertificationEffectiveStartDateTime),
        endDate: isoDate(c.CertificationEffectiveEndDateTime),
      })),
    )
    .filter((c) => c.certificateNumber);
  const lastChange = clean(
    top?.TradeItemSynchronisationDates?.LastChangeDateTime,
  );
  const prefix = /^([A-Z]{2})-(MF|PR)-\d{9}$/.exec(mfSrn ?? '');
  const riskClass = risk
    ? firstbaseRiskClass(risk.code, risk.system, act)
    : null;
  return makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: ctx.uuid,
    sourceUrl: detailUrl(ctx.uuid),
    sourceVersion: `eudamed-portal-api;via=eudamed2firstbase@${ctx.mirror.commit.slice(0, 8)}${lastChange ? `;lastChange=${lastChange}` : ''}`,
    retrievedAt: ctx.retrievedAt,
    deviceTypeCode: emdn[0] ?? null,
    deviceTypeSystem: emdn[0] ? 'emdn' : null,
    deviceTypeName: emdn[0]
      ? (ctx.emdnByCode?.get(emdn[0])?.display ?? null)
      : null,
    manufacturerName: mf?.ContactName,
    manufacturerCountry: prefix ? prefix[1] : null,
    manufacturerRegistryId: mfSrn ? `srn:${mfSrn}` : null,
    brandName: trade.text,
    model: modelNumber ?? mpn,
    udiDi,
    riskClass,
    authorizationId: certList[0]?.certificateNumber ?? null,
    authorizationDate: certList[0]?.startDate ?? null,
    status: val(
      ti?.MedicalDeviceTradeItemModule?.MedicalDeviceInformation
        ?.EUMedicalDeviceStatusCode,
    ),
    extra: {
      basicUdiDi: clean(gmi?.GlobalModelNumber),
      deviceName: pickLang(gmi?.GlobalModelDescription).text,
      reference: mpn,
      modelSource: modelNumber
        ? 'MODEL_NUMBER'
        : mpn
          ? 'MANUFACTURER_PART_NUMBER'
          : null,
      legislation: act,
      manufacturerContactType: val(mf?.ContactTypeCode),
      manufacturerCountrySource: prefix ? 'prefijo-SRN' : null,
      authorisedRepresentativeSrn: srnOf(ar),
      authorisedRepresentativeName: clean(ar?.ContactName),
      certificates: certList.length ? certList : null,
      deviceTypes:
        emdn.length > 1
          ? emdn.slice(1).map((code) => ({
              system: 'emdn',
              code,
              name: ctx.emdnByCode?.get(code)?.display ?? null,
            }))
          : null,
      packageDis: packages.length ? packages : null,
      tradeNames: trade.all.length > 1 ? trade.all : null,
      riskClassMayBeConverterDefault: risk?.code === 'EU_CLASS_I' ? true : null,
      mirror: ctx.mirror,
    },
  });
}
