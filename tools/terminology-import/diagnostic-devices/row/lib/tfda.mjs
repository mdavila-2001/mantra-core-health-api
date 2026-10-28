// =============================================================================
// Taiwán · TFDA · Medical Device Licence Dataset (醫療器材許可證資料集) →
// formato común. Archivo oficial `https://data.fda.gov.tw/data/opendata/export/68/csv`
// (zip con `68_2.csv`, UTF-8 con BOM, 34 columnas, actualización semanal).
// Licencia declarada por data.gov.tw (dataset 9576): «1» = Government Open Data
// License v1.0 (ver SOURCES.md).
//
// - Una fila = una licencia (許可證字號). Cuatro números de licencia aparecen
//   más de una vez en el archivo (ítems distintos de la misma licencia): el
//   id de la fila lleva `#n` desde la segunda aparición, en orden del archivo.
// - Tipo: clasificación oficial de TFDA (醫器次類別一, «E.1250 經皮導管»): código =
//   texto hasta el primer espacio. Los códigos de 4 dígitos (0399…) son de la
//   clasificación anterior y llevan otro sistema.
// - Fabricante: 製造商名稱 (verbatim); país 製造廠國別 (ISO alfa-2 tal cual). Si
//   falta, va el solicitante (申請商名稱) con `extra.manufacturerNameFrom`.
// - Marca: 英文品名 si existe, si no 中文品名; ambos en `extra`.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

const ymd = (v) => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(String(v ?? '').trim());
  return m ? isoDateOrNull(`${m[1]}-${m[2]}-${m[3]}`) : null;
};

/** «E.1250 經皮導管» → { code: 'E.1250', name: '經皮導管', system }. */
export function tfdaType(text) {
  const t = textOrNull(text);
  if (t === null) return null;
  const m = /^(\S+)\s+(.+)$/.exec(t);
  const code = m ? m[1] : t;
  const name = m ? m[2] : null;
  const system = /^[A-Z]\.\d+/.test(code)
    ? 'tw:tfda-classification'
    : /^\d{4}$/.test(code)
      ? 'tw:tfda-classification-legacy'
      : null;
  return { code, name, system, verbatim: t };
}

export const TFDA_HEADER = [
  '許可證字號', '註銷狀態', '註銷日期', '註銷理由', '有效日期', '發證日期',
  '許可證種類', '舊證字號', '醫療器材級數', '通關簽審文件編號', '中文品名',
  '英文品名', '效能', '劑型', '包裝', '醫器主類別一', '醫器次類別一',
  '醫器主類別二', '醫器次類別二', '醫器主類別三', '醫器次類別三', '主成分略述',
  '醫器規格', '限制項目', '申請商名稱', '申請商地址', '申請商統一編號',
  '製造商名稱', '製造廠廠址', '製造廠公司地址', '製造廠國別', '製程', '異動日期',
  '製造許可登錄編號',
];

export function assertTfdaHeader(header) {
  const missing = TFDA_HEADER.filter((h) => !header.includes(h));
  if (missing.length)
    throw new Error(`TFDA: faltan columnas ${missing.join(', ')}; reales: ${JSON.stringify(header)}`);
}

/**
 * @param {Record<string,string>[]} records filas del CSV como objetos
 * @param {{ sourceUrl: string, sourceVersion: string, retrievedAt: string, official: object, officialPortal: string }} ctx
 */
export function tfdaRows(records, ctx, stats = {}) {
  const seen = new Map();
  stats.duplicateLicenceNumbers = 0;
  stats.withoutManufacturer = 0;
  const rows = [];
  for (const r of records) {
    const licence = textOrNull(r['許可證字號']);
    if (licence === null) continue;
    const n = (seen.get(licence) ?? 0) + 1;
    seen.set(licence, n);
    if (n > 1) stats.duplicateLicenceNumbers += 1;
    const manufacturer = textOrNull(r['製造商名稱']);
    const applicant = textOrNull(r['申請商名稱']);
    if (manufacturer === null && applicant === null) {
      stats.withoutManufacturer += 1;
      continue;
    }
    const type1 = tfdaType(r['醫器次類別一']);
    const others = ['二', '三']
      .map((k) => tfdaType(r[`醫器次類別${k}`]))
      .filter((t) => t && t.system)
      .map((t) => ({ system: t.system, code: t.code, name: t.name }));
    const country = textOrNull(r['製造廠國別']);
    const level = textOrNull(r['醫療器材級數']);
    const nameEn = textOrNull(r['英文品名']);
    const nameZh = textOrNull(r['中文品名']);
    const cancelled = textOrNull(r['註銷狀態']);
    const ubn = textOrNull(r['申請商統一編號']);
    rows.push(
      makeRow({
        source: 'tfda-licences',
        sourceRecordId: n === 1 ? licence : `${licence}#${n}`,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: type1?.system ? type1.code : null,
        deviceTypeSystem: type1?.system ?? null,
        deviceTypeName: type1?.system ? type1.name : null,
        manufacturerName: manufacturer ?? applicant,
        manufacturerCountry:
          manufacturer !== null && country !== null && /^[A-Z]{2}$/.test(country)
            ? country
            : null,
        manufacturerRegistryId: null,
        brandName: nameEn ?? nameZh,
        model: null,
        udiDi: null,
        riskClass: level === null ? null : `tw:${level}`,
        authorizationId: licence,
        authorizationDate: ymd(r['發證日期']),
        status: cancelled,
        extra: {
          ...(nameEn && nameZh ? { nameZh } : {}),
          ...(nameEn === null && nameZh ? { brandFrom: '中文品名' } : {}),
          mainCategory: textOrNull(r['醫器主類別一']),
          ...(others.length ? { deviceTypes: others } : {}),
          ...(manufacturer === null ? { manufacturerNameFrom: '申請商名稱' } : {}),
          applicant: { name: applicant, ...(ubn ? { ubn } : {}) },
          manufacturerAddress: textOrNull(r['製造廠廠址']),
          ...(textOrNull(r['註銷日期']) ? { cancellationDate: ymd(r['註銷日期']) } : {}),
          expiryDate: ymd(r['有效日期']),
          changedAt: ymd(r['異動日期']),
          ...(textOrNull(r['製造許可登錄編號']) ? { manufacturingPermit: textOrNull(r['製造許可登錄編號']) } : {}),
          official: ctx.official,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return rows;
}
