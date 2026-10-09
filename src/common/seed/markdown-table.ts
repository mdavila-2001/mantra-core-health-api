/**
 * Lector mínimo de tablas markdown, para leer los padrones bolivianos
 * (`mantra-core-health-model/markdown_convertidos/*.md`) sin escribir nada a
 * disco: se lee en el momento en que corre el seed y sólo queda en la base.
 *
 * Puerto de las mismas reglas que `tools/bolivia-datasets/load_people.py`
 * (`celdas`, `es_separador`, `filas_de_tabla`, `columna`, `normalizar`): dos
 * implementaciones del mismo parseo divergen tarde o temprano si una vive en
 * Python y la otra en TypeScript sin nada que las mantenga iguales, así que
 * esta reimplementa el mismo contrato, no uno «equivalente».
 */

/** Una fila de datos junto con la cabecera de su tabla. */
export interface MarkdownTableRow {
  readonly header: readonly string[];
  readonly cells: readonly string[];
}

function cells(linea: string): string[] {
  const t = linea.trim();
  if (!t.startsWith('|')) return [];
  return t
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isSeparator(row: readonly string[]): boolean {
  if (row.length === 0) return false;
  return row.every((c) => c === '' || /^:?-{2,}:?$/.test(c));
}

/** Emite `{header, cells}` por cada fila de dato de cada tabla del texto. */
export function tableRows(text: string): MarkdownTableRow[] {
  const rows: MarkdownTableRow[] = [];
  let header: string[] = [];
  let anterior: string[] = [];
  for (const linea of text.split(/\r?\n/)) {
    const row = cells(linea);
    if (row.length === 0) {
      anterior = [];
      continue;
    }
    if (isSeparator(row)) {
      header = anterior;
      continue;
    }
    if (header.length > 0) {
      rows.push({ header: header, cells: row });
    }
    anterior = row;
  }
  return rows;
}

function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** La celda de la primera columna cuyo título case con alguno de `nombres`. */
export function column(row: MarkdownTableRow, ...names: string[]): string {
  for (const nombre of names) {
    const target = normalize(nombre);
    const i = row.header.findIndex((h) => normalize(h) === target);
    if (i >= 0 && i < row.cells.length) return row.cells[i].trim();
  }
  return '';
}

/** `undefined` si la celda está vacía, el valor recortado si no. */
export function optional(valor: string): string | undefined {
  const v = valor.trim();
  return v || undefined;
}
