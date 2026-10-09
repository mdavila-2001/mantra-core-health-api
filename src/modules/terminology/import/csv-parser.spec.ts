import { CsvParser } from './csv-parser';
import { IMPORT_PROFILES } from './import-profiles';

const CONCEPTS = IMPORT_PROFILES.conceptos;

/** Parsea un CSV escrito como texto, con el perfil de conceptos. */
function parse(csv: string) {
  return new CsvParser().parse(Buffer.from(csv, 'utf8'), CONCEPTS);
}

/** Arma el fixture `ok-50`: cincuenta conceptos sintéticos bien formados. */
function ok50(): string {
  const rows = Array.from({ length: 50 }, (_, index) => {
    const numero = String(index + 1).padStart(3, '0');
    return `ZZ-${numero},Ejemplo ${numero},Definición del ejemplo ${numero}`;
  });
  return ['code,display,definition', ...rows].join('\n') + '\n';
}

describe('CsvParser', () => {
  it('declara su formato', () => {
    expect(new CsvParser().formato).toBe('csv');
  });

  describe('archivo bien formado', () => {
    it('lee las cincuenta filas y no encuentra problemas', () => {
      const result = parse(ok50());

      expect(result.filas).toHaveLength(50);
      expect(result.problemas).toHaveLength(0);
    });

    it('numera la primera fila de datos como 2, porque el encabezado es la 1', () => {
      const result = parse(ok50());

      expect(result.filas[0]?.numero).toBe(2);
      expect(result.filas[0]?.valores).toEqual({
        code: 'ZZ-001',
        display: 'Ejemplo 001',
        definition: 'Definición del ejemplo 001',
      });
      expect(result.filas[49]?.numero).toBe(51);
    });
  });

  describe('variantes que producen las planillas reales', () => {
    it('tolera la marca de orden de bytes que escribe Excel', () => {
      const result = parse(
        '﻿code,display\nZZ-001,Uno\nZZ-002,Dos\nZZ-003,Tres\n',
      );

      expect(result.filas).toHaveLength(3);
      expect(result.problemas).toHaveLength(0);
      expect(result.filas[0]?.valores.code).toBe('ZZ-001');
    });

    it('detecta el punto y coma como separador', () => {
      const result = parse(
        'code;display\nZZ-001;Uno\nZZ-002;Dos\nZZ-003;Tres\n',
      );

      expect(result.filas).toHaveLength(3);
      expect(result.problemas).toHaveLength(0);
      expect(result.filas[1]?.valores.display).toBe('Dos');
    });

    it('conserva tildes, eñes y emoji tal como vinieron', () => {
      const result = parse(
        'code,display\nZZ-001,Año pequeño\nZZ-002,Cirugía\nZZ-003,Señal 🩺\n',
      );

      expect(result.filas.map((row) => row.valores.display)).toEqual([
        'Año pequeño',
        'Cirugía',
        'Señal 🩺',
      ]);
    });

    it('respeta comas, comillas y saltos de línea dentro de una celda', () => {
      const result = parse(
        'code,display,definition\n' +
          'ZZ-001,Uno,"Con una coma, una ""comilla"" y\nun salto"\n' +
          'ZZ-002,Dos,Simple\n' +
          'ZZ-003,Tres,Simple\n',
      );

      expect(result.filas).toHaveLength(3);
      expect(result.filas[0]?.valores.definition).toBe(
        'Con una coma, una "comilla" y\nun salto',
      );
    });

    it('una celda de varios renglones sigue siendo una sola fila lógica', () => {
      const result = parse(
        'code,display,definition\n' +
          'ZZ-001,Uno,"primer\nsegundo\ntercer renglón"\n' +
          'ZZ-002,Dos,Simple\n',
      );

      expect(result.filas[1]?.numero).toBe(3);
    });

    it('ignora las filas vacías del final', () => {
      const result = parse(
        'code,display\nZZ-001,Uno\nZZ-002,Dos\nZZ-003,Tres\n\n\n',
      );

      expect(result.filas).toHaveLength(3);
      expect(result.problemas).toHaveLength(0);
    });
  });

  describe('resolución de columnas', () => {
    it('acepta las columnas en cualquier orden', () => {
      const result = parse(
        'definition,display,code\nUna definición,Uno,ZZ-001\n',
      );

      expect(result.filas[0]?.valores).toEqual({
        code: 'ZZ-001',
        display: 'Uno',
        definition: 'Una definición',
      });
    });

    it('acepta los encabezados en castellano del perfil', () => {
      const result = parse(
        'Código;Nombre;Descripción\nZZ-001;Uno;Una definición\n',
      );

      expect(result.problemas).toHaveLength(0);
      expect(result.filas[0]?.valores).toEqual({
        code: 'ZZ-001',
        display: 'Uno',
        definition: 'Una definición',
      });
    });

    it('señala la columna que sobra, sin descartar las filas', () => {
      const result = parse(
        'code,display,extra\nZZ-001,Uno,x\nZZ-002,Dos,y\nZZ-003,Tres,z\n',
      );

      expect(result.filas).toHaveLength(3);
      expect(result.problemas).toEqual([
        {
          fila: 1,
          columna: 'extra',
          motivo: 'la columna «extra» no se reconoce',
        },
      ]);
    });

    it('un encabezado que no se reconoce en absoluto corta la lectura en la fila 1', () => {
      const result = parse('uno,dos,tres\na,b,c\nd,e,f\n');

      expect(result.filas).toHaveLength(0);
      expect(result.problemas).toHaveLength(1);
      expect(result.problemas[0]?.fila).toBe(1);
    });

    it('un archivo con sólo el encabezado no es un problema de lectura', () => {
      const result = parse('code,display,definition\n');

      expect(result.filas).toHaveLength(0);
      expect(result.problemas).toHaveLength(0);
    });
  });

  it('las filas que después fallarán la validación se leen sin problemas', () => {
    // El parseador no valida: una celda vacía o demasiado larga es una fila
    // leída, y quien decide si sirve es el validador del servicio.
    const result = parse(
      'code,display\nZZ-001,\n,Sin código\nZZ-003,' + 'x'.repeat(256) + '\n',
    );

    expect(result.filas).toHaveLength(3);
    expect(result.problemas).toHaveLength(0);
  });
});
