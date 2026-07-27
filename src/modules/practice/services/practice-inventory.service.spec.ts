import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeInventoryService } from './practice-inventory.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const itemsRepo = { findById: mockFn(), create: mockFn() };
  const movementsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeInventoryService(
    em as any,
    itemsRepo,
    movementsRepo,
    logger as any,
  );
  return { service, tx, itemsRepo, movementsRepo };
}

describe('PracticeInventoryService', () => {
  describe('createItem (UC-14-10)', () => {
    it('creates an item with zero stock', async () => {
      const d = build();
      const created = {
        id: 'it1',
        practiceId: 'p1',
        name: 'Gauze',
        quantityOnHand: '0',
        statusConceptId: PRAC.INVENTORY_ACTIVE,
        createdAt: new Date(),
      };
      d.itemsRepo.create.mockReturnValue(created);
      const res = await d.service.createItem('p1', { name: 'Gauze' }, actor);
      expect(res.quantityOnHand).toBe('0');
      expect(d.itemsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          quantityOnHand: '0',
          statusConceptId: PRAC.INVENTORY_ACTIVE,
        }),
      );
    });
  });

  describe('recordMovement (UC-14-11)', () => {
    it('throws when the item is missing', async () => {
      const d = build();
      d.itemsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordMovement(
          'it1',
          { direction: 'IN', quantity: 5 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects an OUT movement with insufficient stock', async () => {
      const d = build();
      d.itemsRepo.findById.mockResolvedValue({
        id: 'it1',
        statusConceptId: PRAC.INVENTORY_ACTIVE,
        quantityOnHand: '2',
        updatedAt: new Date(),
      });
      await expect(
        d.service.recordMovement(
          'it1',
          { direction: 'OUT', quantity: 5 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('increments stock on an IN movement', async () => {
      const d = build();
      const item = {
        id: 'it1',
        statusConceptId: PRAC.INVENTORY_ACTIVE,
        quantityOnHand: '2',
        reorderLevel: null,
        updatedAt: new Date(),
      };
      d.itemsRepo.findById.mockResolvedValue(item);
      d.movementsRepo.create.mockReturnValue({
        id: 'mv1',
        inventoryItemId: 'it1',
        recordedAt: new Date(),
      });
      const res = await d.service.recordMovement(
        'it1',
        { direction: 'IN', quantity: 3 } as any,
        actor,
      );
      expect(item.quantityOnHand).toBe('5');
      expect(res.quantityOnHand).toBe('5');
      expect(d.movementsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          movementTypeConceptId: PRAC.MOVEMENT_IN,
          quantity: '3',
        }),
      );
    });

    it('decrements stock on an OUT movement', async () => {
      const d = build();
      const item = {
        id: 'it1',
        statusConceptId: PRAC.INVENTORY_ACTIVE,
        quantityOnHand: '10',
        reorderLevel: null,
        updatedAt: new Date(),
      };
      d.itemsRepo.findById.mockResolvedValue(item);
      d.movementsRepo.create.mockReturnValue({
        id: 'mv1',
        inventoryItemId: 'it1',
        recordedAt: new Date(),
      });
      await d.service.recordMovement(
        'it1',
        { direction: 'OUT', quantity: 4 } as any,
        actor,
      );
      expect(item.quantityOnHand).toBe('6');
    });
  });
});
