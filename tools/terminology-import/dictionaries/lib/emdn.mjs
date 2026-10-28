// =============================================================================
// EMDN — Nomenclatura Europea de Productos Sanitarios (European Medical Device
// Nomenclature), planilla oficial «EMDN v2026_EN..xlsx» de la Comisión Europea
// (DG SANTE). Un concepto por fila; el padre sale de la columna LEVEL y del
// prefijo del código (la estructura de siete niveles que la propia Comisión
// documenta en su FAQ: 1, 3, 5, 7, 9, 11 y 13 caracteres).
//
// Lo que la fuente publica solo está en inglés y en MAYÚSCULAS: se carga tal
// cual (nada se traduce ni se pasa a minúsculas). Puro: recibe filas ya leídas.
// =============================================================================

import { readZipEntry } from './zip-mini.mjs';
import { provenance } from './terms.mjs';

const decodeXml = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** Cadenas compartidas de un .xlsx (`xl/sharedStrings.xml`): <si> con <t> directos o runs <r><t>. */
export function sharedStrings(xml) {
  const out = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    out.push(decodeXml([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  }
  return out;
}

/** Hoja de un .xlsx → filas [{ A: 'x', C: 'y' }] indexadas por letra de columna. */
export function sheetRows(sheetXml, strings) {
  const rows = [];
  for (const r of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = {};
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const inner = c[3];
      if (!inner) continue;
      const type = /\bt="(\w+)"/.exec(c[2])?.[1];
      let value;
      if (type === 'inlineStr') value = decodeXml([...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
      else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        if (v === undefined) continue;
        value = type === 's' ? strings[Number(v)] : decodeXml(v);
      }
      row[c[1]] = value;
    }
    rows.push(row);
  }
  return rows;
}

/** Lee la primera hoja de un .xlsx del disco. */
export function readXlsxFirstSheet(path) {
  const strings = sharedStrings(readZipEntry(path, 'xl/sharedStrings.xml').toString('utf8'));
  return sheetRows(readZipEntry(path, 'xl/worksheets/sheet1.xml').toString('utf8'), strings);
}

const HEADER = { A: 'CATEGORY', C: 'CODE', E: 'LEVEL', F: 'TERMINAL LEVEL (YES/NO)' };

/**
 * Filas de la planilla → filas del corpus. Aborta si la cabecera no es la
 * esperada, si un nivel no cuadra con el largo del código o si un código no
 * tiene su padre: son síntomas de que el formato cambió.
 */
export function emdnRows(sheet, source, file) {
  const headerIdx = sheet.findIndex((r) => r.C === 'CODE');
  if (headerIdx < 0) throw new Error('EMDN: no se encontró la fila de cabecera (columna CODE)');
  const h = sheet[headerIdx];
  for (const [col, name] of Object.entries(HEADER)) if (h[col] !== name) throw new Error(`EMDN: cabecera inesperada en la columna ${col}: «${h[col]}» (se esperaba «${name}»)`);
  if (!/^TERM EMDN/.test(h.D ?? '') || !/^CATEGORY DESCRIPTION/.test(h.B ?? '')) throw new Error('EMDN: cabecera inesperada en las columnas B/D');
  const data = sheet.slice(headerIdx + 1).filter((r) => r.C);
  const levelLen = [0, 1, 3, 5, 7, 9, 11, 13];
  const byCode = new Map();
  for (const r of data) {
    const level = Number(r.E);
    if (!Number.isInteger(level) || level < 1 || level > 7) throw new Error(`EMDN ${r.C}: nivel inválido «${r.E}»`);
    if (r.C.length !== levelLen[level]) throw new Error(`EMDN ${r.C}: el nivel ${level} exige ${levelLen[level]} caracteres`);
    if (byCode.has(r.C)) throw new Error(`EMDN: código repetido ${r.C}`);
    byCode.set(r.C, r);
  }
  const stats = { rows: data.length, byLevel: {}, terminal: 0, orphans: 0 };
  const rows = [];
  for (const r of data) {
    const level = Number(r.E);
    const parent = level === 1 ? null : r.C.slice(0, levelLen[level - 1]);
    if (parent && !byCode.has(parent)) throw new Error(`EMDN ${r.C}: su padre ${parent} no está en la planilla`);
    stats.byLevel[level] = (stats.byLevel[level] ?? 0) + 1;
    const terminal = r.F === 'YES';
    if (terminal) stats.terminal++;
    rows.push({
      key: `${source.codeSystem}|${r.C}`,
      codeSystem: source.codeSystem,
      code: r.C,
      domain: source.domain,
      lang: 'en',
      display: r.D,
      definition: null,
      definitionXrefs: [],
      synonymsExact: [],
      synonymsOther: [],
      xrefs: [],
      subsets: terminal ? ['terminal-level'] : [],
      namespace: 'emdn',
      altIds: [],
      relations: parent ? [{ type: 'IS_A', predicate: 'emdn-parent', target: parent, targetKey: `${source.codeSystem}|${parent}` }] : [],
      otherRelations: [],
      extra: { level, terminalLevel: terminal, category: r.A, categoryDescription: r.B },
      provenance: provenance(source, r.C, { file }),
    });
  }
  return { rows, stats };
}
