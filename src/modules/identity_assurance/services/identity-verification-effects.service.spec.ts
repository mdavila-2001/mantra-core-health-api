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
    const admissions = {
      recordExternalLicenseVerification: fn().mockResolvedValue(true),
    };
    const tenantsRepo = { findById: fn().mockResolvedValue(null) };
    const verification = {
      applyVerified: fn().mockResolvedValue({ action: 'granted' }),
      applyRevoked: fn().mockResolvedValue({ revoked: 1 }),
    };
    // Por defecto el tenant no tiene requisitos para operar (no es farmacia
    // ni laboratorio): `evaluateForTenant` devuelve `undefined`.
    const operatingRequirements = {
      evaluateForTenant: fn().mockResolvedValue(undefined),
    };
    const service = new IdentityVerificationEffectsService(
      authorizationsRepo as never,
      admissions as never,
      tenantsRepo as never,
      verification as never,
      logger as never,
      operatingRequirements as never,
    );
    return {
      service,
      tx,
      authorizationsRepo,
      admissions,
      tenantsRepo,
      verification,
      operatingRequirements,
    };
  }

  /** Caso verificado del tipo de sujeto indicado. */
  function verifiedCase(subjectTypeConceptId: string, subjectEntityId: string) {
    return { subjectTypeConceptId, subjectEntityId } as never;
  }

  it('records a verified medical license in the admission and does NOT verify the practitioner (v4.2.67)', async () => {
    const d = build();
    const authorization = {
      id: 'auth-1',
      practitionerProfileId: 'prac-1',
      stateConceptId: PROF.AUTH_PENDING,
      updatedAt: new Date(),
    };
    d.authorizationsRepo.findById.mockResolvedValue(authorization);

    await d.service.applyVerified(
      d.tx as never,
      {
        id: 'caso-9',
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
        subjectEntityId: 'auth-1',
      } as never,
      ACTOR,
    );

    // La autoridad aporta evidencia; el cierre es de la admisión.
    expect(d.admissions.recordExternalLicenseVerification).toHaveBeenCalledWith(
      d.tx,
      {
        authorizationId: 'auth-1',
        practitionerProfileId: 'prac-1',
        identityCaseId: 'caso-9',
        actorUserId: ACTOR,
      },
    );
    expect(authorization.stateConceptId).toBe(PROF.AUTH_PENDING);
    expect(d.verification.applyVerified).not.toHaveBeenCalled();
  });

  it('only activates the license when the practitioner has no open admission', async () => {
    const d = build();
    const authorization = {
      id: 'auth-1',
      practitionerProfileId: 'prac-1',
      stateConceptId: PROF.AUTH_PENDING,
      updatedAt: new Date(),
    } as Record<string, unknown>;
    d.authorizationsRepo.findById.mockResolvedValue(authorization);
    d.admissions.recordExternalLicenseVerification.mockResolvedValue(false);

    await d.service.applyVerified(
      d.tx as never,
      {
        id: 'caso-9',
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
        subjectEntityId: 'auth-1',
      } as never,
      ACTOR,
    );

    expect(authorization.stateConceptId).toBe(PROF.AUTH_ACTIVE);
    expect(authorization.verifiedByUserId).toBe(ACTOR);
    expect(d.verification.applyVerified).not.toHaveBeenCalled();
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

  it('keeps a pending pharmacy without its papers pending and without badge (P50)', async () => {
    const d = build();
    const tenant = {
      id: 'tenant-1',
      statusConceptId: DIR.TENANT_PENDING,
      verificationStatusConceptId: CONCEPTS.TENANT_UNVERIFIED,
      updatedAt: new Date(),
    };
    d.tenantsRepo.findById.mockResolvedValue(tenant);
    d.operatingRequirements.evaluateForTenant.mockResolvedValue({
      kind: 'PHARMACY',
      readiness: {
        ready: false,
        missing: ['HEADQUARTERS_LOCATION'],
        documentIds: [],
      },
    });

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_TENANT_IDENTITY, 'tenant-1'),
      ACTOR,
    );

    expect(d.operatingRequirements.evaluateForTenant).toHaveBeenCalledWith(
      d.tx,
      tenant,
    );
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_UNVERIFIED);
    expect(d.verification.applyVerified).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'pharmacy-not-ready',
        missing: ['HEADQUARTERS_LOCATION'],
      }),
      expect.any(String),
    );
  });

  it('activates a pending laboratory that has its papers (P51)', async () => {
    const d = build();
    const tenant = {
      id: 'tenant-1',
      statusConceptId: DIR.TENANT_PENDING,
      verificationStatusConceptId: CONCEPTS.TENANT_UNVERIFIED,
      updatedAt: new Date(),
    };
    d.tenantsRepo.findById.mockResolvedValue(tenant);
    d.operatingRequirements.evaluateForTenant.mockResolvedValue({
      kind: 'LABORATORY',
      readiness: { ready: true, missing: [], documentIds: ['d1', 'd2', 'd3'] },
    });

    await d.service.applyVerified(
      d.tx as never,
      verifiedCase(IDA.SUBJECT_TENANT_IDENTITY, 'tenant-1'),
      ACTOR,
    );

    expect(tenant.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
    expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_VERIFIED);
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
    const admissions = {
      recordExternalLicenseVerification: fn().mockResolvedValue(true),
    };
    const tenantsRepo = { findById: fn().mockResolvedValue(null) };
    const verification = {
      applyVerified: fn().mockResolvedValue({ action: 'granted' }),
      applyRevoked: fn().mockResolvedValue({ revoked: 1 }),
    };
    // Por defecto el tenant no tiene requisitos para operar (no es farmacia
    // ni laboratorio): `evaluateForTenant` devuelve `undefined`.
    const operatingRequirements = {
      evaluateForTenant: fn().mockResolvedValue(undefined),
    };
    const service = new IdentityVerificationEffectsService(
      authorizationsRepo as never,
      admissions as never,
      tenantsRepo as never,
      verification as never,
      logger as never,
      operatingRequirements as never,
    );
    return {
      service,
      tx,
      authorizationsRepo,
      admissions,
      tenantsRepo,
      verification,
      operatingRequirements,
    };
  }

  it('una matrícula verificada NO emite el sello: lo emite la admisión al verificar (D-01)', async () => {
    const d = build();
    d.authorizationsRepo.findById.mockResolvedValue({
      id: 'auth-1',
      practitionerProfileId: 'prof-1',
      validTo: new Date('2027-01-01T00:00:00Z'),
    });

    await d.service.applyVerified(
      d.tx as never,
      {
        id: 'caso-1',
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
        subjectEntityId: 'auth-1',
      } as never,
      ACTOR,
    );

    // Un sello por una sola matrícula, sin revisar títulos ni identidad, era el
    // «sello que miente»: ahora el check sólo nace de la resolución de la admisión.
    expect(d.verification.applyVerified).not.toHaveBeenCalled();
    expect(
      d.admissions.recordExternalLicenseVerification,
    ).toHaveBeenCalledTimes(1);
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
