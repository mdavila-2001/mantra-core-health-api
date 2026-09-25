import { detectarFormato } from './format-detector';
import { FormatoNoAdmitidoError } from './row-contract';

/**
 * Arma un ZIP mínimo: la firma, el nombre de una entrada y relleno.
 *
 * No hace falta que sea un ZIP válido —el detector no lo descomprime— sino que
 * tenga la firma y el nombre de entrada donde un ZIP real los pone.
 */
function zipCon(nombreDeEntrada: string): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from([0x14, 0x00, 0x00, 0x00, 0x08, 0x00]),
    Buffer.from(nombreDeEntrada, 'latin1'),
    Buffer.from([0x9a, 0x3f, 0x01, 0xc7]),
  ]);
}

describe('detectarFormato', () => {
  describe('reconoce los tres formatos por su contenido', () => {
    it('una planilla, por la firma del comprimido y su libro', () => {
      expect(detectarFormato(zipCon('xl/workbook.xml'))).toBe('xlsx');
    });

    it('NDJSON, porque la primera línea con contenido es un objeto', () => {
      const archivo = Buffer.from(
        '{"code":"ZZ-001","display":"Ejemplo uno"}\n' +
          '{"code":"ZZ-002","display":"Ejemplo dos"}\n',
      );

      expect(detectarFormato(archivo)).toBe('ndjson');
    });

    it('CSV, por el separador de la primera línea', () => {
      const archivo = Buffer.from(
        'code,display,definition\nZZ-001,Ejemplo uno,Una definición\n',
      );

      expect(detectarFormato(archivo)).toBe('csv');
    });

    it('CSV aunque venga con la marca de orden de bytes que escribe Excel', () => {
      const archivo = Buffer.from('﻿code;display\nZZ-001;Ejemplo uno\n');

      expect(detectarFormato(archivo)).toBe('csv');
    });
  });

  describe('rechaza lo que no es ninguno de los tres, con motivos distintos', () => {
    it('un documento que no es una planilla', () => {
      expect(() => detectarFormato(Buffer.from('%PDF-1.4'))).toThrow(
        FormatoNoAdmitidoError,
      );
    });

    it('un archivo vacío', () => {
      expect(() => detectarFormato(Buffer.alloc(0))).toThrow(
        'el archivo llegó vacío',
      );
    });

    it('un comprimido que no es una planilla', () => {
      expect(() => detectarFormato(zipCon('fotos/vacaciones.jpg'))).toThrow(
        'es un archivo comprimido, pero no una planilla',
      );
    });

    it('texto sin columnas separadas', () => {
      const archivo = Buffer.from('esto es una nota suelta\nsin columnas\n');

      expect(() => detectarFormato(archivo)).toThrow(
        /no tiene columnas separadas/,
      );
    });

    it('cada motivo dice algo distinto', () => {
      const motivos = [
        Buffer.alloc(0),
        zipCon('fotos/vacaciones.jpg'),
        Buffer.from([0x00, 0x01, 0x02, 0x03]),
        Buffer.from('una nota suelta'),
      ].map((archivo) => {
        try {
          detectarFormato(archivo);
          return 'no lanzó';
        } catch (error) {
          return (error as FormatoNoAdmitidoError).motivo;
        }
      });

      expect(new Set(motivos).size).toBe(motivos.length);
    });
  });

  it('decide por contenido, no por extensión: un «.csv» con objetos es NDJSON', () => {
    const archivo = Buffer.from('{"code":"ZZ-001","display":"Ejemplo uno"}\n');

    expect(detectarFormato(archivo)).toBe('ndjson');
  });

  it('un arreglo JSON no es NDJSON: el formato es un objeto por línea', () => {
    const archivo = Buffer.from('[]\n');

    expect(() => detectarFormato(archivo)).toThrow(FormatoNoAdmitidoError);
  });
});
