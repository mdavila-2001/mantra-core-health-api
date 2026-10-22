import {
  CsvParser,
  NdjsonParser,
  XlsxParser,
  type FormatoDeArchivo,
} from '../import';
import { READER_IMPORT } from './import-parsers.provider';

describe('LECTOR_DE_IMPORTACION', () => {
  describe('parseadorDe', () => {
    it('devuelve el parseador de cada formato registrado', () => {
      expect(READER_IMPORT.parseadorDe('csv')).toBeInstanceOf(CsvParser);
      expect(READER_IMPORT.parseadorDe('ndjson')).toBeInstanceOf(NdjsonParser);
      expect(READER_IMPORT.parseadorDe('xlsx')).toBeInstanceOf(XlsxParser);
    });

    it('cubre todos los formatos que el contrato declara', () => {
      // Esta es la prueba que se rompe sola el día que alguien sume un formato
      // al contrato y se olvide de registrar quién lo lee: sin ella, ese hueco
      // recién aparecería con un archivo real en la mano.
      const declared: readonly FormatoDeArchivo[] = ['ndjson', 'csv', 'xlsx'];

      for (const format of declared) {
        expect(READER_IMPORT.parseadorDe(format)).toBeDefined();
      }
    });

    it('no inventa un parseador para un formato que no está registrado', () => {
      // La búsqueda es por el `formato` que cada parseador declara: pedir uno
      // que nadie declaró tiene que devolver nada, no el primero de la lista.
      expect(
        READER_IMPORT.parseadorDe('parquet' as FormatoDeArchivo),
      ).toBeUndefined();
    });
  });

  describe('perfil', () => {
    it('devuelve el perfil de conceptos con sus columnas', () => {
      const profile = READER_IMPORT.perfil('conceptos');

      expect(profile?.id).toBe('conceptos');
      expect(profile?.columnas.map((column) => column.nombre)).toEqual([
        'code',
        'display',
        'definition',
      ]);
    });

    it('no devuelve nada para un perfil que no existe', () => {
      expect(READER_IMPORT.perfil('designaciones')).toBeUndefined();
    });

    it('no confunde una propiedad heredada con un perfil', () => {
      // El perfil se pide por un identificador que llega desde afuera: sin la
      // comprobación de propiedad propia, pedir «constructor» devolvería una
      // función en vez de nada.
      expect(READER_IMPORT.perfil('constructor')).toBeUndefined();
      expect(READER_IMPORT.perfil('toString')).toBeUndefined();
    });
  });

  describe('detectarFormato', () => {
    it('es la misma decisión por contenido que usa todo el importador', () => {
      expect(
        READER_IMPORT.detectarFormato(
          Buffer.from('code,display\nZZ-001,Uno\n', 'utf8'),
        ),
      ).toBe('csv');
    });
  });
});
