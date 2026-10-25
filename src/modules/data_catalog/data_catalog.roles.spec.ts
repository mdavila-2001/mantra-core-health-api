import { clinicalRoleId } from '../authz/authz.seed';
import {
  CATALOG_WRITE_ROLES,
  PORTAL_READ_ROLES,
} from './data_catalog.constants';
import {
  DATA_CATALOG_ROLE_CODES,
  DATA_CATALOG_ROLE_SEED,
} from './data_catalog.roles';

/** Roles del portal que no siembra este módulo: globales de `iam` o del modelo. */
const ROLES_AJENOS = ['SECURITY_ADMIN', 'PLATFORM_ADMIN'];

describe('roles de sistema del centro de datos', () => {
  it('declara los cinco roles globales con ids deterministas', () => {
    expect(DATA_CATALOG_ROLE_CODES).toEqual([
      'GOVERNANCE_ADMIN',
      'DATA_PLATFORM_ADMIN',
      'DPO',
      'AUDITOR',
      'DATA_STEWARD',
    ]);
    for (const rol of DATA_CATALOG_ROLE_SEED) {
      expect(rol.id).toBe(clinicalRoleId(rol.code));
      expect(rol.scope).toBe('GLOBAL');
      expect(rol.baseRole).not.toBe('CLINICAL');
    }
  });

  it('cada rol que exige el portal está sembrado o es de otro origen', () => {
    for (const codigo of [...PORTAL_READ_ROLES, ...CATALOG_WRITE_ROLES])
      if (!ROLES_AJENOS.includes(codigo))
        expect(DATA_CATALOG_ROLE_CODES).toContain(codigo);
  });

  it('quien escribe también lee, y leer no autoriza a escribir', () => {
    for (const codigo of CATALOG_WRITE_ROLES)
      expect(PORTAL_READ_ROLES).toContain(codigo);
    expect(CATALOG_WRITE_ROLES).not.toContain('AUDITOR');
    expect(CATALOG_WRITE_ROLES).not.toContain('DPO');
    expect(PORTAL_READ_ROLES).toContain('AUDITOR');
    expect(PORTAL_READ_ROLES).toContain('DPO');
  });
});
