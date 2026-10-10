import { resolverColumn } from './import-profiles';
import type {
  ReadRow,
  FileParser,
  ImportProfile,
  RowProblem,
  ParsingResult,
} from './row-contract';

/** Los dos separadores que se admiten, en orden de preferencia ante un empate. */
const SEPARATORS = [',', ';'] as const;

/** Marca de orden de bytes que Excel escribe al frente de los CSV que exporta. */
const BOM = '﻿';

/** La fila del encabezado, a la que apuntan sus problemas. */
const HEADER_ROW = 1;

/**
 * Lee un CSV siguiendo el RFC 4180, sin dependencias.
 *
 * ## Por qué escrito a mano y no con una librería
 *
 * Porque el alcance real es chico y conocido: separador entre dos candidatos,
 * comillas dobles con `""` como escape, y saltos de línea dentro de comillas.
 * Eso entra en un recorrido de caracteres. Sumar una dependencia para esto
 * costaría más de lo que resuelve: hay que justificarla, auditarla, y después
 * envolverla igual detrás de este mismo contrato para que el servicio no la vea.
 *
 * ## Los números de fila son los que ve quien abre el archivo
 *
 * El encabezado es la fila 1, así que la primera fila de datos es la 2. Una
 * fila entrecomillada que ocupa tres renglones sigue siendo **una** fila, y su
 * número es el de la fila lógica, no el del renglón donde empieza. Es lo que
 * muestra una planilla, y es lo único que le sirve a quien tiene que corregirla.
 */
export class CsvParser implements FileParser {
  readonly formato = 'csv' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param profile - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de lectura.
   */
  parse(buffer: Buffer, profile: ImportProfile): ParsingResult {
    const text = buffer.toString('utf8').replace(BOM, '');
    const separator = detectSeparator(text);
    const records = chunk(text, separator);

    const problems: RowProblem[] = [];
    const header = records[0];
    if (header === undefined) {
      return {
        filas: [],
        problemas: [
          {
            fila: HEADER_ROW,
            motivo: 'el archivo no tiene encabezado',
          },
        ],
      };
    }

    const columns = header.map((cell) => resolverColumn(profile, cell));
    header.forEach((cell, index) => {
      if (columns[index] === undefined) {
        // Lleva `columna` aunque sea un problema del encabezado: nombrar cuál
        // de las columnas sobra es la diferencia entre poder corregir el
        // archivo y tener que adivinar mirando los encabezados uno por uno.
        problems.push({
          fila: HEADER_ROW,
          columna: cell.trim(),
          motivo: `la columna «${cell.trim()}» no se reconoce`,
        });
      }
    });

    if (columns.every((column) => column === undefined)) {
      // Sin una sola columna reconocible no hay forma de leer las filas, y
      // devolverlas vacías sería informar cien mil errores de contenido cuando
      // el problema es uno solo y está en la primera fila.
      return {
        filas: [],
        problemas: [
          {
            fila: HEADER_ROW,
            motivo:
              'ninguna columna del encabezado se reconoce: se esperaban ' +
              profile.columnas.map((column) => column.nombre).join(', '),
          },
        ],
      };
    }

    const rows: ReadRow[] = [];
    records.slice(1).forEach((record, index) => {
      // Una fila de puros separadores la deja cualquier planilla al guardar, y
      // no es un error del archivo: es el final del archivo.
      if (record.every((cell) => cell.trim() === '')) return;

      const values: Record<string, string> = {};
      record.forEach((cell, indexColumn) => {
        const name = columns[indexColumn];
        if (name !== undefined) values[name] = cell;
      });
      rows.push({ numero: index + 2, valores: values });
    });

    return { filas: rows, problemas: problems };
  }
}

/**
 * Elige el separador contando cuál aparece más en el encabezado.
 *
 * Se mira sólo la primera fila porque es la que tiene que estar bien formada
 * para que el archivo sirva, y porque una celda de datos puede traer comas
 * adentro de comillas sin que eso diga nada del separador. Ante un empate gana
 * la coma, que es la del formato por omisión.
 *
 * @param text - El contenido completo, ya sin la marca de orden de bytes.
 * @returns El separador elegido.
 */
function detectSeparator(text: string): string {
  const firstRow = chunkRecord(text, 0, ',').crudo;
  const counts = SEPARATORS.map((separator) => ({
    separador: separator,
    veces: countOutside(firstRow, separator),
  }));
  const best = counts.reduce((a, b) => (b.veces > a.veces ? b : a));
  return best.veces > 0 ? best.separador : ',';
}

/**
 * Cuenta apariciones de un carácter fuera de comillas.
 *
 * @param text - La fila cruda.
 * @param searched - El separador candidato.
 * @returns Cuántas veces aparece fuera de comillas.
 */
function countOutside(text: string, searched: string): number {
  let quotesInside = false;
  let times = 0;
  for (let i = 0; i < text.length; i += 1) {
    const caracter = text[i];
    if (caracter === '"') {
      if (quotesInside && text[i + 1] === '"') {
        i += 1;
        continue;
      }
      quotesInside = !quotesInside;
      continue;
    }
    if (!quotesInside && caracter === searched) times += 1;
  }
  return times;
}

/**
 * Parte el texto en registros, respetando las comillas.
 *
 * @param text - El contenido completo.
 * @param separator - El separador ya detectado.
 * @returns Un arreglo de registros, cada uno con sus celdas.
 */
function chunk(text: string, separator: string): string[][] {
  const records: string[][] = [];
  let from = 0;
  while (from < text.length) {
    const {
      celdas: cells,
      siguiente: next,
      crudo: raw,
    } = chunkRecord(text, from, separator);
    // El último renglón de un archivo que termina en salto de línea es vacío y
    // no es un registro: sin esto, todo archivo bien formado traería una fila
    // fantasma al final.
    if (!(raw === '' && next >= text.length)) records.push(cells);
    from = next;
  }
  return records;
}

/**
 * Lee un registro desde una posición, hasta el salto de línea que lo cierra.
 *
 * @param text - El contenido completo.
 * @param from - Posición donde empieza el registro.
 * @param separator - El separador en uso.
 * @returns Las celdas, la posición del registro siguiente y el texto crudo leído.
 */
function chunkRecord(
  text: string,
  from: number,
  separator: string,
): { celdas: string[]; siguiente: number; crudo: string } {
  const cells: string[] = [];
  let cell = '';
  let quotesInside = false;
  let i = from;

  for (; i < text.length; i += 1) {
    const caracter = text[i];

    if (quotesInside) {
      if (caracter === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
          continue;
        }
        quotesInside = false;
        continue;
      }
      cell += caracter;
      continue;
    }

    if (caracter === '"') {
      quotesInside = true;
      continue;
    }
    if (caracter === separator) {
      cells.push(cell);
      cell = '';
      continue;
    }
    if (caracter === '\n') {
      i += 1;
      break;
    }
    if (caracter === '\r' && text[i + 1] === '\n') {
      i += 2;
      break;
    }
    cell += caracter;
  }

  cells.push(cell);
  return {
    celdas: cells,
    siguiente: i,
    crudo: text.slice(from, i),
  };
}
