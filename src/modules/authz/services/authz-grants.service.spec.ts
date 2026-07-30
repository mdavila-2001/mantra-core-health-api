import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzGrantsService } from './authz-grants.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const rolesRepo = { findById: mockFn() };
  const assignmentsRepo = { findActive: mockFn(), create: mockFn() };
  const permissionsRepo = { findById: mockFn() };
  const permGrantsRepo = { findActive: mockFn(), create: mockFn() };
  const resourceGrantsRepo = { findExisting: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzGrantsService(
    em as any,
    rolesRepo as any,
    assignmentsRepo as any,
    permissionsRepo as any,
    permGrantsRepo as any,
    resourceGrantsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    rolesRepo,
    assignmentsRepo,
    permissionsRepo,
    permGrantsRepo,
    resourceGrantsRepo,
  };
}

describe('AuthzGrantsService', () => {
  describe('assignRole (UC-06-04)', () => {
    it('assigns an assignable role', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        isAssignable: true,
      });
      d.assignmentsRepo.findActive.mockResolvedValue(null);
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a-1',
        createdAt: new Date(),
      });
      const res = await d.service.assignRole(
        'user-1',
        { roleId: 'role-1' },
        actor,
      );
      expect(res.id).toBe('a-1');
    });

    it('rejects a non-assignable role', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        isAssignable: false,
      });
      await expect(
        d.service.assignRole('user-1', { roleId: 'role-1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects invalid validity window', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        isAssignable: true,
      });
      await expect(
        d.service.assignRole(
          'user-1',
          {
            roleId: 'role-1',
            validFrom: new Date('2026-02-01'),
            validTo: new Date('2026-01-01'),
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated active assignment', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'role-1',
        isAssignable: true,
      });
      d.assignmentsRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.assignRole('user-1', { roleId: 'role-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the role is missing', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.assignRole('user-1', { roleId: 'missing' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('grantPermission (UC-06-05)', () => {
    it('grants a user permission exception', async () => {
      const d = build();
      d.permissionsRepo.findById.mockResolvedValue({ id: 'perm-1' });
      d.permGrantsRepo.findActive.mockResolvedValue(null);
      d.permGrantsRepo.create.mockReturnValue({
        id: 'g-1',
        createdAt: new Date(),
      });
      const res = await d.service.grantPermission(
        'user-1',
        {
          permissionId: 'perm-1',
          effect: 'ALLOW',
          reason: 'temp coverage',
        } as any,
        actor,
      );
      expect(res.id).toBe('g-1');
    });

    it('rejects a duplicated active grant', async () => {
      const d = build();
      d.permissionsRepo.findById.mockResolvedValue({ id: 'perm-1' });
      d.permGrantsRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.grantPermission(
          'user-1',
          { permissionId: 'perm-1', effect: 'DENY', reason: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('grantResourceScope (UC-06-09)', () => {
    it('creates a polymorphic grant', async () => {
      const d = build();
      d.permissionsRepo.findById.mockResolvedValue({ id: 'perm-1' });
      d.resourceGrantsRepo.findExisting.mockResolvedValue(null);
      d.resourceGrantsRepo.create.mockReturnValue({
        id: 'rsg-1',
        createdAt: new Date(),
      });
      const res = await d.service.grantResourceScope(
        {
          subjectType: 'USER',
          subjectId: 'user-1',
          permissionId: 'perm-1',
          resourceType: 'PATIENT',
          resourceId: 'pat-1',
          effect: 'ALLOW',
        } as any,
        actor,
      );
      expect(res.id).toBe('rsg-1');
    });

    it('rejects a duplicated grant', async () => {
      const d = build();
      d.permissionsRepo.findById.mockResolvedValue({ id: 'perm-1' });
      d.resourceGrantsRepo.findExisting.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.grantResourceScope(
          {
            subjectType: 'USER',
            subjectId: 'user-1',
            permissionId: 'perm-1',
            resourceType: 'PATIENT',
            resourceId: 'pat-1',
            effect: 'ALLOW',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
