import {
  ROLE_ALIAS_GROUPS,
  expandRoleAliases,
  roleEquivalents,
} from './role-aliases';
import { roleAuthorizesInTenant } from './roles.guard';
import { hasPlatformScope } from '../tenant/platform-scope';
import type { AuthenticatedUser } from './authenticated-user.interface';

const usuario = (
  roles: string[],
  scopedRoles?: Record<string, string[]>,
): AuthenticatedUser => ({ id: 'u1', roles, scopedRoles }) as AuthenticatedUser;
const T1 = '00000000-0000-4000-8000-0000000000a1';

describe('alias de roles (decisión X-6)', () => {
  it('GOVERNANCE_ADMIN y DATA_GOVERNANCE_ADMIN son equivalentes; el resto no tiene alias', () => {
    expect(ROLE_ALIAS_GROUPS).toEqual([
      ['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'],
    ]);
    expect(roleEquivalents('DATA_GOVERNANCE_ADMIN')).toContain(
      'GOVERNANCE_ADMIN',
    );
    expect(roleEquivalents('DPO')).toEqual(['DPO']);
    expect(expandRoleAliases(['GOVERNANCE_ADMIN', 'DPO'])).toEqual([
      'GOVERNANCE_ADMIN',
      'DATA_GOVERNANCE_ADMIN',
      'DPO',
    ]);
  });

  it.each([
    ['GOVERNANCE_ADMIN', 'DATA_GOVERNANCE_ADMIN'],
    ['DATA_GOVERNANCE_ADMIN', 'GOVERNANCE_ADMIN'],
  ])('quien tiene %s autoriza una ruta que exige %s', (tiene, exige) => {
    expect(roleAuthorizesInTenant(usuario([tiene]), exige, undefined)).toBe(
      true,
    );
  });

  it('un rol ajeno no pasa por alias', () => {
    for (const ajeno of ['DATA_PLATFORM_ADMIN', 'DPO', 'SECURITY_ADMIN'])
      expect(
        roleAuthorizesInTenant(
          usuario([ajeno]),
          'DATA_GOVERNANCE_ADMIN',
          undefined,
        ),
      ).toBe(false);
    expect(
      roleAuthorizesInTenant(usuario([]), 'GOVERNANCE_ADMIN', undefined),
    ).toBe(false);
  });

  it('el ámbito de tenant de cada código se respeta (acotado a T1 no es global)', () => {
    const acotado = usuario(['DATA_GOVERNANCE_ADMIN'], {
      [T1]: ['DATA_GOVERNANCE_ADMIN'],
    });
    expect(roleAuthorizesInTenant(acotado, 'GOVERNANCE_ADMIN', undefined)).toBe(
      false,
    );
    expect(roleAuthorizesInTenant(acotado, 'GOVERNANCE_ADMIN', T1)).toBe(true);
  });

  it('el alcance plataforma lo da cualquiera de los dos nombres, si la ruta acepta el rol', () => {
    expect(hasPlatformScope(usuario(['DATA_GOVERNANCE_ADMIN']))).toBe(true);
    expect(
      hasPlatformScope(usuario(['DATA_GOVERNANCE_ADMIN']), [
        'GOVERNANCE_ADMIN',
      ]),
    ).toBe(true);
    expect(
      hasPlatformScope(usuario(['GOVERNANCE_ADMIN']), [
        'DATA_GOVERNANCE_ADMIN',
      ]),
    ).toBe(true);
    expect(hasPlatformScope(usuario(['DATA_GOVERNANCE_ADMIN']), ['DPO'])).toBe(
      false,
    );
  });
});
