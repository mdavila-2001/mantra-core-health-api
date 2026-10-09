import { resolverColumn } from './import-profiles';
import type {
  ReadRow,
  FileParser,
  ImportProfile,
  RowProblem,
  ParsingResult,
} from './row-contract';

import * as XLSX from 'xlsx';
import type { CellObject, WorkSheet } from 'xlsx';

/** El nombre de hoja que se busca primero; si no existe, se usa la primera del libro. */
const PREFERRED_SHEET = 'conceptos';

/** La fila del encabezado, a la que apuntan sus problemas. */
const HEADER_ROW = 1;

/**
 * Tope de filas de datos que se leen de una hoja.
 *
 * Sin este tope, un archivo XLSX con una hoja de millones de filas —una
 * planilla exportada por error, o un intento deliberado de agotar memoria—
 * se leería entero antes de que el servicio tuviera oportunidad de rechazarlo.
 * `sheetRows` de la librería corta la lectura misma, no sólo el resultado:
 * el `sharedStrings.xml` igual se descomprime entero (riesgo residual, no
 * cubierto por este tope — ver `gate-seguridad-phi.md`).
 */
const MAX_ROWS_XLSX = 100_000;

/**
 * Lee un archivo XLSX (planilla de cálculo) contra el mismo contrato que
 * `CsvParser`.
 *
 * ## Por qué los mismos textos de error que el CSV
 *
 * El servicio de Itzan no sabe qué formato parseó: compara los problemas de
 * `parsear()` con la misma lógica sin importar el origen. Que la columna
 * desconocida o el encabezado ausente digan lo mismo en los dos formatos es
 * lo que permite que el spec cruzado (`xlsx-parser.spec.ts`) verifique
 * igualdad byte a byte de `ResultadoDeParseo` sobre los fixtures gemelos.
 *
 * ## Los números de fila son los que ve quien abre el archivo
 *
 * Igual que en CSV: el encabezado es la fila 1, la primera fila de datos es
 * la 2, y una fila completamente vacía se ignora sin renumerar las que
 * siguen — es lo que ve cualquiera con la planilla abierta.
 */
export class XlsxParser implements FileParser {
  readonly formato = 'xlsx' as const;

  /**
   * Parsea el archivo contra las columnas del perfil.
   *
   * @param buffer - Contenido del archivo.
   * @param profile - Qué columnas se esperan.
   * @returns Las filas leídas y los problemas de lectura.
   */
  parse(buffer: Buffer, profile: ImportProfile): ParsingResult {
    const book = XLSX.read(buffer, {
      type: 'buffer',
      dense: true,
      cellFormula: true,
      cellDates: true,
      sheetRows: MAX_ROWS_XLSX + 2,
    });

    const sheetName = book.SheetNames.includes(PREFERRED_SHEET)
      ? PREFERRED_SHEET
      : book.SheetNames[0];
    const sheet =
      sheetName === undefined ? undefined : book.Sheets[sheetName];

    if (sheet === undefined) {
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

    const cellProblems: RowProblem[] = [];
    const records = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: true,
    });

    const tope = readRecordsMore(records, sheet);
    if (tope) {
      return {
        filas: [],
        problemas: [
          {
            fila: HEADER_ROW,
            motivo: `el archivo tiene más de ${MAX_ROWS_XLSX} filas`,
          },
        ],
      };
    }

    // Las fórmulas sin valor cacheado no aparecen en `sheet_to_json` con el
    // texto que hace falta: se completan leyendo la celda cruda antes de
    // seguir, y el problema que generan viaja aparte porque apunta a una
    // celda concreta, no a la fila entera.
    const completeRecords = records.map((record, recordIndex) =>
      completeFormulasWithoutValor(
        record,
        sheet,
        recordIndex,
        cellProblems,
      ),
    );

    const header = completeRecords[0];
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

    const problems: RowProblem[] = [];
    const columns = header.map((cell) =>
      resolverColumn(profile, String(cell)),
    );
    header.forEach((cell, index) => {
      if (columns[index] === undefined) {
        problems.push({
          fila: HEADER_ROW,
          columna: String(cell).trim(),
          motivo: `la columna «${String(cell).trim()}» no se reconoce`,
        });
      }
    });

    if (columns.every((column) => column === undefined)) {
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
    completeRecords.slice(1).forEach((record, index) => {
      if (record.every((cell) => cellText(cell).trim() === '')) return;

      const values: Record<string, string> = {};
      record.forEach((cell, indexColumn) => {
        const nombre = columns[indexColumn];
        if (nombre !== undefined) values[nombre] = cellText(cell);
      });
      rows.push({ numero: index + 2, valores: values });
    });

    return { filas: rows, problemas: [...problems, ...cellProblems] };
  }
}

