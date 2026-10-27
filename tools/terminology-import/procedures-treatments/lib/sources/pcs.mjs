// =============================================================================
// ICD-10-PCS (CMS) → procedimientos y su sitio por el eje del propio código.
//
// Fuente: archivos oficiales de CMS (dominio público), edición FY2027:
//   icd10pcs_tables_2027.xml   las 918 tablas con sus ejes (título + etiquetas por eje)
//   icd10pcs_codes_2027.txt    código + descripción larga de los 79 256 códigos
//   icd10pcs_order_2027.txt    orden oficial, descripción corta y marca de código válido
//
// Los códigos se GENERAN de las tablas (producto cartesiano de los ejes 4 a 7 de cada
// fila bajo las tres primeras posiciones de la tabla) y se COTEJAN con el archivo de
// códigos: si no coinciden exactamente, el build aborta.
//
// Procedimiento → sitio: el eje 4 de PCS es la parte del cuerpo («Body Part»), la región
// («Body Region»), el sistema («Body System» / «Body System / Region») o el sitio de
// tratamiento («Treatment Site», radioterapia). Es una afirmación POR DEFINICIÓN del
// código. En las secciones G y H el eje 4 se llama «Qualifier» (tipo de prueba o de
// terapia), no es un sitio, y NO se relaciona. El sitio se modela como un concepto por
// (sección, sistema, valor): la misma letra significa cosas distintas en otro sistema.
//
// Español oficial: «CIE-10-ES Procedimientos 2026» (Ministerio de Sanidad), por código
// exacto. La edición es la 2026 (PCS FY2026): los códigos nuevos de FY2027 no tienen
// traducción oficial todavía y quedan sin designación en español; no se traduce nada.
// =============================================================================

import { slugify } from '../../../lib/glossary-es/common.mjs';
import { assertionRecord, procedureRecord, uniqueById } from '../records.mjs';

export const PCS_SYSTEM = 'icd10pcs-cms';
export const PCS_SITE_SYSTEM = 'icd10pcs-site';

/** Título del eje 4 → tipo de relación (predicado literal de la fuente). Qualifier no es un sitio. */
export const SITE_AXIS_TITLES = {
  'Body Part': 'body-part',
  'Body Region': 'body-region',
  'Body System / Region': 'body-system-region',
  'Body System': 'body-system',
  'Treatment Site': 'treatment-site',
};

const labelsOf = (xml) => [...xml.matchAll(/<label code="([^"]*)"[^>]*>([\s\S]*?)<\/label>/g)].map((m) => ({ code: m[1], label: m[2].replace(/\s+/g, ' ').trim() }));
const axesOf = (xml) =>
  Object.fromEntries(
    [...xml.matchAll(/<axis pos="(\d)" values="(\d+)">\s*<title>([\s\S]*?)<\/title>([\s\S]*?)<\/axis>/g)].map((m) => [Number(m[1]), { title: m[3].replace(/\s+/g, ' ').trim(), labels: labelsOf(m[4]), declared: Number(m[2]) }]),
  );

/** @returns {{ version: string, tables: object[] }} */
export function parsePcsTables(xml) {
  const version = xml.match(/<version>([^<]+)<\/version>/)?.[1];
  if (!version) throw new Error('PCS tablas: falta <version>');
  const tables = [];
  for (const t of xml.matchAll(/<pcsTable>([\s\S]*?)<\/pcsTable>/g)) {
    const head = t[1].split('<pcsRow')[0];
    const a = axesOf(head);
    for (const p of [1, 2, 3]) if (!a[p] || a[p].labels.length !== 1) throw new Error(`PCS tabla: el eje ${p} debía tener 1 etiqueta`);
    const rows = [...t[1].matchAll(/<pcsRow[^>]*>([\s\S]*?)<\/pcsRow>/g)].map((r) => axesOf(r[1]));
    for (const r of rows) {
      for (const p of [4, 5, 6, 7]) {
        if (!r[p]) throw new Error('PCS tabla: una fila no trae los ejes 4 a 7');
        if (r[p].labels.length !== r[p].declared) throw new Error(`PCS tabla: eje ${p} declara ${r[p].declared} valores y trae ${r[p].labels.length}`);
      }
    }
    tables.push({ id: `${a[1].labels[0].code}${a[2].labels[0].code}${a[3].labels[0].code}`, section: { ...a[1].labels[0], title: a[1].title }, bodySystem: { ...a[2].labels[0], title: a[2].title }, operation: { ...a[3].labels[0], title: a[3].title }, rows });
  }
  return { version, tables };
}

