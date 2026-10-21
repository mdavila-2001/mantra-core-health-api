import type { AuthenticatedUser } from '../../common';
import { myInvoicesScope, operatingScope } from './billing-simulated.access';

const user = (over: Partial<AuthenticatedUser>): AuthenticatedUser => ({
  id: 'u1',
  roles: [],
  ...over,
});

describe('billing-simulated.access', () => {
  it('SUPERADMIN opera sin acotar tenants', () => {
    expect(operatingScope(user({ roles: ['SUPERADMIN'] }))).toEqual({
      kind: 'admin',
      tenantIds: null,
    });
  });

  it('la administración queda acotada a sus tenants (y a ninguno si no tiene)', () => {
    expect(
      operatingScope(user({ roles: ['SECURITY_ADMIN'], tenantIds: ['t1'] })),
    ).toEqual({
      kind: 'admin',
      tenantIds: ['t1'],
    });
    expect(operatingScope(user({ roles: ['BILLING'] }))).toEqual({
      kind: 'admin',
      tenantIds: [],
    });
  });

  it('el médico sólo opera con perfil profesional', () => {
    expect(
      operatingScope(
        user({ roles: ['PRACTITIONER'], practitionerProfileId: 'h1' }),
      ),
    ).toEqual({
      kind: 'practitioner',
      practitionerProfileId: 'h1',
    });
    expect(operatingScope(user({ roles: ['PRACTITIONER'] }))).toBeNull();
  });

  it('el paciente no opera cobros: sólo ve las facturas que recibió', () => {
    const p = user({ roles: ['PATIENT'], patientProfileId: 'p1' });
    expect(operatingScope(p)).toBeNull();
    expect(myInvoicesScope(p)).toEqual({
      view: 'RECEIVED',
      patientProfileId: 'p1',
    });
  });

  it('una cuenta sin rol de facturación ni paciente ve «emitidas» vacío', () => {
    expect(myInvoicesScope(user({ roles: ['USER'] }))).toEqual({
      view: 'ISSUED',
      scope: null,
    });
  });

  it('el médico ve las emitidas de su alcance', () => {
    const r = myInvoicesScope(
      user({ roles: ['CLINICIAN'], practitionerProfileId: 'h1' }),
    );
    expect(r).toEqual({
      view: 'ISSUED',
      scope: { kind: 'practitioner', practitionerProfileId: 'h1' },
    });
  });
});
