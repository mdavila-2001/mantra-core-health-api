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
    const verification = {
      applyVerified: fn().mockResolvedValue({ action: 'granted' }),
      applyRevoked: fn().mockResolvedValue({ revoked: 1 }),
    };
    const service = new IdentityVerificationEffectsService(
      authorizationsRepo as never,
      practitionersRepo as never,
      tenantsRepo as never,
      verification as never,
      logger as never,
    );
    return {
      service,
      tx,
      authorizationsRepo,
      practitionersRepo,
      tenantsRepo,
      verification,
    };
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

/**
 * P13 · el sello del perfil público sale de la verificación real.
 *
 * Antes de P13 `community.verified_badges` no tenía ningún camino de
 * escritura: un profesional podía pasar la verificación de matrícula y **no
 * ganar el sello**, mientras que un perfil sin verificar nada podía lucirlo si
 * alguien metía la fila a mano. Estas pruebas son las que impiden que el puente
 * se corte sin que nadie se entere.
 */
describe('IdentityVerificationEffectsService · sello público (P13)', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /** Igual que el `build` de arriba, pero exponiendo el doble de community. */
  function build() {
    const tx = {};
    const authorizationsRepo = { findById: fn().mockResolvedValue(null) };
    const practitionersRepo = { findById: fn().mockResolvedValue(null) };
    const tenantsRepo = { findById: fn().mockResolvedValue(null) };
    const verification = {
      applyVerified: fn().mockResolvedValue({ action: 'granted' }),
      applyRevoked: fn().mockResolvedValue({ revoked: 1 }),
    };
    const service = new IdentityVerificationEffectsService(
      authorizationsRepo as never,
      practitionersRepo as never,
      tenantsRepo as never,
      verification as never,
      logger as never,
    );
    return {
      service,
      tx,
      authorizationsRepo,
      practitionersRepo,
      tenantsRepo,
      verification,
    };
  }

  it('una matrícula verificada emite el sello del profesional', async () => {
    const d = build();
    d.authorizationsRepo.findById.mockResolvedValue({
      id: 'auth-1',
      practitionerProfileId: 'prof-1',
      validTo: new Date('2027-01-01T00:00:00Z'),
    });

    await d.service.applyVerified(
      d.tx as never,
      {
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
        subjectEntityId: 'auth-1',
      } as never,
      ACTOR,
    );

    const [[, outcome]] = d.verification.applyVerified.mock.calls;
    expect(outcome.targetId).toBe('prof-1');
    // El sello no puede durar más que la habilitación que lo respalda.
    expect(outcome.validTo).toEqual(new Date('2027-01-01T00:00:00Z'));
  });

  it('una institución verificada emite su sello', async () => {
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue({
      id: 'tenant-1',
      statusConceptId: DIR.TENANT_PENDING,
    });

    await d.service.applyVerified(
      d.tx as never,
      {
        subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
        subjectEntityId: 'tenant-1',
      } as never,
      ACTOR,
    );

    const [[, outcome]] = d.verification.applyVerified.mock.calls;
    expect(outcome.targetId).toBe('tenant-1');
  });

  it('la identidad de una persona no emite sello de matrícula', async () => {
    const d = build();

    await d.service.applyVerified(
      d.tx as never,
      {
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId: 'p-1',
      } as never,
      ACTOR,
    );

    // Un sello que dice «matrícula verificada» sobre un paciente sería peor
    // que la ausencia del sello.
    expect(d.verification.applyVerified).not.toHaveBeenCalled();
  });

  describe('applyRevoked', () => {
    it('una matrícula revocada hace caer el sello del profesional', async () => {
      const d = build();
      d.authorizationsRepo.findById.mockResolvedValue({
        id: 'auth-1',
        practitionerProfileId: 'prof-1',
      });

      await d.service.applyRevoked(
        d.tx as never,
        {
          id: 'caso-1',
          subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
          subjectEntityId: 'auth-1',
        } as never,
        ACTOR,
        'REVOKED',
      );

      expect(d.verification.applyRevoked).toHaveBeenCalledWith(
        d.tx,
        'prof-1',
        ACTOR,
        'REVOKED',
      );
    });

    it('un caso vencido baja el sello como VENCIDO, no como revocado', async () => {
      const d = build();

      await d.service.applyRevoked(
        d.tx as never,
        {
          id: 'caso-1',
          subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
          subjectEntityId: 'tenant-1',
        } as never,
        ACTOR,
        'EXPIRED',
      );

      // «La autoridad retiró el respaldo» y «hay que renovar» no significan lo
      // mismo, y la pantalla los muestra distinto.
      expect(d.verification.applyRevoked).toHaveBeenCalledWith(
        d.tx,
        'tenant-1',
        ACTOR,
        'EXPIRED',
      );
    });

    it('un caso de otro tipo no toca ningún sello', async () => {
      const d = build();

      await d.service.applyRevoked(
        d.tx as never,
        {
          id: 'caso-1',
          subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
          subjectEntityId: 'p-1',
        } as never,
        ACTOR,
      );

      expect(d.verification.applyRevoked).not.toHaveBeenCalled();
    });

    it('una matrícula que ya no existe no revienta el cierre del caso', async () => {
      const d = build();
      d.authorizationsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.applyRevoked(
          d.tx as never,
          {
            id: 'caso-1',
            subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
            subjectEntityId: 'auth-x',
          } as never,
          ACTOR,
        ),
      ).resolves.toBeUndefined();
      expect(d.verification.applyRevoked).not.toHaveBeenCalled();
    });
  });
});
