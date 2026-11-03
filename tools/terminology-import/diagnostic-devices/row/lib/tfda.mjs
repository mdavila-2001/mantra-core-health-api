// =============================================================================
// TFDA (Taiwán) · 醫療器材許可證資料集 (data.gov.tw 9576) → formato común.
//
// Export oficial `https://data.fda.gov.tw/data/opendata/export/68/csv` (ZIP con
// un CSV UTF-8 con BOM). Una línea por licencia × fabricante: se agrupa por
// 許可證字號 (número de licencia) y cada licencia es una fila; los demás
// fabricantes van en `extra.otherManufacturers`.
//
// - Clasificación: 醫器次類別一 (p. ej. «A.1485 黃體激素試驗系統») del 醫療器材分類
//   分級管理辦法 → `tw:tfda-classification`, código y nombre tal cual. Los demás
//   (二, 三) y las categorías principales (醫器主類別, p. ej. «A 臨床化學及臨床
//   毒理學») van en `extra.deviceTypes`.
// - Clase: 醫療器材級數 1–3 → `tw:1`…`tw:3`.
// - Fabricante: 製造商名稱 y 製造廠國別 (ya viene en ISO alfa-2); 製造許可登錄編號
//   (registro QMS/QSD de la planta) → `tw-tfda-qms:`.
// - Titular (申請商) con su 統一編號 en `extra.holder`.
// - `brandName`: 中文品名; el nombre en inglés (英文品名) en `extra.englishName`.
//   El campo 醫器規格 (especificaciones) va verbatim en `extra.specifications`:
//   no siempre es un modelo, así que no se usa como `model`.
// Textos verbatim, sin traducir.
// =============================================================================

import { makeRow, textOrNull } from './row.mjs';

/** `2026/02/25` → `2026-02-25`. */
export function tfdaDate(value) {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(String(value ?? '').trim());
  return m === null ? null : `${m[1]}-${m[2]}-${m[3]}`;
}

/** «A.1485 黃體激素試驗系統» → { code: 'A.1485', name: '黃體激素試驗系統' }. */
export function splitTfdaCategory(value) {
  const text = textOrNull(value);
  if (text === null) return null;
  const m = /^(\S+)\s+([\s\S]+)$/.exec(text);
  return m === null
    ? { code: null, name: text }
    : { code: m[1], name: m[2].trim() };
}

function manufacturerOf(r) {
  const name = textOrNull(r['製造商名稱']);
  if (name === null) return null;
  const country = textOrNull(r['製造廠國別']);
  return {
    name,
    country: country !== null && /^[A-Z]{2}$/.test(country) ? country : null,
    address: textOrNull(r['製造廠廠址']),
    qmsRegistration: textOrNull(r['製造許可登錄編號']),
    process: textOrNull(r['製程']),
  };
}

function deviceTypesOf(r) {
  const types = [];
  for (const n of ['一', '二', '三']) {
    const main = splitTfdaCategory(r[`醫器主類別${n}`]);
    const sub = splitTfdaCategory(r[`醫器次類別${n}`]);
    if (main)
      types.push({
        system: 'tw:tfda-category',
        code: main.code,
        name: main.name,
      });
    if (sub && n !== '一')
      types.push({
        system: 'tw:tfda-classification',
        code: sub.code,
        name: sub.name,
      });
  }
  return types;
}

/**
 * @param {Iterable<Record<string,string>>} lines filas del CSV por encabezado
 * @returns {{ rows: object[], stats: Record<string, number> }}
 */
