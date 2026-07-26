import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { InventoryLocationsService } from './inventory-locations.service';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const locationsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new InventoryLocationsService(em as any, locationsRepo as any, logger as any);
  return { service, tx, locationsRepo };
}

describe('InventoryLocationsService', () => {
  it('creates an active inventory location (bootstrap)', async () => {
    const d = build();
    d.locationsRepo.create.mockReturnValue({ id: 'loc1' });
    const res = await d.service.create('site1', { code: 'A1', name: 'Shelf A1' } as any, actor);
    expect(res).toEqual({ id: 'loc1' });
    expect(d.locationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ pharmacySiteId: 'site1', code: 'A1' }),
    );
  });
});
