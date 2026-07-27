import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopPreopService } from './periop-preop.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['ANESTHESIOLOGIST'] };
const CASE = '11111111-1111-1111-1111-111111111111';
const PROFILE = '22222222-2222-2222-2222-222222222222';
const CHECKLIST = '33333333-3333-3333-3333-333333333333';
const PLAN = '44444444-4444-4444-4444-444444444444';
const ORDER = '55555555-5555-5555-5555-555555555555';
const ITEM = '66666666-6666-6666-6666-666666666666';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const preopRepo = {
    createAssessment: mockFn(),
    findAssessmentByCase: mockFn(),
    createRiskScore: mockFn(),
    createOrder: mockFn(),
    findOrdersByCaseForUpdate: mockFn(),
    createChecklist: mockFn(),
    findChecklistForUpdate: mockFn(),
    findChecklistByCase: mockFn(),
    findItemsByPhase: mockFn(),
    findItemById: mockFn(),
    createResponse: mockFn(),
    findResponsesByChecklist: mockFn(),
    createAnesthesiaPlan: mockFn(),
    findAnesthesiaPlanForUpdate: mockFn(),
    findAnesthesiaPlanByCase: mockFn(),
    createAirwayAssessment: mockFn(),
    createAnesthesiaEvent: mockFn(),
  };
  const casesRepo = {
    findCaseForUpdate: mockFn(),
    createMilestone: mockFn(),
    findMilestone: mockFn(),
    createStatusHistory: mockFn(),
    createUtilizationEvent: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PeriopPreopService(
    em as any,
    preopRepo,
    casesRepo as any,
    logger as any,
  );
  return { service, tx, preopRepo, casesRepo, logger };
}

function scheduledCase(overrides: Record<string, unknown> = {}): any {
  return { id: CASE, statusConceptId: CONCEPTS.CASE_SCHEDULED, ...overrides };
}

