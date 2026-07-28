import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageOperationsController } from './storage-operations.controller';

const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const operationsService = {
    recordHealthCheck: mockFn(),
    defineIntegrityPolicy: mockFn(),
    verifyIntegrity: mockFn(),
  };
  return {
    controller: new StorageOperationsController(operationsService as any),
    operationsService,
  };
}

describe('StorageOperationsController', () => {
  it('delegates the health check (UC-54-11)', async () => {
    const d = build();
    const dto = { storageBackendRegionId: ID, status: 'HEALTHY' } as any;
    d.operationsService.recordHealthCheck.mockResolvedValue({ id: ID });

    await d.controller.recordHealthCheck(dto);

    expect(d.operationsService.recordHealthCheck).toHaveBeenCalledWith(dto);
  });

  it('delegates the integrity policy (UC-54-13)', async () => {
    const d = build();
    const dto = { datasetDefinitionId: ID } as any;
    d.operationsService.defineIntegrityPolicy.mockResolvedValue({ id: ID });

    await d.controller.defineIntegrityPolicy(dto);

    expect(d.operationsService.defineIntegrityPolicy).toHaveBeenCalledWith(dto);
  });

  it('delegates the verification with the dataset id (UC-54-13)', async () => {
    const d = build();
    const dto = { placementId: ID } as any;
    d.operationsService.verifyIntegrity.mockResolvedValue({ matched: true });

    await d.controller.verifyIntegrity(ID, dto);

    expect(d.operationsService.verifyIntegrity).toHaveBeenCalledWith(ID, dto);
  });
});
