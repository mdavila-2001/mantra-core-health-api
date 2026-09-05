import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IdentitySelfServiceService } from './identity-self-service.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { IDA } from '../identity_assurance.concepts';
import {
  IDENTITY_CARD_VERTICAL,
  MEDICAL_LICENSE_VERTICAL,
} from '../identity_assurance.seed';

const actor = { id: 'user-1', roles: [] } as any;
const dto = { evidenceFileId: 'file-1' };

describe('IdentitySelfServiceService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = { flush: fn().mockResolvedValue(undefined) };
    const em = {
      transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
      fork: fn(() => tx),
    };
    const casesRepo = {
      countLiveForSubject: fn().mockResolvedValue(0),
      create: fn(() => ({ id: 'case-1', statusConceptId: IDA.CASE_OPEN })),
      findById: fn().mockResolvedValue(null),
      findBySubjects: fn().mockResolvedValue([]),
    };
    const evidenceRepo = {
      create: fn(() => ({ id: 'ev-1' })),
      findLatestByCase: fn().mockResolvedValue(null),
    };
    const checksRepo = {
      create: fn(() => ({ id: 'check-1' })),
      findRequiredByCase: fn().mockResolvedValue([]),
    };
    const accountLinksRepo = {
      findActiveByUser: fn().mockResolvedValue({ personId: 'person-1' }),
    };
    const practitionersRepo = {
      findById: fn().mockResolvedValue({ profileId: 'person-1' }),
    };
    const authorizationsRepo = {
      findById: fn().mockResolvedValue(null),
      findByPractitioner: fn().mockResolvedValue([]),
    };
    const membershipsRepo = {
      findActiveByUserTenant: fn().mockResolvedValue(null),
    };
    const manualReviewRepo = {
      findLatestDecidedByCase: fn().mockResolvedValue(null),
    };
    const checkResultsRepo = {
      findLatestByCheck: fn().mockResolvedValue(null),
    };
    const service = new IdentitySelfServiceService(
      em as never,
      casesRepo as never,
      evidenceRepo,
      checksRepo as never,
      accountLinksRepo as never,
      practitionersRepo as never,
      authorizationsRepo as never,
      membershipsRepo as never,
      manualReviewRepo as never,
      checkResultsRepo as never,
      logger as never,
    );
    return {
      service,
      tx,
      casesRepo,
      evidenceRepo,
      checksRepo,
      accountLinksRepo,
      practitionersRepo,
      authorizationsRepo,
      membershipsRepo,
      manualReviewRepo,
      checkResultsRepo,
    };
  }

  describe('requestPatientIdentity', () => {
    it('opens the case for the actor own person, never for an id in the body', async () => {
      const d = build();

      const res = await d.service.requestPatientIdentity(dto, actor);

      expect(d.casesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          subjectEntityId: 'person-1',
          subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
          identityVerificationPolicyId: IDENTITY_CARD_VERTICAL.policyId,
        }),
      );
      expect(res).toEqual({
        caseId: 'case-1',
        checkId: 'check-1',
        status: IDA.CASE_IN_VERIFICATION,
      });
    });

    it('records the evidence and plans a required check in one go', async () => {
      const d = build();

      await d.service.requestPatientIdentity(dto, actor);

      expect(d.evidenceRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          evidenceFileId: 'file-1',
          evidenceTypeConceptId: IDA.EVIDENCE_TYPE_SELFIE_WITH_ID,
        }),
      );
      expect(d.checksRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
          required: true,
        }),
      );
    });

    it('refuses a second verification while one is already running', async () => {
      const d = build();
      d.casesRepo.countLiveForSubject.mockResolvedValue(1);

      await expect(
        d.service.requestPatientIdentity(dto, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.casesRepo.create).not.toHaveBeenCalled();
    });

    it('refuses when the account has no linked person', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.requestPatientIdentity(dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('requestPractitionerLicense', () => {
    it('opens the case against the license, not the person', async () => {
      const d = build();
      d.authorizationsRepo.findById.mockResolvedValue({
        id: 'auth-1',
        practitionerProfileId: 'person-1',
      });

      await d.service.requestPractitionerLicense(
        { ...dto, jurisdictionAuthorizationId: 'auth-1' },
        actor,
      );

      expect(d.casesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          subjectEntityId: 'auth-1',
          subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
          identityVerificationPolicyId: MEDICAL_LICENSE_VERTICAL.policyId,
        }),
      );
    });

    it('refuses to verify a license that belongs to another practitioner', async () => {
      const d = build();
      d.authorizationsRepo.findById.mockResolvedValue({
        id: 'auth-1',
        practitionerProfileId: 'someone-else',
      });

      await expect(
        d.service.requestPractitionerLicense(
          { ...dto, jurisdictionAuthorizationId: 'auth-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.casesRepo.create).not.toHaveBeenCalled();
    });

    it('refuses when the account has no practitioner profile', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.requestPractitionerLicense(
          { ...dto, jurisdictionAuthorizationId: 'auth-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('requestTenantVerification', () => {
    it('opens the case when the actor owns the institution', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });

      await d.service.requestTenantVerification('tenant-1', dto, actor);

      expect(d.casesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          subjectEntityId: 'tenant-1',
          subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
        }),
      );
    });

    it('refuses a member who is neither owner nor admin', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });

      await expect(
        d.service.requestTenantVerification('tenant-1', dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses someone who does not belong to the institution', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);

      await expect(
        d.service.requestTenantVerification('tenant-1', dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('getOwnCaseStatus', () => {
    it('returns the status of a case about the actor own person', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'case-1',
        statusConceptId: IDA.CASE_ASSERTED,
        subjectEntityId: 'person-1',
      });

      await expect(
        d.service.getOwnCaseStatus('case-1', actor),
      ).resolves.toMatchObject({
        id: 'case-1',
        status: IDA.CASE_ASSERTED,
      });
    });

    it('resuelve el tipo, el archivo y el motivo del veredicto (FT-32-R02/R03/R05)', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'case-1',
        statusConceptId: IDA.CASE_REJECTED,
        subjectEntityId: 'auth-1',
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
      });
      d.authorizationsRepo.findById.mockResolvedValue({
        id: 'auth-1',
        practitionerProfileId: 'person-1',
      });
      d.evidenceRepo.findLatestByCase.mockResolvedValue({
        evidenceFileId: 'file-9',
      });
      d.manualReviewRepo.findLatestDecidedByCase.mockResolvedValue({
        decisionReason: 'El documento no coincide con la matrícula declarada',
      });
      d.checksRepo.findRequiredByCase.mockResolvedValue([
        {
          id: 'check-1',
          checkTypeConceptId: IDA.CHECK_TYPE_MEDICAL_LICENSE,
          statusConceptId: IDA.CHECK_FAILED,
        },
      ]);
      d.checkResultsRepo.findLatestByCheck.mockResolvedValue({
        resultConceptId: IDA.RESULT_NO_MATCH,
        checkedAt: new Date('2026-08-01T00:00:00Z'),
      });

      await expect(
        d.service.getOwnCaseStatus('case-1', actor),
      ).resolves.toMatchObject({
        id: 'case-1',
        type: 'PRACTITIONER_LICENSE',
        evidenceFileId: 'file-9',
        reasonText: 'El documento no coincide con la matrícula declarada',
        checks: [
          expect.objectContaining({
            checkTypeConceptId: IDA.CHECK_TYPE_MEDICAL_LICENSE,
            resultConceptId: IDA.RESULT_NO_MATCH,
          }),
        ],
      });
    });

    it('un caso sin revisión manual no inventa un motivo', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'case-1',
        statusConceptId: IDA.CASE_VERIFIED,
        subjectEntityId: 'person-1',
        subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_IDENTITY,
      });

      const res = await d.service.getOwnCaseStatus('case-1', actor);

      expect(res.reasonText).toBeUndefined();
    });

    it("hides someone else's case behind a not-found", async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'case-1',
        statusConceptId: IDA.CASE_ASSERTED,
        subjectEntityId: 'another-person',
      });

      // Distinguir "no es tuyo" de "no existe" revelaría qué ids son casos
      // reales de otras personas.
      await expect(
        d.service.getOwnCaseStatus('case-1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('listOwnCases', () => {
    it('reúne los casos de la persona y los de sus matrículas', async () => {
      const d = build();
      d.authorizationsRepo.findByPractitioner.mockResolvedValue([
        { id: 'lic-1' },
        { id: 'lic-2' },
      ]);
      d.casesRepo.findBySubjects.mockResolvedValue([
        {
          id: 'case-9',
          statusConceptId: IDA.CASE_OPEN,
          openedAt: new Date('2026-08-01T00:00:00Z'),
          completedAt: undefined,
        },
      ]);

      const res = await d.service.listOwnCases({ id: 'user-1', roles: [] });

      // Una verificación de matrícula tiene como sujeto la autorización, no la
      // persona: sin incluirlas, el médico no vería el caso de su matrícula.
      expect(d.casesRepo.findBySubjects).toHaveBeenCalledWith(
        expect.anything(),
        ['person-1', 'lic-1', 'lic-2'],
      );
      expect(res).toEqual([
        expect.objectContaining({ id: 'case-9', status: IDA.CASE_OPEN }),
      ]);
    });

    it('la lista trae el tipo pero no el trace de checks (FT-32-R01..R04)', async () => {
      const d = build();
      d.casesRepo.findBySubjects.mockResolvedValue([
        {
          id: 'case-9',
          statusConceptId: IDA.CASE_OPEN,
          subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_IDENTITY,
          openedAt: new Date('2026-08-01T00:00:00Z'),
        },
      ]);

      const [row] = await d.service.listOwnCases({ id: 'user-1', roles: [] });

      expect(row).toMatchObject({
        id: 'case-9',
        type: 'PRACTITIONER_IDENTITY',
      });
      expect(row.checks).toBeUndefined();
      // La lista no paga el N+1 de revisión manual/checks por fila.
      expect(d.manualReviewRepo.findLatestDecidedByCase).not.toHaveBeenCalled();
      expect(d.checksRepo.findRequiredByCase).not.toHaveBeenCalled();
    });

    it('una cuenta sin persona vinculada no tiene casos, y eso no es un error', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      // Es el estado normal de un usuario administrativo: devolver 422 le
      // rompería la pantalla de perfil a quien no hizo nada mal.
      await expect(
        d.service.listOwnCases({ id: 'user-1', roles: [] }),
      ).resolves.toEqual([]);
      expect(d.casesRepo.findBySubjects).not.toHaveBeenCalled();
    });
  });

  describe('listAvailableTypes', () => {
    it('sin persona vinculada, ningún tipo disponible', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(d.service.listAvailableTypes(actor)).resolves.toEqual({
        types: [],
      });
    });

    it('sin perfil profesional, ningún tipo disponible (catálogo del módulo Doctor)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(d.service.listAvailableTypes(actor)).resolves.toEqual({
        types: [],
      });
    });

    it('ofrece identidad y cada matrícula propia, marcando cuáles ya tienen solicitud viva (FT-32-R09/R11)', async () => {
      const d = build();
      d.authorizationsRepo.findByPractitioner.mockResolvedValue([
        { id: 'auth-1', licenseNumber: 'MAT-1' },
        { id: 'auth-2', licenseNumber: 'MAT-2' },
      ]);
      d.casesRepo.countLiveForSubject.mockImplementation(
        (_em: unknown, _subjectType: string, subjectEntityId: string) =>
          Promise.resolve(subjectEntityId === 'auth-1' ? 1 : 0),
      );

      const res = await d.service.listAvailableTypes(actor);

      expect(res.types).toEqual([
        expect.objectContaining({
          code: 'PRACTITIONER_IDENTITY',
          hasPendingRequest: false,
        }),
        expect.objectContaining({
          code: 'PRACTITIONER_LICENSE',
          jurisdictionAuthorizationId: 'auth-1',
          hasPendingRequest: true,
        }),
        expect.objectContaining({
          code: 'PRACTITIONER_LICENSE',
          jurisdictionAuthorizationId: 'auth-2',
          hasPendingRequest: false,
        }),
      ]);
    });
  });
});
