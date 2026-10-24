// =============================================================================
// LOINC (distribución oficial de Regenstrief) → registros del catálogo de
// análisis: los seis ejes del nombre (componente, propiedad, tiempo, sistema,
// escala, método), la clase como categoría, unidades UCUM de ejemplo, paneles
// con sus miembros, la variante en castellano y los anexos que sirven para un
// catálogo de pedidos (Universal Lab Orders, Top 2000, RSNA Playbook).
//
// ADVERTENCIA HONESTA (igual que `lib/glossary-es/loinc-es.mjs`): ningún
// parser de este archivo se validó contra los archivos reales. Bajarlos exige
// cuenta en loinc.org, y desde la sesión que escribió esto loinc.org respondía
// 403. Por eso todo es POR CABECERA, nunca por posición: cada archivo declara
// las columnas que exige y, si no están, aborta mostrando las cabeceras reales.
// Las pruebas usan CSV SINTÉTICOS marcados como tales (códigos `0000-0`).
//
// Archivos (rutas dentro del zip «LOINC Table + Accessory Files»):
//   LoincTable/Loinc.csv                                         (obligatorio)
//   AccessoryFiles/PartFile/Part.csv                             (nombre de la clase)
//   AccessoryFiles/PartFile/LoincPartLink_Primary.csv            (partes LP de cada código)
//   AccessoryFiles/PanelsAndForms/PanelsAndForms.csv             (miembros de paneles)
//   AccessoryFiles/LinguisticVariants/LinguisticVariants.csv     (índice de variantes)
//   AccessoryFiles/LinguisticVariants/es<PAÍS><id>LinguisticVariant.csv
//   AccessoryFiles/LoincUniversalLabOrdersValueSet/LoincUniversalLabOrdersValueSet.csv
//   AccessoryFiles/LoincRsnaRadiologyPlaybook/LoincRsnaRadiologyPlaybook.csv
//   AccessoryFiles/Top2000Results/{US,SI}/*.csv
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { parseCsv } from '../../lib/glossary-es/loinc-es.mjs';
import { loincDomain } from './domains.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const LOINC_CODE_SYSTEM = 'loinc';
const LOINC_NUM = /^\d{1,7}-\d$/;

/** CSV con cabecera → objetos. Exige `required`; si falta alguna, aborta con las cabeceras reales. */
export function csvObjects(text, required, label) {
  const [header = [], ...data] = parseCsv(text);
  const names = header.map((h) => h.trim());
  const missing = required.filter((r) => !names.includes(r));
  if (missing.length) throw new Error(`${label}: faltan columnas ${missing.join(', ')}. Cabeceras encontradas: ${names.join(', ')}`);
  return data.map((row) => Object.fromEntries(names.map((n, i) => [n, (row[i] ?? '').trim()])));
}

/** Primera columna presente de una lista de alternativas (para archivos cuyo encabezado cambió entre versiones). */
function pickColumn(text, candidates, label) {
  const [header = []] = parseCsv(text.slice(0, 4096).split(/\r?\n/)[0] + '\n');
  const names = header.map((h) => h.trim());
  const hit = candidates.find((c) => names.includes(c));
  if (!hit) throw new Error(`${label}: no hay ninguna columna ${candidates.join(' | ')}. Cabeceras encontradas: ${names.join(', ')}`);
  return hit;
}

const splitList = (s) => [...new Set(String(s ?? '').split(';').map((x) => x.trim()).filter(Boolean))];
const intOrNull = (s) => (/^\d+$/.test(String(s ?? '')) && Number(s) > 0 ? Number(s) : null);

export const LOINC_TABLE_COLUMNS = ['LOINC_NUM', 'COMPONENT', 'PROPERTY', 'TIME_ASPCT', 'SYSTEM', 'SCALE_TYP', 'METHOD_TYP', 'CLASS', 'CLASSTYPE', 'STATUS', 'LONG_COMMON_NAME'];

export function parseLoincTable(text) {
  return csvObjects(text, LOINC_TABLE_COLUMNS, 'Loinc.csv').filter((r) => LOINC_NUM.test(r.LOINC_NUM));
}

/** Part.csv → nombre visible de cada clase (`PartTypeName = CLASS`). */
export function parseClassNames(text) {
  const rows = csvObjects(text, ['PartNumber', 'PartTypeName', 'PartName', 'PartDisplayName'], 'Part.csv');
  const out = new Map();
  for (const r of rows) if (r.PartTypeName === 'CLASS' && r.PartName) out.set(r.PartName, { partNumber: r.PartNumber, display: r.PartDisplayName || r.PartName });
  return out;
}

