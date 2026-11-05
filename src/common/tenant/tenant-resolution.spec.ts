import type { Request } from 'express';
import {
  hasPrivilegedTenantRole,
  resolveOrdinaryTenantId,
  resolveRequestTenantId,
} from './tenant-resolution';
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

describe('resolveOrdinaryTenantId · el paciente y la organización que declara', () => {
  const declaring = (tenantId: string): Request =>
    ({ headers: { 'x-tenant-id': tenantId } }) as unknown as Request;
  const patient = user({ roles: ['PATIENT'], tenantIds: ['tenant-default'] });

  it('sin la marca de la ruta, una organización ajena sigue siendo 403', () => {
    expect(() =>
      resolveOrdinaryTenantId(declaring('tenant-otra'), patient),
    ).toThrow('El actor no pertenece al tenant indicado en X-Tenant-Id');
  });

  it('con la marca, un paciente agenda en una organización de la que no es miembro', () => {
    expect(
      resolveOrdinaryTenantId(declaring('tenant-otra'), patient, {
        patientAnyTenant: true,
      }),
    ).toBe('tenant-otra');
  });

  it('con la marca, lo mismo vale para el camino general de resolución', () => {
    expect(
      resolveRequestTenantId(declaring('tenant-otra'), patient, {
        patientAnyTenant: true,
      }),
    ).toBe('tenant-otra');
  });

  it('con la marca, quien no es paciente sigue necesitando membresía', () => {
    const staff = user({
      roles: ['PRACTITIONER'],
      tenantIds: ['tenant-default'],
    });
    expect(() =>
      resolveOrdinaryTenantId(declaring('tenant-otra'), staff, {
        patientAnyTenant: true,
      }),
    ).toThrow('El actor no pertenece al tenant indicado en X-Tenant-Id');
  });

  it('con la marca, sin cabecera se resuelve como siempre (su única membresía)', () => {
    expect(
      resolveOrdinaryTenantId({ headers: {} } as unknown as Request, patient, {
        patientAnyTenant: true,
      }),
    ).toBe('tenant-default');
  });
});
