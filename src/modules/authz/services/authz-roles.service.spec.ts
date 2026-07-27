import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzRolesService } from './authz-roles.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const rolesRepo = {
    findByCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const rolePermsRepo = {
    revokeAllForRole: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const permissionsRepo = { findById: mockFn() };
  const fieldPermsRepo = { findOneByKey: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzRolesService(
    em as any,
    rolesRepo,
    rolePermsRepo as any,
    permissionsRepo as any,
    fieldPermsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    rolesRepo,
    rolePermsRepo,
    permissionsRepo,
    fieldPermsRepo,
  };
}

describe('AuthzRolesService', () => {
  describe('createRole (UC-06-03)', () => {
    it('creates a role when the code is free', async () => {
      const d = build();
      d.rolesRepo.findByCode.mockResolvedValue(null);
      d.rolesRepo.create.mockReturnValue({
        id: 'role-1',
        code: 'NURSE',
        createdAt: new Date(),
      });
      const res = await d.service.createRole(
        { code: 'NURSE', name: 'Nurse' },
        actor,
      );
      expect(res.id).toBe('role-1');
      expect(res.permissionCount).toBe(0);
    });

    it('rejects a duplicated role code', async () => {
      const d = build();
      d.rolesRepo.findByCode.mockResolvedValue({ id: 'role-x' });
      await expect(
        d.service.createRole({ code: 'NURSE', name: 'Nurse' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the parent role does not exist', async () => {
      const d = build();
      d.rolesRepo.findByCode.mockResolvedValue(null);
      d.rolesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createRole(
          { code: 'NURSE', name: 'Nurse', parentRoleId: 'missing' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('setPermissions (UC-06-03)', () => {
    it('replaces bindings after validating permissions exist', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        code: 'NURSE',
        createdAt: new Date(),
      });
      d.permissionsRepo.findById.mockResolvedValue({ id: 'perm-1' });
      const res = await d.service.setPermissions(
        'role-1',
        { permissions: [{ permissionId: 'perm-1', effect: 'ALLOW' }] } as any,
        actor,
      );
      expect(d.rolePermsRepo.revokeAllForRole).toHaveBeenCalledWith(
        d.tx,
        'role-1',
      );
      expect(d.rolePermsRepo.create).toHaveBeenCalledTimes(1);
      expect(res.permissionCount).toBe(1);
    });

    it('throws when the role is missing', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.setPermissions(
          'missing',
          { permissions: [{ permissionId: 'p', effect: 'ALLOW' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('throws when a permission does not exist', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        code: 'NURSE',
        createdAt: new Date(),
      });
      d.permissionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.setPermissions(
          'role-1',
          { permissions: [{ permissionId: 'nope', effect: 'ALLOW' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('setFieldPermissions (UC-06-08)', () => {
    it('upserts field rules', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({ id: 'role-1' });
      d.fieldPermsRepo.findOneByKey.mockResolvedValue(null);
      const res = await d.service.setFieldPermissions(
        'role-1',
        {
          fields: [
            {
              entity: 'patient',
              columnName: 'ssn',
              canRead: true,
              canWrite: false,
              maskStrategy: 'REDACT',
            },
          ],
        } as any,
        actor,
      );
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(d.fieldPermsRepo.create).toHaveBeenCalled();
    });

    it('rejects canWrite=true without canRead (check)', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({ id: 'role-1' });
      await expect(
        d.service.setFieldPermissions(
          'role-1',
          {
            fields: [
              {
                entity: 'patient',
                columnName: 'ssn',
                canRead: false,
                canWrite: true,
              },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
