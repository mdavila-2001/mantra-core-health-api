import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ServiceRequestsService } from './service-requests.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

const ENCOUNTER = { id: 'enc-1', patientProfileId: 'p1', tenantId: 't1' };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const serviceRequestsRepo = { findById: mockFn(), create: mockFn() };
  const encountersRepo = {
    findById: mockFn().mockResolvedValue(ENCOUNTER),
  };
  const clinicalRead = {
    assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
  };
  const duplicateStudyDetector = {
    findDuplicate: mockFn().mockResolvedValue(null),
    findPendingReport: mockFn().mockResolvedValue(false),
    describe: mockFn(),
    warningMessageFor: mockFn().mockReturnValue('warning'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ServiceRequestsService(
    em as any,
    serviceRequestsRepo as any,
    encountersRepo as any,
    clinicalRead as any,
    duplicateStudyDetector as any,
    logger as any,
  );
  return {
    service,
    serviceRequestsRepo,
    encountersRepo,
    clinicalRead,
    duplicateStudyDetector,
    tx,
  };
}

const MATCH = {
  report: {
    id: 'report-1',
    patientProfileId: 'p1',
    codeConceptId: 'code1',
    custodianTenantId: 't1',
    updatedAt: new Date(),
  },
  version: null,
  performedAt: new Date(),
  resultsAvailable: true,
};

const PREVIOUS_STUDY = {
  reportId: 'report-1',
  serviceRequestId: null,
  studyName: 'Hemograma completo',
  providerName: 'Laboratorio Central',
  performedAt: new Date(),
  daysAgo: 14,
  resultsAvailable: true,
  conclusionText: null,
  reportDownloadUrl: null,
  sameOrganization: true,
};

describe('ServiceRequestsService (UC-08-05)', () => {
  it('places a service request with order intent', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue({
      id: 'sr1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
      },
      actor,
    );
    expect(res.status).toBe(CLIN.SERVICE_REQUEST_ACTIVE);
    expect(res.intent).toBe(CLIN.SERVICE_REQUEST_INTENT_ORDER);
  });

  it('rejects when the referenced encounter does not exist', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          encounterId: 'missing',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  describe('antiduplicación de estudios (T-26, subtarea 3.2)', () => {
    it('rejects with DUPLICATE_STUDY_DETECTED when a duplicate exists and no decision was made', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);
      d.duplicateStudyDetector.describe.mockResolvedValue(PREVIOUS_STUDY);

      const error = await runWithTenant('t1', () =>
        d.service
          .create(
            {
              custodianTenantId: 't1',
              patientProfileId: 'p1',
              codeConceptId: 'code1',
            },
            actor,
          )
          .catch((e: unknown) => e),
      );

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as any).details).toEqual({
        reason: 'DUPLICATE_STUDY_DETECTED',
        previousStudy: PREVIOUS_STUDY,
      });
    });

    it('rejects with DUPLICATE_STUDY_MISMATCH when previousDiagnosticReportId does not match the detected duplicate', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);

      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            previousDiagnosticReportId: 'forged-id',
            reusePreviousReport: true,
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        details: { reason: 'DUPLICATE_STUDY_MISMATCH' },
      });
    });

    it('rejects with DUPLICATE_STUDY_NOT_FOUND when a decision is sent but no duplicate exists', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(null);

      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            previousDiagnosticReportId: 'report-1',
            reusePreviousReport: true,
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        details: { reason: 'DUPLICATE_STUDY_NOT_FOUND' },
      });
    });

    it('creates the order as SATISFIED_BY_PRIOR, without reason, when reusing the previous report', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);
      d.serviceRequestsRepo.create.mockReturnValue({
        id: 'sr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        createdAt: new Date(),
      });

      await d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          previousDiagnosticReportId: 'report-1',
          reusePreviousReport: true,
        } as any,
        actor,
      );

      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR,
          previousDiagnosticReportId: 'report-1',
          duplicateOverrideReason: undefined,
        }),
      );
    });

    it('creates the order as ACTIVE, with the reason, when repeating a justified duplicate', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);
      d.serviceRequestsRepo.create.mockReturnValue({
        id: 'sr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        createdAt: new Date(),
      });

      await d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
          previousDiagnosticReportId: 'report-1',
          duplicateOverrideReason:
            'Control post-quirúrgico inmediato por sospecha de sangrado activo',
        } as any,
        actor,
      );

      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          previousDiagnosticReportId: 'report-1',
          duplicateOverrideReason:
            'Control post-quirúrgico inmediato por sospecha de sangrado activo',
        }),
      );
    });

    it('does not consult the detector when duplicatePolicy is "skip"', async () => {
      const d = build();
      d.serviceRequestsRepo.create.mockReturnValue({
        id: 'sr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        createdAt: new Date(),
      });

      await d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
        },
        actor,
        { duplicatePolicy: 'skip' },
      );

      expect(d.duplicateStudyDetector.findDuplicate).not.toHaveBeenCalled();
    });
  });

  describe('checkDuplicate', () => {
    it('returns isDuplicate false with no match', async () => {
      const d = build();
      const result = await runWithTenant('t1', () =>
        d.service.checkDuplicate(
          {
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            encounterId: 'enc-1',
          } as any,
          actor,
        ),
      );
      expect(result.isDuplicate).toBe(false);
      expect(result.previousStudy).toBeNull();
      expect(result.requiresJustification).toBe(false);
    });

    it('returns the previous study when a duplicate is found', async () => {
      const d = build();
      d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);
      d.duplicateStudyDetector.describe.mockResolvedValue(PREVIOUS_STUDY);

      const result = await runWithTenant('t1', () =>
        d.service.checkDuplicate(
          {
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            encounterId: 'enc-1',
          } as any,
          actor,
        ),
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.previousStudy).toEqual(PREVIOUS_STUDY);
      expect(result.requiresJustification).toBe(true);
    });

    it('rejects with 404 when the encounter belongs to another patient', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        ...ENCOUNTER,
        patientProfileId: 'someone-else',
      });

      await expect(
        runWithTenant('t1', () =>
          d.service.checkDuplicate(
            {
              patientProfileId: 'p1',
              codeConceptId: 'code1',
              encounterId: 'enc-1',
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects with 404 when the encounter belongs to another tenant', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        ...ENCOUNTER,
        tenantId: 'other-tenant',
      });

      await expect(
        runWithTenant('t1', () =>
          d.service.checkDuplicate(
            {
              patientProfileId: 'p1',
              codeConceptId: 'code1',
              encounterId: 'enc-1',
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('propagates the ForbiddenException raised by assertPuedeLeerHistoria', async () => {
      const d = build();
      d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
        new Error('forbidden'),
      );

      await expect(
        runWithTenant('t1', () =>
          d.service.checkDuplicate(
            {
              patientProfileId: 'p1',
              codeConceptId: 'code1',
              encounterId: 'enc-1',
            } as any,
            actor,
          ),
        ),
      ).rejects.toThrow('forbidden');
    });
  });
});
