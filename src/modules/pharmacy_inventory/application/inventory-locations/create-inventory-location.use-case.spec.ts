import { jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { CreateInventoryLocationUseCase } from './create-inventory-location.use-case';

describe('CreateInventoryLocationUseCase', () => {
  it('creates an active shelf with ambient storage and flushes the transaction', async () => {
    const tx = { flush: jest.fn(async () => undefined) };
    const em = {
      transactional: jest.fn(async (work: (tx: any) => unknown) => work(tx)),
    };
    const locations = {
      create: jest.fn(() => ({ id: 'location-1' })),
    };
    const logger = { info: jest.fn() };
    const useCase = new CreateInventoryLocationUseCase(
      em as any,
      locations as any,
      logger as any,
    );

    await expect(
      useCase.execute(
        'site-1',
        {
          code: 'SHELF-1',
          name: 'Estante 1',
          parentLocationId: 'parent-1',
          controlledAccess: true,
        } as any,
        { id: 'user-1' } as any,
      ),
    ).resolves.toEqual({ id: 'location-1' });
    expect(locations.create).toHaveBeenCalledWith(tx, {
      pharmacySiteId: 'site-1',
      parentLocationId: 'parent-1',
      code: 'SHELF-1',
      name: 'Estante 1',
      locationTypeConceptId: PINV.LOCATION_TYPE_SHELF,
      temperatureZoneConceptId: PINV.TEMPERATURE_ZONE_AMBIENT,
      controlledAccess: true,
      statusConceptId: PINV.LOCATION_ACTIVE,
      actorUserId: 'user-1',
    });
    expect(tx.flush).toHaveBeenCalledTimes(1);
  });
});
