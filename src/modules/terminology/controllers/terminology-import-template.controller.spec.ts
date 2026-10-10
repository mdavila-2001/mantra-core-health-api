import { describe, expect, it, jest } from '@jest/globals';

import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { READER_IMPORT } from '../services/import-parsers.provider';
import { ImportTemplateService } from '../services/import-template.service';
import { TerminologyImportTemplateController } from './terminology-import-template.controller';

describe('TerminologyImportTemplateController', () => {
  /** El controlador con el generador real: la plantilla es su contrato. */
  function build() {
    const controller = new TerminologyImportTemplateController(
      new ImportTemplateService(READER_IMPORT),
    );
    const headers: Record<string, string> = {};
    const response = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
    };
    return { controller, response, cabeceras: headers };
  }

  it('descarga la plantilla con su tipo y su nombre de archivo', () => {
    const { controller, response, cabeceras: headers } = build();

    const file = controller.descargarPlantilla(
      { profile: 'conceptos', format: 'csv' },
      response as never,
    );

    expect(headers['Content-Type']).toBe('text/csv; charset=utf-8');
    expect(headers['Content-Disposition']).toBe(
      'attachment; filename="plantilla-conceptos.csv"',
    );
    expect(file.getStream()).toBeDefined();
  });

  it('sin decir nada descarga la de conceptos en CSV', () => {
    // Es lo que se carga casi siempre; pedirlo explícito no debería ser
    // requisito para bajar la plantilla.
    const { controller, response, cabeceras: headers } = build();

    controller.descargarPlantilla({}, response as never);

    expect(headers['Content-Disposition']).toContain(
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
