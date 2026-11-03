// =============================================================================
// ICD-10-PCS (CMS, tablas oficiales FY2027): procedimiento → parte del cuerpo
// POR DEFINICIÓN DEL CÓDIGO.
//
// Cada código PCS tiene 7 posiciones; la 4.ª es el eje anatómico de su tabla.
// Su título cambia según la sección («Body Part», «Body Region», «Treatment
// Site», «Body System / Region», «Body System») y se conserva literal como tipo
// de relación. Las secciones G y H usan la posición 4 como «Qualifier»: no es
// anatomía y no entra.
//
// El valor del eje solo tiene sentido dentro de su sección y sistema (la «6» de
// 0-0 es «Cerebral Ventricle»; la de 0-D es otra cosa), así que el sitio se
// guarda en un code system propio, `icd10pcs-body-part`, con clave
// `<sección><sistema><valor>` y el nombre oficial del valor. CMS no publica un
// mapeo de esos valores a Uberon/FMA/TA2: queda como hueco, no se inventa.
//
// Nombre del procedimiento: el título largo oficial del archivo de orden de CMS
// (icd10pcs_order_FFFF.txt), nunca uno compuesto a mano con los ejes.
// =============================================================================

import { assertionRecord, procedureRecord } from '../records.mjs';

export const SITE_AXIS_TITLES = [
  'Body Part',
  'Body Region',
  'Treatment Site',
  'Body System / Region',
  'Body System',
];

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

function axisLabels(axisXml) {
  return [...axisXml.matchAll(/<label code="([^"]+)">([^<]*)<\/label>/g)].map(
    (m) => ({ code: m[1], label: decode(m[2]) }),
  );
}

function axes(xml) {
  const out = {};
  for (const m of xml.matchAll(/<axis pos="(\d)"[^>]*>([\s\S]*?)<\/axis>/g)) {
    out[m[1]] = {
      title: decode(m[2].match(/<title>([^<]*)<\/title>/)[1]),
      labels: axisLabels(m[2]),
    };
  }
  return out;
}

/** Archivo de orden de CMS → `Map<código, { long, valid }>` (columna de 1 = código facturable). */
export function parseOrderFile(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (line.length < 16) continue;
    const code = line.slice(6, 13).trim();
    const valid = line[14] === '1';
    const long = line.slice(77).trim();
    if (code) out.set(code, { long, valid });
  }
  return out;
}

/**
 * Tablas → un registro por código válido con su eje 4.
 * @returns {{ rows: {code, section, sectionLabel, system, systemLabel, axisTitle, value, valueLabel}[], declared: number }}
 */
export function expandTables(xml) {
  const rows = [];
  let declared = 0;
  for (const t of xml.matchAll(/<pcsTable>([\s\S]*?)<\/pcsTable>/g)) {
    const tableXml = t[1];
    const head = axes(tableXml.replace(/<pcsRow[\s\S]*?<\/pcsRow>/g, ''));
    const [sec] = head['1'].labels;
    const [sys] = head['2'].labels;
    const [op] = head['3'].labels;
    for (const r of tableXml.matchAll(
      /<pcsRow codes="(\d+)">([\s\S]*?)<\/pcsRow>/g,
    )) {
      declared += Number(r[1]);
      const a = axes(r[2]);
      for (const bp of a['4'].labels)
        for (const ap of a['5'].labels)
          for (const dv of a['6'].labels)
            for (const q of a['7'].labels) {
              rows.push({
                code: `${sec.code}${sys.code}${op.code}${bp.code}${ap.code}${dv.code}${q.code}`,
                section: sec.code,
                sectionLabel: sec.label,
                system: sys.code,
                systemLabel: sys.label,
                axisTitle: a['4'].title,
                value: bp.code,
                valueLabel: bp.label,
              });
            }
    }
  }
  return { rows, declared };
}

/**
 * @param {ReturnType<typeof expandTables>['rows']} rows
 * @param {Map<string,{long:string,valid:boolean}>} order
 */
export function icd10pcsCorpus(rows, order, meta) {
  const procedures = [];
  const sites = new Map();
  const assertions = [];
  const skipped = { qualifierAxis: 0, notInOrderFile: 0, notValid: 0 };
  for (const r of rows) {
    if (!SITE_AXIS_TITLES.includes(r.axisTitle)) {
      skipped.qualifierAxis++;
      continue;
    }
    const o = order.get(r.code);
    if (!o) {
      skipped.notInOrderFile++;
      continue;
    }
    if (!o.valid) {
      skipped.notValid++;
      continue;
    }
    const siteCode = `${r.section}${r.system}${r.value}`;
    if (!sites.has(siteCode)) {
      sites.set(
        siteCode,
        procedureRecord({
          system: 'icd10pcs-body-part',
          code: siteCode,
          display: r.valueLabel,
          category: r.axisTitle,
          owned: true,
          meta,
          uri: `${meta.fileUrl}#${r.section}${r.system}`,
          extra: {
            kind: 'site',
            section: r.sectionLabel,
            bodySystem: r.systemLabel,
          },
        }),
      );
    }
    procedures.push(
      procedureRecord({
        system: 'icd10pcs',
        code: r.code,
        display: o.long,
        category: r.sectionLabel,
        owned: true,
        meta,
        uri: `${meta.fileUrl}#${r.code}`,
      }),
    );
    assertions.push(
      assertionRecord({
        typeCode: `icd10pcs:${r.axisTitle}`,
        subject: { system: 'icd10pcs', code: r.code, label: o.long },
        object: {
          system: 'icd10pcs-body-part',
          code: siteCode,
          label: r.valueLabel,
        },
        sourceRecordId: `${r.code} axis4 ${r.value}`,
        uri: `${meta.fileUrl}#${r.code}`,
        meta,
      }),
    );
  }
  return { procedures, sites: [...sites.values()], assertions, skipped };
}
