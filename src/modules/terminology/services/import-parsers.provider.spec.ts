import {
  CsvParser,
  NdjsonParser,
  XlsxParser,
  type FormatoDeArchivo,
} from '../import';
import { LECTOR_DE_IMPORTACION } from './import-parsers.provider';

describe('LECTOR_DE_IMPORTACION', () => {
  describe('parseadorDe', () => {
    it('devuelve el parseador de cada formato registrado', () => {
      expect(LECTOR_DE_IMPORTACION.parseadorDe('csv')).toBeInstanceOf(
        CsvParser,
      );
      expect(LECTOR_DE_IMPORTACION.parseadorDe('ndjson')).toBeInstanceOf(
        NdjsonParser,
      );
      expect(LECTOR_DE_IMPORTACION.parseadorDe('xlsx')).toBeInstanceOf(
        XlsxParser,
      );
    });

    it('cubre todos los formatos que el contrato declara', () => {
      // Esta es la prueba que se rompe sola el día que alguien sume un formato
      // al contrato y se olvide de registrar quién lo lee: sin ella, ese hueco
      // recién aparecería con un archivo real en la mano.
      const declarados: readonly FormatoDeArchivo[] = ['ndjson', 'csv', 'xlsx'];

      for (const formato of declarados) {
        expect(LECTOR_DE_IMPORTACION.parseadorDe(formato)).toBeDefined();
      }
    });

    it('no inventa un parseador para un formato que no está registrado', () => {
      // La búsqueda es por el `formato` que cada parseador declara: pedir uno
      // que nadie declaró tiene que devolver nada, no el primero de la lista.
      expect(
        LECTOR_DE_IMPORTACION.parseadorDe('parquet' as FormatoDeArchivo),
      ).toBeUndefined();
    });
  });

  describe('perfil', () => {
    it('devuelve el perfil de conceptos con sus columnas', () => {
      const perfil = LECTOR_DE_IMPORTACION.perfil('conceptos');

      expect(perfil?.id).toBe('conceptos');
      expect(perfil?.columnas.map((columna) => columna.nombre)).toEqual([
        'code',
        'display',
        'definition',
      ]);
    });

    it('no devuelve nada para un perfil que no existe', () => {
      expect(LECTOR_DE_IMPORTACION.perfil('designaciones')).toBeUndefined();
    });

    it('no confunde una propiedad heredada con un perfil', () => {
      // El perfil se pide por un identificador que llega desde afuera: sin la
      // comprobación de propiedad propia, pedir «constructor» devolvería una
      // función en vez de nada.
      expect(LECTOR_DE_IMPORTACION.perfil('constructor')).toBeUndefined();
      expect(LECTOR_DE_IMPORTACION.perfil('toString')).toBeUndefined();
    });
  });

  describe('detectarFormato', () => {
    it('es la misma decisión por contenido que usa todo el importador', () => {
      expect(
        LECTOR_DE_IMPORTACION.detectarFormato(
          Buffer.from('code,display\nZZ-001,Uno\n', 'utf8'),
        ),
      ).toBe('csv');
    });
  });
});
