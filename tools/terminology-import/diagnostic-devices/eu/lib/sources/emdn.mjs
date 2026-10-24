// =============================================================================
// EMDN (Comisión Europea): descarga completa en Excel → conceptos con
// jerarquía. Estructura verificada en fuentes oficiales: una letra de
// categoría, dos dígitos de grupo y pares de dígitos por nivel, hasta 7
// niveles y 13 caracteres (UDI Helpdesk de la Comisión). Columnas del Excel
// según la presentación del Ministero della Salute (2025): categoría,
// descripción de la categoría, código, término, nivel (1–7) y si es terminal.
// Los encabezados exactos se resuelven por alias y, si falta uno, el parser
// falla mostrando los encabezados reales.
// =============================================================================

import { clean, md5uuid, resolveHeaders } from '../common.mjs';
import { classifyEmdn } from '../emdn-scope.mjs';

export const EMDN_HEADER_SPEC = {
  code: {
    aliases: ['EMDN code', 'EMDN_CODE', 'code', 'codice', 'codice EMDN'],
    required: true,
  },
  term: {
    aliases: [
      'term',
      'EMDN term',
      'description',
      'EMDN description',
      'descrizione',
      'termine',
    ],
    required: true,
  },
  level: { aliases: ['level', 'livello', 'EMDN level'], required: false },
  terminal: {
    aliases: [
      'terminal',
      'is terminal',
      'terminal level',
      'final level',
      'livello terminale',
      'terminal level yes/no',
      'terminale',
    ],
    required: false,
  },
  category: { aliases: ['category', 'categoria'], required: false },
};

const CODE_RE = /^[A-Z](\d{2}){0,6}$/;

/** Nivel según la estructura del código: A=1, A01=2, A0101=3, … */
export function levelFromCode(code) {
  if (!CODE_RE.test(code)) return null;
  return 1 + (code.length - 1) / 2;
}

export function parentFromCode(code) {
  if (!CODE_RE.test(code) || code.length === 1) return null;
  return code.length === 3 ? code[0] : code.slice(0, -2);
}

function parseTerminal(v) {
  const s = clean(v)?.toUpperCase();
  if (s === null || s === undefined) return null;
  if (['Y', 'YES', 'S', 'SI', 'SÌ', 'TRUE', '1'].includes(s)) return true;
  if (['N', 'NO', 'FALSE', '0'].includes(s)) return false;
  throw new Error(`Valor de «terminal» no reconocido en la EMDN: ${v}`);
}

/**
 * @param {string[]} header
 * @param {Record<string,string>[]} records filas del Excel como objetos
 * @param {{ sourceUrl: string, sourceVersion: string, retrievedAt: string }} prov
 */
export function parseEmdnRows(header, records, prov) {
  const cols = resolveHeaders(header, EMDN_HEADER_SPEC, 'EMDN');
  const byCode = new Map();
  for (const [i, r] of records.entries()) {
    const code = clean(r[cols.code])?.toUpperCase();
    if (!code) continue;
    if (!CODE_RE.test(code))
      throw new Error(
        `Código EMDN con forma inesperada en la fila ${i + 2}: ${code}`,
      );
    const derived = levelFromCode(code);
    const declared = cols.level ? Number(clean(r[cols.level])) : null;
    if (declared !== null && !Number.isNaN(declared) && declared !== derived)
      throw new Error(
        `Nivel declarado (${declared}) ≠ nivel por estructura (${derived}) para ${code}`,
      );
    if (byCode.has(code)) throw new Error(`Código EMDN repetido: ${code}`);
    byCode.set(code, {
      code,
      display: clean(r[cols.term]),
      level: derived,
      terminal: cols.terminal ? parseTerminal(r[cols.terminal]) : null,
      parentCode: parentFromCode(code),
      category: code[0],
      sourceRow: i + 2,
    });
  }
  // La jerarquía tiene que cerrar: todo padre existe en el archivo.
  const orphans = [...byCode.values()].filter(
    (c) => c.parentCode && !byCode.has(c.parentCode),
  );
  if (orphans.length)
    throw new Error(
      `EMDN con ${orphans.length} códigos sin padre en el archivo (p. ej. ${orphans
        .slice(0, 5)
        .map((o) => o.code)
        .join(', ')})`,
    );
  // Si el archivo no trae «terminal», se deduce: terminal = sin hijos.
  const hasChild = new Set([...byCode.values()].map((c) => c.parentCode));
  return [...byCode.values()].map((c) => ({
    id: md5uuid(`mantra:dx-devices:emdn:${prov.sourceVersion}:${c.code}`),
    ...c,
    terminal: c.terminal ?? !hasChild.has(c.code),
    terminalSource: c.terminal === null ? 'deducido-sin-hijos' : 'archivo',
    scope: classifyEmdn(c.code),
    source: 'ec-emdn',
    sourceRecordId: c.code,
    sourceUrl: `https://webgate.ec.europa.eu/dyna2/emdn/${c.code}`,
    sourceFileUrl: prov.sourceUrl,
    sourceVersion: prov.sourceVersion,
    retrievedAt: prov.retrievedAt,
  }));
}

/**
 * Busca en el HTML de la página oficial los enlaces a la descarga completa
 * en Excel. Devuelve URLs absolutas; si no hay ninguna, el llamador falla.
 */
export function discoverExcelLinks(html, pageUrl) {
  const out = new Set();
  for (const m of html.matchAll(/href\s*=\s*"([^"]+)"/gi)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (/\.xlsx?(\?|$)|filename=[^&]*\.xlsx?/i.test(href))
      out.add(new URL(href, pageUrl).toString());
  }
  return [...out];
}

/** Lee la primera hoja de un .xlsx con la librería `xlsx` ya declarada en el repo. */
export async function readFirstSheet(path) {
  const XLSX = (await import('xlsx')).default;
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  const headerIdx = rows.findIndex((r) =>
    r.some((v) => /emdn|code|codice/i.test(String(v ?? ''))),
  );
  if (headerIdx < 0)
    throw new Error(`No se encontró la fila de encabezados en ${path}`);
  const header = rows[headerIdx].map((v) => String(v ?? '').trim());
  const records = rows
    .slice(headerIdx + 1)
    .map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])));
  return { header, records, sheetName: wb.SheetNames[0] };
}
