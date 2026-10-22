import { IMPORT_PROFILES } from './import-profiles';
import { NdjsonParser } from './ndjson-parser';

const CONCEPTS = IMPORT_PROFILES.conceptos;

/** Parsea un NDJSON escrito como texto, con el perfil de conceptos. */
function parse(ndjson: string) {
  return new NdjsonParser().parse(Buffer.from(ndjson, 'utf8'), CONCEPTS);
}

describe('NdjsonParser', () => {
  it('declara su formato', () => {
    expect(new NdjsonParser().formato).toBe('ndjson');
  });

  it('lee un objeto por línea, numerando por línea del archivo', () => {
    const result = parse(
      '{"code":"ZZ-001","display":"Uno","definition":"La primera"}\n' +
        '{"code":"ZZ-002","display":"Dos"}\n',
    );

    expect(result.problemas).toHaveLength(0);
    expect(result.filas).toEqual([
      {
        numero: 1,
        valores: { code: 'ZZ-001', display: 'Uno', definition: 'La primera' },
      },
      { numero: 2, valores: { code: 'ZZ-002', display: 'Dos' } },
    ]);
  });

  it('las líneas vacías no cuentan como leídas y no son un problema', () => {
    const result = parse(
      '\n{"code":"ZZ-001","display":"Uno"}\n\n\n{"code":"ZZ-002","display":"Dos"}\n\n',
    );

    expect(result.filas).toHaveLength(2);
    expect(result.problemas).toHaveLength(0);
    expect(result.filas[1]?.numero).toBe(5);
  });

  it('una línea rota es un problema de esa línea, no del archivo', () => {
    const result = parse(
      '{"code":"ZZ-001","display":"Uno"}\n' +
        'esto no es json\n' +
        '{"code":"ZZ-003","display":"Tres"}\n',
    );

    expect(result.filas).toHaveLength(2);
    expect(result.problemas).toEqual([
      { fila: 2, motivo: 'la línea no es un JSON válido' },
    ]);
  });

  it('un arreglo o un número sueltos no son un concepto', () => {
    const result = parse('[1,2,3]\n42\n');

    expect(result.filas).toHaveLength(0);
    expect(result.problemas.map((problem) => problem.motivo)).toEqual([
      'la línea no es un objeto',
      'la línea no es un objeto',
    ]);
  });

  it('un valor que no es texto se señala con su columna', () => {
    const result = parse('{"code":"ZZ-001","display":123}\n');

    expect(result.filas).toHaveLength(0);
    expect(result.problemas).toEqual([
      { fila: 1, columna: 'display', motivo: '«display» no es texto' },
    ]);
  });

  it('ignora en silencio las claves que el perfil no espera', () => {
    const result = parse('{"code":"ZZ-001","display":"Uno","sobrante":"x"}\n');

    expect(result.problemas).toHaveLength(0);
    expect(result.filas[0]?.valores).toEqual({
      code: 'ZZ-001',
      display: 'Uno',
    });
  });

  it('no valida: una celda vacía o larguísima es una fila leída', () => {
    // Lo que sirve y lo que no lo decide el validador, igual que para una
    // planilla. El parseador sólo mira la forma del archivo.
    const result = parse(
      '{"code":"","display":"Uno"}\n' +
        `{"code":"ZZ-002","display":"${'x'.repeat(256)}"}\n`,
    );

    expect(result.filas).toHaveLength(2);
    expect(result.problemas).toHaveLength(0);
  });
});
