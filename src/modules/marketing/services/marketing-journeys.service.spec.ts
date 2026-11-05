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
  runWithTenant,
} from '../../../common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { MarketingErrorReason } from '../marketing.error-reasons';
import { issueLinkToken } from '../marketing.link-token';

const actor = { id: 'user-1', roles: ['MARKETING_MANAGER'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
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
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const journeysRepo = {
    createJourney: mockFn(),
    findJourneyById: mockFn(async () => ({ id: JOURNEY, tenantId: TENANT })),
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
    findTouchpointsByIds: mockFn(async (_tx: any, ids: string[]) =>
      ids.map((id) => ({ id })),
    ),
    keepTouchpointsOfTenant: mockFn(
      async (_tx: any, _tenantId: string, list: any[]) => list,
    ),
    findTrackedLinkById: mockFn(),
    createAttributionTouch: mockFn(),
    findAttributionTouches: mockFn(),
    removeAttributionTouches: mockFn(),
  };
  const campaignsRepo = {
    findSegmentById: mockFn(),
    findPublishedTemplate: mockFn(),
    findTemplateById: mockFn(),
    findCampaignByIdOrAdRef: mockFn(
      async (_tx: any, tenantId: string, id: string) => ({
        id,
        tenantId,
      }),
    ),
    findCampaignMemberByRef: mockFn(),
    findCampaignMemberByRefForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MarketingJourneysService(
    em as any,
    journeysRepo,
    campaignsRepo as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    em,
    journeysRepo,
    campaignsRepo,
  };
}

/**
 * Ejecuta cada método del servicio con `tenant` como tenant activo del
 * contexto, igual que lo deja el interceptor en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenant - Tenant activo.
 * @returns Proxy que fija el contexto en cada llamada.
 */
function inTenant<T extends object>(service: T, tenant: string): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenant, () => value.apply(target, args));
    },
  });
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
      return {
        id: JOURNEY,
        tenantId: TENANT,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      };
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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

    it('increments the counter and records a click touchpoint for the recipient of a valid token', async () => {
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
      const { token } = issueLinkToken(
        'lnk-1',
        { memberType: 'CONTACT', memberRefId: MEMBER },
        3600,
      );

      const res = await d.service.registerClick('ABC123', token);

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

      const res = await d.service.registerClick('ABC123', undefined);

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
        d.service.registerClick('ABC123', undefined),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the code does not resolve', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue(null);

      await expect(
        d.service.registerClick('NOPE', undefined),
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
  describe('aislamiento por tenant (MKT-01)', () => {
    const createDto = {
      code: 'JRN-X',
      name: 'X',
      entryTrigger: 'EVENT' as const,
    };

    it('crea el journey en el tenant del contexto y rechaza un tenantId ajeno', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);
      d.journeysRepo.createJourney.mockReturnValue({ id: 'jrn-1' });

      await d.service.createJourney(createDto, actor);
      expect(d.journeysRepo.createJourney).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );

      d.journeysRepo.createJourney.mockClear();
      await expect(
        d.service.createJourney(
          { ...createDto, tenantId: OTHER_TENANT },
          actor,
        ),
      ).rejects.toMatchObject({ reason: MarketingErrorReason.TENANT_MISMATCH });
      expect(d.journeysRepo.createJourney).not.toHaveBeenCalled();
    });

    it('sin tenant activo no se crea nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(d.raw.createJourney(createDto, actor)).rejects.toMatchObject(
        { details: { reason: 'TENANT_REQUIRED' } },
      );
      expect(d.journeysRepo.createJourney).not.toHaveBeenCalled();
    });

    it('rechaza un segmento de entrada de otro tenant con el mismo 404 que uno inexistente', async () => {
      const d = build();
      const dto = {
        ...createDto,
        entryTrigger: 'SEGMENT' as const,
        entrySegmentId: JOURNEY,
      };
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);
      d.campaignsRepo.findSegmentById.mockResolvedValue({
        id: JOURNEY,
        tenantId: OTHER_TENANT,
      });
      const foreign = await d.service
        .createJourney(dto, actor)
        .catch((e: any) => e);
      d.campaignsRepo.findSegmentById.mockResolvedValue(null);
      const missing = await d.service
        .createJourney(dto, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(MarketingErrorReason.SEGMENT_NOT_AVAILABLE);
      expect(d.journeysRepo.createJourney).not.toHaveBeenCalled();
    });

    it('traduce la violación de unicidad de la base a un 409 estable', async () => {
      const d = build();
      d.journeysRepo.findJourneyByCode.mockResolvedValue(null);
      d.em.transactional.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );
      const attempt = d.service.createJourney(createDto, actor);
      await expect(attempt).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt).rejects.toMatchObject({
        reason: MarketingErrorReason.CODE_ALREADY_EXISTS,
      });
    });

    it('un journey de otro tenant no admite pasos ni activación (404 uniforme)', async () => {
      const d = build();
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        tenantId: OTHER_TENANT,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      });
      const steps = await d.service
        .addSteps(
          JOURNEY,
          { steps: [{ stepCode: 'W', stepType: 'EXIT' as const }] },
          actor,
        )
        .catch((e: any) => e);
      const activate = await d.service
        .activateJourney(JOURNEY, { cohort: [] }, actor)
        .catch((e: any) => e);
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue(null);
      const missing = await d.service
        .activateJourney(JOURNEY, { cohort: [] }, actor)
        .catch((e: any) => e);

      for (const error of [steps, activate]) {
        expect(error.getStatus()).toBe(404);
        expect(error.getResponse()).toEqual(missing.getResponse());
        expect(error.reason).toBe(MarketingErrorReason.JOURNEY_NOT_AVAILABLE);
      }
      expect(d.journeysRepo.createJourneyStep).not.toHaveBeenCalled();
      expect(d.journeysRepo.createEnrollment).not.toHaveBeenCalled();
      expect(d.journeysRepo.findJourneyForUpdate).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        JOURNEY,
      );
    });

    it('una plantilla de otro tenant en un paso SEND responde igual que una inexistente', async () => {
      const d = build();
      const dto = {
        steps: [
          {
            stepCode: 'S1',
            stepType: 'SEND' as const,
            contentTemplateId: TEMPLATE,
          },
        ],
      };
      d.journeysRepo.findJourneyForUpdate.mockResolvedValue({
        id: JOURNEY,
        tenantId: TENANT,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      });
      d.campaignsRepo.findPublishedTemplate.mockResolvedValue({
        id: TEMPLATE,
        tenantId: OTHER_TENANT,
      });
      const foreign = await d.service
        .addSteps(JOURNEY, dto, actor)
        .catch((e: any) => e);
      d.campaignsRepo.findPublishedTemplate.mockResolvedValue(null);
      const missing = await d.service
        .addSteps(JOURNEY, dto, actor)
        .catch((e: any) => e);

      expect(foreign).toBeInstanceOf(PreconditionFailedException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.journeysRepo.createJourneyStep).not.toHaveBeenCalled();
    });

    it('una inscripción cuyo journey es de otro tenant no avanza ni sale (404 uniforme)', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdateSkipLocked.mockResolvedValue(
        enrollment,
      );
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
      // El repositorio acotado por tenant no encuentra el journey ajeno.
      d.journeysRepo.findJourneyById.mockResolvedValue(null);

      const advance = await d.service
        .advanceEnrollment(ENROLLMENT, {}, actor)
        .catch((e: any) => e);
      const exit = await d.service
        .exitEnrollment(ENROLLMENT, { reason: 'GOAL' as const }, actor)
        .catch((e: any) => e);
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(null);
      const missing = await d.service
        .exitEnrollment(ENROLLMENT, { reason: 'GOAL' as const }, actor)
        .catch((e: any) => e);

      for (const error of [advance, exit]) {
        expect(error.getStatus()).toBe(404);
        expect(error.getResponse()).toEqual(missing.getResponse());
        expect(error.reason).toBe(
          MarketingErrorReason.ENROLLMENT_NOT_AVAILABLE,
        );
      }
      expect(enrollment.statusConceptId).toBe(CONCEPTS.ENROLLMENT_ACTIVE);
      expect(d.journeysRepo.findJourneyById).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        JOURNEY,
      );
    });

    it('defensa en profundidad: un journey ajeno devuelto por el repositorio también se rechaza', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
      d.journeysRepo.findJourneyById.mockResolvedValue({
        id: JOURNEY,
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.exitEnrollment(
          ENROLLMENT,
          { reason: 'GOAL' as const },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: MarketingErrorReason.ENROLLMENT_NOT_AVAILABLE,
      });
      expect(enrollment.statusConceptId).toBe(CONCEPTS.ENROLLMENT_ACTIVE);
    });

    it('la salida de una inscripción propia no toca la campaña de otro tenant', async () => {
      const d = build();
      const enrollment = activeEnrollment();
      d.journeysRepo.findEnrollmentForUpdate.mockResolvedValue(enrollment);
      d.campaignsRepo.findCampaignByIdOrAdRef.mockResolvedValue(null);

      await expect(
        d.service.exitEnrollment(
          ENROLLMENT,
          { reason: 'GOAL' as const, campaignId: CAMPAIGN },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: MarketingErrorReason.CAMPAIGN_NOT_AVAILABLE,
      });
      expect(
        d.campaignsRepo.findCampaignMemberByRefForUpdate,
      ).not.toHaveBeenCalled();
      expect(enrollment.statusConceptId).toBe(CONCEPTS.ENROLLMENT_ACTIVE);
    });

    it('no crea un enlace sobre una campaña de otro tenant', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCode.mockResolvedValue(null);
      d.campaignsRepo.findCampaignByIdOrAdRef.mockResolvedValue(null);
      await expect(
        d.service.createTrackedLink(
          {
            code: 'LNK',
            targetUrl: 'https://clinic.example/x',
            campaignId: CAMPAIGN,
          },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: MarketingErrorReason.CAMPAIGN_NOT_AVAILABLE,
      });
      expect(d.journeysRepo.createTrackedLink).not.toHaveBeenCalled();
    });

    describe('touchpoints y atribución', () => {
      const dto = {
        memberType: 'CONTACT' as const,
        memberRefId: MEMBER,
        touchType: 'CLICK' as const,
        channel: 'EMAIL' as const,
      };

      it('rechaza un touchpoint cuya campaña, journey, enlace o plantilla son de otro tenant', async () => {
        const d = build();
        d.campaignsRepo.findCampaignByIdOrAdRef.mockResolvedValue(null);
        await expect(
          d.service.recordTouchpoint({ ...dto, campaignId: CAMPAIGN }, actor),
        ).rejects.toMatchObject({
          reason: MarketingErrorReason.CAMPAIGN_NOT_AVAILABLE,
        });

        d.journeysRepo.findJourneyById.mockResolvedValue(null);
        await expect(
          d.service.recordTouchpoint({ ...dto, journeyId: JOURNEY }, actor),
        ).rejects.toMatchObject({
          reason: MarketingErrorReason.JOURNEY_NOT_AVAILABLE,
        });

        d.journeysRepo.findTrackedLinkById.mockResolvedValue({
          id: 'lnk-1',
          campaignId: CAMPAIGN,
        });
        d.journeysRepo.findJourneyById.mockResolvedValue({
          id: JOURNEY,
          tenantId: TENANT,
        });
        await expect(
          d.service.recordTouchpoint(
            { ...dto, journeyId: JOURNEY, trackedLinkId: 'lnk-1' },
            actor,
          ),
        ).rejects.toMatchObject({
          reason: MarketingErrorReason.TRACKED_LINK_NOT_AVAILABLE,
        });

        d.campaignsRepo.findTemplateById.mockResolvedValue(null);
        await expect(
          d.service.recordTouchpoint(
            { ...dto, journeyId: JOURNEY, contentTemplateId: TEMPLATE },
            actor,
          ),
        ).rejects.toMatchObject({
          reason: MarketingErrorReason.TEMPLATE_NOT_AVAILABLE,
        });
        expect(d.journeysRepo.createTouchpoint).not.toHaveBeenCalled();
      });

      it('la atribución sólo cuenta touchpoints del tenant', async () => {
        const d = build();
        d.journeysRepo.findTouchpointsInWindow.mockResolvedValue([
          { id: 'tp-own' },
          { id: 'tp-foreign' },
        ]);
        d.journeysRepo.keepTouchpointsOfTenant.mockImplementation(
          async (_tx: any, _tenant: string, list: any[]) =>
            list.filter((t) => t.id === 'tp-own'),
        );
        d.journeysRepo.findAttributionTouches.mockResolvedValue([]);

        const res = await d.service.computeAttribution(
          {
            conversionRefType: 'order' as const,
            conversionRefId: CONVERSION,
            memberType: 'CONTACT' as const,
            memberRefId: MEMBER,
            windowFrom: '2026-01-01T00:00:00Z',
            windowTo: '2026-02-01T00:00:00Z',
            model: 'LINEAR' as const,
          },
          actor,
        );

        expect(res.touches.map((t) => t.touchpointId)).toEqual(['tp-own']);
        expect(d.journeysRepo.keepTouchpointsOfTenant).toHaveBeenCalledWith(
          d.tx,
          TENANT,
          expect.any(Array),
        );
      });

      it('recalcular no borra el reparto que otro tenant calculó para la misma conversión', async () => {
        const d = build();
        const own = { id: 'at-own', marketingTouchpointId: 'tp-own' };
        const foreign = {
          id: 'at-foreign',
          marketingTouchpointId: 'tp-foreign',
        };
        d.journeysRepo.findTouchpointsInWindow.mockResolvedValue([
          { id: 'tp-own' },
        ]);
        d.journeysRepo.findAttributionTouches.mockResolvedValue([own, foreign]);
        d.journeysRepo.keepTouchpointsOfTenant.mockImplementation(
          async (_tx: any, _tenant: string, list: any[]) =>
            list.filter((t) => t.id === 'tp-own'),
        );

        const res = await d.service.computeAttribution(
          {
            conversionRefType: 'order' as const,
            conversionRefId: CONVERSION,
            memberType: 'CONTACT' as const,
            memberRefId: MEMBER,
            windowFrom: '2026-01-01T00:00:00Z',
            windowTo: '2026-02-01T00:00:00Z',
            model: 'LAST_TOUCH' as const,
          },
          actor,
        );

        expect(res.replaced).toBe(1);
        expect(d.journeysRepo.removeAttributionTouches).toHaveBeenCalledWith(
          d.tx,
          [own],
        );
      });

      it('si todos los touchpoints del miembro son de otros tenants no hay atribución', async () => {
        const d = build();
        d.journeysRepo.findTouchpointsInWindow.mockResolvedValue([
          { id: 'tp-foreign' },
        ]);
        d.journeysRepo.keepTouchpointsOfTenant.mockResolvedValue([]);
        await expect(
          d.service.computeAttribution(
            {
              conversionRefType: 'order' as const,
              conversionRefId: CONVERSION,
              memberType: 'CONTACT' as const,
              memberRefId: MEMBER,
              windowFrom: '2026-01-01T00:00:00Z',
              windowTo: '2026-02-01T00:00:00Z',
              model: 'LINEAR' as const,
            },
            actor,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.journeysRepo.createAttributionTouch).not.toHaveBeenCalled();
      });
    });
  });

  describe('token de destinatario del enlace público (MKT-03)', () => {
    const link: any = {
      id: 'lnk-1',
      campaignId: CAMPAIGN,
      code: 'ABC123',
      targetUrl: 'https://clinic.example/x',
      clickCount: '0',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    };

    it('emite un token ligado al destinatario de la campaña y el click lo resuelve en el servidor', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkById.mockResolvedValue(link);
      d.campaignsRepo.findCampaignMemberByRef.mockResolvedValue({ id: 'cm-1' });

      const issued = await d.service.issueTrackedLinkToken('lnk-1', {
        memberType: 'PATIENT' as const,
        memberRefId: MEMBER,
      });
      expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());

      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue({
        ...link,
      });
      d.journeysRepo.createTouchpoint.mockReturnValue({ id: 'tp-1' });
      const res = await d.service.registerClick('ABC123', issued.token);

      expect(res.touchpointId).toBe('tp-1');
      expect(d.journeysRepo.createTouchpoint).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          memberRefId: MEMBER,
          memberTypeConceptId: CONCEPTS.MEMBER_PATIENT,
          trackedLinkId: 'lnk-1',
        }),
      );
    });

    it('un destinatario que no es miembro de la campaña no recibe token', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkById.mockResolvedValue(link);
      d.campaignsRepo.findCampaignMemberByRef.mockResolvedValue(null);
      await expect(
        d.service.issueTrackedLinkToken('lnk-1', {
          memberType: 'CONTACT' as const,
          memberRefId: MEMBER,
        }),
      ).rejects.toMatchObject({
        reason: MarketingErrorReason.RECIPIENT_NOT_AVAILABLE,
      });
    });

    it('un enlace ajeno, inexistente o sin campaña responden igual al emitir', async () => {
      const d = build();
      const dto = { memberType: 'CONTACT' as const, memberRefId: MEMBER };
      d.journeysRepo.findTrackedLinkById.mockResolvedValue(link);
      d.campaignsRepo.findCampaignByIdOrAdRef.mockResolvedValue(null);
      const foreign = await d.service
        .issueTrackedLinkToken('lnk-1', dto)
        .catch((e: any) => e);
      d.journeysRepo.findTrackedLinkById.mockResolvedValue(null);
      const missing = await d.service
        .issueTrackedLinkToken('lnk-1', dto)
        .catch((e: any) => e);
      d.journeysRepo.findTrackedLinkById.mockResolvedValue({
        ...link,
        campaignId: undefined,
      });
      const orphan = await d.service
        .issueTrackedLinkToken('lnk-1', dto)
        .catch((e: any) => e);

      for (const error of [foreign, orphan]) {
        expect(error.getStatus()).toBe(404);
        expect(error.getResponse()).toEqual(missing.getResponse());
      }
      expect(foreign.reason).toBe(
        MarketingErrorReason.TRACKED_LINK_NOT_AVAILABLE,
      );
      expect(d.campaignsRepo.findCampaignMemberByRef).not.toHaveBeenCalled();
    });

    it('rechaza un token forjado, manipulado o de otro enlace sin contar el click', async () => {
      const d = build();
      const click = { ...link };
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue(click);
      const valid = issueLinkToken(
        'lnk-1',
        { memberType: 'CONTACT', memberRefId: MEMBER },
        3600,
      ).token;
      const [payload] = valid.split('.');
      const forgedPayload = Buffer.from(
        JSON.stringify({
          m: 'PATIENT',
          r: '88888888-8888-8888-8888-888888888888',
          e: 4102444800,
        }),
      ).toString('base64url');
      const otherLink = issueLinkToken(
        'lnk-2',
        { memberType: 'CONTACT', memberRefId: MEMBER },
        3600,
      ).token;

      for (const token of [
        'no-es-un-token',
        `${forgedPayload}.${valid.split('.')[1]}`,
        `${payload}.${'0'.repeat(64)}`,
        otherLink,
      ]) {
        await expect(
          d.service.registerClick('ABC123', token),
        ).rejects.toMatchObject({
          reason: MarketingErrorReason.TRACKED_LINK_TOKEN_INVALID,
        });
      }
      expect(click.clickCount).toBe('0');
      expect(d.journeysRepo.createTouchpoint).not.toHaveBeenCalled();
    });

    it('rechaza un token vencido', async () => {
      const d = build();
      d.journeysRepo.findTrackedLinkByCodeForUpdate.mockResolvedValue({
        ...link,
      });
      const { token } = issueLinkToken(
        'lnk-1',
        { memberType: 'CONTACT', memberRefId: MEMBER },
        60,
        new Date(Date.now() - 3_600_000),
      );
      await expect(
        d.service.registerClick('ABC123', token),
      ).rejects.toMatchObject({
        reason: MarketingErrorReason.TRACKED_LINK_TOKEN_INVALID,
      });
    });
  });
});
