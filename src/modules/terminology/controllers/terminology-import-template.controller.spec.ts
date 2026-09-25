import { describe, expect, it, jest } from '@jest/globals';

import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { LECTOR_DE_IMPORTACION } from '../services/import-parsers.provider';
import { ImportTemplateService } from '../services/import-template.service';
import { TerminologyImportTemplateController } from './terminology-import-template.controller';

describe('TerminologyImportTemplateController', () => {
  /** El controlador con el generador real: la plantilla es su contrato. */
  function armar() {
    const controller = new TerminologyImportTemplateController(
      new ImportTemplateService(LECTOR_DE_IMPORTACION),
    );
    const cabeceras: Record<string, string> = {};
    const response = {
      setHeader: jest.fn((nombre: string, valor: string) => {
        cabeceras[nombre] = valor;
      }),
    };
    return { controller, response, cabeceras };
  }

  it('descarga la plantilla con su tipo y su nombre de archivo', () => {
    const { controller, response, cabeceras } = armar();

    const archivo = controller.descargarPlantilla(
      { profile: 'conceptos', format: 'csv' },
      response as never,
    );

    expect(cabeceras['Content-Type']).toBe('text/csv; charset=utf-8');
    expect(cabeceras['Content-Disposition']).toBe(
      'attachment; filename="plantilla-conceptos.csv"',
    );
    expect(archivo.getStream()).toBeDefined();
  });

  it('sin decir nada descarga la de conceptos en CSV', () => {
    // Es lo que se carga casi siempre; pedirlo explícito no debería ser
    // requisito para bajar la plantilla.
    const { controller, response, cabeceras } = armar();

    controller.descargarPlantilla({}, response as never);

    expect(cabeceras['Content-Disposition']).toContain(
      'plantilla-conceptos.csv',
    );
  });

  it('la descarga es del administrador de seguridad, como la importación', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      Object.getOwnPropertyDescriptor(
        TerminologyImportTemplateController.prototype,
        'descargarPlantilla',
      )?.value as object,
    ) as unknown;

    expect(roles).toEqual(['SECURITY_ADMIN']);
  });
});