/** LoincPartLink_Primary.csv → partes LP de cada código. */
export function parsePartLinks(text) {
  const rows = csvObjects(text, ['LoincNumber', 'PartNumber', 'PartName', 'PartTypeName', 'LinkTypeName'], 'LoincPartLink_Primary.csv');
  const out = new Map();
  for (const r of rows) {
    if (!out.has(r.LoincNumber)) out.set(r.LoincNumber, []);
    out.get(r.LoincNumber).push(compact({ partNumber: r.PartNumber, partName: r.PartName, partType: r.PartTypeName, linkType: r.LinkTypeName, partCodeSystem: r.PartCodeSystem }));
  }
  return out;
}

/**
 * PanelsAndForms.csv → miembros directos de cada panel/formulario.
 * El padre inmediato sale de `ParentId` → `ID` cuando el archivo trae ids de
 * fila (paneles anidados); si no, de `ParentLoinc`. La fila del propio panel
 * (Loinc = padre) no es un miembro.
 */
export function parsePanels(text) {
  const rows = csvObjects(text, ['ParentLoinc', 'Loinc', 'SEQUENCE'], 'PanelsAndForms.csv');
  const loincById = new Map(rows.filter((r) => r.ID).map((r) => [r.ID, r.Loinc]));
  const members = new Map(); // parent → [{ loinc, sequence, required, displayNameForForm }]
  for (const r of rows) {
    const parent = (r.ParentId && loincById.get(r.ParentId)) || r.ParentLoinc;
    if (!LOINC_NUM.test(parent) || !LOINC_NUM.test(r.Loinc) || parent === r.Loinc) continue;
    if (!members.has(parent)) members.set(parent, []);
    const list = members.get(parent);
    if (list.some((m) => m.loinc === r.Loinc)) continue;
    list.push(compact({ loinc: r.Loinc, sequence: intOrNull(r.SEQUENCE), required: r.ObservationRequiredInPanel || null, displayNameForForm: r.DisplayNameForForm || null }));
  }
  for (const list of members.values()) list.sort((a, b) => (a.sequence ?? 1e9) - (b.sequence ?? 1e9));
  return members;
}

/** LinguisticVariants.csv → variantes en castellano disponibles (`ISO_LANGUAGE = es`). */
export function parseLinguisticIndex(text) {
  return csvObjects(text, ['ID', 'ISO_LANGUAGE', 'ISO_COUNTRY', 'LANGUAGE_NAME', 'PRODUCER'], 'LinguisticVariants.csv')
    .filter((r) => r.ISO_LANGUAGE.toLowerCase() === 'es')
    .map((r) => ({ id: r.ID, language: r.ISO_LANGUAGE, country: r.ISO_COUNTRY, name: r.LANGUAGE_NAME, producer: r.PRODUCER }));
}

/** es<PAÍS><id>LinguisticVariant.csv → por código: nombres y ejes traducidos (verbatim). */
export function parseLinguisticVariant(text) {
  const rows = csvObjects(text, ['LOINC_NUM'], 'LinguisticVariant.csv');
  const out = new Map();
  for (const r of rows) {
    if (!LOINC_NUM.test(r.LOINC_NUM)) continue;
    const preferred = r.LONG_COMMON_NAME || r.LinguisticVariantDisplayName || '';
    if (!preferred) continue;
    out.set(r.LOINC_NUM, {
      preferred,
      synonyms: [...new Set([r.LinguisticVariantDisplayName, r.SHORTNAME].filter((x) => x && x !== preferred))],
      relatedNames: splitList(r.RELATEDNAMES2),
      parts: compact({ component: r.COMPONENT, property: r.PROPERTY, time_aspct: r.TIME_ASPCT, system: r.SYSTEM, scale_typ: r.SCALE_TYP, method_typ: r.METHOD_TYP, class: r.CLASS }),
    });
  }
  return out;
}

/** LoincUniversalLabOrdersValueSet.csv → códigos del value set oficial de pedidos de laboratorio. */
export function parseUniversalLabOrders(text) {
  const col = pickColumn(text, ['LOINC_NUM', 'LoincNumber', 'LOINC #'], 'LoincUniversalLabOrdersValueSet.csv');
  return new Set(csvObjects(text, [col], 'LoincUniversalLabOrdersValueSet.csv').map((r) => r[col]).filter((c) => LOINC_NUM.test(c)));
}

