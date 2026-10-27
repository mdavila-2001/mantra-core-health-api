// =============================================================================
// Lector de texto delimitado (TSV/CSV) con comillas, para los archivos que
// publican las fuentes abiertas (NCBI GTR, ANS, datos.gov.co…). Puro, sin red.
//
// Reglas (RFC 4180 ampliadas a cualquier delimitador de un carácter):
//   - una comilla sólo abre un campo si es el primer carácter del campo;
//   - dentro de comillas, `""` es una comilla y el delimitador y el salto de línea son texto;
//   - `\r\n` y `\n` terminan la fila; una última fila sin salto final se conserva;
//   - no se descarta ninguna fila: las filas vacías se devuelven como `['']`
//     (quien llama decide), para que el conteo de líneas sea auditable.
//
// Es un generador que corta con `slice` (no concatena carácter a carácter): un
// archivo de 150 MB con 7 millones de campos no cabe en el heap de 2,5 GB si se
// arma con `+=`.
// =============================================================================

export function* iterDelimited(text, delimiter = '\t') {
  const n = text.length;
  const delim = delimiter.charCodeAt(0);
  let i = 0;
  let row = [];
  while (i < n) {
    // --- un campo ---
    let field;
    if (text.charCodeAt(i) === 34) {
      // entrecomillado
      let j = i + 1;
      const parts = [];
      for (;;) {
        const q = text.indexOf('"', j);
        if (q === -1) throw new Error('Comillas sin cerrar al final del archivo');
        parts.push(text.slice(j, q));
        if (text.charCodeAt(q + 1) === 34) {
          parts.push('"');
          j = q + 2;
        } else {
          j = q + 1;
          break;
        }
      }
      field = parts.length === 1 ? parts[0] : parts.join('');
      i = j;
      // lo que sigue a la comilla de cierre debe ser delimitador o fin de fila
      const c = text.charCodeAt(i);
      if (i < n && c !== delim && c !== 10 && c !== 13) {
        // texto pegado a la comilla: se conserva como parte del campo (lector tolerante, como Excel)
        let k = i;
        while (k < n) {
          const ck = text.charCodeAt(k);
          if (ck === delim || ck === 10 || ck === 13) break;
          k += 1;
        }
        field += text.slice(i, k);
        i = k;
      }
    } else {
      let k = i;
      while (k < n) {
        const ck = text.charCodeAt(k);
        if (ck === delim || ck === 10 || ck === 13) break;
        k += 1;
      }
      field = text.slice(i, k);
      i = k;
    }
    row.push(field);
    // --- separador ---
    if (i >= n) break;
    const c = text.charCodeAt(i);
    if (c === delim) {
      i += 1;
      if (i >= n) {
        row.push('');
        break;
      }
    } else {
      // fin de fila
      if (c === 13 && text.charCodeAt(i + 1) === 10) i += 2;
      else i += 1;
      yield row;
      row = [];
    }
  }
  if (row.length) yield row;
}

export function parseDelimited(text, delimiter = '\t') {
  return [...iterDelimited(text, delimiter)];
}

/**
 * Filas → objetos por cabecera (generador). Verifica columnas requeridas y que
 * ninguna fila tenga otro ancho; las filas vacías se saltean.
 */
export function* objectsOf(rows, required, label, { headerPrefix = '' } = {}) {
  let header = null;
  let lineNo = 0;
  for (const r of rows) {
    lineNo += 1;
    if (!header) {
      header = r.map((h) => h.replace(/^﻿/, '').replace(headerPrefix ? new RegExp(`^${headerPrefix}`) : /^$/, '').trim());
      const missing = required.filter((c) => !header.includes(c));
      if (missing.length) throw new Error(`${label}: faltan columnas ${missing.join(', ')}; cabecera real: ${header.join(' | ')}`);
      continue;
    }
    if (r.length === 1 && r[0] === '') continue;
    if (r.length !== header.length) throw new Error(`${label}: la fila ${lineNo} tiene ${r.length} columnas y la cabecera ${header.length}`);
    const o = {};
    for (let j = 0; j < header.length; j += 1) o[header[j]] = r[j];
    yield o;
  }
  if (!header) throw new Error(`${label}: archivo vacío`);
}

export function toObjects(rows, required, label, opts) {
  return [...objectsOf(rows, required, label, opts)];
}
