import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CreateInventoryLocationUseCase } from '../application/inventory-locations/create-inventory-location.use-case';
import { InventoryLocationsService } from '../application/inventory-locations/inventory-locations.service';
import { allowAllScope } from '../application/scope/pharmacy-inventory-scope.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const locationsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const createLocation = new CreateInventoryLocationUseCase(
    em as any,
    locationsRepo as any,
    allowAllScope(),
    logger as any,
  );
  const service = new InventoryLocationsService(createLocation, logger as any);
  return { service, tx, locationsRepo };
}

describe('InventoryLocationsService', () => {
  it('creates an active inventory location (bootstrap)', async () => {
    const d = build();
    d.locationsRepo.create.mockReturnValue({ id: 'loc1' });
    const res = await d.service.create(
      'site1',
      { code: 'A1', name: 'Shelf A1' },
      actor,
    );
    expect(res).toEqual({ id: 'loc1' });
    expect(d.locationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ pharmacySiteId: 'site1', code: 'A1' }),
    );
  });
});
