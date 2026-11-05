// =============================================================================
// NMPA (China) · 医疗器械唯一标识数据库 (UDID), descarga completa mensual
// (`UDID_FULL_RELEASE_<fecha>.zip`, https://udi.nmpa.gov.cn/download.html) →
// formato común.
//
// El zip trae N archivos XML (`UDID_FULL_DOWNLOAD_PART<n>_Of_<N>_<fecha>.xml`)
// con `<device>` por cada 最小销售单元产品标识 (UDI-DI). Significado de cada
// etiqueta: «医疗器械唯一标识管理信息系统 数据共享API 标准文档 V2.1»
// (https://udi.nmpa.gov.cn/wordFile/…数据共享API标准文档V2.1.pdf), salvo
// `qxlb` y `cplb`, que ese documento no define y van verbatim.
//
// - Una fila por UDI-DI (`zxxsdycpbs`, «最小销售单元产品标识»).
// - Tipo: `flbm` («器械目录分类代码») → `cn:nmpa-classification`. La fuente no
//   trae el nombre de la categoría: `deviceTypeName` queda en null. El código
//   anterior (`yflbm`, «原器械目录分类代码») va en `extra`.
// - Fabricante: `ylqxzcrbarmc` («注册/备案人名称»), verbatim; el nombre en
//   inglés en `extra`. País y clase no son campos de la fuente: quedan en null
//   (no se deducen del número de registro).
// - `tyshxydm` (统一社会信用代码) va verbatim en `extra`: la API V2.1 lo define
//   como el del «注册人/代理人», y en los registros de importación (国械注进…)
//   es el de una empresa china, no el del titular extranjero; por eso no se
//   usa como id del fabricante.
// - Marca: `spmc` («商品名称»). Modelo: `ggxh` («规格型号»).
// - `contactList` (correo y teléfono de contacto de la empresa) no se copia.
// =============================================================================

import { isoDateOrNull, makeRow, textOrNull } from './row.mjs';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function xmlText(value) {
  if (value === undefined) return null;
  return textOrNull(
    value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) =>
      e[0] === '#'
        ? String.fromCodePoint(
            e[1] === 'x' || e[1] === 'X'
              ? parseInt(e.slice(2), 16)
              : Number(e.slice(1)),
          )
        : ENTITIES[e.toLowerCase()],
    ),
  );
}

/** Campos simples de un `<device>` y de cada elemento de sus listas. */
function fieldsOf(xml) {
  const out = {};
  for (const m of xml.matchAll(/<(\w+)>([^<]*)<\/\1>/g)) out[m[1]] = m[2];
  return out;
}

function listOf(xml, list, item) {
  const block = new RegExp(`<${list}>([\\s\\S]*?)</${list}>`).exec(xml);
  if (block === null) return [];
  return [
    ...block[1].matchAll(new RegExp(`<${item}>([\\s\\S]*?)</${item}>`, 'g')),
  ].map((m) => fieldsOf(m[1]));
}

const compact = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, v]) => v !== null));

/** Un XML de la descarga → `<header>` y la lista de `<device>` en objetos. */
export function parseUdidXml(xml) {
  const header = fieldsOf(/<header[^>]*>([\s\S]*?)<\/header>/.exec(xml)[1]);
  const devices = [];
  for (const m of xml.matchAll(/<device>([\s\S]*?)<\/device>/g)) {
    const body = m[1].replace(/<contactList>[\s\S]*?<\/contactList>/g, '');
    const simple = fieldsOf(
      body.replace(
        /<(packingList|storageList|clinicalList)>[\s\S]*?<\/\1>/g,
        '',
      ),
    );
    const d = Object.fromEntries(
      Object.entries(simple).map(([k, v]) => [k, xmlText(v)]),
    );
    d.packings = listOf(body, 'packingList', 'packing').map((p) =>
      compact({
        di: xmlText(p.bzcpbs),
        level: xmlText(p.cpbzjb),
        quantity: xmlText(p.bznhxyjcpbssl),
        containsDi: xmlText(p.bznhxyjbzcpbs),
      }),
    );
    d.storages = listOf(body, 'storageList', 'storage').map((s) =>
      compact({
        condition: xmlText(s.cchcztj),
        min: xmlText(s.zdz),
        max: xmlText(s.zgz),
        unit: xmlText(s.jldw),
      }),
    );
    d.clinicalSizes = listOf(body, 'clinicalList', 'clinical').map((c) =>
      compact({
        type: xmlText(c.lcsycclx),
        value: xmlText(c.ccz),
        unit: xmlText(c.ccdw),
      }),
    );
    devices.push(d);
  }
  return { header, devices };
}

