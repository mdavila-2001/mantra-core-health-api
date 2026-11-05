import { roleAuthorizesInTenant } from './roles.guard';
import { hasPlatformScope } from '../tenant/platform-scope';
import type { AuthenticatedUser } from './authenticated-user.interface';
import {
  GOVERNANCE_VIEW_ROLES,
  LEGAL_HOLD_VIEW_ROLES,
} from './governance-read.roles';
import {
  CATALOG_WRITE_ROLES,
  PORTAL_VIEW_ROLES,
} from '../../modules/data_catalog/data_catalog.constants';

const usuario = (roles: string[]): AuthenticatedUser =>
  ({ id: 'u1', roles }) as AuthenticatedUser;

/**
 * Decisión X-6, contrato corregido tras la revisión independiente: `GOVERNANCE_ADMIN` y
 * `DATA_GOVERNANCE_ADMIN` NO son alias globales. El guard sigue comparando nombres exactos; el alias
 * es un opt-in explícito: ambos nombres figuran en las listas de LECTURA de gobierno.
 */
describe('GOVERNANCE_ADMIN y DATA_GOVERNANCE_ADMIN: alias sólo de lectura, explícito', () => {
  it('el guard compara nombres exactos (sin alias global)', () => {
    expect(
      roleAuthorizesInTenant(
        usuario(['GOVERNANCE_ADMIN']),
        'DATA_GOVERNANCE_ADMIN',
        undefined,
      ),
    ).toBe(false);
    expect(
      roleAuthorizesInTenant(
        usuario(['DATA_GOVERNANCE_ADMIN']),
        'GOVERNANCE_ADMIN',
        undefined,
      ),
    ).toBe(false);
    expect(
      roleAuthorizesInTenant(
        usuario(['GOVERNANCE_ADMIN']),
        'GOVERNANCE_ADMIN',
        undefined,
      ),
    ).toBe(true);
  });

  it('el alcance plataforma no se hereda por el otro nombre', () => {
    expect(hasPlatformScope(usuario(['DATA_GOVERNANCE_ADMIN']))).toBe(false);
    expect(
      hasPlatformScope(usuario(['GOVERNANCE_ADMIN']), [
        'DATA_GOVERNANCE_ADMIN',
      ]),
    ).toBe(false);
    expect(
      hasPlatformScope(usuario(['GOVERNANCE_ADMIN']), ['GOVERNANCE_ADMIN']),
    ).toBe(true);
  });

  it.each([
    ['GOVERNANCE_VIEW_ROLES', GOVERNANCE_VIEW_ROLES],
    ['LEGAL_HOLD_VIEW_ROLES', LEGAL_HOLD_VIEW_ROLES],
    ['PORTAL_VIEW_ROLES', PORTAL_VIEW_ROLES],
  ])('%s (lectura) lista los dos nombres', (_n, lista) => {
    expect(lista).toContain('GOVERNANCE_ADMIN');
    expect(lista).toContain('DATA_GOVERNANCE_ADMIN');
  });

  it('las listas de escritura del catálogo NO llevan el nombre de alias', () => {
    expect(CATALOG_WRITE_ROLES).not.toContain('DATA_GOVERNANCE_ADMIN');
  });
});
