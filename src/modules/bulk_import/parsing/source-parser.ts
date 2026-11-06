import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import {
  BULK_IMPORT_LIMITS,
  type BulkImportFormat,
} from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import type { FieldIssue, KindSchema } from '../schema/field-schema';
import { CsvParseError, CsvRowLimitError, parseCsv } from './csv-parser';

/** Una fila cruda tal como vino del archivo, lista para validar. */
export interface RawRow {
  /** Número de fila de datos, desde 1 (sin contar el encabezado). */
  readonly row: number;
  /** Celdas por nombre de columna. */
  readonly values: Record<string, unknown>;
  /** Hallazgo de forma (la fila no era un objeto, o tenía más celdas que columnas). */
  readonly shapeIssue?: FieldIssue;
}

/** Lo que salió de leer la fuente. */
export interface ParsedSource {
  /** Formato leído. */
  readonly format: BulkImportFormat;
  /** Filas crudas. */
  readonly rows: RawRow[];
  /** Hallazgos del archivo entero (columnas faltantes o ajenas, vacío…). Si hay, el lote se rechaza. */
  readonly fileIssues: FieldIssue[];
}

function tooLarge(reason: BulkImportReason, message: string): DomainException {
  return new DomainException(
    HttpStatus.PAYLOAD_TOO_LARGE,
    ErrorCode.PAYLOAD_TOO_LARGE,
    message,
    undefined,
    reason,
  );
}

function fileIssue(
  code: BulkImportReason,
  message: string,
  field = '*',
): FieldIssue {
  return { field, code, message };
}

/** Qué formato tiene el contenido, por extensión/tipo declarado y, si no, por su forma. */
export function detectFormat(
  buffer: Buffer,
  fileName?: string,
  mimeType?: string,
): BulkImportFormat | null {
  const name = (fileName ?? '').toLowerCase();
  const mime = (mimeType ?? '').toLowerCase();
  if (name.endsWith('.json') || mime.includes('json')) return 'json';
  if (name.endsWith('.csv') || mime.includes('csv')) return 'csv';
  const head = buffer
    .subarray(0, 64)
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();
  if (head.startsWith('[') || head.startsWith('{')) return 'json';
  return null;
}

/** Cabeceras de un CSV contra el esquema: faltantes, repetidas y ajenas. */
function checkHeaders(schema: KindSchema, headers: string[]): FieldIssue[] {
  const issues: FieldIssue[] = [];
  const known = new Set(schema.fields.map((f) => f.name));
  const seen = new Set<string>();
  headers.forEach((header, index) => {
    if (seen.has(header)) {
      issues.push(
        fileIssue(
          BulkImportReason.INVALID_FORMAT,
          `La columna ${index + 1} repite el nombre de una anterior`,
        ),
      );
    }
    seen.add(header);
    // Se nombra la posición y no el contenido: si el archivo vino sin
    // encabezado, la «cabecera» es la primera fila de datos de una persona.
    if (!known.has(header)) {
      issues.push(
        fileIssue(
          BulkImportReason.UNKNOWN_FIELD,
          `La columna ${index + 1} no figura en la plantilla`,
        ),
      );
    }
  });
  for (const field of schema.fields) {
    if (field.required && !seen.has(field.name)) {
      issues.push(
        fileIssue(
          BulkImportReason.COLUMN_MISSING,
          `Falta la columna obligatoria «${field.name}»`,
          field.name,
        ),
      );
    }
  }
  return issues;
}

