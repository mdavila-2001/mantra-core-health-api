import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageFinOpsController } from './storage-finops.controller';

const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const operationsService = { consolidateCostSnapshot: mockFn() };
  return {
    controller: new StorageFinOpsController(operationsService as any),
    operationsService,
  };
}

describe('StorageFinOpsController', () => {
  it('delegates the cost consolidation (UC-54-12)', async () => {
    const d = build();
    const dto = {
      storageBackendRegionId: ID,
      estimatedCost: '10.000000',
    } as any;
    d.operationsService.consolidateCostSnapshot.mockResolvedValue({ id: ID });

    await d.controller.consolidateCostSnapshot(dto);

    expect(d.operationsService.consolidateCostSnapshot).toHaveBeenCalledWith(
      dto,
    );
  });
});