describe('PeriopPreopService', () => {
  describe('createAssessment (UC-53-03)', () => {
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        assessmentType: 'ANESTHESIA' as const,
        assessedByProfileId: PROFILE,
        fitnessStatus: 'FIT' as const,
        allergiesReviewed: true,
        medicationsReviewed: true,
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>) {
      d.casesRepo.findCaseForUpdate.mockResolvedValue(scheduledCase());
      d.preopRepo.findAssessmentByCase.mockResolvedValue(null);
      d.preopRepo.createAssessment.mockReturnValue({ id: 'assess-1' });
      d.preopRepo.createRiskScore.mockReturnValue({ id: 'risk-1' });
      d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });
    }

    it('records the assessment and reaches the clearance milestone', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createAssessment(CASE, dto(), actor);

      expect(res).toMatchObject({
        id: 'assess-1',
        fitnessStatusConceptId: CONCEPTS.FITNESS_FIT,
        milestoneId: 'milestone-1',
      });
    });

    it('stores the risk scores with their model and version', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createAssessment(
        CASE,
        dto({
          riskScores: [
            { model: 'RCRI' as const, modelVersion: 'v2', scoreValue: '2' },
          ],
        }),
        actor,
      );

      expect(res.riskScoreIds).toEqual(['risk-1']);
      expect(d.preopRepo.createRiskScore).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          riskModelConceptId: CONCEPTS.RISK_MODEL_RCRI,
          modelVersion: 'v2',
          riskCategoryConceptId: CONCEPTS.RISK_CATEGORY_MODERATE,
        }),
      );
    });

    it('does not clear an unfit patient, and warns', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createAssessment(
        CASE,
        dto({ fitnessStatus: 'UNFIT' as const }),
        actor,
      );

      expect(res.milestoneId).toBeUndefined();
      expect(d.casesRepo.createMilestone).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses an assessment without reviewing allergies', async () => {
      const d = build();

      await expect(
        d.service.createAssessment(
          CASE,
          dto({ allergiesReviewed: false }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a second assessment on the same case', async () => {
      const d = build();
      wire(d);
      d.preopRepo.findAssessmentByCase.mockResolvedValue({ id: 'assess-prev' });

      await expect(
        d.service.createAssessment(CASE, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('verifyOrders (UC-53-04)', () => {
    const dto = { orderIds: [ORDER], verifiedByProfileId: PROFILE };

    function order(overrides: Record<string, unknown> = {}): any {
      return {
        id: ORDER,
        statusConceptId: CONCEPTS.ORDER_PENDING,
        ...overrides,
      };
    }

    it('moves the case to ready when nothing is pending', async () => {
      const d = build();
      const surgicalCase = scheduledCase();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.preopRepo.findOrdersByCaseForUpdate.mockResolvedValue([order()]);

      const res = await d.service.verifyOrders(CASE, dto, actor);

      expect(res).toMatchObject({
        verified: 1,
        pendingMandatory: 0,
        statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
      });
      expect(surgicalCase.statusConceptId).toBe(
        CONCEPTS.CASE_READY_FOR_SURGERY,
      );
    });

    it('keeps the case scheduled while an order is still pending', async () => {
      const d = build();
      const surgicalCase = scheduledCase();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.preopRepo.findOrdersByCaseForUpdate.mockResolvedValue([
        order(),
        order({ id: 'order-2' }),
      ]);

      const res = await d.service.verifyOrders(CASE, dto, actor);

      expect(res).toMatchObject({
        verified: 1,
        pendingMandatory: 1,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
      });
      expect(surgicalCase.statusConceptId).toBe(CONCEPTS.CASE_SCHEDULED);
    });

    it('does not re-verify an order that was already verified', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(scheduledCase());
      d.preopRepo.findOrdersByCaseForUpdate.mockResolvedValue([
        order({ statusConceptId: CONCEPTS.ORDER_VERIFIED }),
      ]);

      const res = await d.service.verifyOrders(CASE, dto, actor);

      expect(res.verified).toBe(0);
    });

    it('fails when an order does not belong to the case', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(scheduledCase());
      d.preopRepo.findOrdersByCaseForUpdate.mockResolvedValue([]);

      await expect(
        d.service.verifyOrders(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses verification on a case that is no longer scheduled', async () => {
      const d = build();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(
        scheduledCase({ statusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS }),
      );

      await expect(
        d.service.verifyOrders(CASE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('submitChecklistPhase (UC-53-05)', () => {
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        phase: 'TIME_OUT' as const,
        respondedByProfileId: PROFILE,
        responses: [
          { itemId: ITEM, status: 'CONFIRMED' as const, responseBoolean: true },
        ],
        ...overrides,
      };
    }

    function wire(
      d: ReturnType<typeof build>,
      items: any[] = [{ id: ITEM, isMandatory: true }],
    ) {
      const checklist: any = {
        id: CHECKLIST,
        procedureCaseId: CASE,
        checklistTypeConceptId: CONCEPTS.CHECKLIST_WHO,
        checklistVersion: '2009',
        statusConceptId: CONCEPTS.CHECKLIST_IN_PROGRESS,
      };
      d.preopRepo.findChecklistForUpdate.mockResolvedValue(checklist);
      d.preopRepo.findItemsByPhase.mockResolvedValue(items);
      d.preopRepo.findResponsesByChecklist.mockResolvedValue([]);
      d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });
      return checklist;
    }

    it('records the responses and completes the phase', async () => {
      const d = build();
      const checklist = wire(d);

      const res = await d.service.submitChecklistPhase(
        CASE,
        CHECKLIST,
        dto(),
        actor,
      );

      expect(res).toMatchObject({
        recorded: 1,
        phaseCompleted: true,
        milestoneId: 'milestone-1',
      });
      expect(checklist.timeOutCompletedAt).toBeInstanceOf(Date);
    });

    it('leaves the phase open while a mandatory item is unanswered', async () => {
      const d = build();
      wire(d, [
        { id: ITEM, isMandatory: true },
        { id: 'item-2', isMandatory: true },
      ]);

      const res = await d.service.submitChecklistPhase(
        CASE,
        CHECKLIST,
        dto(),
        actor,
      );

      expect(res.phaseCompleted).toBe(false);
      expect(res.milestoneId).toBeUndefined();
    });

    it('completes the checklist when the three phases are done', async () => {
      const d = build();
      const checklist = wire(d);
      checklist.signInCompletedAt = new Date();
      checklist.timeOutCompletedAt = new Date();

      await d.service.submitChecklistPhase(
        CASE,
        CHECKLIST,
        dto({ phase: 'SIGN_OUT' as const }),
        actor,
      );

      expect(checklist.statusConceptId).toBe(CONCEPTS.CHECKLIST_COMPLETED);
    });

    it('requires a justification on an exception response', async () => {
      const d = build();

      await expect(
        d.service.submitChecklistPhase(
          CASE,
          CHECKLIST,
          dto({ responses: [{ itemId: ITEM, status: 'EXCEPTION' as const }] }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects answering a phase that is already complete', async () => {
      const d = build();
      const checklist = wire(d);
      checklist.timeOutCompletedAt = new Date();

      await expect(
        d.service.submitChecklistPhase(CASE, CHECKLIST, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses an item that belongs to another phase', async () => {
      const d = build();
      wire(d, [{ id: 'other-item', isMandatory: true }]);

      await expect(
        d.service.submitChecklistPhase(CASE, CHECKLIST, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a checklist of another case', async () => {
      const d = build();
      const checklist = wire(d);
      checklist.procedureCaseId = 'other-case';

      await expect(
        d.service.submitChecklistPhase(CASE, CHECKLIST, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createAnesthesiaPlan (UC-53-06)', () => {
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        anesthesiologistProfileId: PROFILE,
        anesthesiaType: 'GENERAL' as const,
        airwayPlan: 'ETT' as const,
        airwayAssessment: {
          assessedByProfileId: PROFILE,
          mallampati: 'II' as const,
          difficultAirwayExpected: false,
        },
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>) {
      d.casesRepo.findCaseForUpdate.mockResolvedValue(scheduledCase());
      d.preopRepo.findAnesthesiaPlanByCase.mockResolvedValue(null);
      d.preopRepo.createAnesthesiaPlan.mockReturnValue({ id: PLAN });
      d.preopRepo.createAirwayAssessment.mockReturnValue({ id: 'airway-1' });
    }

    it('drafts the plan with its airway assessment', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createAnesthesiaPlan(CASE, dto(), actor);

      expect(res).toMatchObject({
        id: PLAN,
        statusConceptId: CONCEPTS.PLAN_DRAFT,
        airwayAssessmentId: 'airway-1',
        difficultAirwayExpected: false,
      });
    });

    it('requires a rescue plan when a difficult airway is anticipated', async () => {
      const d = build();

      await expect(
        d.service.createAnesthesiaPlan(
          CASE,
          dto({
            airwayAssessment: {
              assessedByProfileId: PROFILE,
              difficultAirwayExpected: true,
            },
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('warns when a difficult airway is anticipated', async () => {
      const d = build();
      wire(d);

      await d.service.createAnesthesiaPlan(
        CASE,
        dto({
          airwayAssessment: {
            assessedByProfileId: PROFILE,
            difficultAirwayExpected: true,
            rescuePlanText: 'Videolaringoscopio disponible',
          },
        }),
        actor,
      );

      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('rejects a second plan on the same case', async () => {
      const d = build();
      wire(d);
      d.preopRepo.findAnesthesiaPlanByCase.mockResolvedValue({
        id: 'plan-prev',
      });

      await expect(
        d.service.createAnesthesiaPlan(CASE, dto(), actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('approveAnesthesiaPlan (UC-53-06)', () => {
    it('approves the plan and assigns the anesthesiologist to the case', async () => {
      const d = build();
      const plan: any = {
        id: PLAN,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PLAN_DRAFT,
        anesthesiologistProfileId: PROFILE,
      };
      d.preopRepo.findAnesthesiaPlanForUpdate.mockResolvedValue(plan);
      const surgicalCase = scheduledCase();
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);

      const res = await d.service.approveAnesthesiaPlan(CASE, PLAN, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.PLAN_APPROVED,
        anesthesiologistProfileId: PROFILE,
      });
      expect(surgicalCase.anesthesiologistProfileId).toBe(PROFILE);
      expect(plan.approvedAt).toBeInstanceOf(Date);
    });

    it('rejects approving twice', async () => {
      const d = build();
      d.preopRepo.findAnesthesiaPlanForUpdate.mockResolvedValue({
        id: PLAN,
        procedureCaseId: CASE,
        statusConceptId: CONCEPTS.PLAN_APPROVED,
      });

      await expect(
        d.service.approveAnesthesiaPlan(CASE, PLAN, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a plan of another case', async () => {
      const d = build();
      d.preopRepo.findAnesthesiaPlanForUpdate.mockResolvedValue({
        id: PLAN,
        procedureCaseId: 'other-case',
        statusConceptId: CONCEPTS.PLAN_DRAFT,
      });

      await expect(
        d.service.approveAnesthesiaPlan(CASE, PLAN, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordAnesthesiaEvent (UC-53-07)', () => {
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        eventType: 'MEDICATION' as const,
        occurredAt: '2026-09-01T13:20:00Z',
        ...overrides,
      };
    }

    function wire(
      d: ReturnType<typeof build>,
      planStatus = CONCEPTS.PLAN_APPROVED,
    ) {
      const surgicalCase = scheduledCase({
        statusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
        operatingRoomId: 'room-1',
      });
      d.casesRepo.findCaseForUpdate.mockResolvedValue(surgicalCase);
      d.preopRepo.findAnesthesiaPlanByCase.mockResolvedValue({
        id: PLAN,
        statusConceptId: planStatus,
      });
      d.preopRepo.createAnesthesiaEvent.mockReturnValue({ id: 'event-1' });
      d.casesRepo.findMilestone.mockResolvedValue(null);
      d.casesRepo.createMilestone.mockReturnValue({ id: 'milestone-1' });
      return surgicalCase;
    }

    it('records the event', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordAnesthesiaEvent(CASE, dto(), actor);

      expect(res).toMatchObject({ id: 'event-1', milestoneId: undefined });
    });

    it('induction opens the case and creates its milestone', async () => {
      const d = build();
      const surgicalCase = wire(d);

      const res = await d.service.recordAnesthesiaEvent(
        CASE,
        dto({ eventType: 'INDUCTION' as const }),
        actor,
      );

      expect(res.milestoneId).toBe('milestone-1');
      expect(surgicalCase.statusConceptId).toBe(
        CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
      );
      expect(surgicalCase.actualStartAt).toBeInstanceOf(Date);
      expect(d.casesRepo.createUtilizationEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.OR_EVENT_CASE_START,
        }),
      );
    });

    it('refuses induction without an approved anesthesia plan', async () => {
      const d = build();
      wire(d, CONCEPTS.PLAN_DRAFT);

      await expect(
        d.service.recordAnesthesiaEvent(
          CASE,
          dto({ eventType: 'INDUCTION' as const }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('warns on a severe event', async () => {
      const d = build();
      wire(d);

      await d.service.recordAnesthesiaEvent(
        CASE,
        dto({
          eventType: 'COMPLICATION' as const,
          severity: 'CRITICAL' as const,
        }),
        actor,
      );

      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not duplicate the milestone if it already exists', async () => {
      const d = build();
      wire(d);
      d.casesRepo.findMilestone.mockResolvedValue({ id: 'milestone-prev' });

      const res = await d.service.recordAnesthesiaEvent(
        CASE,
        dto({ eventType: 'EMERGENCE' as const }),
        actor,
      );

      expect(res.milestoneId).toBeUndefined();
      expect(d.casesRepo.createMilestone).not.toHaveBeenCalled();
    });
  });
});
