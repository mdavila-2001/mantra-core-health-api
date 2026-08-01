import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IdentityVerificationEffectsService } from './identity-verification-effects.service';
import { CONCEPTS } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { DIR } from '../../directory/directory.concepts';
import { IDA } from '../identity_assurance.concepts';

const ACTOR = 'system-worker';

describe('IdentityVerificationEffectsService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = {};
    const authorizationsRepo = { findById: fn().mockResolvedValue(null) };
    const practitionersRepo = { findById: fn().mockResolvedValue(null) };
    const tenantsRepo = { findById: fn().mockResolvedValue(null) };
    const service = new IdentityVerificationEffectsService(
      authorizationsRepo as never,
      practitionersRepo as never,
      tenantsRepo as never,
      logger as never,
    );
    return { service, tx, authorizationsRepo, practitionersRepo, tenantsRepo };
  }

  /** Caso verificado del tipo de sujeto indicado. */
  function verifiedCase(subjectTypeConceptId: string, subjectEntityId: string) {
    return { subjectTypeConceptId, subjectEntityId } as never;
  }

  it('activates the license and its practitioner when a medical license is verified', async () => {
    const d = build();
    const authorization = {
      id: 'auth-1',
      practitionerProfileId: 'prac-1',
      stateConceptId: PROF.AUTH_PENDING,
      updatedAt: new Date(),
    };
    const practitioner = {
      verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
      practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
      updatedAt: new Date(),
    };
    d.authorizationsRepo.findById.mockResolvedValue(authorization);
    d.practitionersRepo.findById.mockResolvedValue(practitioner);

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_PRACTITIONER_LICENSE, 'auth-1'),
      ACTOR,
    );

    expect(authorization.stateConceptId).toBe(PROF.AUTH_ACTIVE);
    expect(practitioner.verificationStatusConceptId).toBe(
      PROF.PRACT_VERIF_VERIFIED,
    );
    expect(practitioner.practiceStatusConceptId).toBe(PROF.PRACTICE_ACTIVE);
  });

  it('marks a pending institution as verified and active', async () => {
    const d = build();
    const tenant = {
      statusConceptId: DIR.TENANT_PENDING,
      verificationStatusConceptId: CONCEPTS.TENANT_UNVERIFIED,
      updatedAt: new Date(),
    };
    d.tenantsRepo.findById.mockResolvedValue(tenant);

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_TENANT_IDENTITY, 'tenant-1'),
      ACTOR,
    );

    expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_VERIFIED);
    expect(tenant.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
  });

  it('verifies an already-operating institution without reactivating it', async () => {
    const d = build();
    const tenant = {
      // Un tenant suspendido no debe volver a activo sólo porque se verificó
      // su documentación: son dos decisiones distintas.
      statusConceptId: DIR.TENANT_SUSPENDED,
      verificationStatusConceptId: CONCEPTS.TENANT_UNVERIFIED,
      updatedAt: new Date(),
    };
    d.tenantsRepo.findById.mockResolvedValue(tenant);

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_TENANT_IDENTITY, 'tenant-1'),
      ACTOR,
    );

    expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_VERIFIED);
    expect(tenant.statusConceptId).toBe(DIR.TENANT_SUSPENDED);
  });

  it('has no domain effect for a person identity (the assertion is the effect)', async () => {
    const d = build();

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_PATIENT_IDENTITY, 'person-1'),
      ACTOR,
    );

    expect(d.authorizationsRepo.findById).not.toHaveBeenCalled();
    expect(d.tenantsRepo.findById).not.toHaveBeenCalled();
  });

  it('warns instead of failing when the subject no longer exists', async () => {
    const d = build();
    d.authorizationsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.applyVerified(
        d.tx as never,
        verifiedCase(IDA.SUBJECT_PRACTITIONER_LICENSE, 'auth-gone'),
        ACTOR,
      ),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
