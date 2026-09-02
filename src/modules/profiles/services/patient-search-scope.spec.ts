import { PreconditionFailedException, runWithTenant } from '../../../common';
import { resolvePatientSearchScope } from './patient-search-scope';

function actor(roles: readonly string[]) {
  return { id: 'u-1', roles: [...roles] } as any;
}

describe('resolvePatientSearchScope', () => {
  it('SECURITY_ADMIN ve el padrón sin acotar', () => {
    expect(resolvePatientSearchScope(actor(['SECURITY_ADMIN']))).toEqual({
      kind: 'unrestricted',
    });
  });

  it('SUPERADMIN ve el padrón sin acotar', () => {
    expect(resolvePatientSearchScope(actor(['SUPERADMIN']))).toEqual({
      kind: 'unrestricted',
    });
  });

  it('PRACTITIONER queda acotado a la actividad de su tenant', () => {
    const scope = runWithTenant('tenant-1', () =>
      resolvePatientSearchScope(actor(['PRACTITIONER'])),
    );
    expect(scope).toEqual({ kind: 'tenant-activity', tenantId: 'tenant-1' });
  });

  it('CLINICIAN queda acotado a la actividad de su tenant', () => {
    const scope = runWithTenant('tenant-2', () =>
      resolvePatientSearchScope(actor(['CLINICIAN'])),
    );
    expect(scope).toEqual({ kind: 'tenant-activity', tenantId: 'tenant-2' });
  });

  /**
   * Sin tenant en contexto no hay un alcance «por omisión» que devolver: eso
   * sería exactamente el descuido —un padrón sin acotar— que esta política
   * existe para evitar.
   */
  it('sin tenant en contexto, falla explícito en vez de no acotar', () => {
    expect(() => resolvePatientSearchScope(actor(['PRACTITIONER']))).toThrow(
      PreconditionFailedException,
    );
  });
});