/** Cada código generado con los ejes de su tabla y fila. */
export function* generateCodes(tables) {
  for (const t of tables) {
    for (const [rowIndex, r] of t.rows.entries()) {
      for (const b of r[4].labels) for (const c of r[5].labels) for (const d of r[6].labels) for (const e of r[7].labels) {
        yield { code: `${t.id}${b.code}${c.code}${d.code}${e.code}`, table: t, rowIndex, axes: { 4: { title: r[4].title, ...b }, 5: { title: r[5].title, ...c }, 6: { title: r[6].title, ...d }, 7: { title: r[7].title, ...e } } };
      }
    }
  }
}

export function parseCodesFile(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^(\S{7}) (.+)$/);
    if (!m) throw new Error(`PCS codes: línea inesperada «${line.slice(0, 60)}»`);
    if (out.has(m[1])) throw new Error(`PCS codes: código repetido ${m[1]}`);
    out.set(m[1], m[2].trim());
  }
  return out;
}

/** Archivo de orden: ancho fijo. Posiciones 1-5 orden · 7-13 código · 15 válido (1/0) · 17-76 corta · 78- larga. */
export function parseOrderFile(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const order = line.slice(0, 5);
    const code = line.slice(6, 13).trim();
    const flag = line[14];
    if (!/^\d{5}$/.test(order) || !code || (flag !== '0' && flag !== '1')) throw new Error(`PCS orden: línea inesperada «${line.slice(0, 60)}»`);
    out.set(code, { order: Number(order), valid: flag === '1', short: line.slice(16, 76).trim(), long: line.slice(77).trim() });
  }
  return out;
}

/** Hoja «Completa» de CIE-10-ES Procedimientos (filas de readXlsx): código → descripción oficial en español. */
export function parseCie10esProcedures(sheetRows) {
  const [head, ...rows] = sheetRows;
  if (head?.[0] !== 'Código' || head?.[1] !== 'Descripción') throw new Error(`CIE-10-ES: cabecera inesperada (${(head ?? []).join(' | ')})`);
  const out = new Map();
  for (const r of rows) {
    if (!r[0]) continue;
    if (out.has(r[0])) throw new Error(`CIE-10-ES: código repetido ${r[0]}`);
    out.set(r[0], r[1]);
  }
  return out;
}

/**
 * Código del sitio. Por omisión (sección, sistema, valor): «00-6». Si en ese nivel el mismo valor
 * tiene dos etiquetas distintas (pasa en la sección X), se baja al nivel de la tabla («XW0-6») y,
 * si aún así chocan, de la fila de la tabla («XW0r2-6»). Nunca se fusionan dos etiquetas.
 */
export function siteCodeResolver(generated) {
  const labelSets = (keyOf) => {
    const m = new Map();
    for (const g of generated.values()) {
      if (!SITE_AXIS_TITLES[g.axes[4].title]) continue;
      const k = keyOf(g);
      (m.get(k) ?? m.set(k, new Set()).get(k)).add(g.axes[4].label);
    }
    return m;
  };
  const l1 = (g) => `${g.table.section.code}${g.table.bodySystem.code}-${g.axes[4].code}`;
  const l2 = (g) => `${g.table.id}-${g.axes[4].code}`;
  const l3 = (g) => `${g.table.id}r${g.rowIndex + 1}-${g.axes[4].code}`;
  const s1 = labelSets(l1);
  const s2 = labelSets(l2);
  const s3 = labelSets(l3);
  const stats = { level1: 0, level2: 0, level3: 0 };
  const resolve = (g) => {
    if (s1.get(l1(g)).size === 1) return l1(g);
    if (s2.get(l2(g)).size === 1) return l2(g);
    if (s3.get(l3(g)).size !== 1) throw new Error(`PCS: ${g.code} tiene dos etiquetas para el mismo valor dentro de una fila`);
    return l3(g);
  };
  return { resolve, stats, levelOf: (code) => (code.includes('r') ? 3 : code.split('-')[0].length > 2 ? 2 : 1) };
}

/**
 * Procedimientos (todos los códigos), sitios (conceptos por sección+sistema+valor) y
 * afirmaciones por definición. `es` (opcional) = Map de CIE-10-ES.
 */
