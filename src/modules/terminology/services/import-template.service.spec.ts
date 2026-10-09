import { ErrorCode } from '../../../common';
import { CsvParser, PERFILES_DE_IMPORTACION } from '../import';
import { LECTOR_IMPORT } from './import-parsers.provider';
import { ImportTemplateService } from './import-template.service';
import { validateRows } from './row-validator';

/**
 * La plantilla es lo primero que toca quien nunca importó nada.
 *
 * Lo que estas pruebas fijan es que no pueda divergir de lo que el importador
 * después acepta: se genera desde el mismo perfil, y la prueba que más importa
 * es la última, que la vuelve a leer con el parseador de verdad.
 */
describe('ImportTemplateService', () => {
  const service = new ImportTemplateService(LECTOR_IMPORT);

  describe('la plantilla de conceptos en CSV', () => {
    it('trae el encabezado canónico y una fila de ejemplo', () => {
      const template = service.generate('conceptos', 'csv');
      const lineas = template.contenido.toString('utf8').trimEnd().split('\n');

      expect(lineas).toHaveLength(2);
      expect(lineas[0]).toBe('code,display,definition');
      expect(lineas[1]).not.toBe('');
    });

    it('se descarga con nombre y con la codificación declarada', () => {
      const template = service.generate('conceptos', 'csv');

      expect(template.nombre).toBe('plantilla-conceptos.csv');
      // Sin declarar la codificación, una planilla abre el archivo con la del
      // sistema y los acentos del ejemplo salen rotos.
      expect(template.tipo).toBe('text/csv; charset=utf-8');
    });

    it('el ejemplo es sintético, no un concepto real', () => {
      // Una plantilla con un código real invita a dejarlo puesto, y ese
      // concepto inventado termina en el catálogo sin que nadie sepa de dónde
      // salió.
      const template = service.generate('conceptos', 'csv');

      expect(template.contenido.toString('utf8')).toContain('ZZ-');
    });

    it('usa los nombres canónicos, no los alias en castellano', () => {
      // Quien use la plantilla tal cual no debería depender de que el
      // importador siga aceptando un alias.
      const template = service.generate('conceptos', 'csv');
      const header = template.contenido.toString('utf8').split('\n')[0];

      expect(header).not.toContain('código');
      expect(header).not.toContain('descripción');
    });
  });

  describe('lo que no se puede generar', () => {
    it('un perfil que no existe se rechaza con su código', () => {
      expect(() => service.generate('inventado', 'csv')).toThrow(
        expect.objectContaining({ code: ErrorCode.IMPORT_PROFILE_UNKNOWN }),
      );
    });

    it('un formato sin generador se rechaza con su código', () => {
      // La planilla se reconoce al importar, pero generarla necesita algo que
      // todavía no está: el rechazo dice eso y no un error genérico.
      expect(() => service.generate('conceptos', 'xlsx')).toThrow(
        expect.objectContaining({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED }),
      );
    });

    it('un formato inventado se rechaza igual', () => {
      expect(() => service.generate('conceptos', 'docx')).toThrow(
        expect.objectContaining({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED }),
      );
    });
  });

  it('lo que genera, el importador lo vuelve a leer sin un solo problema', () => {
    // Es la prueba que sostiene a la plantilla: si alguien cambia una columna
    // del perfil, la plantilla y el importador cambian juntos o esta falla.
    const template = service.generate('conceptos', 'csv');
    const profile = PERFILES_DE_IMPORTACION.conceptos;

    const reading = new CsvParser().parse(template.contenido, profile);
    const validation = validateRows(reading.filas, profile);

    expect(reading.problemas).toEqual([]);
    expect(validation.problemas).toEqual([]);
    expect(validation.validas).toHaveLength(1);
    expect(validation.validas[0]?.numero).toBe(2);
  });
});