function parseCsvSource(schema: KindSchema, buffer: Buffer): ParsedSource {
  let table;
  try {
    table = parseCsv(buffer.toString('utf8'), BULK_IMPORT_LIMITS.maxRows);
  } catch (error) {
    if (error instanceof CsvRowLimitError) {
      throw tooLarge(
        BulkImportReason.ROW_LIMIT_EXCEEDED,
        `El lote supera el máximo de ${BULK_IMPORT_LIMITS.maxRows} filas`,
      );
    }
    if (error instanceof CsvParseError) {
      return {
        format: 'csv',
        rows: [],
        fileIssues: [
          fileIssue(BulkImportReason.FILE_UNREADABLE, 'No se pudo leer el CSV'),
        ],
      };
    }
    throw error;
  }
  const fileIssues = checkHeaders(schema, table.headers);
  if (table.rows.length === 0) {
    fileIssues.push(
      fileIssue(
        BulkImportReason.FILE_EMPTY,
        'El archivo no trae filas de datos',
      ),
    );
  }
  const rows: RawRow[] = table.rows.map((cells, index) => {
    const values: Record<string, unknown> = {};
    table.headers.forEach((header, i) => {
      if (header !== '') values[header] = cells[i];
    });
    return {
      row: index + 1,
      values,
      shapeIssue:
        cells.length > table.headers.length
          ? fileIssue(
              BulkImportReason.INVALID_FORMAT,
              'La fila tiene más celdas que columnas',
            )
          : undefined,
    };
  });
  return { format: 'csv', rows, fileIssues };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Filas de una carga en JSON ya parseada: un arreglo de objetos, o un objeto con
 * `rows` (o `example`, para poder subir de vuelta la propia plantilla) y, si
 * trae `kind`, que coincida con el pedido.
 */
export function rowsFromJson(schema: KindSchema, json: unknown): ParsedSource {
  let list: unknown;
  const fileIssues: FieldIssue[] = [];
  if (Array.isArray(json)) {
    list = json;
  } else if (isPlainObject(json)) {
    list = json.rows ?? json.example;
    if (json.kind !== undefined && json.kind !== schema.kind) {
      fileIssues.push(
        fileIssue(
          BulkImportReason.KIND_MISMATCH,
          'El `kind` del archivo no coincide con el tipo de carga pedido',
        ),
      );
    }
  }
  if (!Array.isArray(list)) {
    return {
      format: 'json',
      rows: [],
      fileIssues: [
        ...fileIssues,
        fileIssue(
          BulkImportReason.FILE_UNREADABLE,
          'El JSON debe ser un arreglo de filas o un objeto con `rows`',
        ),
      ],
    };
  }
  if (list.length > BULK_IMPORT_LIMITS.maxRows) {
    throw tooLarge(
      BulkImportReason.ROW_LIMIT_EXCEEDED,
      `El lote supera el máximo de ${BULK_IMPORT_LIMITS.maxRows} filas`,
    );
  }
  if (list.length === 0) {
    fileIssues.push(
      fileIssue(
        BulkImportReason.FILE_EMPTY,
        'El archivo no trae filas de datos',
      ),
    );
  }
  const rows: RawRow[] = list.map((item: unknown, index) =>
    isPlainObject(item)
      ? { row: index + 1, values: item }
      : {
          row: index + 1,
          values: {},
          shapeIssue: fileIssue(
            BulkImportReason.INVALID_FORMAT,
            'La fila debe ser un objeto con las columnas de la plantilla',
          ),
        },
  );
  return { format: 'json', rows, fileIssues };
}

/**
 * Lee la fuente de una carga (archivo o filas ya parseadas) y aplica los topes.
 *
 * @param schema - Esquema del tipo de carga.
 * @param source - Un archivo, o filas de un cuerpo JSON.
 * @returns Filas crudas y hallazgos del archivo.
 * @throws DomainException 413 si el archivo o la cantidad de filas pasa el tope.
 */
export function parseSource(
  schema: KindSchema,
  source:
    | {
        readonly file: Buffer;
        readonly fileName?: string;
        readonly mimeType?: string;
      }
    | { readonly rows: readonly unknown[] },
): ParsedSource {
  if ('rows' in source) return rowsFromJson(schema, source.rows);

  if (source.file.byteLength > BULK_IMPORT_LIMITS.maxBytes) {
    throw tooLarge(
      BulkImportReason.FILE_TOO_LARGE,
      `El archivo supera el máximo de ${BULK_IMPORT_LIMITS.maxBytes / (1024 * 1024)} MB`,
    );
  }
  const format = detectFormat(source.file, source.fileName, source.mimeType);
  if (format === null) {
    return {
      format: 'csv',
      rows: [],
      fileIssues: [
        fileIssue(
          BulkImportReason.FILE_UNREADABLE,
          'El archivo debe ser CSV o JSON',
        ),
      ],
    };
  }
  if (format === 'csv') return parseCsvSource(schema, source.file);
  let json: unknown;
  try {
    json = JSON.parse(source.file.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {
      format: 'json',
      rows: [],
      fileIssues: [
        fileIssue(BulkImportReason.FILE_UNREADABLE, 'No se pudo leer el JSON'),
      ],
    };
  }
  return rowsFromJson(schema, json);
}
