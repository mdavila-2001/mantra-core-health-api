import { jest } from '@jest/globals';
import { PROF } from '../../profiles.concepts';
import { PractitionerVerificationProjector } from './practitioner-verification-projector.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

function build(practitioner: Record<string, any> | null) {
  const practitionersRepo = { findById: fn().mockResolvedValue(practitioner) };
  const accountLinksRepo = {
    findActiveByPerson: fn().mockResolvedValue({ userId: 'u-doctor' }),
  };
  const verification = {
    grant: fn().mockResolvedValue(undefined),
    revoke: fn().mockResolvedValue(undefined),
  };
  const practitionerContext = {
    ensurePractitionerRole: fn().mockResolvedValue(true),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new PractitionerVerificationProjector(
    practitionersRepo as never,
    accountLinksRepo as never,
    verification as never,
    practitionerContext as never,
    logger as never,
  );
  return {
    service,
    practitionersRepo,
    accountLinksRepo,
    verification,
    practitionerContext,
    logger,
  };
}

const TX = {} as never;
const pending = () => ({
  verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
  practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
  acceptsNewPatients: false,
  updatedAt: new Date(),
});

describe('PractitionerVerificationProjector (único escritor de PRACT_VERIF_*)', () => {
  it('projectVerified habilita al profesional, le da el rol y emite el sello CON vencimiento', async () => {
    const p = pending();
    const d = build(p);
    const validTo = new Date('2027-05-02T03:59:59.999Z');
    const result = await d.service.projectVerified(
      TX,
      'prac-1',
      'u-app',
      'adm-1',
      validTo,
    );
    expect(p).toMatchObject({
      verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
      practiceStatusConceptId: PROF.PRACTICE_ACTIVE,
      acceptsNewPatients: true,
      updatedByUserId: 'u-app',
    });
    expect(d.practitionerContext.ensurePractitionerRole).toHaveBeenCalledWith(
      TX,
      'u-doctor',
      'u-app',
    );
    expect(d.verification.grant).toHaveBeenCalledWith(TX, {
      practitionerProfileId: 'prac-1',
      actorUserId: 'u-app',
      evidenceRef: 'admission:adm-1',
      validTo,
    });
    expect(result).toEqual({ projected: true, roleGranted: true });
  });

  it('un sello nunca nace sin vencimiento: el parámetro es obligatorio', async () => {
    const d = build(pending());
    await d.service.projectVerified(
      TX,
      'prac-1',
      'u',
      'adm-1',
      new Date('2027-01-01T00:00:00Z'),
    );
    expect(d.verification.grant.mock.calls[0][1].validTo).toBeInstanceOf(Date);
  });

  it('si el rol asistencial no se puede conceder, no rompe una verificación correcta pero lo avisa', async () => {
    const d = build(pending());
    d.practitionerContext.ensurePractitionerRole.mockResolvedValue(false);
    const result = await d.service.projectVerified(
      TX,
      'prac-1',
      'u',
      'adm-1',
      new Date(),
    );
    expect(result.roleGranted).toBe(false);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('sin cuenta vinculada se verifica igual (no hay a quién darle el rol)', async () => {
    const d = build(pending());
    d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);
    await d.service.projectVerified(TX, 'prac-1', 'u', 'adm-1', new Date());
    expect(d.practitionerContext.ensurePractitionerRole).not.toHaveBeenCalled();
    expect(d.verification.grant).toHaveBeenCalled();
  });

  it('un perfil inexistente no proyecta nada ni emite sello', async () => {
    const d = build(null);
    expect(
      await d.service.projectVerified(TX, 'x', 'u', 'adm-1', new Date()),
    ).toEqual({
      projected: false,
      roleGranted: false,
    });
    expect(d.verification.grant).not.toHaveBeenCalled();
  });

  it('projectNotVerified baja a pendiente, cierra la agenda a pacientes nuevos y revoca el sello', async () => {
    const p = {
      ...pending(),
      verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
      acceptsNewPatients: true,
    };
    const d = build(p);
    await d.service.projectNotVerified(TX, 'prac-1', 'u-app');
    expect(p).toMatchObject({
      verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
      acceptsNewPatients: false,
    });
    expect(d.verification.revoke).toHaveBeenCalledWith(
      TX,
      'prac-1',
      'u-app',
      'REVOKED',
    );
  });

  it('por vencimiento el sello cae como EXPIRED, no como revocado', async () => {
    const d = build({
      ...pending(),
      verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
    });
    await d.service.projectNotVerified(TX, 'prac-1', 'sys', 'EXPIRED');
    expect(d.verification.revoke).toHaveBeenCalledWith(
      TX,
      'prac-1',
      'sys',
      'EXPIRED',
    );
  });

  it('proyectar «no verificado» sobre quien nunca estuvo verificado no inventa cambios', async () => {
    const p = pending();
    const before = { ...p };
    const d = build(p);
    await d.service.projectNotVerified(TX, 'prac-1', 'u');
    expect(p).toEqual(before);
  });
});
