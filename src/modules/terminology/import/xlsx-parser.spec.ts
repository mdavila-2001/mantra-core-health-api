import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as XLSX from 'xlsx';

import { CsvParser } from './csv-parser';
import { PERFILES_DE_IMPORTACION } from './import-profiles';
import { XlsxParser } from './xlsx-parser';

const FIXTURES = join(process.cwd(), 'test', 'fixtures', 'terminology-import');

function leer(nombre: string): Buffer {
  return readFileSync(join(FIXTURES, nombre));
}

const csv = new CsvParser();
const xlsx = new XlsxParser();
const perfil = PERFILES_DE_IMPORTACION.conceptos;

/**
 * Los 12 fixtures gemelos de §4 del contrato: el `.xlsx` tiene que producir
 * el mismo `ResultadoDeParseo` que el `.csv` sobre el mismo `CsvParser` de
 * Itzan. `vacio-solo-encabezado` sigue al `CsvParser` (que devuelve
 * `{ filas: [], problemas: [] }` sobre un archivo sin filas de datos; el
 * «sin filas» lo declara el servicio, no el parseador), no a la tabla del
 * contrato, que describe el comportamiento observable end-to-end.
 */
const GEMELOS = [
  'ok-50',
  'con-errores',
  'vacio-solo-encabezado',
  'bom',
  'separador-punto-y-coma',
  'comillas-y-saltos',
  'unicode',
  'columnas-desordenadas',
  'columna-desconocida',
  'sin-encabezado',
  'fila-vacia-al-final',
  'duplicado-en-archivo',
];

describe('XlsxParser · igualdad contra el CsvParser sobre los gemelos', () => {
  it.each(GEMELOS)(
    '%s.xlsx produce el mismo resultado que %s.csv',
    (nombre) => {
      const resultadoCsv = csv.parsear(leer(`${nombre}.csv`), perfil);
      const resultadoXlsx = xlsx.parsear(leer(`${nombre}.xlsx`), perfil);
      expect(resultadoXlsx).toEqual(resultadoCsv);
    },
  );
});

describe('XlsxParser · celda-numerica (sólo XLSX, sin gemelo CSV)', () => {
  const resultado = xlsx.parsear(leer('celda-numerica.xlsx'), perfil);

  it('convierte un code numérico a texto sin notación científica', () => {
    expect(resultado.filas[0]?.valores['code']).toBe('10');
  });

  it('toma el valor cacheado de una fórmula', () => {
    expect(resultado.filas[1]?.valores['display']).toBe('2');
  });

  it('reporta un problema cuando la fórmula no tiene valor cacheado', () => {
    const problema = resultado.problemas.find((p) => p.fila === 4);
    expect(problema?.motivo).toBe('la fórmula no tiene valor calculado');
    expect(resultado.filas[2]?.valores['display']).toBe('');
  });
});

describe('XlsxParser · hoja preferida', () => {
  it('elige la hoja «conceptos» aunque no sea la primera', () => {
    const wb = XLSX.utils.book_new();
    const otra = XLSX.utils.aoa_to_sheet([
      ['code', 'display', 'definition'],
      ['ZZ-999', 'No debería leerse', ''],
    ]);
    const conceptos = XLSX.utils.aoa_to_sheet([
      ['code', 'display', 'definition'],
      ['ZZ-001', 'Sí debería leerse', ''],
    ]);
    XLSX.utils.book_append_sheet(wb, otra, 'otra');
    XLSX.utils.book_append_sheet(wb, conceptos, 'conceptos');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    const resultado = xlsx.parsear(buffer, perfil);
    expect(resultado.filas).toHaveLength(1);
    expect(resultado.filas[0]?.valores['code']).toBe('ZZ-001');
  });
});

describe('XlsxParser · límite de filas', () => {
  it('parsea 10 000 filas en menos de 5 segundos', () => {
    const antes = process.memoryUsage().heapUsed;
    const inicio = performance.now();
    const resultado = xlsx.parsear(leer('grande-10k.xlsx'), perfil);
    const duracionMs = performance.now() - inicio;
    const despues = process.memoryUsage().heapUsed;

    expect(resultado.filas).toHaveLength(10_000);
    expect(duracionMs).toBeLessThan(5_000);

    console.log(
      `grande-10k: ${duracionMs.toFixed(0)} ms, heapUsed antes=${antes} después=${despues} (+${despues - antes} bytes)`,
    );
  });

  it('rechaza un archivo con más filas que MAX_FILAS_XLSX', () => {
    const filas = Array.from({ length: 100_002 }, (_, i) => [
      `ZZ-${i}`,
      'x',
      '',
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['code', 'display', 'definition'],
      ...filas,
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'conceptos');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    const resultado = xlsx.parsear(buffer, perfil);
    expect(resultado.filas).toHaveLength(0);
    expect(resultado.problemas[0]?.motivo).toMatch(/más de 100000 filas/);
  });
});
