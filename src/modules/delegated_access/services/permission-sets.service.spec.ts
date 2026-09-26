import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PermissionSetsService } from './permission-sets.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { STATUS } from './concept-maps';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const setsRepo = {
    findByCode: mockFn().mockResolvedValue(null),
    findById: mockFn(),
    create: mockFn(),
    findByTenantPage: mockFn().mockResolvedValue([]),
  };
  const itemsRepo = {
    create: mockFn(),
    deleteBySet: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  em.fork = mockFn(() => em);
  const service = new PermissionSetsService(
    em as any,
    setsRepo,
    itemsRepo as any,
    logger as any,
  );
  return { service, tx, em, setsRepo, itemsRepo };
}

const setDto = {
  tenantId: 't1',
  code: 'SET-A',
  name: 'Secretary set',
  items: [
    { permissionId: 'p1' },
    { permissionId: 'p2', requiresStepUpAuthentication: true },
  ],
};

describe('PermissionSetsService', () => {
  describe('createSet (UC-29-02)', () => {
    it('creates the set (v1) and its items, flushing parent before children', async () => {
      const d = build();
      d.setsRepo.create.mockReturnValue({ id: 's1', versionNumber: 1 });
      const res = await d.service.createSet(setDto, actor);
      expect(res).toEqual({ id: 's1', versionNumber: 1, itemCount: 2 });
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
      expect(d.itemsRepo.create).toHaveBeenCalledTimes(2);
    });

    it('rejects a duplicate code within the tenant (conflict)', async () => {
      const d = build();
      d.setsRepo.findByCode.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.createSet(setDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.setsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('publishVersion (UC-29-02)', () => {
    it('throws when the set does not exist', async () => {
      const d = build();
      d.setsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishVersion(
          's1',
          { items: [{ permissionId: 'p1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('increments the version and replaces items all-or-nothing', async () => {
      const d = build();
      const set = {
        id: 's1',
        versionNumber: 1,
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      d.setsRepo.findById.mockResolvedValue(set);
      const res = await d.service.publishVersion(
        's1',
        { items: [{ permissionId: 'p1' }] },
        actor,
      );
      expect(set.versionNumber).toBe(2);
      expect(d.itemsRepo.deleteBySet).toHaveBeenCalledWith(d.tx, 's1');
      expect(res).toEqual({ id: 's1', versionNumber: 2, itemCount: 1 });
    });
  });

  describe('listByTenant (CV-13)', () => {
    it('lists only the sets of the given tenant, one page under the limit', async () => {
      const d = build();
      d.setsRepo.findByTenantPage.mockResolvedValue([
        {
          id: 'set-1',
          code: 'C1',
          name: 'Set 1',
          delegateTypeConceptId: 'dt-1',
          statusConceptId: STATUS.ACTIVE,
          versionNumber: 1,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      const res = await d.service.listByTenant('tenant-a', { limit: 10 });
      expect(d.setsRepo.findByTenantPage).toHaveBeenCalledWith(
        d.em,
        'tenant-a',
        undefined,
        11,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).toBeNull();
    });

    it('returns a cursor when there is one more row than the limit', async () => {
      const d = build();
      const row = (id: string) => ({
        id,
        code: id,
        name: id,
        delegateTypeConceptId: 'dt-1',
        statusConceptId: STATUS.ACTIVE,
        versionNumber: 1,
        createdAt: new Date('2026-01-01'),
      });
      d.setsRepo.findByTenantPage.mockResolvedValue([row('a'), row('b')]);
      const res = await d.service.listByTenant('tenant-a', { limit: 1 });
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });
  });
});