/**
 * Generador: filas del formato común a partir de los `<device>` de todos los
 * XML, en el orden recibido. `stats` acumula descartes y duplicados.
 * @param {Iterable<object>} devices
 */
export function* nmpaUdiRows(devices, ctx, stats = {}) {
  stats.withoutDi = 0;
  stats.withoutRegistrant = 0;
  stats.duplicates = 0;
  const seen = new Set();
  for (const d of devices) {
    const di = d.zxxsdycpbs;
    if (di === null || di === undefined) {
      stats.withoutDi += 1;
      continue;
    }
    if (seen.has(di)) {
      stats.duplicates += 1;
      continue;
    }
    // Copia: el texto extraído con regex retiene en V8 el XML entero del que
    // salió, y el Set guarda millones de DI.
    seen.add(Buffer.from(di).toString());
    const registrant = d.ylqxzcrbarmc ?? null;
    if (registrant === null) {
      stats.withoutRegistrant += 1;
      continue;
    }
    const flbm = d.flbm ?? null;
    yield makeRow({
      source: 'nmpa-udi',
      sourceRecordId: di,
      sourceUrl: ctx.sourceUrl,
      sourceVersion: ctx.sourceVersion,
      retrievedAt: ctx.retrievedAt,
      deviceTypeCode: flbm,
      deviceTypeSystem: flbm === null ? null : 'cn:nmpa-classification',
      deviceTypeName: null,
      manufacturerName: registrant,
      manufacturerCountry: null,
      manufacturerRegistryId: null,
      brandName: d.spmc ?? null,
      model: d.ggxh ?? null,
      udiDi: di,
      riskClass: null,
      authorizationId: d.zczbhhzbapzbh ?? null,
      authorizationDate: null,
      status: null,
      extra: {
        ...compact({
          genericName: d.cpmctymc ?? null,
          description: d.cpms ?? null,
          catalogNumber: d.cphhhbh ?? null,
          diSystem: d.cpbsbmtxmc ?? null,
          diPublishedOn: isoDateOrNull(d.cpbsfbrq),
          // `qxlb` (器械 / 体外诊断试剂) y `cplb` (耗材 / 设备), verbatim.
          qxlb: d.qxlb ?? null,
          cplb: d.cplb ?? null,
          previousClassificationCode: d.yflbm ?? null,
          manufacturerNameEn: d.ylqxzcrbarywmc ?? null,
          unifiedSocialCreditCode: d.tyshxydm ?? null,
          medicalInsuranceCode: d.ybbm ?? null,
          useUnitDi: d.sydycpbs ?? null,
          unitsPerSalesUnit: d.zxxsdyzsydydsl ?? null,
          directMarkingDi: d.btcpbs ?? null,
          kit: d.sfwblztlcp ?? null,
          singleUse: d.sfbjwycxsy ?? null,
          maxReuses: d.zdcfsycs ?? null,
          sterile: d.sfwwjbz ?? null,
          sterilizeBeforeUse: d.syqsfxyjxmj ?? null,
          sterilizationMethod: d.mjfs ?? null,
          mriSafety: d.cgzmraqxgxx ?? null,
          recordKey: d.deviceRecordKey ?? null,
        }),
        recordVersion: compact({
          number: d.versionNumber ?? null,
          date: isoDateOrNull(d.versionTime),
          status: d.versionStauts ?? null,
        }),
        ...(d.packings.length > 0 ? { packages: d.packings } : {}),
        ...(d.storages.length > 0 ? { storage: d.storages } : {}),
        ...(d.clinicalSizes.length > 0
          ? { clinicalSizes: d.clinicalSizes }
          : {}),
        manufacturerRole: '注册人/备案人',
        officialFile: ctx.officialFile,
        officialPortal: ctx.officialPortal,
      },
    });
  }
}
