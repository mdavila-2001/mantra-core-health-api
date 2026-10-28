// =============================================================================
// Lector de texto delimitado (TSV / CSV / RRF) con comillas, sin dependencias.
// Los archivos de genética pesan hasta 17 MB comprimidos o ~250 MB sin
// comprimir (MGCONSO): se lee en streaming por LÍNEAS lógicas, sin cargar el
// archivo entero. Una línea lógica puede abarcar varias físicas si hay una
// comilla abierta (HGNC family.csv y ClinGen traen saltos de línea dentro de
// campos entrecomillados).
// =============================================================================

import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

/** Abre un archivo de texto; si termina en .gz lo descomprime al vuelo. */
export function openText(path) {
  const raw = createReadStream(path);
  return path.endsWith('.gz') ? raw.pipe(createGunzip()) : raw;
}

/**
 * Parte UNA línea lógica en campos. `quote` null = sin comillas.
 * Dentro de comillas, `""` es una comilla literal.
 */
export function splitFields(line, delimiter = '\t', quote = '"') {
  if (quote === null || !line.includes(quote)) return line.split(delimiter);
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === quote) {
        if (line[i + 1] === quote) {
          cur += quote;
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === quote && cur === '') inQ = true;
    else if (c === delimiter) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** ¿La línea acumulada deja una comilla abierta? (cuenta las comillas: par = cerrada). */
const quoteOpen = (text, quote) => {
  let n = 0;
  for (let i = text.indexOf(quote); i >= 0; i = text.indexOf(quote, i + 1)) n++;
  return n % 2 === 1;
};

/**
 * Recorre un archivo delimitado y llama `onRow(fields, lineNumber)` por fila de
 * datos. Devuelve { header, rows }. `header` = primera línea (sin '#' inicial si
 * `stripHash`). Las filas con distinta cantidad de campos que el encabezado
 * lanzan error (no se rellenan ni se truncan en silencio).
 *
 * @param {string} path
 * @param {(fields: string[], lineNo: number, header: string[]) => void} onRow
 * @param {{ delimiter?: string, quote?: string|null, stripHash?: boolean, trailingDelimiter?: boolean, skipLines?: (line: string) => boolean, headerMatch?: (line: string) => boolean, columns?: number }} [opts]
 */
export async function readDelimited(path, onRow, { delimiter = '\t', quote = '"', stripHash = false, trailingDelimiter = false, skipLines = null, headerMatch = null, columns = null } = {}) {
  const rl = createInterface({ input: openText(path), crlfDelay: Infinity });
  let header = null;
  let rows = 0;
  let lineNo = 0;
  let acc = '';
  for await (const physical of rl) {
    lineNo++;
    acc = acc === '' ? physical : `${acc}\n${physical}`;
    if (quote !== null && quoteOpen(acc, quote)) continue;
    const line = acc;
    acc = '';
    if (line === '') continue;
    if (header === null) {
      if (headerMatch ? !headerMatch(line) : false) continue;
      let h = line;
      if (stripHash && h.startsWith('#')) h = h.slice(1);
      let f = splitFields(h, delimiter, quote);
      if (trailingDelimiter && f[f.length - 1] === '') f = f.slice(0, -1);
      header = f;
      continue;
    }
    if (skipLines?.(line)) continue;
    let fields = splitFields(line, delimiter, quote);
    if (trailingDelimiter && fields[fields.length - 1] === '') fields = fields.slice(0, -1);
    const expected = columns ?? header.length;
    if (fields.length !== expected) throw new Error(`${path}:${lineNo}: ${fields.length} campos, el encabezado trae ${expected}`);
    onRow(fields, lineNo, header);
    rows++;
  }
  if (acc !== '') throw new Error(`${path}: comilla sin cerrar al final del archivo`);
  return { header, rows };
}

/** Convierte una fila en objeto por nombre de columna. */
export const rowObject = (header, fields) => Object.fromEntries(header.map((h, i) => [h, fields[i]]));

/** '' / '-' / 'NULL' → null (convenciones de las fuentes de NCBI y HGNC). */
export const nullIf = (v, tokens = ['', '-', 'NULL']) => (v == null || tokens.includes(v) ? null : v);
