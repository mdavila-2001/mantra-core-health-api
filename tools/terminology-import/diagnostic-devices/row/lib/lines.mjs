// =============================================================================
// Equipos de diagnóstico · ROW · lectura de CSV grandes línea por línea.
//
// Los archivos oficiales pueden pasar del tamaño máximo de un string de V8
// (ANVISA `TA_PRODUTO_SAUDE_MODELO.csv`: ~1 GB). Se leen en streaming con un
// TextDecoder (que respeta la codificación declarada, p. ej. windows-1252) y
// se devuelven como objetos por encabezado.
// =============================================================================

import { createReadStream } from 'node:fs';
import { TextDecoder } from 'node:util';

/** Itera las líneas de texto de un archivo, sin el fin de línea. */
export async function* readTextLines(path, encoding = 'utf-8') {
  const decoder = new TextDecoder(encoding);
  let pending = '';
  for await (const chunk of createReadStream(path)) {
    pending += decoder.decode(chunk, { stream: true });
    const parts = pending.split('\n');
    pending = parts.pop();
    for (const part of parts)
      yield part.endsWith('\r') ? part.slice(0, -1) : part;
  }
  pending += decoder.decode();
  if (pending !== '')
    yield pending.endsWith('\r') ? pending.slice(0, -1) : pending;
}

/**
 * Itera las filas de un CSV con separador fijo y sin comillas que encierren
 * campos, como objetos por encabezado. `strict` hace fallar ante una línea con
 * otra cantidad de columnas; si no, se cuentan en `stats.badLines`.
 */
export async function* readDelimitedRows(
  path,
  { encoding = 'utf-8', delimiter = ';', strict = true, stats = {} } = {},
) {
  let header = null;
  let lineNo = 0;
  stats.badLines = 0;
  for await (const raw of readTextLines(path, encoding)) {
    lineNo += 1;
    const line = header === null ? raw.replace(/^﻿/, '') : raw;
    if (line.trim() === '') continue;
    const cells = line.split(delimiter);
    if (header === null) {
      header = cells.map((c) => c.replace(/^#/, ''));
      continue;
    }
    if (cells.length !== header.length) {
      if (strict)
        throw new Error(
          `${path}:${lineNo}: ${cells.length} columnas, se esperaban ${header.length}`,
        );
      stats.badLines += 1;
      continue;
    }
    yield Object.fromEntries(header.map((name, i) => [name, cells[i]]));
  }
}
