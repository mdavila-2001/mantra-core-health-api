/** Resultado de leer un CSV: encabezados y celdas, sin interpretar. */
export interface CsvTable {
  readonly headers: string[];
  readonly rows: string[][];
}

/** El CSV no se pudo leer (comillas sin cerrar, vacío…). */
export class CsvParseError extends Error {}

/** El CSV trae más filas que el tope. */
export class CsvRowLimitError extends Error {
  constructor(readonly limit: number) {
    super(`Más de ${limit} filas`);
  }
}

const DELIMITERS = [',', ';', '\t'] as const;

/** Delimitador de la primera línea: el que más aparece fuera de comillas. */
function detectDelimiter(text: string): string {
  const counts = new Map<string, number>(DELIMITERS.map((d) => [d, 0]));
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === '\n' || ch === '\r')) break;
    else if (!quoted && counts.has(ch))
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let best: string = ',';
  let bestCount = 0;
  for (const [delimiter, count] of counts) {
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Lee un CSV (RFC 4180): comillas dobles, comillas escapadas duplicadas,
 * saltos de línea dentro de una celda entrecomillada, `\r\n` y BOM. Admite `,`,
 * `;` (la coma decimal de las planillas en español) y tabulación como
 * delimitador, detectado en la primera línea. Las líneas en blanco se ignoran.
 *
 * @param input - Contenido del archivo como texto.
 * @param maxRows - Filas de datos máximas; al pasarse corta sin leer el resto.
 * @returns Encabezados y filas de datos.
 * @throws CsvParseError si hay comillas sin cerrar o no hay encabezado.
 * @throws CsvRowLimitError si hay más de `maxRows` filas de datos.
 */
export function parseCsv(input: string, maxRows: number): CsvTable {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let cellWasQuoted = false;

  const endCell = (): void => {
    row.push(cell);
    cell = '';
    cellWasQuoted = false;
  };
  const endRow = (): void => {
    endCell();
    const blank = row.length === 1 && row[0].trim() === '' && !cellWasQuoted;
    if (!blank) {
      records.push(row);
      // +1: el encabezado es la primera fila.
      if (records.length > maxRows + 1) throw new CsvRowLimitError(maxRows);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && cell === '') {
      quoted = true;
      cellWasQuoted = true;
    } else if (ch === delimiter) {
      endCell();
    } else if (ch === '\n') {
      endRow();
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      endRow();
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new CsvParseError('Comillas sin cerrar');
  if (cell !== '' || row.length > 0) endRow();

  if (records.length === 0) throw new CsvParseError('Sin encabezado');
  const [headerRow, ...rows] = records;
  return { headers: headerRow.map((h) => h.trim()), rows };
}
