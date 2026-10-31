import type { ExecutionContext } from '@nestjs/common';
import { PlatformAdminScopeGuard } from './platform-admin-scope.guard';

const ctx = (user: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('PlatformAdminScopeGuard', () => {
  const guard = new PlatformAdminScopeGuard();

  it('deja pasar al SECURITY_ADMIN de plataforma (sin scopedRoles)', () => {
    expect(guard.canActivate(ctx({ roles: ['SECURITY_ADMIN'] }))).toBe(true);
  });

  it('deja pasar al SUPERADMIN de plataforma', () => {
    expect(guard.canActivate(ctx({ roles: ['SUPERADMIN'] }))).toBe(true);
  });

  it('rechaza al SECURITY_ADMIN acotado a una organización', () => {
    const user = {
      roles: ['SECURITY_ADMIN'],
      scopedRoles: { 'tenant-1': ['SECURITY_ADMIN'] },
    };
    expect(() => guard.canActivate(ctx(user))).toThrow();
  });

  it('rechaza al SUPERADMIN acotado a una organización', () => {
    const user = {
      roles: ['SUPERADMIN'],
      scopedRoles: { 'tenant-1': ['SUPERADMIN'] },
    };
    expect(() => guard.canActivate(ctx(user))).toThrow();
  });

  it('rechaza a quien no es administrador y a quien no tiene sesión', () => {
    expect(() => guard.canActivate(ctx({ roles: ['PATIENT'] }))).toThrow();
    expect(() => guard.canActivate(ctx(undefined))).toThrow();
  });

  it('un SECURITY_ADMIN global con un rol acotado de OTRO rol sigue siendo de plataforma', () => {
    const user = {
      roles: ['SECURITY_ADMIN', 'BILLING'],
      scopedRoles: { 'tenant-1': ['BILLING'] },
    };
    expect(guard.canActivate(ctx(user))).toBe(true);
  });
});
