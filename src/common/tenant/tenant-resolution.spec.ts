import {
  hasPrivilegedTenantRole,
  resolveOrdinaryTenantId,
} from './tenant-resolution';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

const user = (over: Partial<AuthenticatedUser>): AuthenticatedUser => ({
  id: 'u1',
  roles: [],
  ...over,
});

describe('hasPrivilegedTenantRole', () => {
  it.each(['SUPERADMIN', 'SYSTEM'])(
    '%s global (sin scopedRoles) es de plataforma',
    (role) => {
      expect(hasPrivilegedTenantRole(user({ roles: [role] }))).toBe(true);
    },
  );

  it.each(['SUPERADMIN', 'SYSTEM'])(
    '%s concedido sólo dentro de un tenant no es de plataforma',
    (role) => {
      expect(
        hasPrivilegedTenantRole(
          user({ roles: [role], scopedRoles: { 'tenant-1': [role] } }),
        ),
      ).toBe(false);
    },
  );

  it('un rol de negocio no se vuelve de plataforma por tener alcance global', () => {
    expect(hasPrivilegedTenantRole(user({ roles: ['SECURITY_ADMIN'] }))).toBe(
      false,
    );
  });

  it('un scopedRoles con otros códigos no quita el rol global', () => {
    expect(
      hasPrivilegedTenantRole(
        user({
          roles: ['SYSTEM', 'CLINICIAN'],
          scopedRoles: { 'tenant-1': ['CLINICIAN'] },
        }),
      ),
    ).toBe(true);
  });
});

describe('N2: X-Tenant-Id de una organización que niega por su política', () => {
  const req = (tenantId?: string) =>
    ({
      headers: tenantId ? { 'x-tenant-id': tenantId } : {},
    }) as unknown as Request;
  const body = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      return e as { getResponse: () => any; getStatus: () => number };
    }
    throw new Error('no lanzó');
  };

  it.each([
    'OUTSIDE_ALLOWED_HOURS',
    'OUTSIDE_ALLOWED_NETWORK',
    'IDLE_TIMEOUT',
    'MFA_REQUIRED',
    'MFA_ENROLLMENT_REQUIRED',
  ])(
    'con X denegada por %s responde 403 con ese motivo estable y details.tenantId',
    (reason) => {
      const u = user({
        tenantIds: ['Y'],
        deniedTenants: { X: reason },
      });
      const err = body(() => resolveOrdinaryTenantId(req('X'), u));
      expect(err.getStatus()).toBe(403);
      expect(err.getResponse()).toMatchObject({
        code: 'FORBIDDEN',
        reason,
        details: { tenantId: 'X', reason },
      });
    },
  );

  it('las demás organizaciones de la persona siguen disponibles', () => {
    const u = user({
      tenantIds: ['Y'],
      deniedTenants: { X: 'OUTSIDE_ALLOWED_HOURS' },
    });
    expect(resolveOrdinaryTenantId(req('Y'), u)).toBe('Y');
    // Sin cabecera, la única organización viva es la activa.
    expect(resolveOrdinaryTenantId(req(), u)).toBe('Y');
  });

  it('sin cabecera y sin organizaciones vivas, la única denegada explica el rechazo (no «no pertenece a ninguna»)', () => {
    const u = user({
      tenantIds: [],
      deniedTenants: { X: 'MFA_ENROLLMENT_REQUIRED' },
    });
    const err = body(() => resolveOrdinaryTenantId(req(), u));
    expect(err.getResponse()).toMatchObject({
      reason: 'MFA_ENROLLMENT_REQUIRED',
      details: { tenantId: 'X' },
    });
  });

  it('una organización ajena que no figura ni como membresía ni como denegada sigue siendo TENANT_MEMBERSHIP_REQUIRED', () => {
    const u = user({
      tenantIds: ['Y'],
      deniedTenants: { X: 'OUTSIDE_ALLOWED_HOURS' },
    });
    expect(
      body(() => resolveOrdinaryTenantId(req('Z'), u)).getResponse(),
    ).toMatchObject({ reason: 'TENANT_MEMBERSHIP_REQUIRED' });
  });

  it('un motivo desconocido en el claim no se refleja: cae a TENANT_MEMBERSHIP_REQUIRED', () => {
    const u = user({ tenantIds: ['Y'], deniedTenants: { X: 'ALGO_RARO' } });
    expect(
      body(() => resolveOrdinaryTenantId(req('X'), u)).getResponse(),
    ).toMatchObject({ reason: 'TENANT_MEMBERSHIP_REQUIRED' });
  });

  it('con varias organizaciones vivas y sin cabecera sigue siendo ambiguo', () => {
    const u = user({
      tenantIds: ['Y', 'W'],
      deniedTenants: { X: 'OUTSIDE_ALLOWED_HOURS' },
    });
    expect(
      body(() => resolveOrdinaryTenantId(req(), u)).getResponse(),
    ).toMatchObject({ reason: 'TENANT_AMBIGUOUS' });
  });
});