/** LoincRsnaRadiologyPlaybook.csv → por código: RPID y partes RadLex que declara la armonización LOINC/RSNA. */
export function parsePlaybook(text) {
  const rows = csvObjects(text, ['LoincNumber', 'PartTypeName', 'PartName', 'RID', 'PreferredName'], 'LoincRsnaRadiologyPlaybook.csv');
  const out = new Map();
  for (const r of rows) {
    if (!LOINC_NUM.test(r.LoincNumber)) continue;
    if (!out.has(r.LoincNumber)) out.set(r.LoincNumber, { rpid: r.RPID || null, longName: r.LongName || null, parts: [] });
    const entry = out.get(r.LoincNumber);
    entry.rpid ??= r.RPID || null;
    entry.longName ??= r.LongName || null;
    entry.parts.push(compact({ partType: r.PartTypeName, partName: r.PartName, partNumber: r.PartNumber, sequence: intOrNull(r.PartSequenceOrder), rid: r.RID, radlexName: r.PreferredName }));
  }
  return out;
}

/** Archivos Top 2000 (US o SI) → por código, el rango si el archivo lo trae. */
export function parseTop2000(text, label) {
  const col = pickColumn(text, ['LOINC #', 'LOINC_NUM', 'LoincNumber', 'LOINC'], label);
  const rankCol = ['Rank', 'RANK', 'COMMON_TEST_RANK'].find((c) => parseCsv(text.split(/\r?\n/)[0] + '\n')[0].map((h) => h.trim()).includes(c));
  const out = new Map();
  for (const r of csvObjects(text, [col], label)) if (LOINC_NUM.test(r[col])) out.set(r[col], rankCol ? intOrNull(r[rankCol]) : null);
  return out;
}

/**
 * Tabla + anexos → registros. Entra al catálogo todo término con dominio
 * (ver domains.mjs) y todo miembro de un panel que entró; lo demás se cuenta
 * como excluido por clase en `stats`.
 *
 * @param {object} input { table, classNames?, partLinks?, panels?, es?, universalLabOrders?, playbook?, top2000Us?, top2000Si? }
 * @param {object} prov  { release, retrievedAt, files: { <archivo>: { file, sha256 } }, esVariant? }
 */
