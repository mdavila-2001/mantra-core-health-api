import { hasPrivilegedTenantRole } from './tenant-resolution';
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
