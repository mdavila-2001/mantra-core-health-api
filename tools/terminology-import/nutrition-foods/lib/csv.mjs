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
