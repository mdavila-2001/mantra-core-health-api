import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopIntraopService } from './periop-intraop.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';

const actor = { id: 'user-1', roles: ['SURGEON'] };
const CASE = '11111111-1111-1111-1111-111111111111';
const PROCEDURE = '22222222-2222-2222-2222-222222222222';
const STEP = '33333333-3333-3333-3333-333333333333';
const DEVICE = '44444444-4444-4444-4444-444444444444';
const SITE = '55555555-5555-5555-5555-555555555555';
const REPORT = '66666666-6666-6666-6666-666666666666';
const STAY = '77777777-7777-7777-7777-777777777777';
const PROFILE = '88888888-8888-8888-8888-888888888888';
const PATIENT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SPACE = '99999999-9999-9999-9999-999999999999';
const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Mock de una consulta de casos por id. Los casos de prueba son del tenant
 * activo (`TENANT_A`) salvo que el propio caso declare otro `custodianTenantId`.
 *
 * @returns Un `jest.fn` cuyo `mockResolvedValue` sella el tenant del caso.
 */
function caseLookupMock(): any {
  const lookup = mockFn();
  const resolve = lookup.mockResolvedValue.bind(lookup);
  lookup.mockResolvedValue = (row: any) =>
    resolve(
      row && typeof row === 'object' && row.custodianTenantId === undefined
        ? Object.assign(row, { custodianTenantId: TENANT_A })
        : row,
    );
  return lookup;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const intraopRepo: Record<string, any> = {
    createStep: mockFn(),
    findStepById: mockFn(),
    findStepForUpdate: mockFn(),
    findStepsByCase: mockFn(),
    createFinding: mockFn(),
    createBodySite: mockFn(),
    findBodySite: mockFn(),
    createImplant: mockFn(),
    createImplantIdentifier: mockFn(),
    createDevice: mockFn(),
    createMedicationUse: mockFn(),
    createSpecimen: mockFn(),
    createReport: mockFn(),
    findReportForUpdate: mockFn(),
    findReportsByCase: mockFn().mockResolvedValue([]),
    findLastReport: mockFn(),
    findFindingsByCase: mockFn().mockResolvedValue([]),
    findImplantsByCase: mockFn().mockResolvedValue([]),
    findIdentifiersByImplants: mockFn().mockResolvedValue([]),
    createComplication: mockFn(),
    createPacuStay: mockFn(),
    // Sin bloqueo: por defecto devuelve la misma estancia que la lectura bloqueada.
    findPacuStayById: mockFn((...args: unknown[]) =>
      intraopRepo.findPacuStayForUpdate(...args),
    ),
    findPacuStayForUpdate: mockFn(),
    findPacuStayByCase: mockFn(),
    createPacuAssessment: mockFn(),
    findAssessmentsByStay: mockFn(),
    createPostoperativeOrder: mockFn(),
    createFollowup: mockFn(),
  };
  const casesRepo: Record<string, any> = {
    findCaseForUpdate: caseLookupMock(),
    // Sin bloqueo: por defecto devuelve el mismo caso que la lectura bloqueada.
    findCaseById: mockFn((...args: unknown[]) =>
      casesRepo.findCaseForUpdate(...args),
    ),
    createStatusHistory: mockFn(),
    createMilestone: mockFn(),
    createLocation: mockFn(),
    findOpenLocation: mockFn(),
    // Procedimiento del paciente y tenant pedidos, salvo que el test diga otra cosa.
    findProcedureOfPatient: mockFn(
      (_tx: unknown, id: string, patientProfileId: string, tenantId: string) =>
        Promise.resolve({
          id,
          patientProfileId,
          custodianTenantId: tenantId,
        }),
    ),
  };
  // Por defecto el caso existe y es del tenant activo; los tests que prueban su
  // ausencia o un caso ajeno lo sobreescriben.
  casesRepo.findCaseForUpdate.mockResolvedValue({ id: CASE });
  // El alta del procedimiento cuando el informe llega por código.
  const procedures = {
    create: mockFn().mockResolvedValue({ id: 'proc-nuevo' }),
  };
  const receivedServices = {
    projectCompletedCase: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PeriopIntraopService(
    em as any,
    intraopRepo as any,
    casesRepo as any,
    procedures as any,
    receivedServices as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    intraopRepo,
    casesRepo,
    procedures,
    receivedServices,
    logger,
  };
}

/**
 * Ejecuta la operación case in progress.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de case in progress conforme al contrato `any`.
 */
function caseInProgress(overrides: Record<string, unknown> = {}): any {
  return {
    id: CASE,
    patientProfileId: PATIENT,
    statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
    primaryProcedureId: PROCEDURE,
    ...overrides,
  };
}

describe('PeriopIntraopService', () => {
  describe('createStep (UC-53-08)', () => {
    const dto = { stepCodeConceptId: SITE, description: 'Incisión' };

    it('numbers the step after the ones already recorded', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findStepsByCase.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);
      d.intraopRepo.createStep.mockReturnValue({ id: STEP });

      const res = await d.service.createStep(CASE, dto, actor);

      expect(res).toMatchObject({
        id: STEP,
        stepNumber: 3,
        statusConceptId: CONCEPTS.STEP_IN_PROGRESS,
      });
    });

    it('refuses to record on a case that has not started', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        caseInProgress({ statusConceptId: CONCEPTS.CASE_SCHEDULED }),
      );

      await expect(
        d.service.createStep(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the case does not exist', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createStep(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordFinding (UC-53-08)', () => {
    const dto = { findingCodeConceptId: SITE, findingText: 'Adherencias' };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.createFinding.mockReturnValue({ id: 'finding-1' });
      d.intraopRepo.findBodySite.mockResolvedValue(null);
    }

    it('records the finding', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordFinding(CASE, dto, actor);

      expect(res).toMatchObject({ id: 'finding-1', bodySiteRecorded: false });
    });

    it('accumulates the body site into the procedure', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordFinding(
        CASE,
        { ...dto, bodySiteConceptId: SITE, laterality: 'LEFT' as const },
        actor,
      );

      expect(res.bodySiteRecorded).toBe(true);
      expect(d.intraopRepo.createBodySite).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          lateralityConceptId: CONCEPTS.LATERALITY_LEFT,
        }),
      );
    });

    it('does not duplicate a body site already recorded', async () => {
      const d = build();
      wire(d);
      d.intraopRepo.findBodySite.mockResolvedValue({ id: 'site-prev' });

      const res = await d.service.recordFinding(
        CASE,
        { ...dto, bodySiteConceptId: SITE },
        actor,
      );

      expect(res.bodySiteRecorded).toBe(false);
      expect(d.intraopRepo.createBodySite).not.toHaveBeenCalled();
    });

    it('refuses a step from another case', async () => {
      const d = build();
      wire(d);
      d.intraopRepo.findStepById.mockResolvedValue({
        id: STEP,
        procedureCaseId: 'other',
      });

      await expect(
        d.service.recordFinding(
          CASE,
          { ...dto, operativeStepId: STEP },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordImplant (UC-53-09)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        procedureId: PROCEDURE,
        implantDeviceId: DEVICE,
        implantRole: 'PRIMARY' as const,
        identifiers: [
          {
            identifierType: 'UDI_DI' as const,
            identifierValue: '0123456789',
            lotNumber: 'L-42',
            serialNumber: 'S-7',
          },
        ],
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.createImplant.mockReturnValue({ id: 'implant-1' });
      d.intraopRepo.createImplantIdentifier.mockReturnValue({ id: 'ident-1' });
      d.intraopRepo.createDevice.mockReturnValue({ id: 'device-use-1' });
    }

    it('records the implant with its traceability identifiers', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordImplant(CASE, dto(), actor);

      expect(res).toMatchObject({
        id: 'implant-1',
        statusConceptId: CONCEPTS.IMPLANT_IMPLANTED,
        identifierIds: ['ident-1'],
        deviceUseId: 'device-use-1',
      });
    });

    it('carries the lot and serial into the device use record', async () => {
      const d = build();
      wire(d);

      await d.service.recordImplant(
        CASE,
        dto({ udiCarrier: '(01)0123(10)L-42' }),
        actor,
      );

      expect(d.intraopRepo.createDevice).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          lotNumber: 'L-42',
          serialNumber: 'S-7',
          udiCarrier: '(01)0123(10)L-42',
          useRoleConceptId: CONCEPTS.DEVICE_USE_IMPLANT,
        }),
      );
    });

    it('refuses to record on a case that is not in progress', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        caseInProgress({ statusConceptId: CONCEPTS.CASE_COMPLETED }),
      );

      await expect(
        d.service.recordImplant(CASE, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('supplies (UC-53-10)', () => {
    it('records a medication use', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.createMedicationUse.mockReturnValue({ id: 'use-1' });

      const res = await d.service.recordMedicationUse(
        CASE,
        { medicationAdministrationId: DEVICE, useRole: 'ANTIBIOTIC' as const },
        actor,
      );

      expect(res).toEqual({ id: 'use-1', procedureCaseId: CASE });
      expect(d.intraopRepo.createMedicationUse).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          useRoleConceptId: CONCEPTS.MED_USE_ANTIBIOTIC,
        }),
      );
    });

    it('records a specimen with its orientation', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.createSpecimen.mockReturnValue({ id: 'spec-1' });

      const res = await d.service.recordSpecimen(
        CASE,
        {
          procedureId: PROCEDURE,
          specimenId: DEVICE,
          specimenRole: 'BIOPSY' as const,
          orientationText: 'Sutura larga = lateral',
        },
        actor,
      );

      expect(res.id).toBe('spec-1');
    });

    it('refuses a step from another case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findStepById.mockResolvedValue({
        id: STEP,
        procedureCaseId: 'other',
      });

      await expect(
        d.service.recordMedicationUse(
          CASE,
          {
            medicationAdministrationId: DEVICE,
            useRole: 'ANESTHESIA' as const,
            operativeStepId: STEP,
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('draftReport / signReport (UC-53-11)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        procedureId: PROCEDURE,
        authorProfileId: PROFILE,
        procedureDescription: 'Colecistectomía laparoscópica',
        disposition: 'PACU' as const,
        ...overrides,
      };
    }

    it('drafts version 1 when there is no previous report', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findLastReport.mockResolvedValue(null);
      d.intraopRepo.createReport.mockReturnValue({ id: REPORT });

      const res = await d.service.draftReport(CASE, dto(), actor);

      expect(res).toMatchObject({
        id: REPORT,
        reportVersion: 1,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      });
    });

    describe('procedureId del cliente (#864)', () => {
      it('busca el procedimiento con el paciente del caso y el tenant del contexto', async () => {
        const d = build();
        d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
        d.intraopRepo.findLastReport.mockResolvedValue(null);
        d.intraopRepo.createReport.mockReturnValue({ id: REPORT });

        await d.service.draftReport(CASE, dto(), actor);

        expect(d.casesRepo.findProcedureOfPatient).toHaveBeenCalledWith(
          d.tx,
          PROCEDURE,
          PATIENT,
          TENANT_A,
        );
      });

      it('rechaza con 404 el procedimiento de otro paciente o de otro tenant y no escribe el informe', async () => {
        const d = build();
        d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
        d.casesRepo.findProcedureOfPatient.mockResolvedValue(null);

        const error = await d.service
          .draftReport(CASE, dto(), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect((error as ResourceNotFoundException).reason).toBe(
          ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND,
        );
        expect(d.intraopRepo.createReport).not.toHaveBeenCalled();
        expect(d.intraopRepo.createComplication).not.toHaveBeenCalled();
      });

      it('no se fía del filtro de la consulta: una fila de otro paciente o tenant también es 404', async () => {
        for (const foreign of [
          { patientProfileId: 'otro-paciente', custodianTenantId: TENANT_A },
          { patientProfileId: PATIENT, custodianTenantId: TENANT_B },
        ]) {
          const d = build();
          d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
          d.casesRepo.findProcedureOfPatient.mockResolvedValue({
            id: PROCEDURE,
            ...foreign,
          });

          await expect(
            d.service.draftReport(CASE, dto(), actor),
          ).rejects.toMatchObject({
            reason: ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND,
          });
          expect(d.intraopRepo.createReport).not.toHaveBeenCalled();
        }
      });

      it('sin procedureId (informe por código) no valida: el procedimiento se crea con el paciente del caso', async () => {
        const d = build();
        d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
        d.intraopRepo.findLastReport.mockResolvedValue(null);
        d.intraopRepo.createReport.mockReturnValue({ id: REPORT });

        await d.service.draftReport(
          CASE,
          dto({ procedureId: undefined, procedureCodeConceptId: SITE }),
          actor,
        );

        expect(d.casesRepo.findProcedureOfPatient).not.toHaveBeenCalled();
        expect(d.procedures.create).toHaveBeenCalledWith(
          expect.objectContaining({ patientProfileId: PATIENT }),
          actor,
        );
      });
    });

    it('drafts a new version instead of editing the previous one', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findLastReport.mockResolvedValue({
        id: 'report-prev',
        reportVersion: 2,
      });
      d.intraopRepo.createReport.mockReturnValue({ id: REPORT });

      const res = await d.service.draftReport(CASE, dto(), actor);

      expect(res.reportVersion).toBe(3);
    });

    it('records the complications and warns about them', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findLastReport.mockResolvedValue(null);
      d.intraopRepo.createReport.mockReturnValue({ id: REPORT });
      d.intraopRepo.createComplication.mockReturnValue({ id: 'compl-1' });

      const res = await d.service.draftReport(
        CASE,
        dto({
          complications: [
            {
              complicationCodeConceptId: SITE,
              severity: 'MAJOR' as const,
              relatedness: 'PROCEDURE' as const,
            },
          ],
        }),
        actor,
      );

      expect(res.complicationIds).toEqual(['compl-1']);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('signing the report completes the case', async () => {
      const d = build();
      const report: any = {
        id: REPORT,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      };
      d.intraopRepo.findReportForUpdate.mockResolvedValue(report);
      const surgicalCase = caseInProgress();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);

      const res = await d.service.signReport(
        CASE,
        REPORT,
        { signatureId: PROFILE },
        actor,
      );

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_SIGNED,
        caseStatusConceptId: CONCEPTS.CASE_COMPLETED,
      });
      expect(surgicalCase.actualEndAt).toBeInstanceOf(Date);
      expect(d.casesRepo.createMilestone).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          milestoneTypeConceptId: CONCEPTS.MILESTONE_CASE_END,
        }),
      );
    });

    it('signing the report projects the completed case to received services, with the reported procedure', async () => {
      const d = build();
      d.intraopRepo.findReportForUpdate.mockResolvedValue({
        id: REPORT,
        procedureCaseId: CASE,
        procedureId: PROCEDURE,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      });
      const surgicalCase = caseInProgress({ primaryProcedureId: undefined });
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);

      await d.service.signReport(CASE, REPORT, { signatureId: PROFILE }, actor);

      expect(d.receivedServices.projectCompletedCase).toHaveBeenCalledWith(
        d.tx,
        surgicalCase,
        actor.id,
        PROCEDURE,
      );
    });

    it('signing a report on an already completed case does not project it again', async () => {
      const d = build();
      d.intraopRepo.findReportForUpdate.mockResolvedValue({
        id: REPORT,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      });
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        caseInProgress({ statusConceptId: CONCEPTS.CASE_COMPLETED }),
      );

      await d.service.signReport(CASE, REPORT, { signatureId: PROFILE }, actor);

      expect(d.receivedServices.projectCompletedCase).not.toHaveBeenCalled();
    });

    it('rejects signing twice', async () => {
      const d = build();
      d.intraopRepo.findReportForUpdate.mockResolvedValue({
        id: REPORT,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_SIGNED,
      });

      await expect(
        d.service.signReport(
          CASE,
          REPORT,
          { signatureId: PROFILE },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a report from another case', async () => {
      const d = build();
      d.intraopRepo.findReportForUpdate.mockResolvedValue({
        id: REPORT,
        procedureCaseId: 'other-case',
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      });

      await expect(
        d.service.signReport(
          CASE,
          REPORT,
          { signatureId: PROFILE },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('PACU (UC-53-12)', () => {
    it('admits the patient and records the location', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findPacuStayByCase.mockResolvedValue(null);
      d.intraopRepo.createPacuStay.mockReturnValue({ id: STAY });
      d.casesRepo.createLocation.mockReturnValue({ id: 'loc-1' });

      const res = await d.service.admitToPacu(
        CASE,
        { careSpaceId: SPACE },
        actor,
      );

      expect(res).toMatchObject({
        id: STAY,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
        locationId: 'loc-1',
      });
    });

    it('rejects a second stay for the same case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(caseInProgress());
      d.intraopRepo.findPacuStayByCase.mockResolvedValue({ id: 'stay-prev' });

      await expect(
        d.service.admitToPacu(CASE, { careSpaceId: SPACE }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reports whether the assessment meets the discharge criteria', async () => {
      const d = build();
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue({
        id: STAY,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
      });
      d.intraopRepo.createPacuAssessment.mockReturnValue({ id: 'assess-1' });

      const good = await d.service.recordPacuAssessment(
        STAY,
        { assessedByProfileId: PROFILE, aldreteScore: 9 },
        actor,
      );
      const poor = await d.service.recordPacuAssessment(
        STAY,
        { assessedByProfileId: PROFILE, aldreteScore: 6 },
        actor,
      );

      expect(good.meetsDischargeCriteria).toBe(true);
      expect(poor.meetsDischargeCriteria).toBe(false);
    });

    it('discharges with orders and follow-ups', async () => {
      const d = build();
      const stay: any = {
        id: STAY,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
      };
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue(stay);
      d.intraopRepo.findAssessmentsByStay.mockResolvedValue([
        { aldreteScore: 10 },
      ]);
      d.casesRepo.findOpenLocation.mockResolvedValue({ id: 'loc-1' });

      const res = await d.service.dischargeFromPacu(
        STAY,
        {
          destination: 'WARD' as const,
          orders: [
            { serviceRequestId: DEVICE, orderRole: 'MEDICATION' as const },
          ],
          followups: [
            {
              followupType: 'WOUND_CHECK' as const,
              dueAt: '2026-09-08T10:00:00Z',
            },
          ],
        },
        actor,
      );

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.PACU_DISCHARGED,
        ordersCreated: 1,
        followupsCreated: 1,
      });
      expect(stay.dischargeCriteriaMet).toBe(true);
    });

    it('closes the PACU location on discharge', async () => {
      const d = build();
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue({
        id: STAY,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
      });
      d.intraopRepo.findAssessmentsByStay.mockResolvedValue([
        { aldreteScore: 10 },
      ]);
      const location: any = { id: 'loc-1' };
      d.casesRepo.findOpenLocation.mockResolvedValue(location);

      await d.service.dischargeFromPacu(
        STAY,
        { destination: 'HOME' as const },
        actor,
      );

      expect(location.endsAt).toBeInstanceOf(Date);
    });

    it('refuses discharge when the last assessment does not meet the criteria', async () => {
      const d = build();
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue({
        id: STAY,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
      });
      d.intraopRepo.findAssessmentsByStay.mockResolvedValue([
        { aldreteScore: 6 },
      ]);

      await expect(
        d.service.dischargeFromPacu(
          STAY,
          { destination: 'WARD' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses discharge with no assessment at all', async () => {
      const d = build();
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue({
        id: STAY,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
      });
      d.intraopRepo.findAssessmentsByStay.mockResolvedValue([]);

      await expect(
        d.service.dischargeFromPacu(
          STAY,
          { destination: 'WARD' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});

/** Aserciones del 404 uniforme de PERIOP-01. */
async function expectNotFound(
  promise: Promise<unknown>,
  message: string,
  reason: string,
) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(reason);
  return exception;
}

describe('PeriopIntraopService · alcance de tenant (PERIOP-01)', () => {
  const CASE_REASON = ProceduresPerioperativeErrorReason.PERIOP_CASE_NOT_FOUND;
  const foreignCase = (): any => ({
    id: CASE,
    custodianTenantId: TENANT_B,
    statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
  });

  it('registrar un paso operatorio en el caso de otro tenant: 404 uniforme, sin persistir', async () => {
    const d = build();
    d.casesRepo.findCaseForUpdate.mockResolvedValue(foreignCase());

    const foreign = await expectNotFound(
      d.service.createStep(
        CASE,
        { stepCodeConceptId: SITE, description: 'Incisión' } as any,
        actor,
      ),
      'Caso quirúrgico no encontrado',
      CASE_REASON,
    );
    d.casesRepo.findCaseForUpdate.mockResolvedValue(null);
    const missing = await expectNotFound(
      d.service.createStep(
        CASE,
        { stepCodeConceptId: SITE, description: 'Incisión' } as any,
        actor,
      ),
      'Caso quirúrgico no encontrado',
      CASE_REASON,
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.intraopRepo.createStep).not.toHaveBeenCalled();
    expect(d.casesRepo.findCaseForUpdate).toHaveBeenCalledWith(
      d.tx,
      CASE,
      TENANT_A,
    );
  });

  it('sin tenant en el contexto no se registra nada', async () => {
    const d = build();

    await expect(
      d.raw.createStep(
        CASE,
        { stepCodeConceptId: SITE, description: 'Incisión' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.casesRepo.findCaseForUpdate).not.toHaveBeenCalled();
  });

  it('firmar el informe de un caso de otro tenant: 404 uniforme; el informe de B no cambia', async () => {
    const d = build();
    const report: any = {
      id: REPORT,
      procedureCaseId: CASE,
      statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
    };
    d.intraopRepo.findReportForUpdate.mockResolvedValue(report);
    d.casesRepo.findCaseForUpdate.mockResolvedValue(foreignCase());

    await expectNotFound(
      d.service.signReport(CASE, REPORT, { signatureId: PROFILE }, actor),
      'Caso quirúrgico no encontrado',
      CASE_REASON,
    );

    expect(report.statusConceptId).toBe(CONCEPTS.OPERATIVE_REPORT_DRAFT);
    expect(d.intraopRepo.findReportForUpdate).not.toHaveBeenCalled();
  });

  it('un informe de un caso de otro tenant no se revela como «de otro caso»: 404 del informe', async () => {
    const d = build();
    d.casesRepo.findCaseForUpdate.mockResolvedValue({ id: CASE });
    d.casesRepo.findCaseById.mockResolvedValue(foreignCase());
    d.intraopRepo.findReportForUpdate.mockResolvedValue({
      id: REPORT,
      procedureCaseId: 'caso-de-b',
      statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
    });

    await expectNotFound(
      d.service.signReport(CASE, REPORT, { signatureId: PROFILE }, actor),
      'Reporte operatorio no encontrado',
      ProceduresPerioperativeErrorReason.REPORT_NOT_FOUND,
    );
  });

  describe('estancia en recuperación (PACU) por UUID', () => {
    const stayOfCase = (caseId: string): any => ({
      id: STAY,
      procedureCaseId: caseId,
      statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
    });

    it('valorar la estancia de un caso de otro tenant: 404 uniforme, igual que inexistente; no bloquea ni persiste', async () => {
      const d = build();
      d.intraopRepo.findPacuStayById.mockResolvedValue(stayOfCase('caso-de-b'));
      d.casesRepo.findCaseById.mockResolvedValue(foreignCase());

      const foreign = await expectNotFound(
        d.service.recordPacuAssessment(
          STAY,
          { assessedByProfileId: PROFILE, aldreteScore: 9 } as any,
          actor,
        ),
        'Estancia en recuperación no encontrada',
        ProceduresPerioperativeErrorReason.PACU_STAY_NOT_FOUND,
      );
      d.intraopRepo.findPacuStayById.mockResolvedValue(null);
      const missing = await expectNotFound(
        d.service.recordPacuAssessment(
          STAY,
          { assessedByProfileId: PROFILE, aldreteScore: 9 } as any,
          actor,
        ),
        'Estancia en recuperación no encontrada',
        ProceduresPerioperativeErrorReason.PACU_STAY_NOT_FOUND,
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.intraopRepo.findPacuStayForUpdate).not.toHaveBeenCalled();
      expect(d.intraopRepo.createPacuAssessment).not.toHaveBeenCalled();
    });

    it('dar de alta la estancia de un caso de otro tenant: 404 uniforme; el estado de B no cambia', async () => {
      const d = build();
      const stay = stayOfCase('caso-de-b');
      d.intraopRepo.findPacuStayById.mockResolvedValue(stay);
      d.casesRepo.findCaseById.mockResolvedValue(foreignCase());

      await expectNotFound(
        d.service.dischargeFromPacu(
          STAY,
          { destination: 'WARD' } as any,
          actor,
        ),
        'Estancia en recuperación no encontrada',
        ProceduresPerioperativeErrorReason.PACU_STAY_NOT_FOUND,
      );

      expect(stay.statusConceptId).toBe(CONCEPTS.PACU_IN_RECOVERY);
    });

    it('la estancia de un caso propio sí se valora', async () => {
      const d = build();
      const stay = stayOfCase(CASE);
      d.intraopRepo.findPacuStayById.mockResolvedValue(stay);
      d.casesRepo.findCaseById.mockResolvedValue({
        id: CASE,
        custodianTenantId: TENANT_A,
      });
      d.intraopRepo.findPacuStayForUpdate.mockResolvedValue(stay);
      d.intraopRepo.createPacuAssessment.mockReturnValue({ id: 'assess-1' });

      const res = await d.service.recordPacuAssessment(
        STAY,
        { assessedByProfileId: PROFILE, aldreteScore: 9 } as any,
        actor,
      );

      expect(res.meetsDischargeCriteria).toBe(true);
    });
  });
});