export function pcsCorpus({ tables, codes, order, es = null, version }, metas) {
  const generated = new Map();
  for (const g of generateCodes(tables)) {
    if (generated.has(g.code)) throw new Error(`PCS: código generado dos veces ${g.code}`);
    generated.set(g.code, g);
  }
  const missing = [...codes.keys()].filter((c) => !generated.has(c));
  const extra = [...generated.keys()].filter((c) => !codes.has(c));
  if (missing.length || extra.length) throw new Error(`PCS: las tablas y el archivo de códigos no coinciden (solo en el archivo: ${missing.length}; solo en las tablas: ${extra.length})`);

  const { resolve: siteCode } = siteCodeResolver(generated);
  const procedures = [];
  const sites = new Map();
  const assertions = [];
  const stats = { codes: codes.size, withShortTitle: 0, invalidFlag: 0, withSpanish: 0, siteAssertions: 0, skippedQualifierAxis: 0, byAxisTitle: {}, siteCodeLevels: {} };
  for (const [code, g] of generated) {
    const o = order.get(code);
    if (!o) throw new Error(`PCS: ${code} no está en el archivo de orden`);
    if (o.long !== codes.get(code)) throw new Error(`PCS: ${code} tiene dos descripciones largas distintas (codes vs order)`);
    if (!o.valid) stats.invalidFlag += 1;
    stats.withShortTitle += 1;
    const esText = es?.get(code) ?? null;
    if (esText) stats.withSpanish += 1;
    procedures.push(
      procedureRecord({
        system: PCS_SYSTEM,
        code,
        display: codes.get(code),
        category: `pcs-section-${g.table.section.code}`,
        owned: true,
        meta: metas.tables,
        uri: `${metas.tablesUrl}#${code}`,
        extra: {
          properties: {
            pcs_section: { value: g.table.section.code, meaning: g.table.section.label },
            pcs_body_system: { value: g.table.bodySystem.code, meaning: g.table.bodySystem.label, axis: g.table.bodySystem.title },
            pcs_operation: { value: g.table.operation.code, meaning: g.table.operation.label },
            pcs_axes: Object.fromEntries(Object.entries(g.axes).map(([p, a]) => [p, { title: a.title, value: a.code, meaning: a.label }])),
            pcs_table: g.table.id,
            pcs_short_description: o.short,
            pcs_order: o.order,
            ...(esText ? { designation_es_source: 'CIE-10-ES Procedimientos 2026 (Ministerio de Sanidad), traducción oficial de ICD-10-PCS FY2026; coincidencia por código exacto' } : {}),
          },
          designations: esText ? [{ lang: 'es', type: 'preferred', value: esText }] : [],
        },
      }),
    );
    const slug = SITE_AXIS_TITLES[g.axes[4].title];
    if (!slug) {
      stats.skippedQualifierAxis += 1;
      continue;
    }
    const sCode = siteCode(g);
    const prior = sites.get(sCode);
    if (prior && prior.display !== g.axes[4].label) throw new Error(`PCS: el sitio ${sCode} tiene dos etiquetas («${prior.display}» y «${g.axes[4].label}»)`);
    stats.siteCodeLevels[sCode.includes('r') ? 3 : sCode.split('-')[0].length > 2 ? 2 : 1] = (stats.siteCodeLevels[sCode.includes('r') ? 3 : sCode.split('-')[0].length > 2 ? 2 : 1] ?? 0) + (prior ? 0 : 1);
    if (!prior) {
      sites.set(
        sCode,
        procedureRecord({
          system: PCS_SITE_SYSTEM,
          code: sCode,
          display: g.axes[4].label,
          category: 'pcs-site',
          owned: true,
          meta: metas.tables,
          uri: `${metas.tablesUrl}#site-${sCode}`,
          extra: { kind: 'site', properties: { pcs_section: { value: g.table.section.code, meaning: g.table.section.label }, pcs_body_system: { value: g.table.bodySystem.code, meaning: g.table.bodySystem.label, axis: g.table.bodySystem.title }, pcs_axis_4: { title: g.axes[4].title, value: g.axes[4].code } } },
        }),
      );
    }
    stats.byAxisTitle[g.axes[4].title] = (stats.byAxisTitle[g.axes[4].title] ?? 0) + 1;
    stats.siteAssertions += 1;
    assertions.push(
      assertionRecord({
        typeCode: `icd10pcs:axis4-${slug}`,
        subject: { system: PCS_SYSTEM, code, label: codes.get(code) },
        object: { system: PCS_SITE_SYSTEM, code: sCode, label: g.axes[4].label },
        sourceRecordId: `${code} axis4`,
        uri: `${metas.tablesUrl}#table-${g.table.id}`,
        evidence: { table: g.table.id, row: g.rowIndex + 1, axis: 4, axisTitle: g.axes[4].title, value: g.axes[4].code, meaning: g.axes[4].label },
        meta: metas.tables,
      }),
    );
  }
  return { procedures: [...procedures, ...sites.values()], assertions: uniqueById(assertions), stats: { ...stats, sites: sites.size, version, tables: tables.length } };
}
