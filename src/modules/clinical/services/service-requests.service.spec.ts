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
import { PerformerSelectionValidator } from './performer-selection.validator';
import { PERFORMER_SELECTION_CONCEPTS } from '../performer-selection';

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
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
  };
  const duplicateStudyDetector = {
    findDuplicate: mockFn().mockResolvedValue(null),
    findPendingReport: mockFn().mockResolvedValue(false),
    findActiveOrderWithoutReport: mockFn().mockResolvedValue(null),
    describe: mockFn(),
    warningMessageFor: mockFn().mockReturnValue('warning'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const clinicalNotifications = {
    serviceRequestPlaced: mockFn().mockResolvedValue({ suppressed: false }),
  };
  // P43: el origen en formulario. Por defecto, válido.
  const formOrigin = {
    assertUsableOrigin: mockFn().mockResolvedValue(undefined),
  };
  // Centros médicos: el validador real, con el lector de sedes controlado.
  const sites = {
    offersProcedureWithPrice: mockFn().mockResolvedValue(true),
    isActivelyAffiliated: mockFn().mockResolvedValue(true),
  };
  const siteNames = {
    namesFor: mockFn().mockResolvedValue(new Map([['site-1', 'Centro Norte']])),
  };
  const service = new ServiceRequestsService(
    em as any,
    serviceRequestsRepo as any,
    encountersRepo as any,
    clinicalRead as any,
    duplicateStudyDetector as any,
    logger as any,
    outbox as any,
    clinicalNotifications as any,
    formOrigin as any,
    new PerformerSelectionValidator(sites as any),
    siteNames as any,
  );
  return {
    sites,
    siteNames,
    formOrigin,
    service,
    outbox,
    clinicalNotifications,
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

const ACTIVE_ORDER_STUDY = {
  reportId: null,
  serviceRequestId: 'sr-prev',
  studyName: 'Hemograma completo',
  providerName: 'Laboratorio Central',
  performedAt: new Date(),
  daysAgo: 0,
  resultsAvailable: false,
  conclusionText: null,
  reportDownloadUrl: null,
  sameOrganization: true,
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

  describe('formInstanceId (P43)', () => {
    const registration = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'code1',
      encounterId: 'enc-1',
    };

    it('valida la instancia contra el encuentro, la guarda y la devuelve', async () => {
      const d = build();
      d.serviceRequestsRepo.create.mockImplementation(
        (_tx: unknown, data: any) => ({
          id: 'sr1',
          patientProfileId: 'p1',
          statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
          formInstanceId: data.formInstanceId,
          createdAt: new Date(),
        }),
      );
      const res = await d.service.create(
        { ...registration, formInstanceId: 'form-1' },
        actor,
      );
      expect(d.formOrigin.assertUsableOrigin).toHaveBeenCalledWith(
        expect.anything(),
        'form-1',
        'enc-1',
      );
      expect(d.serviceRequestsRepo.create.mock.calls[0][1].formInstanceId).toBe(
        'form-1',
      );
      expect(res.formInstanceId).toBe('form-1');
    });

    it('sin formInstanceId no valida nada y responde null', async () => {
      const d = build();
      d.serviceRequestsRepo.create.mockReturnValue({
        id: 'sr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.create(registration, actor);
      expect(d.formOrigin.assertUsableOrigin).not.toHaveBeenCalled();
      expect(res.formInstanceId).toBeNull();
    });

    it('si el validador rechaza (422), no se crea la orden', async () => {
      const d = build();
      d.formOrigin.assertUsableOrigin.mockRejectedValue(
        new PreconditionFailedException('La instancia es de otro encuentro'),
      );
      await expect(
        d.service.create({ ...registration, formInstanceId: 'form-1' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
    });
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

    it('rejects with DUPLICATE_STUDY_DETECTED (reportId null) when an active order without report exists and no reason was given', async () => {
      const d = build();
      d.duplicateStudyDetector.findActiveOrderWithoutReport.mockResolvedValue(
        ACTIVE_ORDER_STUDY,
      );
      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        details: {
          reason: 'DUPLICATE_STUDY_DETECTED',
          previousStudy: { reportId: null, serviceRequestId: 'sr-prev' },
        },
      });
      expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects reusing when the duplicate is an active order: there is no report to reuse', async () => {
      const d = build();
      d.duplicateStudyDetector.findActiveOrderWithoutReport.mockResolvedValue(
        ACTIVE_ORDER_STUDY,
      );
      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            codeConceptId: 'code1',
            reusePreviousReport: true,
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        details: { reason: 'DUPLICATE_STUDY_DETECTED' },
      });
    });

    it('creates the ACTIVE order, without previous report, when repeating over an active order with a reason', async () => {
      const d = build();
      d.duplicateStudyDetector.findActiveOrderWithoutReport.mockResolvedValue(
        ACTIVE_ORDER_STUDY,
      );
      d.serviceRequestsRepo.create.mockReturnValue({
        id: 'sr2',
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
          duplicateOverrideReason:
            'Muestra anterior hemolizada, se necesita repetir hoy',
        } as any,
        actor,
      );
      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          previousDiagnosticReportId: undefined,
          duplicateOverrideReason: undefined,
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

    it('flags an active order without report as duplicate with reportId null and pendingReport', async () => {
      const d = build();
      d.duplicateStudyDetector.findActiveOrderWithoutReport.mockResolvedValue(
        ACTIVE_ORDER_STUDY,
      );
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
      expect(result.pendingReport).toBe(true);
      expect(result.requiresJustification).toBe(true);
      expect(result.previousStudy).toEqual(ACTIVE_ORDER_STUDY);
      expect(result.previousStudy?.reportId).toBeNull();
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
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
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

describe('ServiceRequestsService · MCH-008.2, coherencia del encuentro', () => {
  const dtoBase = {
    custodianTenantId: 't1',
    patientProfileId: 'p1',
    codeConceptId: 'code1',
    encounterId: 'enc-1',
  };

  it('rechaza un encuentro de otro paciente', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...ENCOUNTER,
      patientProfileId: 'otro-paciente',
    });

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza un encuentro de otro tenant', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...ENCOUNTER,
      tenantId: 'otro-tenant',
    });

    await expect(
      d.service.create(dtoBase as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
  });

  it('crea la orden cuando el encuentro es coherente', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue({
      id: 'sr1',
      patientProfileId: 'p1',
      statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
      createdAt: new Date(),
    });

    await d.service.create(dtoBase as any, actor);

    expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ encounterId: 'enc-1' }),
    );
  });
});

describe('ServiceRequestsService · MCH-027, el aviso de la orden', () => {
  const dto = {
    custodianTenantId: 't1',
    patientProfileId: 'p1',
    codeConceptId: 'code1',
  };
  const order = (statusConceptId: string) => ({
    id: 'sr1',
    custodianTenantId: 't1',
    patientProfileId: 'p1',
    statusConceptId,
    intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
    createdAt: new Date(),
  });

  it('publica exactamente un hecho al outbox, dentro de la transacción y sólo con ids', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue(
      order(CLIN.SERVICE_REQUEST_ACTIVE),
    );

    await d.service.create(dto, actor);

    expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(d.tx, {
      tenantId: 't1',
      eventType: 'ServiceRequestPlaced',
      aggregateType: 'clinical.service_requests',
      aggregateId: 'sr1',
      payloadJson: {
        serviceRequestId: 'sr1',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      },
      actorUserId: actor.id,
    });
  });

  it('le avisa al paciente de una orden activa', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue(
      order(CLIN.SERVICE_REQUEST_ACTIVE),
    );

    await d.service.create(dto, actor);

    expect(d.clinicalNotifications.serviceRequestPlaced).toHaveBeenCalledWith(
      'sr1',
      'p1',
      actor.id,
    );
  });

  it('no avisa de una orden resuelta con un informe previo: no le pide nada al paciente', async () => {
    const d = build();
    d.duplicateStudyDetector.findDuplicate.mockResolvedValue(MATCH);
    d.serviceRequestsRepo.create.mockReturnValue(
      order(CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR),
    );

    await d.service.create(
      {
        ...dto,
        previousDiagnosticReportId: 'report-1',
        reusePreviousReport: true,
      } as any,
      actor,
    );

    expect(d.outbox.publishDomainEvent).toHaveBeenCalledTimes(1);
    expect(d.clinicalNotifications.serviceRequestPlaced).not.toHaveBeenCalled();
  });

  it('una emisión fallida no tumba la orden', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue(
      order(CLIN.SERVICE_REQUEST_ACTIVE),
    );
    d.clinicalNotifications.serviceRequestPlaced.mockResolvedValue({
      suppressed: false,
      failed: true,
    });

    await expect(d.service.create(dto, actor)).resolves.toMatchObject({
      id: 'sr1',
    });
  });

  it('si la orden no llega a persistirse no hay hecho ni aviso', async () => {
    const d = build();
    d.serviceRequestsRepo.create.mockReturnValue(
      order(CLIN.SERVICE_REQUEST_ACTIVE),
    );
    d.tx.flush.mockRejectedValueOnce(new Error('violación de FK'));

    await expect(d.service.create(dto, actor)).rejects.toThrow(
      'violación de FK',
    );
    expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    expect(d.clinicalNotifications.serviceRequestPlaced).not.toHaveBeenCalled();
  });

  describe('quién ejecuta la orden (centros médicos)', () => {
    const base = (extra: Record<string, unknown> = {}): any => ({
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      encounterId: 'enc-1',
      codeConceptId: 'proc-endoscopia',
      requesterProfileId: 'doc-1',
      ...extra,
    });
    const doctor = { id: 'u1', practitionerProfileId: 'doc-1' } as any;

    /**
     * Sistema bajo prueba que devuelve la orden creada tal como se pidió.
     * @returns Resultado de build.
     */
    function ready() {
      const d = build();
      d.serviceRequestsRepo.create.mockImplementation(
        (_tx: any, data: any) => ({
          id: 'sr-1',
          createdAt: new Date(),
          patientProfileId: data.patientProfileId,
          custodianTenantId: data.custodianTenantId,
          statusConceptId: data.statusConceptId,
          intentConceptId: data.intentConceptId,
        }),
      );
      return d;
    }

    it('sin modo, la orden queda en PATIENT_CHOICE sin médico ni sede', async () => {
      const d = ready();

      const res = await d.service.create(base(), doctor);

      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          performerSelectionConceptId:
            PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE,
          performerPractitionerProfileId: undefined,
          suggestedPracticeSiteId: undefined,
        }),
      );
      expect(res).toMatchObject({
        performerSelectionConceptId:
          PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE,
        performerPractitionerProfileId: null,
        suggestedPracticeSiteId: null,
        suggestedPracticeSiteName: null,
      });
      expect(d.siteNames.namesFor).not.toHaveBeenCalled();
    });

    it('«lo hago yo»: persiste los tres campos y responde con el nombre de la sede', async () => {
      const d = ready();

      const res = await d.service.create(
        base({
          performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
          performerPractitionerProfileId: 'doc-1',
          suggestedPracticeSiteId: 'site-1',
        }),
        doctor,
      );

      expect(d.serviceRequestsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
          performerPractitionerProfileId: 'doc-1',
          suggestedPracticeSiteId: 'site-1',
        }),
      );
      expect(res).toMatchObject({
        performerPractitionerProfileId: 'doc-1',
        suggestedPracticeSiteId: 'site-1',
        suggestedPracticeSiteName: 'Centro Norte',
      });
    });

    it('«lo hago yo» sin el médico del solicitante da 422 y no persiste', async () => {
      const d = ready();

      await expect(
        d.service.create(
          base({
            performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
            performerPractitionerProfileId: 'otro',
            suggestedPracticeSiteId: 'site-1',
          }),
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
    });

    it('el solicitante sale de la sesión si el cuerpo no lo trae', async () => {
      const d = ready();

      await expect(
        d.service.create(
          base({
            requesterProfileId: undefined,
            performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.SELF,
            performerPractitionerProfileId: 'doc-1',
            suggestedPracticeSiteId: 'site-1',
          }),
          doctor,
        ),
      ).resolves.toMatchObject({ performerPractitionerProfileId: 'doc-1' });
    });

    it('PATIENT_CHOICE con sede sugerida da 422', async () => {
      const d = ready();

      await expect(
        d.service.create(base({ suggestedPracticeSiteId: 'site-1' }), doctor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.serviceRequestsRepo.create).not.toHaveBeenCalled();
    });

    it.each([
      ['ORGANIZATION', PERFORMER_SELECTION_CONCEPTS.ORGANIZATION, {}],
      [
        'SELF',
        PERFORMER_SELECTION_CONCEPTS.SELF,
        { performerPractitionerProfileId: 'doc-1' },
      ],
    ])(
      'CI-4 (%s): performerTenantId queda tal como llegó, no se deriva de la sede',
      async (_name, mode, extra) => {
        for (const performerTenantId of [undefined, 'tenant-elegido']) {
          const d = ready();

          await d.service.create(
            base({
              performerSelectionConceptId: mode,
              suggestedPracticeSiteId: 'site-1',
              performerTenantId,
              ...extra,
            }),
            doctor,
          );

          const saved = d.serviceRequestsRepo.create.mock.calls[0][1];
          expect(saved.performerTenantId).toBe(performerTenantId);
        }
      },
    );
  });
});
