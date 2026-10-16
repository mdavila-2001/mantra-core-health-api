import { UnsupportedFormatError } from './row-contract';
import type {
  ProfileColumn,
  DetectorFormat,
  ReadRow,
  FileParser,
  ImportProfile,
  RowProblem,
  ParsingResult,
} from './row-contract';

describe('FormatoNoAdmitidoError', () => {
  it('conserva el motivo aparte del mensaje', () => {
    const error = new UnsupportedFormatError(
      'no es un archivo de texto ni una planilla',
    );

    expect(error.motivo).toBe('no es un archivo de texto ni una planilla');
    expect(error.message).toBe('no es un archivo de texto ni una planilla');
    expect(error.name).toBe('FormatoNoAdmitidoError');
  });

  it('es un Error, para que el borde del servicio lo pueda distinguir', () => {
    const error = new UnsupportedFormatError('el archivo llegó vacío');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UnsupportedFormatError);
  });
});

describe('contrato de fila', () => {
  // Estas comprobaciones existen para que el contrato no cambie de forma sin
  // que nadie se entere: otro carril escribe su parseador contra estos tipos.
  it('una fila leída cuenta el encabezado como fila 1', () => {
    const dataFirstRow: ReadRow = {
      numero: 2,
      valores: { code: 'ZZ-001', display: 'Ejemplo uno' },
    };

    expect(dataFirstRow.numero).toBe(2);
    expect(dataFirstRow.valores.code).toBe('ZZ-001');
  });

  it('un problema del encabezado no lleva columna', () => {
    const ofHeader: RowProblem = {
      fila: 1,
      motivo: 'la columna «extra» no se reconoce',
    };
    const ofOneCell: RowProblem = {
      fila: 5,
      columna: 'display',
      motivo: 'está vacía',
    };

    expect(ofHeader.columna).toBeUndefined();
    expect(ofOneCell.columna).toBe('display');
  });

  it('un parseador declara su formato y devuelve filas y problemas', () => {
    const column: ProfileColumn = {
      nombre: 'code',
      alias: ['código', 'codigo'],
      obligatoria: true,
      maxLargo: 255,
    };
    const profile: ImportProfile = {
      id: 'conceptos',
      columnas: [column],
      ejemplo: { code: 'ZZ-000' },
    };
    const empty: ParsingResult = { filas: [], problemas: [] };
    const parser: FileParser = {
      formato: 'csv',
      parse: () => empty,
    };

    expect(parser.formato).toBe('csv');
    expect(parser.parse(Buffer.from(''), profile)).toEqual({
      filas: [],
      problemas: [],
    });
  });

  it('el detector es una función de buffer a formato', () => {
    const detector: DetectorFormat = () => 'ndjson';

    expect(detector(Buffer.from('{}'))).toBe('ndjson');
  });
});
