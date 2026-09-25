import { CsvParser, PERFILES_DE_IMPORTACION } from '../import';
import { validarFilas } from './row-validator';

const CONCEPTOS = PERFILES_DE_IMPORTACION.conceptos;

/** Lee un CSV escrito como texto y valida sus filas, como hace el servicio. */
function leerYValidar(csv: string) {
  const { filas } = new CsvParser().parsear(
    Buffer.from(csv, 'utf8'),
    CONCEPTOS,
  );
  return validarFilas(filas, CONCEPTOS);
}

/**
 * Arma el fixture `con-errores`: cincuenta filas, de las cuales cinco fallan.
 *
 * Las posiciones están dichas en **filas del archivo**, que es como las ve
 * quien lo abre: el encabezado es la 1, así que la fila 5 es la cuarta de datos.
 */
function conErrores(): string {
  const largo256 = 'x'.repeat(256);
  const filas = Array.from({ length: 50 }, (_, indice) => {
    const filaDelArchivo = indice + 2;
    const numero = String(indice + 1).padStart(3, '0');
    const porDefecto = `ZZ-${numero},Ejemplo ${numero},Definición ${numero}`;

    switch (filaDelArchivo) {
      case 5:
        return `ZZ-${numero},,Definición ${numero}`;
      case 9:
        return `,Ejemplo ${numero},Definición ${numero}`;
      case 14:
        return `${largo256},Ejemplo ${numero},Definición ${numero}`;
      case 20:
        return `ZZ-003,Ejemplo ${numero},Definición ${numero}`;
      case 33:
        return `ZZ-${numero},${largo256},Definición ${numero}`;
      default:
        return porDefecto;
    }
  });
  return ['code,display,definition', ...filas].join('\n') + '\n';
}

describe('validarFilas', () => {
  it('señala exactamente las cinco filas malas, con su columna', () => {
    const { validas, problemas } = leerYValidar(conErrores());

    expect(
      problemas.map((problema) => [problema.fila, problema.columna]),
    ).toEqual([
      [5, 'display'],
      [9, 'code'],
      [14, 'code'],
      [20, 'code'],
      [33, 'display'],
    ]);
    expect(validas).toHaveLength(45);
  });

  it('el código repetido se señala en la segunda aparición y nombra la primera', () => {
    const resultado = leerYValidar(
      'code,display\nZZ-001,Uno\nZZ-002,Dos\nZZ-003,Tres\nZZ-001,Otra vez\n',
    );

    expect(resultado.problemas).toEqual([
      {
        fila: 5,
        columna: 'code',
        motivo: '«ZZ-001» ya está repetido en la fila 2',
      },
    ]);
    expect(resultado.validas).toHaveLength(3);
  });

  describe('los motivos se entienden sin saber cómo está hecho el importador', () => {
    it('dice que la celda está vacía', () => {
      const { problemas } = leerYValidar('code,display\n,Uno\n');

      expect(problemas[0]?.motivo).toBe('«code» está vacía');
    });

    it('dice cuántos caracteres se pasó', () => {
      const { problemas } = leerYValidar(
        `code,display\nZZ-001,${'x'.repeat(256)}\n`,
      );

      expect(problemas[0]?.motivo).toBe('«display» supera 255 caracteres');
    });

    it('ningún motivo usa jerga técnica', () => {
      const { problemas } = leerYValidar(conErrores());

      for (const problema of problemas) {
        expect(problema.motivo).not.toMatch(
          /null|undefined|NaN|constraint|entity|buffer/i,
        );
      }
    });
  });

  describe('lo que no es un problema', () => {
    it('una definición ausente, porque la columna es opcional', () => {
      const { validas, problemas } = leerYValidar(
        'code,display,definition\nZZ-001,Uno,\n',
      );

      expect(problemas).toHaveLength(0);
      expect(validas[0]?.valores.definition).toBe('');
    });

    it('un código con espacios al costado: se recortan antes de decidir', () => {
      const { validas, problemas } = leerYValidar(
        'code,display\n"  ZZ-001  ","  Uno  "\n',
      );

      expect(problemas).toHaveLength(0);
      expect(validas[0]?.valores).toEqual({ code: 'ZZ-001', display: 'Uno' });
    });

    it('un texto de exactamente 255 caracteres, que es el límite', () => {
      const { problemas } = leerYValidar(
        `code,display\nZZ-001,${'x'.repeat(255)}\n`,
      );

      expect(problemas).toHaveLength(0);
    });
  });

  it('una celda con espacios no cuenta como celda con contenido', () => {
    const { problemas } = leerYValidar('code,display\n"   ",Uno\n');

    expect(problemas).toEqual([
      { fila: 2, columna: 'code', motivo: '«code» está vacía' },
    ]);
  });

  it('un carácter que la base no puede guardar es problema de esa fila', () => {
    const resultado = validarFilas(
      [
        { numero: 2, valores: { code: 'ZZ-001', display: 'Uno' } },
        { numero: 3, valores: { code: 'ZZ-002', display: 'Con\u0000NUL' } },
      ],
      CONCEPTOS,
    );

    expect(resultado.validas).toHaveLength(1);
    expect(resultado.problemas).toEqual([
      {
        fila: 3,
        columna: 'display',
        motivo: '«display» tiene un carácter que no se puede guardar',
      },
    ]);
  });
});
