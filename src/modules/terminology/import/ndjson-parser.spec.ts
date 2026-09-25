import { PERFILES_DE_IMPORTACION } from './import-profiles';
import { NdjsonParser } from './ndjson-parser';

const CONCEPTOS = PERFILES_DE_IMPORTACION.conceptos;

/** Parsea un NDJSON escrito como texto, con el perfil de conceptos. */
function parsear(ndjson: string) {
  return new NdjsonParser().parsear(Buffer.from(ndjson, 'utf8'), CONCEPTOS);
}

describe('NdjsonParser', () => {
  it('declara su formato', () => {
    expect(new NdjsonParser().formato).toBe('ndjson');
  });

  it('lee un objeto por línea, numerando por línea del archivo', () => {
    const resultado = parsear(
      '{"code":"ZZ-001","display":"Uno","definition":"La primera"}\n' +
        '{"code":"ZZ-002","display":"Dos"}\n',
    );

    expect(resultado.problemas).toHaveLength(0);
    expect(resultado.filas).toEqual([
      {
        numero: 1,
        valores: { code: 'ZZ-001', display: 'Uno', definition: 'La primera' },
      },
      { numero: 2, valores: { code: 'ZZ-002', display: 'Dos' } },
    ]);
  });

  it('las líneas vacías no cuentan como leídas y no son un problema', () => {
    const resultado = parsear(
      '\n{"code":"ZZ-001","display":"Uno"}\n\n\n{"code":"ZZ-002","display":"Dos"}\n\n',
    );

    expect(resultado.filas).toHaveLength(2);
    expect(resultado.problemas).toHaveLength(0);
    expect(resultado.filas[1]?.numero).toBe(5);
  });

  it('una línea rota es un problema de esa línea, no del archivo', () => {
    const resultado = parsear(
      '{"code":"ZZ-001","display":"Uno"}\n' +
        'esto no es json\n' +
        '{"code":"ZZ-003","display":"Tres"}\n',
    );

    expect(resultado.filas).toHaveLength(2);
    expect(resultado.problemas).toEqual([
      { fila: 2, motivo: 'la línea no es un JSON válido' },
    ]);
  });

  it('un arreglo o un número sueltos no son un concepto', () => {
    const resultado = parsear('[1,2,3]\n42\n');

    expect(resultado.filas).toHaveLength(0);
    expect(resultado.problemas.map((problema) => problema.motivo)).toEqual([
      'la línea no es un objeto',
      'la línea no es un objeto',
    ]);
  });

  it('un valor que no es texto se señala con su columna', () => {
    const resultado = parsear('{"code":"ZZ-001","display":123}\n');

    expect(resultado.filas).toHaveLength(0);
    expect(resultado.problemas).toEqual([
      { fila: 1, columna: 'display', motivo: '«display» no es texto' },
    ]);
  });

  it('ignora en silencio las claves que el perfil no espera', () => {
    const resultado = parsear(
      '{"code":"ZZ-001","display":"Uno","sobrante":"x"}\n',
    );

    expect(resultado.problemas).toHaveLength(0);
    expect(resultado.filas[0]?.valores).toEqual({
      code: 'ZZ-001',
      display: 'Uno',
    });
  });

  it('no valida: una celda vacía o larguísima es una fila leída', () => {
    // Lo que sirve y lo que no lo decide el validador, igual que para una
    // planilla. El parseador sólo mira la forma del archivo.
    const resultado = parsear(
      '{"code":"","display":"Uno"}\n' +
        `{"code":"ZZ-002","display":"${'x'.repeat(256)}"}\n`,
    );

    expect(resultado.filas).toHaveLength(2);
    expect(resultado.problemas).toHaveLength(0);
  });
});
