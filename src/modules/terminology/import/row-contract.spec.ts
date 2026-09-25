import { FormatoNoAdmitidoError } from './row-contract';
import type {
  ColumnaDePerfil,
  DetectorDeFormato,
  FilaLeida,
  ParseadorDeArchivo,
  PerfilDeImportacion,
  ProblemaDeFila,
  ResultadoDeParseo,
} from './row-contract';

describe('FormatoNoAdmitidoError', () => {
  it('conserva el motivo aparte del mensaje', () => {
    const error = new FormatoNoAdmitidoError(
      'no es un archivo de texto ni una planilla',
    );

    expect(error.motivo).toBe('no es un archivo de texto ni una planilla');
    expect(error.message).toBe('no es un archivo de texto ni una planilla');
    expect(error.name).toBe('FormatoNoAdmitidoError');
  });

  it('es un Error, para que el borde del servicio lo pueda distinguir', () => {
    const error = new FormatoNoAdmitidoError('el archivo llegó vacío');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FormatoNoAdmitidoError);
  });
});

describe('contrato de fila', () => {
  // Estas comprobaciones existen para que el contrato no cambie de forma sin
  // que nadie se entere: otro carril escribe su parseador contra estos tipos.
  it('una fila leída cuenta el encabezado como fila 1', () => {
    const primeraFilaDeDatos: FilaLeida = {
      numero: 2,
      valores: { code: 'ZZ-001', display: 'Ejemplo uno' },
    };

    expect(primeraFilaDeDatos.numero).toBe(2);
    expect(primeraFilaDeDatos.valores.code).toBe('ZZ-001');
  });

  it('un problema del encabezado no lleva columna', () => {
    const delEncabezado: ProblemaDeFila = {
      fila: 1,
      motivo: 'la columna «extra» no se reconoce',
    };
    const deUnaCelda: ProblemaDeFila = {
      fila: 5,
      columna: 'display',
      motivo: 'está vacía',
    };

    expect(delEncabezado.columna).toBeUndefined();
    expect(deUnaCelda.columna).toBe('display');
  });

  it('un parseador declara su formato y devuelve filas y problemas', () => {
    const columna: ColumnaDePerfil = {
      nombre: 'code',
      alias: ['código', 'codigo'],
      obligatoria: true,
      maxLargo: 255,
    };
    const perfil: PerfilDeImportacion = {
      id: 'conceptos',
      columnas: [columna],
      ejemplo: { code: 'ZZ-000' },
    };
    const vacio: ResultadoDeParseo = { filas: [], problemas: [] };
    const parseador: ParseadorDeArchivo = {
      formato: 'csv',
      parsear: () => vacio,
    };

    expect(parseador.formato).toBe('csv');
    expect(parseador.parsear(Buffer.from(''), perfil)).toEqual({
      filas: [],
      problemas: [],
    });
  });

  it('el detector es una función de buffer a formato', () => {
    const detector: DetectorDeFormato = () => 'ndjson';

    expect(detector(Buffer.from('{}'))).toBe('ndjson');
  });
});
