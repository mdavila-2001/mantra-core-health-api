import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MarketingJourneysService } from './marketing-journeys.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['MARKETING_MANAGER'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const JOURNEY = '22222222-2222-2222-2222-222222222222';
const ENROLLMENT = '33333333-3333-3333-3333-333333333333';
const MEMBER = '44444444-4444-4444-4444-444444444444';
const CAMPAIGN = '55555555-5555-5555-5555-555555555555';
const TEMPLATE = '66666666-6666-6666-6666-666666666666';
const CONVERSION = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const journeysRepo = {
    createJourney: mockFn(),
    findJourneyById: mockFn(),
    findJourneyForUpdate: mockFn(),
    findJourneyByCode: mockFn(),
    createJourneyStep: mockFn(),
    findStepsByJourney: mockFn(),
    findStepById: mockFn(),
    findLastStep: mockFn(),
    createEnrollment: mockFn(),
    findActiveEnrollment: mockFn(),
    findEnrollmentForUpdateSkipLocked: mockFn(),
    findEnrollmentForUpdate: mockFn(),
    createTrackedLink: mockFn(),
    findTrackedLinkByCode: mockFn(),
    findTrackedLinkByCodeForUpdate: mockFn(),
    createTouchpoint: mockFn(),
    findTouchpointsInWindow: mockFn(),
    createAttributionTouch: mockFn(),
    findAttributionTouches: mockFn(),
    removeAttributionTouches: mockFn(),
  };
  const campaignsRepo = {
    findSegmentById: mockFn(),
    findPublishedTemplate: mockFn(),
    findCampaignMemberByRefForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MarketingJourneysService(
    em as any,
    journeysRepo,
    campaignsRepo as any,
    logger as any,
  );
  return { service, tx, journeysRepo, campaignsRepo };
}

/**
 * Ejecuta la operación active enrollment.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active enrollment conforme al contrato `any`.
 */