export function loincRecords(input, prov) {
  const { table, classNames = new Map(), partLinks = new Map(), panels = new Map(), es = null, universalLabOrders = new Set(), playbook = new Map(), top2000Us = new Map(), top2000Si = new Map() } = input;
  const byCode = new Map(table.map((r) => [r.LOINC_NUM, r]));
  const domainOf = new Map(table.map((r) => [r.LOINC_NUM, loincDomain(r.CLASS, r.CLASSTYPE)]));

  // Inclusión: con dominio, o miembro (a cualquier profundidad) de un panel incluido.
  const included = new Set([...domainOf].filter(([, d]) => d.domain).map(([c]) => c));
  const parentsOf = new Map();
  for (const [parent, list] of panels) for (const m of list) {
    if (!parentsOf.has(m.loinc)) parentsOf.set(m.loinc, []);
    parentsOf.get(m.loinc).push({ parent, sequence: m.sequence ?? null });
  }
  const queue = [...included].filter((c) => panels.has(c));
  while (queue.length) {
    const p = queue.pop();
    for (const m of panels.get(p) ?? []) {
      if (byCode.has(m.loinc) && !included.has(m.loinc)) {
        included.add(m.loinc);
        if (panels.has(m.loinc)) queue.push(m.loinc);
      }
    }
  }

  const tableFile = prov.files['Loinc.csv'];
  const esInfo = prov.esVariant ?? null;
  const records = [];
  const excludedByClass = {};
  for (const r of table) {
    const code = r.LOINC_NUM;
    if (!included.has(code)) {
      const k = `${r.CLASS || '(sin clase)'}|${r.CLASSTYPE}`;
      excludedByClass[k] = (excludedByClass[k] ?? 0) + 1;
      continue;
    }
    const { domain, rule } = domainOf.get(code);
    const esRow = es?.get(code) ?? null;
    const isPanel = panels.has(code) || Boolean(r.PanelType);
    const valueSets = [];
    if (domain) valueSets.push(`lab-catalog-domain-${domain}`);
    if (r.CLASS) valueSets.push(`lab-catalog-loinc-class-${slugify(r.CLASS)}`);
    if (isPanel) valueSets.push('lab-catalog-loinc-panels');
    if (r.ORDER_OBS === 'Order' || r.ORDER_OBS === 'Both') valueSets.push('lab-catalog-loinc-orderable');
    if (universalLabOrders.has(code)) valueSets.push('lab-catalog-loinc-universal-lab-orders');
    if (top2000Us.has(code)) valueSets.push('lab-catalog-loinc-top2000-us');
    if (top2000Si.has(code)) valueSets.push('lab-catalog-loinc-top2000-si');
    const cls = classNames.get(r.CLASS);
    const pb = playbook.get(code);

    records.push({
      id: conceptIdFor(LOINC_CODE_SYSTEM, code),
      codeSystem: LOINC_CODE_SYSTEM,
      code,
      display: r.LONG_COMMON_NAME || [r.COMPONENT, r.PROPERTY, r.TIME_ASPCT, r.SYSTEM, r.SCALE_TYP, r.METHOD_TYP].join(':'),
      definition: r.DefinitionDescription || null,
      lang: 'en',
      selectable: r.STATUS === 'ACTIVE' || r.STATUS === 'TRIAL',
      status: r.STATUS,
      category: r.CLASS ? { scheme: 'loinc-class', code: r.CLASS, display: cls?.display ?? r.CLASS, partNumber: cls?.partNumber ?? null } : null,
      domain,
      domainRule: rule,
      properties: compact({
        // Mismos property_code que import-loinc.mjs (mismo id): los seis ejes y la clase.
        component: r.COMPONENT,
        property: r.PROPERTY,
        time_aspct: r.TIME_ASPCT,
        system: r.SYSTEM,
        scale_typ: r.SCALE_TYP,
        method_typ: r.METHOD_TYP,
        class: r.CLASS,
        loinc_classtype: r.CLASSTYPE,
        loinc_status: r.STATUS,
        loinc_shortname: r.SHORTNAME,
        loinc_consumer_name: r.CONSUMER_NAME,
        loinc_order_obs: r.ORDER_OBS,
        loinc_example_units: r.EXAMPLE_UNITS,
        loinc_example_ucum_units: splitList(r.EXAMPLE_UCUM_UNITS),
        loinc_panel_type: r.PanelType,
        loinc_common_test_rank: intOrNull(r.COMMON_TEST_RANK),
        loinc_common_order_rank: intOrNull(r.COMMON_ORDER_RANK),
        loinc_related_names: splitList(r.RELATEDNAMES2),
        loinc_version_first_released: r.VersionFirstReleased,
        loinc_version_last_changed: r.VersionLastChanged,
        loinc_external_copyright_notice: r.EXTERNAL_COPYRIGHT_NOTICE,
        loinc_parts: partLinks.get(code) ?? [],
        loinc_panel_members: panels.get(code) ?? [],
        loinc_universal_lab_order: universalLabOrders.has(code) || null,
        loinc_top2000_us: top2000Us.has(code) || null,
        loinc_top2000_us_rank: top2000Us.get(code) ?? null,
        loinc_top2000_si: top2000Si.has(code) || null,
        loinc_top2000_si_rank: top2000Si.get(code) ?? null,
        radlex_playbook: pb ? compact({ rpid: pb.rpid, longName: pb.longName, parts: pb.parts }) : null,
        loinc_parts_es: esRow && Object.keys(esRow.parts).length ? esRow.parts : null,
        loinc_related_names_es: esRow?.relatedNames ?? [],
        designation_es_source: esRow && esInfo ? { variantId: esInfo.id, country: esInfo.country, producer: esInfo.producer, release: prov.release, file: esInfo.file } : null,
        lab_catalog_domain: domain,
        lab_catalog_domain_rule: rule,
      }),
      designations: esRow ? [{ lang: 'es', type: 'preferred', value: esRow.preferred }, ...esRow.synonyms.map((value) => ({ lang: 'es', type: 'synonym', value }))] : [],
      relations: (parentsOf.get(code) ?? []).filter((p) => included.has(p.parent)).map((p) => ({ type: 'part-of', targetCodeSystem: LOINC_CODE_SYSTEM, targetCode: p.parent, ordinal: p.sequence })),
      valueSets,
      provenance: {
        source: 'loinc',
        sourceName: `LOINC ${prov.release} (Regenstrief Institute)`,
        sourceId: code,
        sourceVersion: prov.release,
        sourceUrl: `https://loinc.org/${code}/`,
        sourceFile: tableFile?.file ?? 'Loinc.csv',
        sourceSha256: tableFile?.sha256 ?? null,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  return { records, stats: { tableRows: table.length, included: records.length, excludedByClass } };
}
