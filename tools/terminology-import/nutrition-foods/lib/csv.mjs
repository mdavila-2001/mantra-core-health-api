import { StringDecoder } from 'node:string_decoder';
// CSV RFC 4180 (comillas dobles, «""» escapado, saltos de línea dentro de campos entrecomillados).
// Los CSV de FoodData Central vienen con todos los campos entrecomillados y fin de línea LF.

/** Devuelve un arreglo de arreglos de texto. No interpreta tipos: lo que dice la fuente es lo que se guarda. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  const n = text.length;
  let quoted = false;
  while (i < n) {
    const c = text.charCodeAt(i);
    if (quoted) {
      if (c === 34) {
        if (text.charCodeAt(i + 1) === 34) { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      // tramo sin comillas: copiar de una vez
      let j = i;
      while (j < n && text.charCodeAt(j) !== 34) j++;
      field += text.slice(i, j);
      i = j;
      continue;
    }
    if (c === 34) { quoted = true; i++; continue; }
    if (c === 44) { row.push(field); field = ''; i++; continue; }
    if (c === 10 || c === 13) {
      if (c === 13 && text.charCodeAt(i + 1) === 10) i++;
      row.push(field); field = '';
      rows.push(row); row = [];
      i++; continue;
    }
    field += text[i];
    i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** CSV con encabezado → [{col: valor}]. Las filas vacías se saltan; las columnas repetidas lanzan. */
export function parseCsvObjects(text) {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  const header = rows.shift();
  if (!header) return [];
  if (new Set(header).size !== header.length) throw new Error(`Encabezado CSV con columnas repetidas: ${header.join(',')}`);
  const out = [];
  for (const r of rows) {
    if (r.length === 1 && r[0] === '') continue;
    if (r.length !== header.length) throw new Error(`Fila CSV con ${r.length} columnas (se esperaban ${header.length}): ${r.slice(0, 3).join('|')}`);
    const o = {};
    for (let k = 0; k < header.length; k++) o[header[k]] = r[k];
    out.push(o);
  }
  return out;
}

/**
 * CSV en streaming (RFC 4180) sobre cualquier `Readable`/iterable de Buffers: devuelve filas (arreglos de texto)
 * sin cargar el archivo entero. Mantiene el estado de comillas entre bloques; sirve para `branded_food.csv` (~1 GB).
 */
export async function* csvRows(readable) {
  const dec = new StringDecoder('utf8');
  let row = [];
  let field = '';
  let quoted = false;
  let pendingQuote = false; // el bloque anterior terminó con «"» dentro de un campo entrecomillado
  let sawCR = false;
  let first = true;
  const consume = function* (s) {
    let i = 0;
    const n = s.length;
    while (i < n) {
      if (pendingQuote) {
        pendingQuote = false;
        if (s.charCodeAt(i) === 34) { field += '"'; i++; continue; }
        quoted = false;
      }
      if (sawCR) {
        sawCR = false;
        if (s.charCodeAt(i) === 10) { i++; continue; }
      }
      if (quoted) {
        const j = s.indexOf('"', i);
        if (j < 0) { field += s.slice(i); i = n; continue; }
        field += s.slice(i, j);
        i = j + 1;
        if (i >= n) { pendingQuote = true; continue; }
        if (s.charCodeAt(i) === 34) { field += '"'; i++; } else quoted = false;
        continue;
      }
      const c = s.charCodeAt(i);
      if (c === 34) { quoted = true; i++; continue; }
      if (c === 44) { row.push(field); field = ''; i++; continue; }
      if (c === 10 || c === 13) {
        row.push(field);
        field = '';
        const done = row;
        row = [];
        i++;
        if (c === 13) sawCR = true;
        yield done;
        continue;
      }
      let j = i + 1;
      while (j < n) {
        const d = s.charCodeAt(j);
        if (d === 44 || d === 10 || d === 13 || d === 34) break;
        j++;
      }
      field += s.slice(i, j);
      i = j;
    }
  };
  for await (const chunk of readable) {
    let s = dec.write(chunk);
    if (first && s.length > 0) { s = s.replace(/^﻿/, ''); first = false; }
    yield* consume(s);
  }
  const tail = dec.end();
  if (tail) yield* consume(tail);
  if (pendingQuote) quoted = false;
  if (field !== '' || row.length) { row.push(field); yield row; }
}

/** `csvRows` con encabezado → objetos. Falla ante columnas repetidas o filas de largo distinto (nada se corrige en silencio). */
export async function* csvObjects(readable, label = 'csv') {
  let header = null;
  let line = 0;
  for await (const r of csvRows(readable)) {
    line++;
    if (!header) {
      header = r;
      if (new Set(header).size !== header.length) throw new Error(`${label}: encabezado con columnas repetidas: ${header.join(',')}`);
      continue;
    }
    if (r.length === 1 && r[0] === '') continue;
    if (r.length !== header.length) throw new Error(`${label}: fila ${line} con ${r.length} columnas (se esperaban ${header.length}): ${r.slice(0, 3).join('|')}`);
    const o = {};
    for (let k = 0; k < header.length; k++) o[header[k]] = r[k];
    yield o;
  }
}
