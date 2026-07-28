import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopCasesService } from './periop-cases.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PERIOP_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';
const SURGEON = '33333333-3333-3333-3333-333333333333';
const ROOM = '44444444-4444-4444-4444-444444444444';
const CASE = '55555555-5555-5555-5555-555555555555';
const CONDITION = '66666666-6666-6666-6666-666666666666';
const REASON = '77777777-7777-7777-7777-777777777777';
const BILLABLE = '88888888-8888-8888-8888-888888888888';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const casesRepo = {
    createCase: mockFn(),
    findCaseById: mockFn(),
    findCaseForUpdate: mockFn(),
    findCaseByNumber: mockFn(),
    countCases: mockFn(),
    findOverlappingCases: mockFn(),
    createStatusHistory: mockFn(),
    createMilestone: mockFn(),
    findMilestone: mockFn(),
    createDiagnosis: mockFn(),
    findDiagnosesByCase: mockFn(),
    createTeamMember: mockFn(),
    findTeamByCase: mockFn(),
    createLocation: mockFn(),
    findOpenLocation: mockFn(),
    createUtilizationEvent: mockFn(),
    createCancellation: mockFn(),
    createChargeItem: mockFn(),
    findChargeItemsByCase: mockFn(),
    findChargeItemsForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PeriopCasesService(em as any, casesRepo, logger as any);
  return { service, tx, casesRepo, logger };
}

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
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          statusConceptId: CONCEPTS.TEAM_ACCEPTED,
        },
        {
          id: 'm-2',
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
    });

    it('blocks confirmation when a member has no current credential (fail-closed)', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue({
        id: CASE,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        primarySurgeonProfileId: SURGEON,
      });
      d.casesRepo.findTeamByCase.mockResolvedValue([
        {
          id: 'm-1',
          teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          // Assigned but not accepted/verified: credential not current.
          statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        },
      ]);

      await expect(
        d.service.confirmCase(CASE, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.casesRepo.createStatusHistory).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
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
});
