// =============================================================================
// Texto literal de una sección: HTML saneado, texto plano y tablas celda a
// celda. Nada de acá resume, traduce ni interpreta: las frecuencias de las
// reacciones adversas, por ejemplo, quedan en la celda en que la ficha las
// escribió («Frecuentes», «Raras»…), sin convertirlas a una escala propia.
// =============================================================================

import { createHash } from 'node:crypto';

import { htmlToText, sanitizeHtml } from '../../lib/glossary-es/common.mjs';

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
};

/**
 * Tablas del HTML como matrices de celdas. Cada celda es `{ text }` y, sólo si
 * la fuente las declara, `colspan`/`rowspan` (no se expanden: expandir sería
 * repetir texto que la fuente escribió una vez). Tablas anidadas: se leen las
 * celdas de la exterior con su contenido completo.
 * @returns {{ caption?: string, rows: { text: string|null, colspan?: number, rowspan?: number }[][] }[]}
 */
export function extractTables(html) {
  if (html == null) return [];
  const src = String(html);
  const tables = [];
  const re = /<table\b[^>]*>|<\/table>/gi;
  let depth = 0;
  let start = -1;
  for (let m = re.exec(src); m !== null; m = re.exec(src)) {
    if (m[0][1] !== '/') {
      if (depth === 0) start = m.index;
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0) tables.push(src.slice(start, m.index + m[0].length));
    }
  }
  return tables
    .map((t) => {
      const caption = htmlToText(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i.exec(t)?.[1] ?? null); // título que la etiqueta escribió («Table 1: …»)
      return { ...(caption ? { caption } : {}), rows: tableRows(t) };
    })
    .filter((t) => t.rows.length > 0);
}

function tableRows(tableHtml) {
  const inner = tableHtml.replace(/^<table\b[^>]*>/i, '').replace(/<\/table>$/i, '');
  const rows = [];
  for (const tr of splitTop(inner, 'tr')) {
    const cells = splitTop(tr.body, 'td|th').map((c) => {
      const cell = { text: htmlToText(c.body) };
      const colspan = Number(attr(c.open, 'colspan'));
      const rowspan = Number(attr(c.open, 'rowspan'));
      if (Number.isInteger(colspan) && colspan > 1) cell.colspan = colspan;
      if (Number.isInteger(rowspan) && rowspan > 1) cell.rowspan = rowspan;
      return cell;
    });
    if (cells.some((c) => c.text !== null)) rows.push(cells);
  }
  return rows;
}

/** Elementos `<tag>` del primer nivel (no entra en tablas anidadas). */
function splitTop(html, tagAlt) {
  const re = new RegExp(`<(/?)(${tagAlt}|table)\\b[^>]*>`, 'gi');
  const out = [];
  let depth = 0;
  let tableDepth = 0;
  let open = null;
  let bodyStart = -1;
  for (let m = re.exec(html); m !== null; m = re.exec(html)) {
    const closing = m[1] === '/';
    const isTable = m[2].toLowerCase() === 'table';
    if (isTable) {
      tableDepth += closing ? -1 : 1;
      continue;
    }
    if (tableDepth > 0) continue;
    if (!closing) {
      if (depth === 0) {
        open = m[0];
        bodyStart = m.index + m[0].length;
      }
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0) out.push({ open, body: html.slice(bodyStart, m.index) });
    }
  }
  return out;
}

/** Huella del texto literal: permite auditar que lo cargado es lo descargado. */
export const textSha256 = (text) => createHash('sha256').update(String(text), 'utf8').digest('hex');

/**
 * HTML de una sección → `{ html, text, tables, textSha256 }`, o null si la
 * sección vino vacía. El texto es el de `htmlToText` (sólo quita etiquetas y
 * normaliza espacios), el mismo criterio del glosario.
 */
export function literalFromHtml(html) {
  const text = htmlToText(html);
  if (!text) return null;
  return { html: sanitizeHtml(html), text, tables: extractTables(html), textSha256: textSha256(text) };
}

/** Lista de párrafos de texto plano (openFDA) → `{ text, textSha256 }`; los párrafos se unen con línea en blanco. */
export function literalFromParagraphs(paragraphs) {
  const parts = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((p) => (p == null ? '' : String(p).trim())).filter((p) => p !== '');
  if (parts.length === 0) return null;
  const text = parts.join('\n\n');
  return { html: null, text, tables: [], textSha256: textSha256(text) };
}
