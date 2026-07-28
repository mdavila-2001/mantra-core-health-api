import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AdsOptimizationService } from './ads-optimization.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['ADS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const ACCOUNT = '22222222-2222-2222-2222-222222222222';
const CAMPAIGN = '33333333-3333-3333-3333-333333333333';
const AD_SET = '44444444-4444-4444-4444-444444444444';
const AD = '55555555-5555-5555-5555-555555555555';
const RULE = '66666666-6666-6666-6666-666666666666';
const VIOLATION = '77777777-7777-7777-7777-777777777777';
const FORM = '88888888-8888-8888-8888-888888888888';
const PIPELINE = '99999999-9999-9999-9999-999999999999';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const optimizationRepo = {
    createExperiment: mockFn(),
    findExperimentForUpdate: mockFn(),
    createVariant: mockFn(),
    findVariantsByExperiment: mockFn(),
    findRuleForUpdate: mockFn(),
    createRuleExecution: mockFn(),
    createReviewEvent: mockFn(),
    findReviewEventByExternalId: mockFn(),
    createViolation: mockFn(),
    findViolationForUpdate: mockFn(),
    findOpenViolations: mockFn(),
    createAppeal: mockFn(),
    findAppealByViolation: mockFn(),
    createInvoice: mockFn(),
    findInvoiceByNumber: mockFn(),
    findInvoiceForPeriod: mockFn(),
    createInvoiceLine: mockFn(),
    findLeadFormById: mockFn(),
    findQuestionsByForm: mockFn(),
    createSubmission: mockFn(),
    findSubmissionByExternalId: mockFn(),
    createAnswer: mockFn(),
    createDeliveryEvent: mockFn(),
    countDeliveryAttempts: mockFn(),
  };
  const campaignsRepo = {
    findCampaignById: mockFn(),
    findCampaignForUpdate: mockFn(),
    findAdSetById: mockFn(),
    findAdSetForUpdate: mockFn(),
    findAdById: mockFn(),
    findAdForUpdate: mockFn(),
  };
  const accountsRepo = {
    findAdAccountById: mockFn(),
    findAdAccountForUpdate: mockFn(),
  };
  const dataRepo = {
    findInsightsInPeriod: mockFn(),
    createDeliverySnapshot: mockFn(),
    createBillingEvent: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AdsOptimizationService(
    em as any,
    optimizationRepo,
    campaignsRepo as any,
    accountsRepo as any,
    dataRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    optimizationRepo,
    campaignsRepo,
    accountsRepo,
    dataRepo,
    logger,
  };
}

