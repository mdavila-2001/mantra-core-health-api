import { describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { BULK_IMPORT_LIMITS } from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import { exampleRow, type KindSchema } from '../schema/field-schema';
import { findKindSchema } from '../schema/registry';
import { CsvParseError, CsvRowLimitError, parseCsv } from './csv-parser';
import { detectFormat, parseSource } from './source-parser';

const staff = findKindSchema('usuario-personal-organizacion') as KindSchema;
const headerLine = staff.fields.map((f) => f.name).join(',');
const example = exampleRow(staff);

function csvWith(
  rows: number,
  email = (i: number) => `u${i}@ejemplo.invalid`,
): Buffer {
  const lines = [headerLine];
  for (let i = 0; i < rows; i += 1) {
    lines.push(
      staff.fields
        .map((f) => (f.name === 'email' ? email(i) : (example[f.name] ?? '')))
        .join(','),
    );
  }
  return Buffer.from(`${lines.join('\n')}\n`);
}

describe('parseCsv', () => {
  it('lee comillas, comillas escapadas, saltos dentro de la celda, CRLF y BOM', () => {
    const table = parseCsv('﻿a,b\r\n"x,1","di ""hola""\nmundo"\r\n\r\n', 10);
    expect(table.headers).toEqual(['a', 'b']);
    expect(table.rows).toEqual([['x,1', 'di "hola"\nmundo']]);
  });

  it('detecta ; y tabulación como delimitador', () => {
    expect(parseCsv('a;b\n1;2\n', 10).rows).toEqual([['1', '2']]);
    expect(parseCsv('a\tb\n1\t2\n', 10).rows).toEqual([['1', '2']]);
  });

  it('límite: exactamente maxRows pasa, uno más corta', () => {
    const body = (n: number) =>
      `a\n${Array.from({ length: n }, (_, i) => i).join('\n')}\n`;
    expect(parseCsv(body(3), 3).rows).toHaveLength(3);
    expect(() => parseCsv(body(4), 3)).toThrow(CsvRowLimitError);
  });

  it('inválido: comillas sin cerrar y archivo vacío', () => {
    expect(() => parseCsv('a,b\n"x,1\n', 10)).toThrow(CsvParseError);
    expect(() => parseCsv('', 10)).toThrow(CsvParseError);
  });

  it('una celda vacía entre delimitadores se conserva', () => {
    expect(parseCsv('a,b,c\n1,,3\n', 10).rows).toEqual([['1', '', '3']]);
  });
});

describe('detectFormat', () => {
  it('por extensión, por tipo y por forma del contenido', () => {
    expect(detectFormat(Buffer.from('x'), 'a.JSON')).toBe('json');
    expect(detectFormat(Buffer.from('x'), 'a.csv')).toBe('csv');
    expect(detectFormat(Buffer.from('x'), undefined, 'application/json')).toBe(
      'json',
    );
    expect(detectFormat(Buffer.from('  [{"a":1}]'))).toBe('json');
    expect(detectFormat(Buffer.from('a,b\n1,2'))).toBeNull();
  });
});

describe('parseSource · topes de tamaño y de filas', () => {
  it('correcto: 5.000 filas exactas pasan', () => {
    const parsed = parseSource(staff, {
      file: csvWith(BULK_IMPORT_LIMITS.maxRows),
      fileName: 'a.csv',
    });
    expect(parsed.fileIssues).toEqual([]);
    expect(parsed.rows).toHaveLength(5000);
    expect(parsed.rows[4999].row).toBe(5000);
  });

  it('límite: 5.001 filas CSV → 413 ROW_LIMIT_EXCEEDED', () => {
    expect.assertions(2);
    try {
      parseSource(staff, {
        file: csvWith(BULK_IMPORT_LIMITS.maxRows + 1),
        fileName: 'a.csv',
      });
    } catch (error) {
      expect((error as { getStatus(): number }).getStatus()).toBe(
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
      expect((error as { reason?: string }).reason).toBe(
        BulkImportReason.ROW_LIMIT_EXCEEDED,
      );
    }
  });

  it('límite: 5.001 filas JSON (cuerpo o archivo) → 413 ROW_LIMIT_EXCEEDED', () => {
    const rows = Array.from({ length: BULK_IMPORT_LIMITS.maxRows + 1 }, () => ({
      ...example,
    }));
    expect(() => parseSource(staff, { rows })).toThrow(
      expect.objectContaining({ reason: BulkImportReason.ROW_LIMIT_EXCEEDED }),
    );
    expect(() =>
      parseSource(staff, {
        file: Buffer.from(JSON.stringify(rows)),
        fileName: 'a.json',
      }),
    ).toThrow(
      expect.objectContaining({ reason: BulkImportReason.ROW_LIMIT_EXCEEDED }),
    );
    expect(parseSource(staff, { rows: rows.slice(0, 5000) }).rows).toHaveLength(
      5000,
    );
  });

  it('límite: 20 MB + 1 byte → 413 FILE_TOO_LARGE; 20 MB exactos se leen', () => {
    const big = Buffer.alloc(BULK_IMPORT_LIMITS.maxBytes + 1, 0x20);
    expect(() => parseSource(staff, { file: big, fileName: 'a.csv' })).toThrow(
      expect.objectContaining({ reason: BulkImportReason.FILE_TOO_LARGE }),
    );
    const edge = Buffer.concat([
      Buffer.from(`${headerLine}\n`),
      Buffer.alloc(BULK_IMPORT_LIMITS.maxBytes - headerLine.length - 1, 0x0a),
    ]);
    expect(edge.byteLength).toBe(BULK_IMPORT_LIMITS.maxBytes);
    const parsed = parseSource(staff, { file: edge, fileName: 'a.csv' });
    expect(parsed.fileIssues.map((i) => i.code)).toContain(
      BulkImportReason.FILE_EMPTY,
    );
  });
});

describe('parseSource · archivos inválidos (el lote se rechaza, no revienta)', () => {
  it('sin filas de datos → FILE_EMPTY', () => {
    const parsed = parseSource(staff, {
      file: Buffer.from(`${headerLine}\n`),
      fileName: 'a.csv',
    });
    expect(parsed.fileIssues.map((i) => i.code)).toContain(
      BulkImportReason.FILE_EMPTY,
    );
  });

  it('falta una columna obligatoria → COLUMN_MISSING con el nombre de la columna', () => {
    const parsed = parseSource(staff, {
      file: Buffer.from('displayName\nA\n'),
      fileName: 'a.csv',
    });
    expect(parsed.fileIssues).toEqual([
      expect.objectContaining({
        code: BulkImportReason.COLUMN_MISSING,
        field: 'email',
      }),
    ]);
  });

  it('CSV sin encabezado: la primera fila de datos no se repite en ningún mensaje', () => {
    const SENTINEL = 'Persona-Real-Ficticia-77';
    const parsed = parseSource(staff, {
      file: Buffer.from(`${SENTINEL},otra@ejemplo.invalid\nx,y\n`),
      fileName: 'a.csv',
    });
    expect(parsed.fileIssues.length).toBeGreaterThan(0);
    expect(JSON.stringify(parsed.fileIssues)).not.toContain(SENTINEL);
  });

  it('JSON roto, JSON que no es arreglo, kind distinto y filas que no son objetos', () => {
    expect(
      parseSource(staff, { file: Buffer.from('[{"a":'), fileName: 'a.json' })
        .fileIssues[0].code,
    ).toBe(BulkImportReason.FILE_UNREADABLE);
    expect(
      parseSource(staff, { file: Buffer.from('{"x":1}'), fileName: 'a.json' })
        .fileIssues[0].code,
    ).toBe(BulkImportReason.FILE_UNREADABLE);
    const mismatch = parseSource(staff, { rows: [] });
    expect(mismatch.fileIssues.map((i) => i.code)).toContain(
      BulkImportReason.FILE_EMPTY,
    );
    const json = JSON.stringify({ kind: 'usuario-paciente', rows: [example] });
    expect(
      parseSource(staff, { file: Buffer.from(json), fileName: 'a.json' })
        .fileIssues[0].code,
    ).toBe(BulkImportReason.KIND_MISMATCH);
    const shape = parseSource(staff, { rows: ['texto', example] });
    expect(shape.rows[0].shapeIssue?.code).toBe(
      BulkImportReason.INVALID_FORMAT,
    );
    expect(shape.rows[1].shapeIssue).toBeUndefined();
  });

  it('un archivo que no es CSV ni JSON se rechaza como ilegible', () => {
    const parsed = parseSource(staff, {
      file: Buffer.from('hola mundo'),
      fileName: 'a.txt',
    });
    expect(parsed.fileIssues[0].code).toBe(BulkImportReason.FILE_UNREADABLE);
  });

  it('una fila CSV con más celdas que columnas se marca, no se descarta en silencio', () => {
    const parsed = parseSource(staff, {
      file: Buffer.from(
        `${headerLine}\n${staff.fields.map(() => 'x').join(',')},extra\n`,
      ),
      fileName: 'a.csv',
    });
    expect(parsed.rows[0].shapeIssue?.code).toBe(
      BulkImportReason.INVALID_FORMAT,
    );
  });
});
