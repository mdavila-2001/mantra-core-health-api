import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopCasesService } from './periop-cases.service';
import { PeriopReacceptanceService } from './periop-reacceptance.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';
import { PERIOP } from '../procedures_perioperative.concepts';

const actor = { id: 'user-1', roles: ['PERIOP_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';
const SURGEON = '33333333-3333-3333-3333-333333333333';
const ROOM = '44444444-4444-4444-4444-444444444444';
const CASE = '55555555-5555-5555-5555-555555555555';
const CONDITION = '66666666-6666-6666-6666-666666666666';
const REASON = '77777777-7777-7777-7777-777777777777';
const BILLABLE = '88888888-8888-8888-8888-888888888888';
const PROCEDURE = '99999999-9999-9999-9999-999999999999';
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
  const casesRepo = {
    createCase: mockFn(),
    findCaseById: caseLookupMock(),
    findCaseForUpdate: caseLookupMock(),
    findCaseByNumber: mockFn(),
    countCases: mockFn(),
    findOverlappingCases: mockFn(),
    createStatusHistory: mockFn(),
    createMilestone: mockFn(),
    findMilestone: mockFn(),
    createDiagnosis: mockFn(),
    // Con valor por defecto porque la lectura agregada del detalle los recorre
    // siempre; los tests que prueban el alta los sobreescriben.
    findDiagnosesByCase: mockFn().mockResolvedValue([]),
    createTeamMember: mockFn(),
    findTeamByCase: mockFn().mockResolvedValue([]),
    createLocation: mockFn(),
    findOpenLocation: mockFn(),
    createUtilizationEvent: mockFn(),
    createCancellation: mockFn(),
    createChargeItem: mockFn(),
    findChargeItemsByCase: mockFn(),
    findCases: mockFn().mockResolvedValue([]),
    countCasesMatching: mockFn().mockResolvedValue(0),
    findMilestonesByCase: mockFn().mockResolvedValue([]),
    findChargeItemsForUpdate: mockFn(),
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
  const credentialsRepo = {
    // Por defecto, toda credencial es vigente; los tests que prueban el bloqueo
    // por credencial vencida lo sobreescriben a false.
    hasCurrentCredential: mockFn().mockResolvedValue(true),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  // El alta de la condición cuando el diagnóstico llega por código; los casos
  // que pasan `conditionId` no lo tocan.
  const conditions = {
    create: mockFn().mockResolvedValue({ id: 'cond-nueva' }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Sólo los usa la lectura agregada del detalle del caso.
  const preopRepo = {
    findOrdersByCase: mockFn().mockResolvedValue([]),
    findAssessmentByCase: mockFn().mockResolvedValue(null),
    findAnesthesiaPlanByCase: mockFn().mockResolvedValue(null),
  };
  const intraopRepo = {
    findReportsByCase: mockFn().mockResolvedValue([]),
    findStepsByCase: mockFn().mockResolvedValue([]),
    findFindingsByCase: mockFn().mockResolvedValue([]),
    findImplantsByCase: mockFn().mockResolvedValue([]),
    findIdentifiersByImplants: mockFn().mockResolvedValue([]),
  };
  // Política clínica del paciente: por defecto, sin base (los tests que prueban
  // el detalle con un actor clínico la conceden).
  const clinicalRead = {
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
  };
  const service = new PeriopCasesService(
    em as any,
    casesRepo,
    preopRepo as any,
    intraopRepo as any,
    credentialsRepo as any,
    auditTrail as any,
    outbox as any,
    conditions as any,
    clinicalRead as any,
    new PeriopReacceptanceService(casesRepo as any, outbox as any),
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    clinicalRead,
    tx,
    casesRepo,
    preopRepo,
    intraopRepo,
    conditions,
    credentialsRepo,
    auditTrail,
    outbox,
    logger,
  };
}

/**
 * Ejecuta la operación schedule dto.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de schedule dto conforme al contrato `any`.
 */
function scheduleDto(overrides: Record<string, unknown> = {}): any {
  return {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    caseType: 'ELECTIVE' as const,
    priority: 'ROUTINE' as const,
    primarySurgeonProfileId: SURGEON,
    operatingRoomId: ROOM,
    scheduledStartAt: '2026-09-01T13:00:00Z',
    scheduledEndAt: '2026-09-01T15:00:00Z',
    ...overrides,
  };
}

describe('PeriopCasesService', () => {
  describe('scheduleCase (UC-53-01)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.casesRepo.findOverlappingCases.mockResolvedValue([]);
      d.casesRepo.countCases.mockResolvedValue(0);
      d.casesRepo.findCaseByNumber.mockResolvedValue(null);
      d.casesRepo.createCase.mockReturnValue({ id: CASE });
      d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });
    }

    it('schedules the case, reserves the room and seats the surgeon', async () => {
      const d = build();
      wire(d);

      const res = await d.service.scheduleCase(scheduleDto(), actor);

      expect(res).toMatchObject({
        id: CASE,
        caseNumber: 'CQ-000001',
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        milestoneId: 'milestone-1',
      });
      expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.OR_EVENT_RESERVED,
        }),
      );
      expect(d.casesRepo.createTeamMember).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practitionerProfileId: SURGEON,
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        }),
      );
    });

    it('records the first status transition with the case', async () => {
      const d = build();
      wire(d);

      await d.service.scheduleCase(scheduleDto(), actor);

      expect(d.casesRepo.createStatusHistory).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ toStatusConceptId: CONCEPTS.CASE_SCHEDULED }),
      );
    });

    it('refuses to double-book the operating room', async () => {
      const d = build();
      wire(d);
      d.casesRepo.findOverlappingCases.mockResolvedValue([
        { id: 'other-case' },
      ]);

      await expect(
        d.service.scheduleCase(scheduleDto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a window that ends before it starts', async () => {
      const d = build();

      await expect(
        d.service.scheduleCase(
          scheduleDto({
            scheduledStartAt: '2026-09-01T15:00:00Z',
            scheduledEndAt: '2026-09-01T13:00:00Z',
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('requires a justification on an urgent case', async () => {
      const d = build();

      await expect(
        d.service.scheduleCase(
          scheduleDto({ caseType: 'URGENT' as const }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts an emergency case with its justification', async () => {
      const d = build();
      wire(d);

      const res = await d.service.scheduleCase(
        scheduleDto({
          caseType: 'EMERGENCY' as const,
          priority: 'STAT' as const,
          urgencyReasonText: 'Hemorragia activa',
        }),
        actor,
      );

      expect(res.id).toBe(CASE);
    });
  });

  describe('addDiagnoses (UC-53-02)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param existing - Valor de existing requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, existing: any[] = []) {
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
      });
      d.casesRepo.findDiagnosesByCase.mockResolvedValue(existing);
      d.casesRepo.createDiagnosis.mockReturnValue({ id: 'dx-1' });
    }

    it('adds the diagnoses numbering them after the existing ones', async () => {
      const d = build();
      wire(d, [
        {
          conditionId: 'other',
          diagnosisRoleConceptId: CONCEPTS.DIAGNOSIS_ROLE_SECONDARY,
        },
      ]);

      const res = await d.service.addDiagnoses(
        CASE,
        { diagnoses: [{ conditionId: CONDITION, role: 'PRIMARY' as const }] },
        actor,
      );

      expect(res).toMatchObject({ diagnosisIds: ['dx-1'], skipped: 0 });
      expect(d.casesRepo.createDiagnosis.mock.calls[0][1].sequenceNumber).toBe(
        2,
      );
    });

    it('skips a condition already registered in the case', async () => {
      const d = build();
      wire(d, [
        {
          conditionId: CONDITION,
          diagnosisRoleConceptId: CONCEPTS.DIAGNOSIS_ROLE_SECONDARY,
        },
      ]);

      const res = await d.service.addDiagnoses(
        CASE,
        { diagnoses: [{ conditionId: CONDITION, role: 'SECONDARY' as const }] },
        actor,
      );

      expect(res).toMatchObject({ diagnosisIds: [], skipped: 1 });
    });

    it('refuses a second primary diagnosis', async () => {
      const d = build();
      wire(d, [
        {
          conditionId: 'other',
          diagnosisRoleConceptId: CONCEPTS.DIAGNOSIS_ROLE_PRIMARY,
        },
      ]);

      await expect(
        d.service.addDiagnoses(
          CASE,
          { diagnoses: [{ conditionId: CONDITION, role: 'PRIMARY' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses two primaries in the same request', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.addDiagnoses(
          CASE,
          {
            diagnoses: [
              { conditionId: CONDITION, role: 'PRIMARY' as const },
              { conditionId: 'other', role: 'PRIMARY' as const },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a cancelled case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_CANCELLED,
      });

      await expect(
        d.service.addDiagnoses(
          CASE,
          { diagnoses: [{ conditionId: CONDITION, role: 'PRIMARY' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('assignTeamMember (UC-53-02)', () => {
    const dto = { practitionerProfileId: SURGEON, role: 'ASSISTANT' as const };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param team - Valor de team requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, team: any[] = []) {
      const surgicalCase: any = {
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
      };
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.casesRepo.findTeamByCase.mockResolvedValue(team);
      d.casesRepo.createTeamMember.mockReturnValue({ id: 'member-1' });
      return surgicalCase;
    }

    it('assigns the member and reports the team size', async () => {
      const d = build();
      wire(d, [
        {
          practitionerProfileId: 'other',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        },
      ]);

      const res = await d.service.assignTeamMember(CASE, dto, actor);

      expect(res).toMatchObject({ id: 'member-1', teamSize: 2 });
    });

    it('sets the anesthesiologist on the case when that role is assigned', async () => {
      const d = build();
      const surgicalCase = wire(d);

      await d.service.assignTeamMember(
        CASE,
        { ...dto, role: 'ANESTHESIOLOGIST' as const },
        actor,
      );

      expect(surgicalCase.anesthesiologistProfileId).toBe(SURGEON);
    });

    it('rejects assigning the same person to the same role twice', async () => {
      const d = build();
      wire(d, [
        {
          practitionerProfileId: SURGEON,
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_ASSISTANT,
        },
      ]);

      await expect(
        d.service.assignTeamMember(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    /* -- API#840 · DOC-MOD-005: el equipo cambia, la aceptación se invalida -- */

    /** Un integrante que ya había aceptado. */
    function acceptedMember(over: Record<string, unknown> = {}): any {
      return {
        id: 'm-ok',
        practitionerProfileId: 'otro-profesional',
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        acceptedAt: new Date('2026-08-20T09:00:00Z'),
        ...over,
      };
    }

    it('sumar a alguien al equipo invalida las aceptaciones y devuelve el caso a pendiente', async () => {
      const d = build();
      const surgicalCase = wire(d);
      surgicalCase.statusConceptId = CONCEPTS.CASE_READY_FOR_SURGERY;
      surgicalCase.custodianTenantId = TENANT_A;
      const accepted = acceptedMember();
      d.casesRepo.findTeamByCase.mockResolvedValue([accepted]);

      await d.service.assignTeamMember(CASE, dto, actor);

      expect(accepted.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
      expect(accepted.acceptedAt).toBeUndefined();
      expect(surgicalCase.statusConceptId).toBe(CONCEPTS.CASE_SCHEDULED);
      expect(d.casesRepo.createStatusHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fromStatusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
          toStatusConceptId: CONCEPTS.CASE_SCHEDULED,
          reasonText: expect.stringContaining('teamComposition'),
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'periop.case.reacceptance_required',
          payloadJson: expect.objectContaining({
            changedFields: ['teamComposition'],
            acceptancesInvalidated: 1,
          }),
        }),
      );
      // El integrante nuevo nace sin aceptar, como siempre.
      expect(d.casesRepo.createTeamMember).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusConceptId: CONCEPTS.TEAM_ASSIGNED }),
      );
    });

    it('darle otro rol a quien ya estaba declara también el cambio de rol', async () => {
      const d = build();
      wire(d);
      d.casesRepo.findTeamByCase.mockResolvedValue([
        acceptedMember({
          practitionerProfileId: SURGEON,
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        }),
      ]);

      await d.service.assignTeamMember(CASE, dto, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payloadJson: expect.objectContaining({
            changedFields: ['teamComposition', 'teamRole'],
          }),
        }),
      );
    });

    it('armar el equipo de un caso sin aceptaciones no avisa a nadie', async () => {
      const d = build();
      wire(d, [
        {
          practitionerProfileId: 'otro',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        },
      ]);

      await d.service.assignTeamMember(CASE, dto, actor);

      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
    });

    it.each([CONCEPTS.SURGICAL_CASE_IN_PROGRESS, CONCEPTS.CASE_COMPLETED])(
      'con el caso ya en ejecución (%s) sumar un integrante no revoca lo aceptado',
      async (status) => {
        const d = build();
        const surgicalCase = wire(d);
        surgicalCase.statusConceptId = status;
        const accepted = acceptedMember();
        d.casesRepo.findTeamByCase.mockResolvedValue([accepted]);

        await d.service.assignTeamMember(CASE, dto, actor);

        expect(accepted.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
        expect(surgicalCase.statusConceptId).toBe(status);
        expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      },
    );

    it('un integrante repetido se rechaza antes de tocar las aceptaciones', async () => {
      const d = build();
      const accepted = acceptedMember({
        practitionerProfileId: SURGEON,
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_ASSISTANT,
      });
      wire(d, [accepted]);

      await expect(
        d.service.assignTeamMember(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(accepted.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('fails when the case does not exist', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(null);

      await expect(
        d.service.assignTeamMember(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('updateCase (C-13 · CAN-INT-001)', () => {
    const NEW_PATIENT = '99999999-9999-9999-9999-999999999999';

    /**
     * Ejecuta la operación draft case.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de draft case conforme al contrato `any`.
     */
    function draftCase(overrides: Record<string, unknown> = {}): any {
      return {
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        patientProfileId: PATIENT,
        primarySurgeonProfileId: SURGEON,
        ...overrides,
      };
    }

    it('corrects the patient on a draft case without dependencies', async () => {
      const d = build();
      const surgicalCase = draftCase();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      // Only the auto-seeded primary surgeon, no diagnoses: no dependencies.
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          practitionerProfileId: SURGEON,
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        },
      ]);
      d.casesRepo.findDiagnosesByCase.mockResolvedValue([]);

      const res = await d.service.updateCase(
        CASE,
        { patientProfileId: NEW_PATIENT },
        actor,
      );

      expect(res).toMatchObject({
        patientProfileId: NEW_PATIENT,
        patientChanged: true,
      });
      expect(surgicalCase.patientProfileId).toBe(NEW_PATIENT);
    });

    it('rejects changing the patient once past DRAFT (ready for surgery)', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        draftCase({ statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY }),
      );

      await expect(
        d.service.updateCase(
          CASE,
          { patientProfileId: NEW_PATIENT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects changing the patient on a confirmed/in-progress case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        draftCase({ statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS }),
      );

      await expect(
        d.service.updateCase(
          CASE,
          { patientProfileId: NEW_PATIENT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects changing the patient in DRAFT when the case has dependencies', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(draftCase());
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          practitionerProfileId: SURGEON,
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        },
      ]);
      // A diagnosis already tied to the current patient is a blocking dependency.
      d.casesRepo.findDiagnosesByCase.mockResolvedValue([{ id: 'dx-1' }]);

      await expect(
        d.service.updateCase(
          CASE,
          { patientProfileId: NEW_PATIENT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('allows editing other fields without touching the patient', async () => {
      const d = build();
      const surgicalCase = draftCase({
        statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
      });
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);

      const res = await d.service.updateCase(
        CASE,
        { urgencyReasonText: 'Actualización de la nota' },
        actor,
      );

      expect(res.patientChanged).toBe(false);
      expect(surgicalCase.urgencyReasonText).toBe('Actualización de la nota');
    });

    /* -- Spec 227-230: la aceptación vale para la versión aceptada ---------- */

    /** Caso confirmado, con un integrante que ya había aceptado. */
    function confirmedWithAcceptance() {
      const d = build();
      const surgicalCase = draftCase({
        statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
        custodianTenantId: TENANT,
        scheduledStartAt: new Date('2026-09-01T13:00:00Z'),
        scheduledEndAt: new Date('2026-09-01T15:00:00Z'),
      });
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      const member: any = {
        id: 'm-1',
        practitionerProfileId: SURGEON,
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        acceptedAt: new Date('2026-08-20T09:00:00Z'),
      };
      d.casesRepo.findTeamByCase.mockResolvedValue([member]);
      return { d, surgicalCase, member };
    }

    it('mover la fecha invalida las aceptaciones y devuelve el caso a pendiente', async () => {
      // Nadie aceptó operar otro día: mantener la aceptación afirmaría algo
      // que el integrante nunca dijo.
      const { d, surgicalCase, member } = confirmedWithAcceptance();

      const res = await d.service.updateCase(
        CASE,
        {
          scheduledStartAt: '2026-09-02T13:00:00Z',
          scheduledEndAt: '2026-09-02T15:00:00Z',
        },
        actor,
      );

      expect(res.reacceptanceRequired).toBe(true);
      expect(res.acceptancesInvalidated).toBe(1);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
      expect(member.acceptedAt).toBeUndefined();
      expect(surgicalCase.statusConceptId).toBe(CONCEPTS.CASE_SCHEDULED);
      expect(d.casesRepo.createStatusHistory).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fromStatusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
          toStatusConceptId: CONCEPTS.CASE_SCHEDULED,
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventType: 'periop.case.reacceptance_required',
        }),
      );
    });

    it('reenviar la misma fecha no invalida nada', async () => {
      // Una modificación que no cambia nada no es una modificación: pedir la
      // re-aceptación por un PATCH idempotente sería ruido puro.
      const { d, member } = confirmedWithAcceptance();

      const res = await d.service.updateCase(
        CASE,
        { scheduledStartAt: '2026-09-01T13:00:00Z' },
        actor,
      );

      expect(res.reacceptanceRequired).toBe(false);
      expect(res.acceptancesInvalidated).toBe(0);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('cambiar sólo la prioridad no invalida aceptaciones', async () => {
      // Spec 228: la lista de cambios que invalidan no incluye la prioridad —
      // no altera responsabilidades ni condiciones de participación.
      const { d, member } = confirmedWithAcceptance();

      const res = await d.service.updateCase(
        CASE,
        { priority: 'URGENT' },
        actor,
      );

      expect(res.reacceptanceRequired).toBe(false);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
    });
  });

  describe('confirmCase (C-14 · CAN-INT-002)', () => {
    it('confirms when every credentialed member is verified', async () => {
      const d = build();
      const surgicalCase: any = {
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        primarySurgeonProfileId: SURGEON,
      };
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          id: 'm-1',
          practitionerProfileId: 'prac-1',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        },
        {
          id: 'm-2',
          practitionerProfileId: 'prac-2',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_ANESTHESIOLOGIST,
          statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        },
      ]);

      const res = await d.service.confirmCase(CASE, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
        teamVerified: 2,
      });
      expect(surgicalCase.statusConceptId).toBe(
        CONCEPTS.CASE_READY_FOR_SURGERY,
      );
      expect(d.casesRepo.createStatusHistory).toHaveBeenCalled();
      // Verifica la credencial real de cada miembro con rol acreditado.
      expect(d.credentialsRepo.hasCurrentCredential).toHaveBeenCalledTimes(2);
      // CAN-AUDIT-001: sella la confirmación en la cadena WORM.
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        actor,
        expect.objectContaining({ action: 'PERIOP_CASE_CONFIRMED' }),
      );
    });

    it('blocks confirmation when a member is assigned but not accepted (fail-closed)', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        primarySurgeonProfileId: SURGEON,
      });
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          id: 'm-1',
          practitionerProfileId: 'prac-1',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          // Assigned but not accepted: credential not current.
          statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        },
      ]);

      await expect(
        d.service.confirmCase(CASE, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
      // CAN-INT-002: notifica el bloqueo al responsable/organización (outbox).
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'periop.case.confirmation_blocked',
        }),
      );
    });

    it('blocks confirmation when an accepted member has an expired/suspended credential (real vigency, fail-closed)', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        primarySurgeonProfileId: SURGEON,
      });
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          id: 'm-1',
          practitionerProfileId: 'prac-1',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          // Accepted, but the authoritative credential is NOT current.
          statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        },
      ]);
      d.credentialsRepo.hasCurrentCredential.mockResolvedValue(false);

      await expect(
        d.service.confirmCase(CASE, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.credentialsRepo.hasCurrentCredential).toHaveBeenCalledWith(
        d.tx,
        'prac-1',
        expect.any(Date),
      );
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
    });

    it('refuses to confirm a case that is not in a confirmable state', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_COMPLETED,
        primarySurgeonProfileId: SURGEON,
      });

      await expect(
        d.service.confirmCase(CASE, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the case does not exist', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(null);

      await expect(
        d.service.confirmCase(CASE, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('acceptTeamMember (C-14 · CAN-INT-002)', () => {
    /** Caso y equipo con un único integrante asignado. */
    function withTeam(statusConceptId = CONCEPTS.TEAM_ASSIGNED) {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
      });
      const member: any = {
        id: 'm-1',
        practitionerProfileId: 'prac-1',
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        statusConceptId,
      };
      d.casesRepo.findTeamByCase.mockResolvedValue([member]);
      return { d, member };
    }

    it('deja aceptado al propio integrante con credencial vigente', async () => {
      // Sin este acto, `confirmCase` no podía cumplirse nunca: todo miembro
      // nace ASSIGNED y nada escribía ACCEPTED.
      const { d, member } = withTeam();
      const titular = {
        id: 'user-9',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-1',
      };

      const res = await d.service.acceptTeamMember(CASE, 'm-1', titular as any);

      expect(res.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
    });

    it('rechaza que otro profesional acepte en su nombre', async () => {
      const { d, member } = withTeam();
      const other = {
        id: 'user-8',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-2',
      };

      await expect(
        d.service.acceptTeamMember(CASE, 'm-1', other as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
    });

    it('rechaza al integrante sin credencial profesional vigente', async () => {
      const { d, member } = withTeam();
      d.credentialsRepo.hasCurrentCredential.mockResolvedValue(false);
      const titular = {
        id: 'user-9',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-1',
      };

      await expect(
        d.service.acceptTeamMember(CASE, 'm-1', titular as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ASSIGNED);
    });

    it('aceptar dos veces no es un error', async () => {
      const { d } = withTeam(CONCEPTS.TEAM_ACCEPTED);
      const titular = {
        id: 'user-9',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-1',
      };

      const res = await d.service.acceptTeamMember(CASE, 'm-1', titular as any);

      expect(res.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
    });

    it('la administración perioperatoria puede aceptar por el integrante', async () => {
      const { d, member } = withTeam();

      await d.service.acceptTeamMember(CASE, 'm-1', actor as any);

      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
    });

    it('rechaza al integrante que no pertenece al caso', async () => {
      const { d } = withTeam();

      await expect(
        d.service.acceptTeamMember(CASE, 'otro-id', actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('sella la fecha y hora de la aceptación (spec 163)', async () => {
      const { d, member } = withTeam();
      const titular = {
        id: 'user-9',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-1',
      };

      await d.service.acceptTeamMember(CASE, 'm-1', titular as any);

      expect(member.acceptedAt).toBeInstanceOf(Date);
    });
  });

  describe('respondTeamMember (spec 164 · 166 · 168)', () => {
    /** Caso y equipo con un único integrante aceptado. */
    function withTeam(statusConceptId = CONCEPTS.TEAM_ACCEPTED) {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        custodianTenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        primarySurgeonProfileId: SURGEON,
      });
      const member: any = {
        id: 'm-1',
        practitionerProfileId: 'prac-1',
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_ASSISTANT,
        statusConceptId,
        acceptedAt: new Date('2026-08-14T10:00:00Z'),
      };
      d.casesRepo.findTeamByCase.mockResolvedValue([member]);
      const titular = {
        id: 'user-9',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-1',
      };
      return { d, member, titular };
    }

    it.each([
      ['DECLINE', PERIOP.TEAM_DECLINED],
      ['REQUEST_CHANGE', PERIOP.TEAM_CHANGE_REQUESTED],
      ['UNAVAILABLE', PERIOP.TEAM_UNAVAILABLE],
    ])(
      'la respuesta %s deja al integrante en su propio estado',
      async (response, expected) => {
        // Las tres son distinguibles a propósito: pedir un cambio no es
        // rechazar, y al responsable le cambia qué hacer a continuación.
        const { d, member, titular } = withTeam();

        const res = await d.service.respondTeamMember(
          CASE,
          'm-1',
          { response, reasonText: 'Motivo declarado' } as any,
          titular as any,
        );

        expect(res.statusConceptId).toBe(expected);
        expect(member.statusConceptId).toBe(expected);
      },
    );

    it('borra la aceptación previa: el integrante ya no está dentro', async () => {
      const { d, member, titular } = withTeam();

      await d.service.respondTeamMember(
        CASE,
        'm-1',
        { response: 'DECLINE', reasonText: 'Conflicto de agenda' } as any,
        titular as any,
      );

      expect(member.acceptedAt).toBeUndefined();
    });

    it('notifica al responsable y a la organización (spec 166)', async () => {
      const { d, titular } = withTeam();

      await d.service.respondTeamMember(
        CASE,
        'm-1',
        { response: 'DECLINE', reasonText: 'Conflicto de agenda' } as any,
        titular as any,
      );

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tenantId: TENANT,
          eventType: 'periop.case.team_participation_declined',
          payloadJson: expect.objectContaining({
            response: 'DECLINE',
            reasonText: 'Conflicto de agenda',
            responsibleProfileId: SURGEON,
          }),
        }),
      );
      expect(d.auditTrail.record).toHaveBeenCalled();
    });

    it('rechaza que otro profesional responda en su nombre (spec 168)', async () => {
      const { d, member } = withTeam();
      const other = {
        id: 'user-8',
        roles: ['SURGEON'],
        practitionerProfileId: 'prac-2',
      };

      await expect(
        d.service.respondTeamMember(
          CASE,
          'm-1',
          { response: 'DECLINE', reasonText: 'Motivo' } as any,
          other as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(member.statusConceptId).toBe(CONCEPTS.TEAM_ACCEPTED);
    });

    it('rechaza responder sobre un caso cancelado', async () => {
      const { d, titular } = withTeam();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        custodianTenantId: TENANT,
        statusConceptId: CONCEPTS.CASE_CANCELLED,
      });

      await expect(
        d.service.respondTeamMember(
          CASE,
          'm-1',
          { response: 'DECLINE', reasonText: 'Motivo' } as any,
          titular as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza al integrante que no pertenece al caso', async () => {
      const { d, titular } = withTeam();

      await expect(
        d.service.respondTeamMember(
          CASE,
          'otro-id',
          { response: 'DECLINE', reasonText: 'Motivo' } as any,
          titular as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('cancelCase (UC-53-13)', () => {
    const dto = {
      cancellationReasonConceptId: REASON,
      category: 'PATIENT' as const,
      preventable: true,
    };

    it('cancels the case and releases the operating room', async () => {
      const d = build();
      const surgicalCase: any = {
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        operatingRoomId: ROOM,
      };
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.casesRepo.createCancellation.mockReturnValue({ id: 'cancel-1' });

      const res = await d.service.cancelCase(CASE, dto, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.CASE_CANCELLED,
        cancellationId: 'cancel-1',
        operatingRoomReleased: true,
      });
      expect(surgicalCase.statusConceptId).toBe(CONCEPTS.CASE_CANCELLED);
      expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.OR_EVENT_SLOT_RELEASED,
        }),
      );
    });

    it('records whether the cancellation was preventable', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
      });
      d.casesRepo.createCancellation.mockReturnValue({ id: 'cancel-1' });

      await d.service.cancelCase(CASE, { ...dto, preventable: false }, actor);

      expect(d.casesRepo.createCancellation).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          preventableConceptId: CONCEPTS.PREVENTABLE_NO,
        }),
      );
    });

    it('rejects cancelling twice', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_CANCELLED,
      });

      await expect(
        d.service.cancelCase(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to cancel a completed case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_COMPLETED,
      });

      await expect(
        d.service.cancelCase(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('postCharges (UC-53-14)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        items: [
          {
            chargeType: 'PROCEDURE' as const,
            billableItemId: BILLABLE,
            quantity: '1',
            unitPrice: '1500.00',
          },
          {
            chargeType: 'IMPLANT' as const,
            billableItemId: BILLABLE,
            quantity: '2',
            unitPrice: '250.00',
          },
        ],
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación completed case.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de completed case conforme al contrato `any`.
     */
    function completedCase(overrides: Record<string, unknown> = {}): any {
      return {
        id: CASE,
        statusConceptId: CONCEPTS.CASE_COMPLETED,
        operatingRoomId: ROOM,
        scheduledStartAt: new Date('2026-09-01T13:00:00Z'),
        scheduledEndAt: new Date('2026-09-01T15:00:00Z'),
        actualStartAt: new Date('2026-09-01T13:10:00Z'),
        actualEndAt: new Date('2026-09-01T15:40:00Z'),
        ...overrides,
      };
    }

    it('posts the charges and totals them', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(completedCase());
      d.casesRepo.findChargeItemsForUpdate.mockResolvedValue([]);

      const res = await d.service.postCharges(CASE, dto(), actor);

      expect(res).toMatchObject({ charged: 2, totalAmount: '2000.00' });
    });

    it('consolidates the real operating room usage and its variance', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(completedCase());
      d.casesRepo.findChargeItemsForUpdate.mockResolvedValue([]);

      const res = await d.service.postCharges(CASE, dto(), actor);

      // Real 2 h 30 min contra 2 h programadas: media hora de más.
      expect(res.actualDurationSeconds).toBe(9000);
      expect(res.scheduleVarianceSeconds).toBe(1800);
      expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.OR_EVENT_CASE_END,
        }),
      );
    });

    it('records the turnover when it is reported', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(completedCase());
      d.casesRepo.findChargeItemsForUpdate.mockResolvedValue([]);

      await d.service.postCharges(CASE, dto({ turnoverSeconds: 900 }), actor);

      expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.OR_EVENT_TURNOVER,
          durationSeconds: '900',
        }),
      );
    });

    it('refuses to bill a case that is not completed', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        completedCase({ statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS }),
      );

      await expect(
        d.service.postCharges(CASE, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to bill the same case twice', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(completedCase());
      d.casesRepo.findChargeItemsForUpdate.mockResolvedValue([
        { id: 'charge-prev', statusConceptId: CONCEPTS.CHARGE_POSTED },
      ]);

      await expect(
        d.service.postCharges(CASE, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  /**
   * El detalle del caso tenía escrituras sin lectura: pasos, hallazgos e
   * implantes se registraban por `POST` y no salían por ninguna parte de la API,
   * así que el histórico de procedimientos del punto 7 era inalcanzable desde el
   * frontend. Estas pruebas fijan que ahora salen.
   */
  describe('getCaseDetail', () => {
    /** El caso mínimo que la lectura necesita para no abortar. */
    const readCase = {
      id: CASE,
      caseNumber: 'CX-1',
      patientProfileId: PATIENT,
      statusConceptId: CONCEPTS.CASE_COMPLETED,
    };

    it('devuelve pasos, hallazgos e implantes del caso', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(readCase);
      d.intraopRepo.findStepsByCase.mockResolvedValue([
        {
          id: 'step-1',
          stepNumber: 1,
          stepCodeConceptId: 'code-1',
          description: 'Abordaje',
          statusConceptId: 'st-1',
        },
      ]);
      d.intraopRepo.findFindingsByCase.mockResolvedValue([
        {
          id: 'find-1',
          findingCodeConceptId: 'code-2',
          findingText: 'Adherencias',
          recordedAt: new Date('2026-08-01T10:00:00.000Z'),
        },
      ]);
      d.intraopRepo.findImplantsByCase.mockResolvedValue([
        {
          id: 'imp-1',
          procedureId: 'proc-1',
          implantDeviceId: 'dev-1',
          implantRoleConceptId: 'role-1',
          implantedAt: new Date('2026-08-01T11:00:00.000Z'),
        },
      ]);

      const detail = await d.service.getCaseDetail(CASE, actor);

      expect(detail.operativeSteps).toHaveLength(1);
      expect(detail.operativeSteps[0].description).toBe('Abordaje');
      expect(detail.findings[0].findingText).toBe('Adherencias');
      expect(detail.implants[0].implantDeviceId).toBe('dev-1');
    });

    /**
     * El lote es lo que hace trazable a un implante: una alerta de retiro del
     * mercado se resuelve por lote, no por modelo. Va anidado en su implante y
     * no en una lista suelta que el cliente tenga que volver a cruzar.
     */
    it('anida los identificadores dentro de su implante', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(readCase);
      d.intraopRepo.findImplantsByCase.mockResolvedValue([
        {
          id: 'imp-1',
          procedureId: 'p',
          implantDeviceId: 'd',
          implantRoleConceptId: 'r',
          implantedAt: new Date(),
        },
        {
          id: 'imp-2',
          procedureId: 'p',
          implantDeviceId: 'd',
          implantRoleConceptId: 'r',
          implantedAt: new Date(),
        },
      ]);
      d.intraopRepo.findIdentifiersByImplants.mockResolvedValue([
        {
          id: 'id-1',
          procedureImplantId: 'imp-1',
          identifierTypeConceptId: 'udi',
          identifierValue: '0123456789',
          lotNumber: 'L-42',
        },
        {
          id: 'id-2',
          procedureImplantId: 'imp-1',
          identifierTypeConceptId: 'serial',
          identifierValue: 'S-7',
        },
      ]);

      const detail = await d.service.getCaseDetail(CASE, actor);

      expect(d.intraopRepo.findIdentifiersByImplants).toHaveBeenCalledWith(
        expect.anything(),
        ['imp-1', 'imp-2'],
      );
      expect(detail.implants[0].identifiers).toHaveLength(2);
      expect(detail.implants[0].identifiers[0].lotNumber).toBe('L-42');
      // El implante sin identificadores trae un arreglo vacío, no `undefined`:
      // el cliente no debería tener que distinguir «sin lote» de «sin dato».
      expect(detail.implants[1].identifiers).toEqual([]);
    });

    it('un caso sin registro intraoperatorio devuelve listas vacías', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(readCase);

      const detail = await d.service.getCaseDetail(CASE, actor);

      expect(detail.operativeSteps).toEqual([]);
      expect(detail.findings).toEqual([]);
      expect(detail.implants).toEqual([]);
    });

    it('sin implantes no se consulta la tabla de identificadores', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(readCase);

      await d.service.getCaseDetail(CASE, actor);

      expect(d.intraopRepo.findIdentifiersByImplants).toHaveBeenCalledWith(
        expect.anything(),
        [],
      );
    });

    it('un caso inexistente sigue siendo 404', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(null);

      await expect(d.service.getCaseDetail(CASE, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});

/** Aserciones del 404 uniforme de PERIOP-01. */
async function expectCaseNotFound(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe('Caso quirúrgico no encontrado');
  expect(exception.reason).toBe(
    ProceduresPerioperativeErrorReason.PERIOP_CASE_NOT_FOUND,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('PeriopCasesService · alcance de tenant (PERIOP-01)', () => {
  const ownCase = (overrides: Record<string, unknown> = {}): any => ({
    id: CASE,
    custodianTenantId: TENANT_A,
    patientProfileId: PATIENT,
    caseNumber: 'CQ-0001',
    statusConceptId: CONCEPTS.CASE_SCHEDULED,
    ...overrides,
  });
  const foreignCase = (overrides: Record<string, unknown> = {}): any =>
    ownCase({ custodianTenantId: TENANT_B, ...overrides });
  const clinician = {
    id: 'user-2',
    roles: ['SURGEON'],
    practitionerProfileId: SURGEON,
  } as any;

  describe('detalle y equipo por UUID', () => {
    it('el detalle de un caso de otro tenant: 404 uniforme, igual que inexistente, y no lee nada del caso', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(foreignCase());
      const foreign = await expectCaseNotFound(
        d.service.getCaseDetail(CASE, actor),
      );
      d.casesRepo.findCaseById.mockResolvedValue(null);
      const missing = await expectCaseNotFound(
        d.service.getCaseDetail(CASE, actor),
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.casesRepo.findDiagnosesByCase).not.toHaveBeenCalled();
      expect(d.casesRepo.findTeamByCase).not.toHaveBeenCalled();
      expect(d.preopRepo.findOrdersByCase).not.toHaveBeenCalled();
      expect(d.intraopRepo.findImplantsByCase).not.toHaveBeenCalled();
    });

    it('la consulta del detalle lleva el tenant del contexto, el mismo de la agenda', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(ownCase());

      await d.service.getCaseDetail(CASE, actor);
      await d.service.listCases(TENANT_A, {} as any);

      expect(d.casesRepo.findCaseById).toHaveBeenCalledWith(
        expect.anything(),
        CASE,
        TENANT_A,
      );
      expect(d.casesRepo.findCases).toHaveBeenCalledWith(
        expect.anything(),
        TENANT_A,
        expect.anything(),
      );
    });

    it('sin tenant en el contexto no se lee el detalle ni el equipo', async () => {
      const d = build();

      await expect(d.raw.getCaseDetail(CASE, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      await expect(d.raw.listTeamMembers(CASE)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.casesRepo.findCaseById).not.toHaveBeenCalled();
    });

    it('el equipo de un caso de otro tenant: 404 uniforme y no lista a nadie', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(foreignCase());

      await expectCaseNotFound(d.service.listTeamMembers(CASE));

      expect(d.casesRepo.findTeamByCase).not.toHaveBeenCalled();
    });

    it('el equipo del caso propio se lista', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(ownCase());
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          id: 'm-1',
          practitionerProfileId: SURGEON,
          teamRoleConceptId: 'role',
          statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        },
      ]);

      const team = await d.service.listTeamMembers(CASE);

      expect(team).toHaveLength(1);
    });
  });

  describe('autorización clínica sobre el paciente (detalle)', () => {
    it('el integrante del equipo lee el detalle sin pasar por la política de la historia', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(
        ownCase({ primarySurgeonProfileId: 'otro' }),
      );
      d.casesRepo.findTeamByCase.mockResolvedValue([
        { id: 'm-1', practitionerProfileId: SURGEON },
      ]);

      const detail = await d.service.getCaseDetail(CASE, clinician);

      expect(detail.case.id).toBe(CASE);
      expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it('el cirujano principal lee el detalle', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(
        ownCase({ primarySurgeonProfileId: SURGEON }),
      );

      const detail = await d.service.getCaseDetail(CASE, clinician);

      expect(detail.case.id).toBe(CASE);
    });

    it('un profesional ajeno al caso con base clínica sobre el paciente lo lee', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(ownCase());

      await d.service.getCaseDetail(CASE, clinician);

      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        PATIENT,
        clinician,
      );
    });

    it('un profesional ajeno al caso y sin base clínica: el mismo 404, sin datos clínicos', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(ownCase());
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new ForbiddenException(
          'Sólo puede consultar su propia historia clínica.',
        ),
      );

      await expectCaseNotFound(d.service.getCaseDetail(CASE, clinician));

      expect(d.casesRepo.findDiagnosesByCase).not.toHaveBeenCalled();
      expect(d.preopRepo.findAssessmentByCase).not.toHaveBeenCalled();
    });

    it('una caída de la política no se disfraza de 404', async () => {
      const d = build();
      d.casesRepo.findCaseById.mockResolvedValue(ownCase());
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new Error('db down'),
      );

      await expect(d.service.getCaseDetail(CASE, clinician)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('mutaciones por UUID de caso', () => {
    it('modificar el caso de otro tenant: 404 uniforme, sin tocarlo', async () => {
      const d = build();
      const foreign = foreignCase();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(foreign);

      await expectCaseNotFound(
        d.service.updateCase(CASE, { priority: 'URGENT' } as any, actor),
      );

      expect(foreign.priorityConceptId).toBeUndefined();
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
    });

    it('el tenant del contexto viaja a la consulta que bloquea el caso', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(null);

      await expectCaseNotFound(d.service.confirmCase(CASE, actor));

      expect(d.casesRepo.findCaseForUpdate).toHaveBeenCalledWith(
        d.tx,
        CASE,
        TENANT_A,
      );
    });

    it.each([
      [
        'confirmar',
        (d: ReturnType<typeof build>) => d.service.confirmCase(CASE, actor),
      ],
      [
        'agregar diagnósticos',
        (d: ReturnType<typeof build>) =>
          d.service.addDiagnoses(CASE, { diagnoses: [] } as any, actor),
      ],
      [
        'asignar integrante',
        (d: ReturnType<typeof build>) =>
          d.service.assignTeamMember(
            CASE,
            { practitionerProfileId: SURGEON } as any,
            actor,
          ),
      ],
      [
        'aceptar participación',
        (d: ReturnType<typeof build>) =>
          d.service.acceptTeamMember(CASE, 'm-1', actor),
      ],
      [
        'responder participación',
        (d: ReturnType<typeof build>) =>
          d.service.respondTeamMember(CASE, 'm-1', {} as any, actor),
      ],
      [
        'cancelar',
        (d: ReturnType<typeof build>) =>
          d.service.cancelCase(CASE, {} as any, actor),
      ],
      [
        'cargar cargos',
        (d: ReturnType<typeof build>) =>
          d.service.postCharges(CASE, { items: [] } as any, actor),
      ],
    ])(
      '%s en el caso de otro tenant: 404 uniforme y no persiste',
      async (_name, call) => {
        const d = build();
        d.casesRepo.findCaseForUpdate.mockResolvedValue(foreignCase());

        await expectCaseNotFound(call(d));

        expect(d.casesRepo.createDiagnosis).not.toHaveBeenCalled();
        expect(d.casesRepo.createTeamMember).not.toHaveBeenCalled();
        expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
        expect(d.casesRepo.createCancellation).not.toHaveBeenCalled();
        expect(d.casesRepo.createChargeItem).not.toHaveBeenCalled();
      },
    );

    describe('primaryProcedureId del cliente (#864)', () => {
      /**
       * Deja listo el alta del caso para que lo único que pueda fallar sea el
       * procedimiento.
       *
       * @param d - Sistema bajo prueba.
       */
      function wireSchedule(d: ReturnType<typeof build>) {
        d.casesRepo.findOverlappingCases.mockResolvedValue([]);
        d.casesRepo.countCases.mockResolvedValue(0);
        d.casesRepo.findCaseByNumber.mockResolvedValue(null);
        d.casesRepo.createCase.mockReturnValue({ id: CASE });
        d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });
      }

      it('busca el procedimiento con el paciente del caso y el tenant del contexto, no el del cuerpo', async () => {
        const d = build();
        wireSchedule(d);

        await d.service.scheduleCase(
          scheduleDto({
            primaryProcedureId: PROCEDURE,
            custodianTenantId: TENANT_B,
          }),
          actor,
        );

        expect(d.casesRepo.findProcedureOfPatient).toHaveBeenCalledWith(
          d.tx,
          PROCEDURE,
          PATIENT,
          TENANT_A,
        );
        expect(d.casesRepo.createCase.mock.calls[0][1].primaryProcedureId).toBe(
          PROCEDURE,
        );
      });

      it('rechaza con 404 el procedimiento de otro paciente o de otro tenant y no crea el caso', async () => {
        const d = build();
        wireSchedule(d);
        // La consulta filtra por paciente y tenant: uno ajeno no vuelve.
        d.casesRepo.findProcedureOfPatient.mockResolvedValue(null);

        const error = await d.service
          .scheduleCase(scheduleDto({ primaryProcedureId: PROCEDURE }), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect((error as ResourceNotFoundException).reason).toBe(
          ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND,
        );
        expect(d.casesRepo.createCase).not.toHaveBeenCalled();
        expect(d.casesRepo.createUtilizationEvent).not.toHaveBeenCalled();
      });

      it('no se fía del filtro de la consulta: una fila de otro paciente o tenant también es 404', async () => {
        for (const foreign of [
          { patientProfileId: 'otro-paciente', custodianTenantId: TENANT_A },
          { patientProfileId: PATIENT, custodianTenantId: TENANT_B },
        ]) {
          const d = build();
          wireSchedule(d);
          d.casesRepo.findProcedureOfPatient.mockResolvedValue({
            id: PROCEDURE,
            ...foreign,
          });

          await expect(
            d.service.scheduleCase(
              scheduleDto({ primaryProcedureId: PROCEDURE }),
              actor,
            ),
          ).rejects.toMatchObject({
            reason: ProceduresPerioperativeErrorReason.PROCEDURE_NOT_FOUND,
          });
          expect(d.casesRepo.createCase).not.toHaveBeenCalled();
        }
      });

      it('el procedimiento ajeno y el inexistente responden idéntico (mismo mensaje, sin details)', async () => {
        const responses: unknown[] = [];
        for (const found of [
          null,
          {
            id: PROCEDURE,
            patientProfileId: 'otro',
            custodianTenantId: TENANT_A,
          },
        ]) {
          const d = build();
          wireSchedule(d);
          d.casesRepo.findProcedureOfPatient.mockResolvedValue(found);
          const error: any = await d.service
            .scheduleCase(scheduleDto({ primaryProcedureId: PROCEDURE }), actor)
            .catch((e: unknown) => e);
          responses.push({
            message: error.message,
            reason: error.reason,
            details: error.details,
          });
        }
        expect(responses[0]).toEqual(responses[1]);
        expect((responses[0] as any).details).toBeUndefined();
      });

      it('sin primaryProcedureId no consulta ningún procedimiento', async () => {
        const d = build();
        wireSchedule(d);

        await d.service.scheduleCase(scheduleDto(), actor);

        expect(d.casesRepo.findProcedureOfPatient).not.toHaveBeenCalled();
      });
    });

    it('programar un caso toma el tenant custodio del contexto e ignora el del cuerpo', async () => {
      const d = build();
      d.casesRepo.findOverlappingCases.mockResolvedValue([]);
      d.casesRepo.countCases.mockResolvedValue(0);
      d.casesRepo.findCaseByNumber.mockResolvedValue(null);
      d.casesRepo.createCase.mockReturnValue({ id: CASE });
      d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });

      await d.service.scheduleCase(
        scheduleDto({ custodianTenantId: TENANT_B }),
        actor,
      );

      expect(d.casesRepo.createCase.mock.calls[0][1].custodianTenantId).toBe(
        TENANT_A,
      );
    });
  });
});
