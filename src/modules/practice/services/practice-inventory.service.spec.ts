import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeInventoryService } from './practice-inventory.service';
import { PRAC } from '../practice.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Mock de `PracticesRepository.findById`. Las prácticas de prueba son del tenant
 * activo (`TENANT_A`) salvo que la propia práctica declare otro `tenantId`; sin
 * configurar, resuelve una práctica del tenant activo (la dueña de los hijos).
 *
 * @returns Un `jest.fn` cuyo `mockResolvedValue` sella el tenant de la práctica.
 */
function practiceLookupMock(): any {
  const lookup = mockFn();
  const resolve = lookup.mockResolvedValue.bind(lookup);
  const stamp = (row: any) =>
    row && typeof row === 'object' && row.tenantId === undefined
      ? Object.assign(row, { tenantId: TENANT_A })
      : row;
  lookup.mockResolvedValue = (row: any) => resolve(stamp(row));
  resolve(stamp({ id: 'p1' }));
  return lookup;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: practiceLookupMock() };
  const itemsRepo = { findById: mockFn(), create: mockFn() };
  const movementsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeInventoryService(
    em as any,
    practicesRepo as any,
    itemsRepo,
    movementsRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    practicesRepo,
    itemsRepo,
    movementsRepo,
  };
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

/** Aserciones del 404 uniforme de PRAC-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(
    PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('PracticeInventoryService · alcance de tenant (PRAC-01)', () => {
  it('dar de alta un insumo en la práctica de otro tenant: 404 uniforme y no persiste', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_B,
    });

    await expectOutOfScope(
      d.service.createItem('p1', { name: 'Gasas' } as any, actor),
      'Práctica no encontrada',
    );

    expect(d.itemsRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('mover el stock del insumo de otro tenant: 404 uniforme, igual que inexistente; las cantidades de B no cambian', async () => {
    const d = build();
    const item: any = {
      id: 'i1',
      practiceId: 'p-de-b',
      statusConceptId: PRAC.INVENTORY_ACTIVE,
      quantityOnHand: '10',
    };
    d.itemsRepo.findById.mockResolvedValue(item);
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p-de-b',
      tenantId: TENANT_B,
    });
    const foreign = await expectOutOfScope(
      d.service.recordMovement(
        'i1',
        { direction: 'OUT' as const, quantity: 4 } as any,
        actor,
      ),
      'Insumo de inventario no encontrado',
    );
    d.itemsRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.recordMovement(
        'i1',
        { direction: 'OUT' as const, quantity: 4 } as any,
        actor,
      ),
      'Insumo de inventario no encontrado',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(item.quantityOnHand).toBe('10');
    expect(d.movementsRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('el insumo propio sí se mueve', async () => {
    const d = build();
    const item: any = {
      id: 'i1',
      practiceId: 'p1',
      statusConceptId: PRAC.INVENTORY_ACTIVE,
      quantityOnHand: '10',
    };
    d.itemsRepo.findById.mockResolvedValue(item);
    d.movementsRepo.create.mockReturnValue({
      id: 'm1',
      inventoryItemId: 'i1',
      recordedAt: new Date(),
    });

    await d.service.recordMovement(
      'i1',
      { direction: 'OUT' as const, quantity: 4 } as any,
      actor,
    );

    expect(item.quantityOnHand).toBe('6');
  });

  it('sin tenant en el contexto no se mueve stock', async () => {
    const d = build();

    await expect(
      d.raw.recordMovement(
        'i1',
        { direction: 'IN' as const, quantity: 1 } as any,
        actor,
      ),
    ).rejects.toThrow();
    expect(d.itemsRepo.findById).not.toHaveBeenCalled();
  });
});
