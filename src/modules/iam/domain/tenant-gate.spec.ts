import { everyTenantDenied, withoutTenants } from './tenant-gate';

describe('tenant-gate', () => {
  const authority = {
    roles: ['USER', 'SECURITY_ADMIN', 'NURSE', 'DOCTOR'],
    scopedRoles: { A: ['SECURITY_ADMIN', 'NURSE'], B: ['DOCTOR'] },
    tenants: ['A', 'B', 'C'],
  };

  it('quita la organización de tenants y de scopedRoles', () => {
    const out = withoutTenants(authority, ['A']);
    expect(out.tenants).toEqual(['B', 'C']);
    expect(out.scopedRoles).toEqual({ B: ['DOCTOR'] });
  });

  it('un rol que solo regía en la organización quitada sale de roles: si no, pasaría a ser global', () => {
    const out = withoutTenants(authority, ['A']);
    expect(out.roles).toEqual(['USER', 'DOCTOR']);
  });

  it('un rol que sigue con ámbito en otra organización se conserva', () => {
    const out = withoutTenants(
      {
        roles: ['NURSE'],
        scopedRoles: { A: ['NURSE'], B: ['NURSE'] },
        tenants: ['A', 'B'],
      },
      ['A'],
    );
    expect(out.roles).toEqual(['NURSE']);
    expect(out.scopedRoles).toEqual({ B: ['NURSE'] });
  });

  it('un rol global que nunca tuvo ámbito no se toca', () => {
    expect(withoutTenants(authority, ['A', 'B', 'C']).roles).toEqual(['USER']);
  });

  it('sin organizaciones que quitar devuelve lo mismo', () => {
    expect(withoutTenants(authority, [])).toEqual({
      roles: authority.roles,
      scopedRoles: authority.scopedRoles,
      tenants: authority.tenants,
    });
  });

  describe('everyTenantDenied', () => {
    it('solo si hay organizaciones y todas niegan', () => {
      expect(everyTenantDenied(['A'], { A: 'OUTSIDE_ALLOWED_HOURS' })).toBe(
        true,
      );
      expect(
        everyTenantDenied(['A', 'B'], { A: 'OUTSIDE_ALLOWED_HOURS' }),
      ).toBe(false);
      expect(everyTenantDenied([], {})).toBe(false);
    });
  });
});
