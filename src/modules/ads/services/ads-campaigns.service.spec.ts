import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AdsCampaignsService } from './ads-campaigns.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['AD_OPS'] };
const ACCOUNT = '11111111-1111-1111-1111-111111111111';
const AD_SET = '22222222-2222-2222-2222-222222222222';
const CAMPAIGN = '33333333-3333-3333-3333-333333333333';
const IDENTITY = '44444444-4444-4444-4444-444444444444';
const CURRENCY = '55555555-5555-5555-5555-555555555555';
const TARGETING = '66666666-6666-6666-6666-666666666666';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const campaignsRepo = {
    createCampaign: mockFn(),
    findCampaignById: mockFn(),
    findCampaignForUpdate: mockFn(),
    createAdSet: mockFn(),
    findAdSetById: mockFn(),
    findAdSetForUpdate: mockFn(),
    findAdSetsForRule: mockFn(),
    createPlacement: mockFn(),
    createCreative: mockFn(),
    createCreativeAsset: mockFn(),
    createAd: mockFn(),
    findAdById: mockFn(),
    findAdForUpdate: mockFn(),
    createTargetingSpec: mockFn(),
    findTargetingSpecById: mockFn(),
    createCustomAudience: mockFn(),
    findCustomAudienceById: mockFn(),
    createSavedAudience: mockFn(),
    createLookalikeSpec: mockFn(),
    createBudgetSchedule: mockFn(),
    findActiveSchedules: mockFn(),
    upsertAttributionSettings: mockFn(),
    findDefaultAttributionSettings: mockFn(),
    createLearningSnapshot: mockFn(),
  };
  const accountsRepo = {
    findAdAccountById: mockFn(),
    findIdentityAssetById: mockFn(),
    findActiveAssignmentForUpdate: mockFn(),
    createIdentityAssignment: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AdsCampaignsService(
    em as any,
    campaignsRepo,
    accountsRepo as any,
    logger as any,
  );
  return { service, tx, campaignsRepo, accountsRepo };
}

/**
 * Ejecuta la operación active account.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active account conforme al contrato `any`.
 */
function activeAccount(overrides: Record<string, unknown> = {}): any {
  return {
    id: ACCOUNT,
    accountStatusConceptId: CONCEPTS.AD_ACCOUNT_ACTIVE,
    currencyConceptId: CURRENCY,
    amountSpent: '100.00',
    ...overrides,
  };
}

/**
 * Ejecuta la operación launch dto.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de launch dto conforme al contrato `any`.
 */
function launchDto(overrides: Record<string, unknown> = {}): any {
  return {
    name: 'Campaña chequeo',
    objective: 'CONVERSIONS' as const,
    buyingType: 'AUCTION' as const,
    dailyBudget: '100.00',
    adSets: [
      {
        name: 'Conjunto A',
        optimizationGoal: 'CONVERSIONS' as const,
        billingEvent: 'IMPRESSIONS' as const,
        adName: 'Anuncio A',
        creative: { name: 'Creativo A', format: 'SINGLE_IMAGE' as const },
      },
    ],
    ...overrides,
  };
}

