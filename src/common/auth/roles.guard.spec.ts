import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from './authenticated-user.interface';

/** Contexto de ejecución HTTP mínimo con el usuario ya autenticado. */
function contextFor(user: AuthenticatedUser, resolvedTenantId?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, resolvedTenantId }),
    }),
    getHandler: () => fn(),
    getClass: () => fn(),
  } as never;
}

function build(required: string[] | undefined) {
  const reflector = { getAllAndOverride: fn(() => required) };
  const guard = new RolesGuard(reflector as never);
  return { guard };
}

describe('RolesGuard', () => {
  it('deja pasar cuando el handler no declara roles', () => {
    const { guard } = build(undefined);
    expect(
      guard.canActivate(
        contextFor({ id: 'u1', roles: [] } as AuthenticatedUser),
      ),
    ).toBe(true);
  });

  it('SUPERADMIN pasa cualquier chequeo de rol', () => {
    const { guard } = build(['STORAGE_ADMIN']);
    expect(
      guard.canActivate(
        contextFor({
          id: 'u1',
          roles: ['SUPERADMIN'],
        } as AuthenticatedUser),
      ),
    ).toBe(true);
  });

  it('un rol sin entrada en scopedRoles autoriza en cualquier tenant (excepción global)', () => {
    const { guard } = build(['SECURITY_ADMIN']);
    const actor: AuthenticatedUser = { id: 'u1', roles: ['SECURITY_ADMIN'] };
    expect(guard.canActivate(contextFor(actor, 'tenant-A'))).toBe(true);
    expect(guard.canActivate(contextFor(actor, 'tenant-B'))).toBe(true);
    expect(guard.canActivate(contextFor(actor, undefined))).toBe(true);
  });

  // MCH-001: el defecto en sí. Antes de este guard, un rol de negocio con
  // ámbito de tenant se comportaba igual que uno global.
  describe('rol con ámbito de tenant (MCH-001)', () => {
    const actor: AuthenticatedUser = {
      id: 'u1',
      roles: ['STORAGE_ADMIN'],
      scopedRoles: { 'tenant-A': ['STORAGE_ADMIN'] },
    };

    it('autoriza en el tenant donde el rol fue concedido', () => {
      const { guard } = build(['STORAGE_ADMIN']);
      expect(guard.canActivate(contextFor(actor, 'tenant-A'))).toBe(true);
    });

    it('deniega en un tenant donde el actor sólo tiene membresía ordinaria', () => {
      const { guard } = build(['STORAGE_ADMIN']);
      expect(() => guard.canActivate(contextFor(actor, 'tenant-B'))).toThrow(
        ForbiddenException,
      );
    });

    it('deniega sin tenant resuelto (barrido de sistema no hereda el rol)', () => {
      const { guard } = build(['STORAGE_ADMIN']);
      expect(() => guard.canActivate(contextFor(actor, undefined))).toThrow(
        ForbiddenException,
      );
    });

    it('retirar el rol (fuera de scopedRoles y de roles) deja de autorizar', () => {
      const { guard } = build(['STORAGE_ADMIN']);
      const sinRol: AuthenticatedUser = { id: 'u1', roles: [] };
      expect(() => guard.canActivate(contextFor(sinRol, 'tenant-A'))).toThrow(
        ForbiddenException,
      );
    });
  });
});
