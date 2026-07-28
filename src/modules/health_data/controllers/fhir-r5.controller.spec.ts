import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FhirR5Controller } from './fhir-r5.controller';

const actor = { id: 'user-1', roles: ['HEALTH_DATA_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const releaseService = { exportBundle: mockFn(), serveEverything: mockFn() };
  return {
    controller: new FhirR5Controller(releaseService as any),
    releaseService,
  };
}

describe('FhirR5Controller', () => {
  it('delegates the bundle export (UC-52-12)', async () => {
    const d = build();
    const dto = { contentHash: 'h', recordCount: '1' } as any;
    d.releaseService.exportBundle.mockResolvedValue({ id: ID });

    await d.controller.exportBundle(dto, actor);

    expect(d.releaseService.exportBundle).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates $everything with the patient id and the custodian (UC-52-13)', async () => {
    const d = build();
    d.releaseService.serveEverything.mockResolvedValue({
      patientProfileId: ID,
    });

    await d.controller.serveEverything(ID, actor, TENANT);

    expect(d.releaseService.serveEverything).toHaveBeenCalledWith(
      ID,
      TENANT,
      actor,
    );
  });

  it('serves $everything without a custodian filter', async () => {
    const d = build();
    d.releaseService.serveEverything.mockResolvedValue({
      patientProfileId: ID,
    });

    await d.controller.serveEverything(ID, actor);

    expect(d.releaseService.serveEverything).toHaveBeenCalledWith(
      ID,
      undefined,
      actor,
    );
  });
});