describe('AdsCampaignsService', () => {
  describe('launchCampaign (UC-43-04)', () => {
    /**
     * Ejecuta la operación wire happy path.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire happy path.
     */
    function wireHappyPath(d: ReturnType<typeof build>) {
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createCampaign.mockReturnValue({ id: CAMPAIGN });
      d.campaignsRepo.createAdSet.mockReturnValue({ id: AD_SET });
      d.campaignsRepo.createCreative.mockReturnValue({ id: 'creative-1' });
      d.campaignsRepo.createAd.mockReturnValue({ id: 'ad-1' });
    }

    it('creates the whole hierarchy paused and the ad pending review', async () => {
      const d = build();
      wireHappyPath(d);

      const res = await d.service.launchCampaign(ACCOUNT, launchDto(), actor);

      expect(res).toMatchObject({
        campaignId: CAMPAIGN,
        statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
        adSetIds: [AD_SET],
        adIds: ['ad-1'],
      });
      expect(d.campaignsRepo.createAd).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CONCEPTS.AD_STATUS_PAUSED,
          effectiveStatusConceptId: CONCEPTS.AD_EFFECTIVE_PENDING_REVIEW,
        }),
      );
    });

    it('creates the placements of each ad set', async () => {
      const d = build();
      wireHappyPath(d);

      await d.service.launchCampaign(
        ACCOUNT,
        launchDto({
          adSets: [
            {
              ...launchDto().adSets[0],
              placements: [
                { platform: 'META' as const, position: 'FEED' as const },
                { platform: 'META' as const, position: 'REELS' as const },
              ],
            },
          ],
        }),
        actor,
      );

      expect(d.campaignsRepo.createPlacement).toHaveBeenCalledTimes(2);
    });

    it('numbers the creative assets in the order received', async () => {
      const d = build();
      wireHappyPath(d);

      await d.service.launchCampaign(
        ACCOUNT,
        launchDto({
          adSets: [
            {
              ...launchDto().adSets[0],
              creative: {
                name: 'Creativo A',
                format: 'CAROUSEL' as const,
                assets: [
                  { assetType: 'IMAGE' as const },
                  { assetType: 'IMAGE' as const },
                ],
              },
            },
          ],
        }),
        actor,
      );

      expect(d.campaignsRepo.createCreativeAsset.mock.calls[0][1].ordinal).toBe(
        1,
      );
      expect(d.campaignsRepo.createCreativeAsset.mock.calls[1][1].ordinal).toBe(
        2,
      );
    });

    it('refuses an account that already burned its spend cap', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(
        activeAccount({ spendCapAmount: '100.00', amountSpent: '100.00' }),
      );

      await expect(
        d.service.launchCampaign(ACCOUNT, launchDto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive account', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(
        activeAccount({ accountStatusConceptId: CONCEPTS.AD_ACCOUNT_DISABLED }),
      );

      await expect(
        d.service.launchCampaign(ACCOUNT, launchDto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a launch with no budget anywhere', async () => {
      const d = build();

      await expect(
        d.service.launchCampaign(
          ACCOUNT,
          launchDto({ dailyBudget: undefined }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a window that ends before it starts', async () => {
      const d = build();

      await expect(
        d.service.launchCampaign(
          ACCOUNT,
          launchDto({
            startAt: '2026-03-01T00:00:00Z',
            stopAt: '2026-02-01T00:00:00Z',
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when a referenced targeting spec does not exist', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createCampaign.mockReturnValue({ id: CAMPAIGN });
      d.campaignsRepo.findTargetingSpecById.mockResolvedValue(null);

      await expect(
        d.service.launchCampaign(
          ACCOUNT,
          launchDto({
            adSets: [{ ...launchDto().adSets[0], targetingSpecId: TARGETING }],
          }),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createTargeting (UC-43-05)', () => {
    it('saves the targeting spec', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createTargetingSpec.mockReturnValue({ id: TARGETING });

      const res = await d.service.createTargeting(
        ACCOUNT,
        { ageMin: 25 },
        actor,
      );

      expect(res).toEqual({
        targetingSpecId: TARGETING,
        customAudienceId: undefined,
        lookalikeSpecId: undefined,
      });
    });

    it('creates the custom audience as populating', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createCustomAudience.mockReturnValue({ id: 'aud-1' });
      d.campaignsRepo.createTargetingSpec.mockReturnValue({ id: TARGETING });

      const res = await d.service.createTargeting(
        ACCOUNT,
        { customAudience: { name: 'Visitantes', source: 'PIXEL' as const } },
        actor,
      );

      expect(res.customAudienceId).toBe('aud-1');
      expect(d.campaignsRepo.createCustomAudience).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CONCEPTS.AUDIENCE_POPULATING,
        }),
      );
    });

    it('derives a lookalike from the audience when asked', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createCustomAudience.mockReturnValue({ id: 'aud-1' });
      d.campaignsRepo.createLookalikeSpec.mockReturnValue({ id: 'look-1' });
      d.campaignsRepo.createTargetingSpec.mockReturnValue({ id: TARGETING });

      const res = await d.service.createTargeting(
        ACCOUNT,
        {
          customAudience: {
            name: 'Visitantes',
            source: 'PIXEL' as const,
            lookalikeRatioPercent: '3',
            lookalikeCountryConceptId: CURRENCY,
          },
        },
        actor,
      );

      expect(res.lookalikeSpecId).toBe('look-1');
    });

    it('requires a country for a lookalike', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.createCustomAudience.mockReturnValue({ id: 'aud-1' });

      await expect(
        d.service.createTargeting(
          ACCOUNT,
          {
            customAudience: {
              name: 'Visitantes',
              source: 'PIXEL' as const,
              lookalikeRatioPercent: '3',
            },
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an inverted age range', async () => {
      const d = build();

      await expect(
        d.service.createTargeting(
          ACCOUNT,
          { ageMin: 60, ageMax: 20 },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('assignIdentity (UC-43-05)', () => {
    const dto = { adIdentityAssetId: IDENTITY };

    it('assigns the identity to the ad set', async () => {
      const d = build();
      d.campaignsRepo.findAdSetById.mockResolvedValue({ id: AD_SET });
      d.accountsRepo.findIdentityAssetById.mockResolvedValue({
        id: IDENTITY,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.accountsRepo.findActiveAssignmentForUpdate.mockResolvedValue(null);
      d.accountsRepo.createIdentityAssignment.mockReturnValue({
        id: 'assign-1',
      });

      const res = await d.service.assignIdentity(AD_SET, dto, actor);

      expect(res).toEqual({
        assignmentId: 'assign-1',
        adSetId: AD_SET,
        supersededAssignmentId: undefined,
      });
    });

    it('closes the previous assignment: only one identity is current', async () => {
      const d = build();
      d.campaignsRepo.findAdSetById.mockResolvedValue({ id: AD_SET });
      d.accountsRepo.findIdentityAssetById.mockResolvedValue({
        id: IDENTITY,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const previous: any = { id: 'assign-old', effectiveTo: undefined };
      d.accountsRepo.findActiveAssignmentForUpdate.mockResolvedValue(previous);
      d.accountsRepo.createIdentityAssignment.mockReturnValue({
        id: 'assign-1',
      });

      const res = await d.service.assignIdentity(AD_SET, dto, actor);

      expect(res.supersededAssignmentId).toBe('assign-old');
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('rejects an inactive identity', async () => {
      const d = build();
      d.campaignsRepo.findAdSetById.mockResolvedValue({ id: AD_SET });
      d.accountsRepo.findIdentityAssetById.mockResolvedValue({
        id: IDENTITY,
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.assignIdentity(AD_SET, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the ad set does not exist', async () => {
      const d = build();
      d.campaignsRepo.findAdSetById.mockResolvedValue(null);

      await expect(
        d.service.assignIdentity(AD_SET, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createBudgetSchedule (UC-43-16)', () => {
    const dto = {
      budgetType: 'DAILY' as const,
      amount: '200.00',
      currencyConceptId: CURRENCY,
      validFrom: '2026-08-01T00:00:00Z',
    };

    /**
     * Ejecuta la operación wire ad set.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de wire ad set.
     */
    function wireAdSet(
      d: ReturnType<typeof build>,
      overrides: Record<string, unknown> = {},
    ) {
      const adSet: any = {
        id: AD_SET,
        campaignId: CAMPAIGN,
        dailyBudget: '100.00',
        ...overrides,
      };
      d.campaignsRepo.findAdSetForUpdate.mockResolvedValue(adSet);
      d.campaignsRepo.findCampaignById.mockResolvedValue({
        id: CAMPAIGN,
        adAccountId: ACCOUNT,
      });
      d.accountsRepo.findAdAccountById.mockResolvedValue(activeAccount());
      d.campaignsRepo.findActiveSchedules.mockResolvedValue([]);
      d.campaignsRepo.createBudgetSchedule.mockReturnValue({ id: 'sched-1' });
      d.campaignsRepo.createLearningSnapshot.mockReturnValue({ id: 'learn-1' });
      return adSet;
    }

    it('applies the budget and resets the learning phase', async () => {
      const d = build();
      const adSet = wireAdSet(d);

      const res = await d.service.createBudgetSchedule(AD_SET, dto, actor);

      expect(res).toMatchObject({
        id: 'sched-1',
        amount: '200.00',
        learningReset: true,
        learningSnapshotId: 'learn-1',
      });
      expect(adSet.dailyBudget).toBe('200.00');
      expect(d.campaignsRepo.createLearningSnapshot).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          learningStatusConceptId: CONCEPTS.LEARNING_LEARNING,
        }),
      );
    });

    it('does not reset learning when nothing actually changed', async () => {
      const d = build();
      wireAdSet(d, { dailyBudget: '200.00' });

      const res = await d.service.createBudgetSchedule(AD_SET, dto, actor);

      expect(res.learningReset).toBe(false);
      expect(d.campaignsRepo.createLearningSnapshot).not.toHaveBeenCalled();
    });

    it('rejects a schedule that overlaps an existing one', async () => {
      const d = build();
      wireAdSet(d);
      d.campaignsRepo.findActiveSchedules.mockResolvedValue([
        {
          id: 'sched-old',
          validFrom: new Date('2026-07-01T00:00:00Z'),
          validTo: new Date('2026-09-01T00:00:00Z'),
        },
      ]);

      await expect(
        d.service.createBudgetSchedule(AD_SET, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('accepts a schedule that starts after the previous one ends', async () => {
      const d = build();
      wireAdSet(d);
      d.campaignsRepo.findActiveSchedules.mockResolvedValue([
        {
          id: 'sched-old',
          validFrom: new Date('2026-06-01T00:00:00Z'),
          validTo: new Date('2026-07-01T00:00:00Z'),
        },
      ]);

      const res = await d.service.createBudgetSchedule(AD_SET, dto, actor);

      expect(res.id).toBe('sched-1');
    });

    it('refuses a budget above the account spend cap', async () => {
      const d = build();
      wireAdSet(d);
      d.accountsRepo.findAdAccountById.mockResolvedValue(
        activeAccount({ spendCapAmount: '150.00' }),
      );

      await expect(
        d.service.createBudgetSchedule(AD_SET, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a window that ends before it starts', async () => {
      const d = build();

      await expect(
        d.service.createBudgetSchedule(
          AD_SET,
          { ...dto, validTo: '2026-07-01T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('updates the attribution windows when they are given', async () => {
      const d = build();
      wireAdSet(d);
      d.campaignsRepo.findDefaultAttributionSettings.mockResolvedValue(null);

      await d.service.createBudgetSchedule(
        AD_SET,
        { ...dto, clickWindowDays: 28, viewWindowDays: 7 },
        actor,
      );

      expect(d.campaignsRepo.upsertAttributionSettings).toHaveBeenCalledWith(
        d.tx,
        null,
        expect.objectContaining({ clickWindowDays: 28, viewWindowDays: 7 }),
      );
    });
  });
});