function activeEnrollment(overrides: Record<string, unknown> = {}): any {
  return {
    id: ENROLLMENT,
    journeyId: JOURNEY,
    memberTypeConceptId: CONCEPTS.MEMBER_CONTACT,
    memberRefId: MEMBER,
    currentStepId: 'step-1',
    statusConceptId: CONCEPTS.ENROLLMENT_ACTIVE,
    enteredAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('MarketingJourneysService', () => {
  describe('createJourney (UC-50-06)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'JRN-01',
      name: 'Bienvenida',
      entryTrigger: 'EVENT' as const,
    };

    it('creates the journey in draft', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);
      d.journeysRepo.createJourney.mockReturnValue({ id: 'jrn-1' });

      const res = await d.service.createJourney(dto, actor);

      expect(res.stateConceptId).toBe(CONCEPTS.JOURNEY_DRAFT);
    });

    it('rejects a duplicate code in the tenant', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue({
        id: 'jrn-existing',
      });

      await expect(
        d.service.createJourney(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires an entry segment when the trigger is SEGMENT', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);

      await expect(
        d.service.createJourney(
          { ...dto, entryTrigger: 'SEGMENT' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the entry segment does not exist', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);
      d.campaignsRepo.findSegmentById.mockResolvedValue(null);

      await expect(
        d.service.createJourney(
          { ...dto, entryTrigger: 'SEGMENT' as const, entrySegmentId: JOURNEY },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('addSteps (UC-50-06)', () => {
    /**
     * Ejecuta la operación draft journey.
     * @returns Resultado de draft journey conforme al contrato `any`.
     */
    function draftJourney(): any {
      return { id: JOURNEY, stateConceptId: CONCEPTS.JOURNEY_DRAFT };
    }

    it('chains the steps in the order received', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(draftJourney());
      d.journeysRepo.findLastStep.mockResolvedValue(null);
      const created = [{ id: 'step-1' }, { id: 'step-2' }];
      let index = 0;
      d.journeysRepo.createJourneyStep.mockImplementation(
        () => created[index++],
      );

      const res = await d.service.addSteps(
        JOURNEY,
        {
          steps: [
            {
              stepCode: 'WAIT-1',
              stepType: 'WAIT' as const,
              waitDurationMinutes: 60,
            },
            { stepCode: 'GOAL-1', stepType: 'GOAL' as const },
          ],
        },
        actor,
      );

      expect(res.stepIds).toEqual(['step-1', 'step-2']);
      expect((created[0] as any).nextStepId).toBe('step-2');
    });

    it('continues the ordinal from the last existing step', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(draftJourney());
      d.journeysRepo.findLastStep.mockResolvedValue({
        id: 'step-0',
        ordinal: 5,
      });
      d.journeysRepo.createJourneyStep.mockReturnValue({ id: 'step-1' });

      await d.service.addSteps(
        JOURNEY,
        { steps: [{ stepCode: 'EXIT-1', stepType: 'EXIT' as const }] },
        actor,
      );

      expect(d.journeysRepo.createJourneyStep).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ ordinal: 6 }),
      );
    });

    it('refuses to change the graph of a journey that is already active', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_ACTIVE,
      });

      await expect(
        d.service.addSteps(
          JOURNEY,
          { steps: [{ stepCode: 'EXIT-1', stepType: 'EXIT' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a SEND step whose template is not published', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(draftJourney());
      d.campaignsRepo.findPublishedTemplate.mockResolvedValue(null);

      await expect(
        d.service.addSteps(
          JOURNEY,
          {
            steps: [
              {
                stepCode: 'SEND-1',
                stepType: 'SEND' as const,
                channel: 'EMAIL' as const,
                contentTemplateId: TEMPLATE,
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a WAIT step without a duration', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(draftJourney());

      await expect(
        d.service.addSteps(
          JOURNEY,
          { steps: [{ stepCode: 'WAIT-1', stepType: 'WAIT' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a BRANCH step without a condition', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(draftJourney());

      await expect(
        d.service.addSteps(
          JOURNEY,
          { steps: [{ stepCode: 'BR-1', stepType: 'BRANCH' as const }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('activateJourney (UC-50-07)', () => {
    const cohort = [{ memberType: 'CONTACT' as const, memberRefId: MEMBER }];

    it('activates the journey and enrolls the cohort in the first step', async () => {
      const d = build();
      const journey: any = {
        id: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      };
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(journey);
      d.journeysRepo.findStepsByJourney.mockResolvedValue([
        { id: 'step-1', ordinal: 1 },
      ]);
      d.journeysRepo.findActiveEnrollment.mockResolvedValue(null);

      const res = await d.service.activateJourney(JOURNEY, { cohort }, actor);

      expect(res).toEqual({
        journeyId: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_ACTIVE,
        enrolled: 1,
        skipped: 0,
      });
      expect(journey.stateConceptId).toBe(CONCEPTS.JOURNEY_ACTIVE);
      expect(d.journeysRepo.createEnrollment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ currentStepId: 'step-1' }),
      );
    });

    it('skips a member that already has an active enrollment', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      });
      d.journeysRepo.findStepsByJourney.mockResolvedValue([
        { id: 'step-1', ordinal: 1 },
      ]);
      d.journeysRepo.findActiveEnrollment.mockResolvedValue({
        id: 'enr-existing',
      });

      const res = await d.service.activateJourney(JOURNEY, { cohort }, actor);

      expect(res).toMatchObject({ enrolled: 0, skipped: 1 });
      expect(d.journeysRepo.createEnrollment).not.toHaveBeenCalled();
    });

    it('refuses to activate a journey with no steps', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      });
      d.journeysRepo.findStepsByJourney.mockResolvedValue([]);

      await expect(
        d.service.activateJourney(JOURNEY, { cohort }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to activate twice', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        stateConceptId: CONCEPTS.JOURNEY_ACTIVE,
      });

      await expect(
        d.service.activateJourney(JOURNEY, { cohort }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('advanceEnrollment (UC-50-08)', () => {
    it('records an impression touchpoint when the step is SEND', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        enrollment,
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_SEND,
        channelConceptId: CONCEPTS.CH_SMS,
        contentTemplateId: TEMPLATE,
        nextStepId: 'step-2',
      });
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });

      const res = await d.service.advanceEnrollment(ENROLLMENT, {}, actor);

      expect(res.touchpointId).toBe('tp-1');
      expect(res.currentStepId).toBe('step-2');
      expect(d.journeysRepo.createTouchpoint).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          touchTypeConceptId: CONCEPTS.TOUCH_IMPRESSION,
          channelConceptId: CONCEPTS.CH_SMS,
        }),
      );
    });

    it('completes the enrollment when there is no next step', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        enrollment,
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_GOAL,
      });

      const res = await d.service.advanceEnrollment(ENROLLMENT, {}, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.ENROLLMENT_COMPLETED);
      expect(res.currentStepId).toBeUndefined();
      expect(enrollment.exitedAt).toBeInstanceOf(Date);
    });

    it('takes the branch when the orchestrator says the condition held', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        activeEnrollment(),
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_BRANCH,
        nextStepId: 'step-main',
        branchStepId: 'step-branch',
      });

      const res = await d.service.advanceEnrollment(
        ENROLLMENT,
        { branchTaken: true },
        actor,
      );

      expect(res.currentStepId).toBe('step-branch');
    });

    it('follows the main path when the condition did not hold', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        activeEnrollment(),
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_BRANCH,
        nextStepId: 'step-main',
        branchStepId: 'step-branch',
      });

      const res = await d.service.advanceEnrollment(
        ENROLLMENT,
        { branchTaken: false },
        actor,
      );

      expect(res.currentStepId).toBe('step-main');
    });

    it('refuses to advance a WAIT step whose delay has not elapsed', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        activeEnrollment({ updatedAt: new Date() }),
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_WAIT,
        waitDurationMinutes: 120,
        nextStepId: 'step-2',
      });

      await expect(
        d.service.advanceEnrollment(ENROLLMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('advances a WAIT step once the delay has elapsed', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        activeEnrollment({
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        }),
      );
      d.journeysRepo.findStepById.mockResolvedValue({
        id: 'step-1',
        stepTypeConceptId: CONCEPTS.STEP_WAIT,
        waitDurationMinutes: 120,
        nextStepId: 'step-2',
      });

      const res = await d.service.advanceEnrollment(ENROLLMENT, {}, actor);

      expect(res.currentStepId).toBe('step-2');
    });

    it('rejects an enrollment that is no longer active', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        activeEnrollment({ statusConceptId: CONCEPTS.ENROLLMENT_EXITED }),
      );

      await expect(
        d.service.advanceEnrollment(ENROLLMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reports not found when another worker holds the row', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(null);

      await expect(
        d.service.advanceEnrollment(ENROLLMENT, {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('exitEnrollment (UC-50-09)', () => {
    it('completes the enrollment when the goal was reached', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);

      const res = await d.service.exitEnrollment(
        ENROLLMENT,
        { reason: 'GOAL' as const },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.ENROLLMENT_COMPLETED);
      expect(res.exitReasonConceptId).toBe(CONCEPTS.EXIT_REASON_GOAL);
      expect(enrollment.currentStepId).toBeUndefined();
    });

    it('marks it as exited when the member unsubscribed', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment(),
      );

      const res = await d.service.exitEnrollment(
        ENROLLMENT,
        { reason: 'UNSUBSCRIBE' as const },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.ENROLLMENT_EXITED);
      expect(res.exitReasonConceptId).toBe(CONCEPTS.EXIT_REASON_UNSUBSCRIBE);
    });

    it('reflects the exit on the campaign member', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment(),
      );
      const member: any = {
        id: 'cm-1',
        memberStatusConceptId: CONCEPTS.CAMPAIGN_MEMBER_TARGETED,
      };
      d.campaignsRepo.findCampaignMemberByRefForUpdate.mockResolvedValue(
        member,
      );

      await d.service.exitEnrollment(
        ENROLLMENT,
        { reason: 'BOUNCE' as const, campaignId: CAMPAIGN },
        actor,
      );

      expect(member.memberStatusConceptId).toBe(
        CONCEPTS.CAMPAIGN_MEMBER_BOUNCED,
      );
      expect(member.respondedAt).toBeInstanceOf(Date);
    });

    it('rejects exiting an enrollment that is not active', async () => {
      const d = build();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(
        activeEnrollment({ statusConceptId: CONCEPTS.ENROLLMENT_COMPLETED }),
      );

      await expect(
        d.service.exitEnrollment(
          ENROLLMENT,
          { reason: 'GOAL' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('tracked links (UC-50-10)', () => {
    const dto = { code: 'ABC123', targetUrl: 'https://salud.example/promo' };

    it('creates the link active with a zeroed counter', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCode.mockResolvedValue(null);
      d.journeysRepo.createTrackedLink.mockReturnValue({ id: 'lnk-1' });

      const res = await d.service.createTrackedLink(dto, actor);

      expect(res).toEqual({
        id: 'lnk-1',
        code: 'ABC123',
        targetUrl: dto.targetUrl,
      });
      expect(d.journeysRepo.createTrackedLink).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ stateConceptId: CONCEPTS.STATE_ACTIVE }),
      );
    });

    it('rejects a code already in use', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCode.mockResolvedValue({
        id: 'lnk-existing',
      });

      await expect(
        d.service.createTrackedLink(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('increments the counter and records a click touchpoint for a known member', async () => {
      const d = build();
      const link: any = {
        id: 'lnk-1',
        campaignId: CAMPAIGN,
        code: 'ABC123',
        targetUrl: dto.targetUrl,
        clickCount: '41',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue(link);
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });

      const res = await d.service.registerClick('ABC123', 'CONTACT', MEMBER);

      expect(res.clickCount).toBe('42');
      expect(link.clickCount).toBe('42');
      expect(res.touchpointId).toBe('tp-1');
      expect(d.journeysRepo.createTouchpoint).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ touchTypeConceptId: CONCEPTS.TOUCH_CLICK }),
      );
    });

    it('counts an anonymous click without recording a touchpoint', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue({
        id: 'lnk-1',
        code: 'ABC123',
        targetUrl: dto.targetUrl,
        clickCount: '0',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      const res = await d.service.registerClick('ABC123', undefined, undefined);

      expect(res.clickCount).toBe('1');
      expect(res.touchpointId).toBeUndefined();
      expect(d.journeysRepo.createTouchpoint).not.toHaveBeenCalled();
    });

    it('refuses to resolve a link that is not active', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue({
        id: 'lnk-1',
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.registerClick('ABC123', undefined, undefined),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the code does not resolve', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue(null);

      await expect(
        d.service.registerClick('NOPE', undefined, undefined),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordTouchpoint (UC-50-11)', () => {
    const dto = {
      memberType: 'CONTACT' as const,
      memberRefId: MEMBER,
      touchType: 'CLICK' as const,
      channel: 'EMAIL' as const,
      campaignId: CAMPAIGN,
    };

    it('appends the touchpoint and moves the campaign member forward', async () => {
      const d = build();
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });
      const member: any = {
        id: 'cm-1',
        memberStatusConceptId: CONCEPTS.CAMPAIGN_MEMBER_TARGETED,
      };
      d.campaignsRepo.findCampaignMemberByRefForUpdate.mockResolvedValue(
        member,
      );

      const res = await d.service.recordTouchpoint(dto, actor);

      expect(res.id).toBe('tp-1');
      expect(res.memberStatusConceptId).toBe(CONCEPTS.CAMPAIGN_MEMBER_CLICKED);
      expect(member.memberStatusConceptId).toBe(
        CONCEPTS.CAMPAIGN_MEMBER_CLICKED,
      );
    });

    it('leaves the member untouched for a contact type that says nothing about them', async () => {
      const d = build();
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });

      const res = await d.service.recordTouchpoint(
        { ...dto, touchType: 'IMPRESSION' as const },
        actor,
      );

      expect(res.memberStatusConceptId).toBeUndefined();
      expect(
        d.campaignsRepo.findCampaignMemberByRefForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('requires a campaign or a journey as the origin', async () => {
      const d = build();

      await expect(
        d.service.recordTouchpoint(
          { ...dto, campaignId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts an explicit occurrence time so late events land where they happened', async () => {
      const d = build();
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });
      d.campaignsRepo.findCampaignMemberByRefForUpdate.mockResolvedValue(null);

      await d.service.recordTouchpoint(
        { ...dto, occurredAt: '2026-05-01T10:00:00Z' },
        actor,
      );

      expect(d.journeysRepo.createTouchpoint).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          occurredAt: new Date('2026-05-01T10:00:00Z'),
        }),
      );
    });
  });

  describe('computeAttribution (UC-50-12)', () => {
    const base = {
      conversionRefType: 'order' as const,
      conversionRefId: CONVERSION,
      memberType: 'CONTACT' as const,
      memberRefId: MEMBER,
      windowFrom: '2026-01-01T00:00:00Z',
      windowTo: '2026-02-01T00:00:00Z',
    };
    const touchpoints = [{ id: 'tp-1' }, { id: 'tp-2' }, { id: 'tp-3' }];

    it('gives all the credit to the last touch', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue(touchpoints);
      d.journeysRepo.findAttributionTouches.mockResolvedValue([]);

      const res = await d.service.computeAttribution(
        { ...base, model: 'LAST_TOUCH' as const },
        actor,
      );

      expect(res.touches).toHaveLength(1);
      expect(res.touches[0]).toMatchObject({
        touchpointId: 'tp-3',
        weight: '1',
        positionConceptId: CONCEPTS.ATTR_POSITION_LAST,
      });
    });

    it('gives all the credit to the first touch', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue(touchpoints);
      d.journeysRepo.findAttributionTouches.mockResolvedValue([]);

      const res = await d.service.computeAttribution(
        { ...base, model: 'FIRST_TOUCH' as const },
        actor,
      );

      expect(res.touches).toHaveLength(1);
      expect(res.touches[0]).toMatchObject({
        touchpointId: 'tp-1',
        positionConceptId: CONCEPTS.ATTR_POSITION_FIRST,
      });
    });

    it('splits linearly with weights that add up to exactly 1', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue(touchpoints);
      d.journeysRepo.findAttributionTouches.mockResolvedValue([]);

      const res = await d.service.computeAttribution(
        { ...base, model: 'LINEAR' as const },
        actor,
      );

      const total = res.touches.reduce((sum, t) => sum + Number(t.weight), 0);
      expect(res.touches).toHaveLength(3);
      expect(total).toBeCloseTo(1, 9);
    });

    it('splits the conversion value along the weights', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue([
        { id: 'tp-1' },
        { id: 'tp-2' },
      ]);
      d.journeysRepo.findAttributionTouches.mockResolvedValue([]);

      const res = await d.service.computeAttribution(
        { ...base, model: 'LINEAR' as const, conversionValue: '200.00' },
        actor,
      );

      expect(res.touches.map((t) => t.attributedValue)).toEqual([
        '100.00',
        '100.00',
      ]);
    });

    it('replaces the previous split of the same model', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue(touchpoints);
      const previous = [{ id: 'at-1' }, { id: 'at-2' }];
      d.journeysRepo.findAttributionTouches.mockResolvedValue(previous);

      const res = await d.service.computeAttribution(
        { ...base, model: 'LAST_TOUCH' as const },
        actor,
      );

      expect(res.replaced).toBe(2);
      expect(d.journeysRepo.removeAttributionTouches).toHaveBeenCalledWith(
        d.tx,
        previous,
      );
    });

    it('rejects an inverted attribution window', async () => {
      const d = build();

      await expect(
        d.service.computeAttribution(
          {
            ...base,
            model: 'LINEAR' as const,
            windowFrom: '2026-02-01T00:00:00Z',
            windowTo: '2026-01-01T00:00:00Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the member has no touchpoints in the window', async () => {
      const d = build();
      d.journeysRepo.findTouchpointsInWindow.mockResolvedValue([]);

      await expect(
        d.service.computeAttribution(
          { ...base, model: 'LINEAR' as const },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