describe('AdsOptimizationService', () => {
  describe('createExperiment (UC-43-10)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        name: 'Prueba creativo',
        experimentType: 'AB_SPLIT' as const,
        objectiveMetric: 'CPA' as const,
        variants: [
          {
            name: 'Control',
            variantRefType: 'AD_SET' as const,
            variantRefId: AD_SET,
            trafficSplitPercent: '50',
            isControl: true,
          },
          {
            name: 'Variante',
            variantRefType: 'AD_SET' as const,
            variantRefId: 'adset-b',
            trafficSplitPercent: '50',
            isControl: false,
          },
        ],
        ...overrides,
      };
    }

    it('starts the experiment and activates its paused entities', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue({ id: ACCOUNT });
      d.optimizationRepo.createExperiment.mockReturnValue({ id: 'exp-1' });
      d.campaignsRepo.findAdSetForUpdate.mockImplementation(async () => ({
        id: AD_SET,
        statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
      }));
      let n = 0;
      d.optimizationRepo.createVariant.mockImplementation(() => ({
        id: `var-${++n}`,
      }));

      const res = await d.service.createExperiment(ACCOUNT, dto(), actor);

      expect(res).toMatchObject({
        id: 'exp-1',
        statusConceptId: CONCEPTS.EXPERIMENT_RUNNING,
        variantIds: ['var-1', 'var-2'],
        entitiesActivated: 2,
      });
    });

    it('rejects a traffic split that does not add up to 100', async () => {
      const d = build();

      await expect(
        d.service.createExperiment(
          ACCOUNT,
          dto({
            variants: [
              {
                name: 'A',
                variantRefType: 'AD_SET' as const,
                variantRefId: AD_SET,
                trafficSplitPercent: '30',
                isControl: true,
              },
              {
                name: 'B',
                variantRefType: 'AD_SET' as const,
                variantRefId: 'adset-b',
                trafficSplitPercent: '30',
                isControl: false,
              },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an experiment with no control', async () => {
      const d = build();

      await expect(
        d.service.createExperiment(
          ACCOUNT,
          dto({
            variants: [
              {
                name: 'A',
                variantRefType: 'AD_SET' as const,
                variantRefId: AD_SET,
                trafficSplitPercent: '50',
                isControl: false,
              },
              {
                name: 'B',
                variantRefType: 'AD_SET' as const,
                variantRefId: 'adset-b',
                trafficSplitPercent: '50',
                isControl: false,
              },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an experiment with two controls', async () => {
      const d = build();

      await expect(
        d.service.createExperiment(
          ACCOUNT,
          dto({
            variants: [
              {
                name: 'A',
                variantRefType: 'AD_SET' as const,
                variantRefId: AD_SET,
                trafficSplitPercent: '50',
                isControl: true,
              },
              {
                name: 'B',
                variantRefType: 'AD_SET' as const,
                variantRefId: 'adset-b',
                trafficSplitPercent: '50',
                isControl: true,
              },
            ],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when a variant points at an entity that does not exist', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue({ id: ACCOUNT });
      d.optimizationRepo.createExperiment.mockReturnValue({ id: 'exp-1' });
      d.campaignsRepo.findAdSetForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createExperiment(ACCOUNT, dto(), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('evaluateRule (UC-43-11)', () => {
    /**
     * Ejecuta la operación enabled rule.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de enabled rule conforme al contrato `any`.
     */
    function enabledRule(overrides: Record<string, unknown> = {}): any {
      return {
        id: RULE,
        isEnabled: true,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        scopeConceptId: CONCEPTS.RULE_SCOPE_ADSET,
        actionConceptId: CONCEPTS.RULE_ACTION_PAUSE,
        ...overrides,
      };
    }

    it('pauses the matched ad sets and logs the execution', async () => {
      const d = build();
      d.optimizationRepo.findRuleForUpdate.mockResolvedValue(enabledRule());
      const adSet: any = {
        id: AD_SET,
        statusConceptId: CONCEPTS.AD_STATUS_ACTIVE,
      };
      d.campaignsRepo.findAdSetForUpdate.mockResolvedValue(adSet);
      d.optimizationRepo.createRuleExecution.mockReturnValue({ id: 'exec-1' });

      const res = await d.service.evaluateRule(
        RULE,
        { matchedEntityIds: [AD_SET] },
        actor,
      );

      expect(res).toMatchObject({
        ruleExecutionId: 'exec-1',
        entitiesEvaluated: 1,
        entitiesAffected: 1,
        statusConceptId: CONCEPTS.RULE_RUN_SUCCEEDED,
      });
      expect(adSet.statusConceptId).toBe(CONCEPTS.AD_STATUS_PAUSED);
    });

    it('does not count an entity that was already in the target state', async () => {
      const d = build();
      d.optimizationRepo.findRuleForUpdate.mockResolvedValue(enabledRule());
      d.campaignsRepo.findAdSetForUpdate.mockResolvedValue({
        id: AD_SET,
        statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
      });
      d.optimizationRepo.createRuleExecution.mockReturnValue({ id: 'exec-1' });

      const res = await d.service.evaluateRule(
        RULE,
        { matchedEntityIds: [AD_SET] },
        actor,
      );

      expect(res).toMatchObject({ entitiesEvaluated: 1, entitiesAffected: 0 });
    });

    it('adjusts the budget when the action says so', async () => {
      const d = build();
      d.optimizationRepo.findRuleForUpdate.mockResolvedValue(
        enabledRule({ actionConceptId: CONCEPTS.RULE_ACTION_ADJUST_BUDGET }),
      );
      const adSet: any = { id: AD_SET, dailyBudget: '100.00' };
      d.campaignsRepo.findAdSetForUpdate.mockResolvedValue(adSet);
      d.optimizationRepo.createRuleExecution.mockReturnValue({ id: 'exec-1' });

      await d.service.evaluateRule(
        RULE,
        { matchedEntityIds: [AD_SET], newDailyBudget: '250.00' },
        actor,
      );

      expect(adSet.dailyBudget).toBe('250.00');
    });

    it('logs an execution with no effect when nothing matched', async () => {
      const d = build();
      d.optimizationRepo.findRuleForUpdate.mockResolvedValue(enabledRule());
      d.optimizationRepo.createRuleExecution.mockReturnValue({ id: 'exec-1' });

      const res = await d.service.evaluateRule(
        RULE,
        { matchedEntityIds: [] },
        actor,
      );

      expect(res).toMatchObject({ entitiesEvaluated: 0, entitiesAffected: 0 });
      expect(d.optimizationRepo.createRuleExecution).toHaveBeenCalled();
    });

    it('rejects a disabled rule', async () => {
      const d = build();
      d.optimizationRepo.findRuleForUpdate.mockResolvedValue(
        enabledRule({ isEnabled: false }),
      );

      await expect(
        d.service.evaluateRule(RULE, { matchedEntityIds: [] }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordReviewEvent (UC-43-12)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        reviewEventType: 'INITIAL' as const,
        reviewStatus: 'APPROVED' as const,
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
      const ad: any = { id: AD, adSetId: AD_SET };
      d.campaignsRepo.findAdForUpdate.mockResolvedValue(ad);
      d.optimizationRepo.createReviewEvent.mockReturnValue({ id: 'review-1' });
      d.campaignsRepo.findAdSetById.mockResolvedValue({
        id: AD_SET,
        campaignId: CAMPAIGN,
      });
      d.campaignsRepo.findCampaignById.mockResolvedValue({
        id: CAMPAIGN,
        adAccountId: ACCOUNT,
      });
      d.optimizationRepo.findOpenViolations.mockResolvedValue([]);
      return ad;
    }

    it('approving leaves the ad effectively active', async () => {
      const d = build();
      const ad = wire(d);

      const res = await d.service.recordReviewEvent(AD, dto(), actor);

      expect(res).toMatchObject({
        reviewEventId: 'review-1',
        effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_ACTIVE,
        duplicate: false,
      });
      expect(ad.effectiveStatusConceptId).toBe(CONCEPTS.AD_EFFECTIVE_ACTIVE);
    });

    it('approving closes the open violations', async () => {
      const d = build();
      wire(d);
      const violation: any = {
        id: VIOLATION,
        statusConceptId: CONCEPTS.VIOLATION_OPEN,
      };
      d.optimizationRepo.findOpenViolations.mockResolvedValue([violation]);

      await d.service.recordReviewEvent(AD, dto(), actor);

      expect(violation.statusConceptId).toBe(CONCEPTS.VIOLATION_RESOLVED);
      expect(violation.resolvedAt).toBeInstanceOf(Date);
    });

    it('disapproving opens a violation and stops delivery', async () => {
      const d = build();
      const ad = wire(d);
      d.optimizationRepo.createViolation.mockReturnValue({ id: VIOLATION });

      const res = await d.service.recordReviewEvent(
        AD,
        dto({
          reviewStatus: 'DISAPPROVED' as const,
          policyCode: 'HEALTH_CLAIMS',
          policyCategory: 'HEALTH' as const,
          severity: 'HIGH' as const,
        }),
        actor,
      );

      expect(res).toMatchObject({
        violationId: VIOLATION,
        effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_DISAPPROVED,
      });
      expect(ad.effectiveStatusConceptId).toBe(
        CONCEPTS.AD_EFFECTIVE_DISAPPROVED,
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses a rejection with no policy detail', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.recordReviewEvent(
          AD,
          dto({ reviewStatus: 'DISAPPROVED' as const }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('is idempotent when the platform redelivers the webhook', async () => {
      const d = build();
      d.optimizationRepo.findReviewEventByExternalId.mockResolvedValue({
        id: 'review-prev',
      });
      d.campaignsRepo.findAdById.mockResolvedValue({
        id: AD,
        effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_ACTIVE,
      });

      const res = await d.service.recordReviewEvent(
        AD,
        dto({ externalReviewId: 'ext-1' }),
        actor,
      );

      expect(res).toMatchObject({
        reviewEventId: 'review-prev',
        duplicate: true,
      });
      expect(d.optimizationRepo.createReviewEvent).not.toHaveBeenCalled();
    });

    it('fails when the ad does not exist', async () => {
      const d = build();
      d.campaignsRepo.findAdForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordReviewEvent(AD, dto(), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('submitAppeal (UC-43-12)', () => {
    const dto = { appealReason: 'El contenido no hace afirmaciones de salud' };

    it('submits the appeal on an open violation', async () => {
      const d = build();
      d.optimizationRepo.findViolationForUpdate.mockResolvedValue({
        id: VIOLATION,
        statusConceptId: CONCEPTS.VIOLATION_OPEN,
      });
      d.optimizationRepo.findAppealByViolation.mockResolvedValue(null);
      d.optimizationRepo.createAppeal.mockReturnValue({ id: 'appeal-1' });

      const res = await d.service.submitAppeal(VIOLATION, dto, actor);

      expect(res).toMatchObject({
        id: 'appeal-1',
        statusConceptId: CONCEPTS.APPEAL_SUBMITTED,
      });
    });

    it('refuses to appeal a violation that is already resolved', async () => {
      const d = build();
      d.optimizationRepo.findViolationForUpdate.mockResolvedValue({
        id: VIOLATION,
        statusConceptId: CONCEPTS.VIOLATION_RESOLVED,
      });

      await expect(
        d.service.submitAppeal(VIOLATION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a second appeal on the same violation', async () => {
      const d = build();
      d.optimizationRepo.findViolationForUpdate.mockResolvedValue({
        id: VIOLATION,
        statusConceptId: CONCEPTS.VIOLATION_OPEN,
      });
      d.optimizationRepo.findAppealByViolation.mockResolvedValue({
        id: 'appeal-prev',
      });

      await expect(
        d.service.submitAppeal(VIOLATION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('issueInvoice (UC-43-14)', () => {
    const dto = {
      invoiceNumber: 'ADS-2026-07',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param rollups - Valor de rollups requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, rollups: any[]) {
      d.optimizationRepo.findInvoiceByNumber.mockResolvedValue(null);
      d.accountsRepo.findAdAccountForUpdate.mockResolvedValue({ id: ACCOUNT });
      d.optimizationRepo.findInvoiceForPeriod.mockResolvedValue(null);
      d.dataRepo.findInsightsInPeriod.mockResolvedValue(rollups);
      d.optimizationRepo.createInvoice.mockReturnValue({ id: 'invoice-1' });
    }

    it('aggregates the daily rollups into one line per campaign', async () => {
      const d = build();
      wire(d, [
        {
          entityRefId: CAMPAIGN,
          impressions: '1000',
          clicks: '50',
          spend: '25.00',
        },
        {
          entityRefId: CAMPAIGN,
          impressions: '2000',
          clicks: '80',
          spend: '40.00',
        },
        {
          entityRefId: 'campaign-b',
          impressions: '500',
          clicks: '10',
          spend: '10.00',
        },
      ]);

      const res = await d.service.issueInvoice(ACCOUNT, dto, actor);

      expect(res).toMatchObject({
        subtotal: '75.00',
        total: '75.00',
        lines: 2,
      });
      const firstLine = d.optimizationRepo.createInvoiceLine.mock.calls[0][1];
      expect(firstLine).toMatchObject({
        campaignRefId: CAMPAIGN,
        impressions: '3000',
        amount: '65.00',
      });
      // Se asienta el cobro real de la factura por el total.
      expect(d.dataRepo.createBillingEvent).toHaveBeenCalledTimes(1);
      const charge = d.dataRepo.createBillingEvent.mock.calls[0][1];
      expect(charge).toMatchObject({
        adAccountId: ACCOUNT,
        billingEventTypeConceptId: CONCEPTS.AD_BILLING_CHARGE,
        amount: '75.00',
        externalBillingRef: dto.invoiceNumber,
      });
    });

    it('applies the tax percentage on the subtotal', async () => {
      const d = build();
      wire(d, [{ entityRefId: CAMPAIGN, spend: '100.00' }]);

      const res = await d.service.issueInvoice(
        ACCOUNT,
        { ...dto, taxPercentage: '13' },
        actor,
      );

      expect(res).toMatchObject({
        subtotal: '100.00',
        taxTotal: '13.00',
        total: '113.00',
      });
    });

    it('rejects a duplicate invoice number', async () => {
      const d = build();
      d.optimizationRepo.findInvoiceByNumber.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.issueInvoice(ACCOUNT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to bill a period twice', async () => {
      const d = build();
      wire(d, [{ entityRefId: CAMPAIGN, spend: '10.00' }]);
      d.optimizationRepo.findInvoiceForPeriod.mockResolvedValue({
        id: 'invoice-prev',
      });

      await expect(
        d.service.issueInvoice(ACCOUNT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to bill a period with no recorded consumption', async () => {
      const d = build();
      wire(d, []);

      await expect(
        d.service.issueInvoice(ACCOUNT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a period that ends before it starts', async () => {
      const d = build();
      d.optimizationRepo.findInvoiceByNumber.mockResolvedValue(null);

      await expect(
        d.service.issueInvoice(
          ACCOUNT,
          { ...dto, periodStart: '2026-07-31', periodEnd: '2026-07-01' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('submitLead (UC-43-15)', () => {
    /**
     * Ejecuta la operación dto.
     *
     * @param answers - Valor de answers requerido por la operación.
     * @returns Resultado de dto conforme al contrato `any`.
     */
    function dto(
      answers: any[] = [{ questionKey: 'email', answer: 'a@b.com' }],
    ): any {
      return {
        tenantId: TENANT,
        externalLeadId: 'lead-ext-1',
        answers,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param form - Valor de form requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      form: Record<string, unknown> = {},
    ) {
      d.optimizationRepo.findLeadFormById.mockResolvedValue({
        id: FORM,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...form,
      });
      d.optimizationRepo.findSubmissionByExternalId.mockResolvedValue(null);
      d.optimizationRepo.createSubmission.mockReturnValue({ id: 'sub-1' });
      d.optimizationRepo.findQuestionsByForm.mockResolvedValue([
        { id: 'q-1', questionKey: 'email', isRequired: true },
      ]);
      d.optimizationRepo.countDeliveryAttempts.mockResolvedValue(0);
      d.optimizationRepo.createDeliveryEvent.mockReturnValue({
        id: 'delivery-1',
      });
    }

    it('stores the answers and queues the CRM delivery', async () => {
      const d = build();
      wire(d, { destinationCrmPipelineId: PIPELINE });

      const res = await d.service.submitLead(FORM, dto(), actor);

      expect(res).toMatchObject({
        id: 'sub-1',
        processingStatusConceptId: CONCEPTS.LEAD_RECEIVED,
        answersStored: 1,
        answersIgnored: 0,
        duplicate: false,
        deliveryEventId: 'delivery-1',
      });
    });

    it('ignores answers that do not match a question of the form', async () => {
      const d = build();
      wire(d);

      const res = await d.service.submitLead(
        FORM,
        dto([
          { questionKey: 'email', answer: 'a@b.com' },
          { questionKey: 'diagnosis', answer: 'secreto' },
        ]),
        actor,
      );

      expect(res).toMatchObject({ answersStored: 1, answersIgnored: 1 });
    });

    it('hashes the source IP instead of storing it in the clear', async () => {
      const d = build();
      wire(d);

      await d.service.submitLead(
        FORM,
        { ...dto(), sourceIp: '10.0.0.1' },
        actor,
      );

      const persisted = d.optimizationRepo.createSubmission.mock.calls[0][1];
      expect(persisted.sourceIpHash).toHaveLength(64);
      expect(persisted.sourceIpHash).not.toContain('10.0.0.1');
    });

    it('refuses a submission missing a required answer', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.submitLead(
          FORM,
          dto([{ questionKey: 'email' }]),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('is idempotent when the platform redelivers the lead', async () => {
      const d = build();
      wire(d);
      d.optimizationRepo.findSubmissionByExternalId.mockResolvedValue({
        id: 'sub-prev',
        processingStatusConceptId: CONCEPTS.LEAD_RECEIVED,
      });

      const res = await d.service.submitLead(FORM, dto(), actor);

      expect(res).toMatchObject({
        id: 'sub-prev',
        duplicate: true,
        answersStored: 0,
      });
      expect(d.optimizationRepo.createSubmission).not.toHaveBeenCalled();
    });

    it('refuses an inactive form', async () => {
      const d = build();
      d.optimizationRepo.findLeadFormById.mockResolvedValue({
        id: FORM,
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.submitLead(FORM, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
