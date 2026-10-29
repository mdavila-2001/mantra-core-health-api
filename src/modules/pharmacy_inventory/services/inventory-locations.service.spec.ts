import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { runWithTenant } from '../../../common';
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
  // Sin espacio ni unidad el alta es la de siempre: el punto de stock no se resuelve.
  const access = {
    practiceSiteOf: mockFn().mockResolvedValue('practice-site-1'),
    assertCanManage: mockFn().mockResolvedValue(undefined),
    resolve: mockFn().mockResolvedValue({
      careSpaceId: null,
      clinicalUnitId: null,
    }),
  };
  const events = { located: mockFn(), relocated: mockFn() };
  const createLocation = new CreateInventoryLocationUseCase(
    em as any,
    locationsRepo as any,
    allowAllScope(),
    logger as any,
    access as any,
    events as any,
  );
  const service = new InventoryLocationsService(
    createLocation,
    logger as any,
    {} as any,
    {} as any,
  );
  return { service, tx, locationsRepo, access, events };
}

describe('InventoryLocationsService', () => {
  it('creates an active inventory location (bootstrap)', async () => {
    const d = build();
    d.locationsRepo.create.mockReturnValue({ id: 'loc1' });
    const res = await runWithTenant('tenant-1', () =>
      d.service.create('site1', { code: 'A1', name: 'Shelf A1' }, actor),
    );
    expect(res).toEqual({ id: 'loc1' });
    expect(d.locationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ pharmacySiteId: 'site1', code: 'A1' }),
    );
  });
});
