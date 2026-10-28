// =============================================================================
// Lector de archivos RRF de MedGen (delimitados por `|`, cada registro termina
// en `|\n`). NO usa readline: MGDEF.RRF trae `\r` sueltos DENTRO de la
// definición (README de MedGen: «The line separator within the DEF column of
// MGDEF.RRF is '\r'») y readline los cortaría como saltos de línea.
// =============================================================================

import { openText } from './delimited.mjs';

/**
 * @param {string} path
 * @param {(fields: Record<string,string>, n: number) => void} onRecord
 * @returns {Promise<{ header: string[], rows: number }>}
 */
export async function readRrf(path, onRecord) {
  let header = null;
  let rows = 0;
  let pending = '';
  const handle = (record) => {
    const fields = record.split('|');
    if (header === null) {
      header = record.replace(/^#/, '').split('|');
      if (header[header.length - 1] === '') header.pop();
      return;
    }
    // Cada registro termina en «|»: el último campo queda vacío y no es columna.
    if (fields[fields.length - 1] === '') fields.pop();
    if (fields.length !== header.length) throw new Error(`${path}: registro ${rows + 1} con ${fields.length} campos, el encabezado trae ${header.length}: ${record.slice(0, 120)}`);
    const o = {};
    for (let i = 0; i < header.length; i++) o[header[i]] = fields[i];
    rows++;
    onRecord(o, rows);
  };
  const stream = openText(path);
  stream.setEncoding?.('utf8');
  for await (const chunk of stream) {
    pending += chunk.toString('utf8');
    let i;
    while ((i = pending.indexOf('|\n')) >= 0) {
      const record = pending.slice(0, i + 1); // conserva el «|» final
      pending = pending.slice(i + 2);
      handle(record);
    }
  }
  if (pending.trim() !== '') throw new Error(`${path}: registro final sin terminador «|\\n»`);
  return { header, rows };
}