export function tfdaRows(lines, ctx) {
  const groups = new Map();
  for (const line of lines) {
    const key = textOrNull(line['許可證字號']);
    if (key === null) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }
  const rows = [];
  const stats = { licences: groups.size, withoutManufacturer: 0 };
  for (const [licence, group] of groups) {
    const first = group[0];
    const seen = new Map();
    for (const line of group) {
      const m = manufacturerOf(line);
      if (m !== null && !seen.has(`${m.name}|${m.address}`))
        seen.set(`${m.name}|${m.address}`, m);
    }
    const manufacturers = [...seen.values()];
    const primary = manufacturers[0] ?? null;
    if (primary === null) {
      stats.withoutManufacturer += 1;
      continue;
    }
    const sub = splitTfdaCategory(first['醫器次類別一']);
    const klass = textOrNull(first['醫療器材級數']);
    const holderId = textOrNull(first['申請商統一編號']);
    rows.push(
      makeRow({
        source: 'tfda-devices',
        sourceRecordId: licence,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: sub?.code ?? null,
        deviceTypeSystem: sub === null ? null : 'tw:tfda-classification',
        deviceTypeName: sub?.name ?? null,
        manufacturerName: primary.name,
        manufacturerCountry: primary.country,
        manufacturerRegistryId:
          primary.qmsRegistration === null
            ? null
            : `tw-tfda-qms:${primary.qmsRegistration}`,
        brandName: textOrNull(first['中文品名']),
        model: null,
        udiDi: null,
        riskClass: klass === null ? null : `tw:${klass}`,
        authorizationId: licence,
        authorizationDate: tfdaDate(first['發證日期']),
        status: textOrNull(first['註銷狀態']),
        extra: {
          ...(textOrNull(first['英文品名'])
            ? { englishName: textOrNull(first['英文品名']) }
            : {}),
          deviceTypes: deviceTypesOf(first),
          ...(tfdaDate(first['有效日期'])
            ? { validUntil: tfdaDate(first['有效日期']) }
            : {}),
          ...(tfdaDate(first['註銷日期'])
            ? { cancelledOn: tfdaDate(first['註銷日期']) }
            : {}),
          ...(textOrNull(first['註銷理由'])
            ? { cancelReason: textOrNull(first['註銷理由']) }
            : {}),
          ...(textOrNull(first['舊證字號'])
            ? { previousLicence: textOrNull(first['舊證字號']) }
            : {}),
          ...(textOrNull(first['通關簽審文件編號'])
            ? { customsDocument: textOrNull(first['通關簽審文件編號']) }
            : {}),
          ...(textOrNull(first['效能'])
            ? { intendedUse: textOrNull(first['效能']) }
            : {}),
          ...(textOrNull(first['醫器規格'])
            ? { specifications: textOrNull(first['醫器規格']) }
            : {}),
          ...(textOrNull(first['主成分略述'])
            ? { mainComponents: textOrNull(first['主成分略述']) }
            : {}),
          ...(textOrNull(first['限制項目'])
            ? { restrictions: textOrNull(first['限制項目']) }
            : {}),
          ...(textOrNull(first['異動日期'])
            ? { changedOn: tfdaDate(first['異動日期']) }
            : {}),
          holder: {
            name: textOrNull(first['申請商名稱']),
            ...(holderId ? { taxId: holderId } : {}),
            ...(textOrNull(first['申請商地址'])
              ? { address: textOrNull(first['申請商地址']) }
              : {}),
          },
          ...(primary.address ? { manufacturerAddress: primary.address } : {}),
          ...(primary.process ? { manufacturingProcess: primary.process } : {}),
          ...(manufacturers.length > 1
            ? { otherManufacturers: manufacturers.slice(1) }
            : {}),
          officialFile: ctx.officialFile,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, stats };
}

/**
 * TUDID (data.gov.tw 151955, export 197): una línea por UDI-DI con licencia,
 * modelo (型號) y nombre del producto. No publica fabricante ni clase: se toman
 * de la licencia (`tfda-devices`) por número de licencia exacto; sin licencia
 * conocida no hay fila (se cuenta en `stats.withoutLicence`).
 *
 * @param {Iterable<Record<string,string>>} lines filas del CSV por encabezado
 * @param {Map<string, object>} licenceRows filas de `tfda-devices` por número de licencia
 */
export function tudidRows(lines, licenceRows, ctx) {
  const rows = [];
  const seen = new Set();
  const stats = { withoutLicence: 0, duplicates: 0 };
  for (const line of lines) {
    const licence = textOrNull(line['許可證字號（類型）']);
    const di = textOrNull(line['基本DI']);
    if (licence === null || di === null) continue;
    const id = `${di}|${line['型號'] ?? ''}|${licence}`;
    if (seen.has(id)) {
      stats.duplicates += 1;
      continue;
    }
    seen.add(id);
    const lic = licenceRows.get(licence);
    if (lic === undefined) {
      stats.withoutLicence += 1;
      continue;
    }
    const flag = (name) => {
      const v = textOrNull(line[name]);
      return v === '是' ? true : v === '否' ? false : null;
    };
    rows.push(
      makeRow({
        source: 'tfda-tudid',
        sourceRecordId: id,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: lic.deviceTypeCode,
        deviceTypeSystem: lic.deviceTypeSystem,
        deviceTypeName: lic.deviceTypeName,
        manufacturerName: lic.manufacturerName,
        manufacturerCountry: lic.manufacturerCountry,
        manufacturerRegistryId: lic.manufacturerRegistryId,
        brandName: textOrNull(line['產品中文品名']),
        model: textOrNull(line['型號']),
        udiDi: di,
        riskClass: lic.riskClass,
        authorizationId: licence,
        authorizationDate: lic.authorizationDate,
        status: lic.status,
        extra: {
          udiIssuingAgency: textOrNull(line['UDI發碼機構']),
          ...(textOrNull(line['產品描述'])
            ? { description: textOrNull(line['產品描述']) }
            : {}),
          ...(flag('本器材是否為套組') !== null
            ? { kit: flag('本器材是否為套組') }
            : {}),
          ...(flag('是否為單次使用器材') !== null
            ? { singleUse: flag('是否為單次使用器材') }
            : {}),
          ...(flag('本器材是否為滅菌包裝') !== null
            ? { sterile: flag('本器材是否為滅菌包裝') }
            : {}),
          ...(textOrNull(line['特材代碼'])
            ? { nhiSpecialMaterialCode: textOrNull(line['特材代碼']) }
            : {}),
          deviceTypes: lic.extra.deviceTypes,
          licenceFrom: 'tfda-devices',
          officialFile: ctx.officialFile,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, stats };
}
