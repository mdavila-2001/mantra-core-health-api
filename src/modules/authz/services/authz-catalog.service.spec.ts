import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzCatalogService } from './authz-catalog.service';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const categoriesRepo = { findByCode: mockFn(), findById: mockFn(), create: mockFn() };
  const permissionsRepo = { findByCode: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzCatalogService(
    em as any,
    categoriesRepo as any,
    permissionsRepo as any,
    logger as any,
  );
  return { service, tx, categoriesRepo, permissionsRepo };
}

describe('AuthzCatalogService', () => {
  describe('createCategory (UC-06-01)', () => {
    it('creates the category when the code is free', async () => {
      const d = build();
      d.categoriesRepo.findByCode.mockResolvedValue(null);
      const created = { id: 'cat-1', createdAt: new Date('2026-01-01') };
      d.categoriesRepo.create.mockReturnValue(created);

      const res = await d.service.createCategory({ code: 'CLINICAL', name: 'Clinical' } as any, actor);

      expect(res).toEqual({ id: 'cat-1', status: 'ACTIVE', createdAt: created.createdAt });
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects a duplicated category code', async () => {
      const d = build();
      d.categoriesRepo.findByCode.mockResolvedValue({ id: 'cat-x' });
      await expect(
        d.service.createCategory({ code: 'CLINICAL', name: 'Clinical' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.categoriesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('createPermission (UC-06-01)', () => {
    it('creates the permission mapping action/scope concepts', async () => {
      const d = build();
      d.permissionsRepo.findByCode.mockResolvedValue(null);
      const created = { id: 'perm-1', createdAt: new Date('2026-01-02') };
      d.permissionsRepo.create.mockReturnValue(created);

      const res = await d.service.createPermission(
        { code: 'patient.read', name: 'Read patient', resource: 'patient', action: 'READ' } as any,
        actor,
      );

      expect(res.id).toBe('perm-1');
      const args = d.permissionsRepo.create.mock.calls[0][1];
      expect(args.actionConceptId).toBeDefined();
    });

    it('rejects a duplicated permission code', async () => {
      const d = build();
      d.permissionsRepo.findByCode.mockResolvedValue({ id: 'p-x' });
      await expect(
        d.service.createPermission(
          { code: 'patient.read', name: 'x', resource: 'patient', action: 'READ' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the referenced category does not exist', async () => {
      const d = build();
      d.permissionsRepo.findByCode.mockResolvedValue(null);
      d.categoriesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createPermission(
          {
            code: 'patient.read',
            name: 'x',
            resource: 'patient',
            action: 'READ',
            categoryId: 'cat-missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
