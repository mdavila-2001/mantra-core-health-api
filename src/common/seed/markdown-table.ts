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

function celdas(linea: string): string[] {
  const t = linea.trim();
  if (!t.startsWith('|')) return [];
  return t
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function esSeparador(fila: readonly string[]): boolean {
  if (fila.length === 0) return false;
  return fila.every((c) => c === '' || /^:?-{2,}:?$/.test(c));
}

/** Emite `{header, cells}` por cada fila de dato de cada tabla del texto. */
export function filasDeTabla(texto: string): MarkdownTableRow[] {
  const filas: MarkdownTableRow[] = [];
  let cabecera: string[] = [];
  let anterior: string[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const fila = celdas(linea);
    if (fila.length === 0) {
      anterior = [];
      continue;
    }
    if (esSeparador(fila)) {
      cabecera = anterior;
      continue;
    }
    if (cabecera.length > 0) {
      filas.push({ header: cabecera, cells: fila });
    }
    anterior = fila;
  }
  return filas;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** La celda de la primera columna cuyo título case con alguno de `nombres`. */
export function columna(fila: MarkdownTableRow, ...nombres: string[]): string {
  for (const nombre of nombres) {
    const objetivo = normalizar(nombre);
    const i = fila.header.findIndex((h) => normalizar(h) === objetivo);
    if (i >= 0 && i < fila.cells.length) return fila.cells[i].trim();
  }
  return '';
}

/** `undefined` si la celda está vacía, el valor recortado si no. */
export function opcional(valor: string): string | undefined {
  const v = valor.trim();
  return v || undefined;
}
