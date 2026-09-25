import { CsvParser, NdjsonParser } from '../import';
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
    });

    it('no devuelve nada para un formato que todavía no tiene parseador', () => {
      // El formato de planilla lo reconoce el detector, pero quien lo lee llega
      // por otro lado: hasta que se registre, pedirlo no puede inventar uno.
      expect(LECTOR_DE_IMPORTACION.parseadorDe('xlsx')).toBeUndefined();
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