/**
 * Si la hoja tiene más filas que el tope, no importa cuántas haya leído
 * `sheetRows` (que corta la lectura, no el conteo real del archivo).
 *
 * @param records - Lo que devolvió `sheet_to_json` con el tope aplicado.
 * @param sheet - La hoja original, para consultar su rango declarado.
 * @returns Si el archivo excede el tope.
 */
function readRecordsMore(records: unknown[], sheet: WorkSheet): boolean {
  if (records.length > MAX_ROWS_XLSX + 1) return true;
  const reference = sheet['!ref'];
  if (reference === undefined) return false;
  const range = XLSX.utils.decode_range(reference);
  const declaredRows = range.e.r - range.s.r + 1;
  return declaredRows > MAX_ROWS_XLSX + 1;
}

/**
 * Completa, en un registro ya convertido a texto, las celdas cuya fórmula no
 * tiene valor cacheado — `sheet_to_json` las deja `undefined`/vacías sin
 * avisar.
 *
 * @param record - La fila ya troceada por `sheet_to_json`.
 * @param sheet - La hoja original, para leer la celda cruda.
 * @param recordIndex - Posición del registro dentro de la hoja (0 = encabezado).
 * @param problems - Acumulador de problemas de celda.
 * @returns El registro con las fórmulas sin valor marcadas.
 */
function completeFormulasWithoutValor(
  record: unknown[],
  sheet: WorkSheet,
  recordIndex: number,
  problems: RowProblem[],
): unknown[] {
  const logicRow = recordIndex + 1; // 1-based, igual que la numeración del contrato
  return record.map((valor, columnIndex) => {
    const cell = readCell(sheet, recordIndex, columnIndex);
    if (cell?.f !== undefined && cell.v === undefined) {
      if (recordIndex > 0) {
        problems.push({
          fila: logicRow,
          columna: `columna ${columnIndex + 1}`,
          motivo: 'la fórmula no tiene valor calculado',
        });
      }
      return '';
    }
    return valor;
  });
}

/**
 * Lee la celda cruda de la hoja, ya sea en modo denso (`!data`) o
 * disperso (direcciones tipo `A1`) — `XLSX.read` con `dense: true` guarda
 * las celdas en `!data`, y las direcciones sueltas como `hoja['A1']` no
 * existen en ese modo.
 *
 * @param sheet - La hoja original.
 * @param row - Índice de fila 0-based.
 * @param column - Índice de columna 0-based.
 * @returns La celda, o `undefined` si no hay ninguna en esa posición.
 */
function readCell(
  sheet: WorkSheet,
  row: number,
  column: number,
): CellObject | undefined {
  const denseData = (sheet as { '!data'?: CellObject[][] })['!data'];
  if (denseData !== undefined) return denseData[row]?.[column];
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  return (sheet as Record<string, CellObject | undefined>)[address];
}

/**
 * Convierte el valor crudo de una celda al texto sin recortar que espera el
 * contrato, igual que hace `csv-parser.ts` con cada celda de texto.
 *
 * @param valor - El valor devuelto por `sheet_to_json`.
 * @returns El texto de la celda.
 */
function cellText(valor: unknown): string {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'boolean') return valor ? 'true' : 'false';
  if (valor instanceof Date) {
    const isMidnightUtc =
      valor.getUTCHours() === 0 &&
      valor.getUTCMinutes() === 0 &&
      valor.getUTCSeconds() === 0 &&
      valor.getUTCMilliseconds() === 0;
    return isMidnightUtc
      ? valor.toISOString().slice(0, 10)
      : valor.toISOString();
  }
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? BigInt(valor).toString() : String(valor);
  }
  if (typeof valor === 'bigint') return valor.toString();
  /*
   * `sheet_to_json` devuelve cadena, número, booleano o fecha para una celda
   * con valor, y un **objeto** cuando la celda trae un error de fórmula
   * (`{ t: 'e', … }`). `String(objeto)` daba «[object Object]», que entraba al
   * catálogo como si fuera el contenido de la celda: un concepto con ese
   * display es indistinguible de uno bueno para quien mire la tabla después.
   * Se serializa para que el error viaje visible y la revisión de la
   * importación lo encuentre.
   */
  if (typeof valor === 'symbol') return valor.toString();
  return JSON.stringify(valor) ?? '';
}
