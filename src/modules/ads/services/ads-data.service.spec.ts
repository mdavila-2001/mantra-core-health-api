import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AdsDataService } from './ads-data.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const ACCOUNT = '22222222-2222-2222-2222-222222222222';
const CONNECTION = '33333333-3333-3333-3333-333333333333';
const DATASET = '44444444-4444-4444-4444-444444444444';
const CAMPAIGN = '55555555-5555-5555-5555-555555555555';
const CATALOG = '66666666-6666-6666-6666-666666666666';
const FEED = '77777777-7777-7777-7777-777777777777';
const CURRENCY = '88888888-8888-8888-8888-888888888888';
const CONSENT = '99999999-9999-9999-9999-999999999999';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dataRepo = {
    createEventPolicy: mockFn(),
    findEventPolicyById: mockFn(),
    findEventPolicyByCode: mockFn(),
    findActiveEventPolicy: mockFn(),
    createFieldRule: mockFn(),
    findFieldRules: mockFn(),
    createInsightRun: mockFn(),
    createFactRow: mockFn(),
    findInsightsDaily: mockFn(),
    createInsightsDaily: mockFn(),
    createDeliverySnapshot: mockFn(),
    createBillingEvent: mockFn(),
    findBillingEventsInPeriod: mockFn(),
    findInsightsInPeriod: mockFn(),
    findDatasetById: mockFn(),
    findDedupForUpdate: mockFn(),
    createDedup: mockFn(),
    createServerEvent: mockFn(),
    createEventUserData: mockFn(),
    createEventCustomData: mockFn(),
    createBlockedEvent: mockFn(),
    createDeliveryAttempt: mockFn(),
    createOfflineSet: mockFn(),
    findOfflineSetForUpdate: mockFn(),
    createOfflineEvent: mockFn(),
    findCatalogById: mockFn(),
    findCatalogForUpdate: mockFn(),
    findFeedForUpdate: mockFn(),
    findProductByRetailerId: mockFn(),
    createProduct: mockFn(),
    countProducts: mockFn(),
    findDynamicSets: mockFn(),
    findSetMember: mockFn(),
    createSetMember: mockFn(),
    countSetMembers: mockFn(),
    createFeedRunLog: mockFn(),
  };
  const accountsRepo = {
    findConnectionById: mockFn(),
    findAdAccountById: mockFn(),
    findAdAccountForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AdsDataService(
    em as any,
    dataRepo,
    accountsRepo as any,
    logger as any,
  );
  return { service, tx, dataRepo, accountsRepo, logger };
}

describe('AdsDataService', () => {
  describe('createEventPolicy (UC-43-06)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'POL-BO',
      name: 'Política Bolivia',
      jurisdiction: 'BO' as const,
      purposeOfUse: 'MARKETING' as const,
      defaultAction: 'BLOCK' as const,
      fieldRules: [
        {
          eventNamePattern: '*',
          fieldPath: 'user_data.external_user_id',
          action: 'HASH' as const,
          transformation: 'SHA256' as const,
        },
      ],
    };

    it('publishes the policy active with its field rules', async () => {
      const d = build();
      d.dataRepo.findEventPolicyByCode.mockResolvedValue(null);
      d.dataRepo.createEventPolicy.mockReturnValue({ id: 'pol-1' });
      d.dataRepo.createFieldRule.mockReturnValue({ id: 'rule-1' });

      const res = await d.service.createEventPolicy(dto, actor);

      expect(res).toMatchObject({
        id: 'pol-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        fieldRuleIds: ['rule-1'],
      });
    });

    it('rejects a duplicate code in the tenant', async () => {
      const d = build();
      d.dataRepo.findEventPolicyByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createEventPolicy(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a HASH rule with no transformation', async () => {
      const d = build();
      d.dataRepo.findEventPolicyByCode.mockResolvedValue(null);

      await expect(
        d.service.createEventPolicy(
          {
            ...dto,
            fieldRules: [
              {
                eventNamePattern: '*',
                fieldPath: 'a',
                action: 'HASH' as const,
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('ingestInsights (UC-43-07)', () => {
    function dto(rows: any[] = []): any {
      return {
        tenantId: TENANT,
        adAccountId: ACCOUNT,
        platformConnectionId: CONNECTION,
        dateStart: '2026-07-01',
        dateEnd: '2026-07-01',
        rows: rows.length
          ? rows
          : [
              {
                entityType: 'CAMPAIGN' as const,
                entityRefId: CAMPAIGN,
                externalObjectId: 'ext_1',
                statDate: '2026-07-01',
                impressions: '1000',
                clicks: '50',
                spend: '25.00',
              },
            ],
      };
    }

    function wire(
      d: ReturnType<typeof build>,
      account: Record<string, unknown> = {},
    ) {
      d.accountsRepo.findConnectionById.mockResolvedValue({
        id: CONNECTION,
        statusConceptId: CONCEPTS.CONNECTION_CONNECTED,
      });
      const acc: any = {
        id: ACCOUNT,
        currencyConceptId: CURRENCY,
        amountSpent: '100.00',
        ...account,
      };
      d.accountsRepo.findAdAccountForUpdate.mockResolvedValue(acc);
      d.dataRepo.createInsightRun.mockReturnValue({ id: 'run-1' });
      return acc;
    }

    it('creates the daily rollup and adds the spend to the account', async () => {
      const d = build();
      const account = wire(d);
      d.dataRepo.findInsightsDaily.mockResolvedValue(null);

      const res = await d.service.ingestInsights(dto(), actor);

      expect(res).toMatchObject({
        insightQueryRunId: 'run-1',
        factRows: 1,
        rollupsCreated: 1,
        rollupsUpdated: 0,
        amountSpent: '125.00',
        spendCapReached: false,
      });
      expect(account.amountSpent).toBe('125.00');
    });

    it('reingesting a day rewrites the rollup and only adds the delta', async () => {
      const d = build();
      wire(d);
      const existing: any = {
        id: 'rollup-1',
        spend: '20.00',
        impressions: '800',
      };
      d.dataRepo.findInsightsDaily.mockResolvedValue(existing);

      const res = await d.service.ingestInsights(dto(), actor);

      // 25 nuevos menos 20 ya contabilizados = 5 de incremento sobre los 100.
      expect(res).toMatchObject({
        rollupsCreated: 0,
        rollupsUpdated: 1,
        amountSpent: '105.00',
      });
      expect(existing.spend).toBe('25.00');
      expect(d.dataRepo.createInsightsDaily).not.toHaveBeenCalled();
    });

    it('warns when the account reaches its spend cap', async () => {
      const d = build();
      wire(d, { spendCapAmount: '110.00' });
      d.dataRepo.findInsightsDaily.mockResolvedValue(null);

      const res = await d.service.ingestInsights(dto(), actor);

      expect(res.spendCapReached).toBe(true);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('records a billing event when asked', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findInsightsDaily.mockResolvedValue(null);

      await d.service.ingestInsights(
        { ...dto(), recordBillingEvent: true },
        actor,
      );

      expect(d.dataRepo.createBillingEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          amount: '25.00',
          billingEventTypeConceptId: CONCEPTS.AD_BILLING_CHARGE,
        }),
      );
    });

    it('rejects an inactive platform connection', async () => {
      const d = build();
      d.accountsRepo.findConnectionById.mockResolvedValue({
        id: CONNECTION,
        statusConceptId: CONCEPTS.CONNECTION_REVOKED,
      });

      await expect(
        d.service.ingestInsights(dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the ad account does not exist', async () => {
      const d = build();
      d.accountsRepo.findConnectionById.mockResolvedValue({
        id: CONNECTION,
        statusConceptId: CONCEPTS.CONNECTION_CONNECTED,
      });
      d.accountsRepo.findAdAccountForUpdate.mockResolvedValue(null);

      await expect(
        d.service.ingestInsights(dto(), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('sendConversion (UC-43-08)', () => {
    function dto(overrides: Record<string, unknown> = {}): any {
      return {
        tenantId: TENANT,
        eventName: 'Purchase',
        eventId: 'evt-1',
        eventTime: '2026-07-01T10:00:00Z',
        actionSource: 'WEBSITE' as const,
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>) {
      d.dataRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        statusConceptId: CONCEPTS.DATASET_ACTIVE,
      });
      d.dataRepo.findDedupForUpdate.mockResolvedValue(null);
      d.dataRepo.findActiveEventPolicy.mockResolvedValue(null);
      d.dataRepo.createServerEvent.mockReturnValue({ id: 'event-1' });
    }

    it('accepts the event and records its dedup entry', async () => {
      const d = build();
      wire(d);

      const res = await d.service.sendConversion(DATASET, dto(), actor);

      expect(res).toMatchObject({
        eventId: 'event-1',
        processingStatusConceptId: CONCEPTS.EVENT_ACCEPTED,
        duplicate: false,
        blocked: false,
      });
      expect(d.dataRepo.createDedup).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resolutionConceptId: CONCEPTS.DEDUP_UNIQUE }),
      );
    });

    it('counts the browser-then-server repeat as a duplicate without persisting again', async () => {
      const d = build();
      d.dataRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        statusConceptId: CONCEPTS.DATASET_ACTIVE,
      });
      const dedup: any = {
        duplicateCount: 0,
        serverConversionEventId: 'event-prev',
      };
      d.dataRepo.findDedupForUpdate.mockResolvedValue(dedup);

      const res = await d.service.sendConversion(DATASET, dto(), actor);

      expect(res).toMatchObject({ duplicate: true, eventId: 'event-prev' });
      expect(dedup.duplicateCount).toBe(1);
      expect(dedup.resolutionConceptId).toBe(CONCEPTS.DEDUP_DUPLICATE);
      expect(d.dataRepo.createServerEvent).not.toHaveBeenCalled();
    });

    it('blocks the event when a field rule says BLOCK', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findActiveEventPolicy.mockResolvedValue({
        id: 'pol-1',
        requiresConsent: false,
      });
      d.dataRepo.findFieldRules.mockResolvedValue([
        {
          eventNamePattern: 'Purchase',
          fieldPath: 'custom_data.diagnosis',
          actionConceptId: CONCEPTS.FIELD_ACTION_BLOCK,
        },
      ]);

      const res = await d.service.sendConversion(DATASET, dto(), actor);

      expect(res).toMatchObject({
        blocked: true,
        processingStatusConceptId: CONCEPTS.EVENT_BLOCKED,
      });
      expect(d.dataRepo.createBlockedEvent).toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('drops the field a DROP rule points at, keeping the rest', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findActiveEventPolicy.mockResolvedValue({
        id: 'pol-1',
        requiresConsent: false,
      });
      d.dataRepo.findFieldRules.mockResolvedValue([
        {
          eventNamePattern: '*',
          fieldPath: 'user_data.client_ip_address',
          actionConceptId: CONCEPTS.FIELD_ACTION_DROP,
        },
      ]);

      await d.service.sendConversion(
        DATASET,
        dto({ userData: { clientIpAddress: '10.0.0.1', clickId: 'clk-1' } }),
        actor,
      );

      const persisted = d.dataRepo.createEventUserData.mock.calls[0][1];
      expect(persisted.clientIpAddressEncrypted).toBeUndefined();
      expect(persisted.clickId).toBe('clk-1');
    });

    it('refuses an event with no consent when the policy demands it', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findActiveEventPolicy.mockResolvedValue({
        id: 'pol-1',
        requiresConsent: true,
      });

      await expect(
        d.service.sendConversion(DATASET, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts the event when consent is provided', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findActiveEventPolicy.mockResolvedValue({
        id: 'pol-1',
        requiresConsent: true,
      });
      d.dataRepo.findFieldRules.mockResolvedValue([]);

      const res = await d.service.sendConversion(
        DATASET,
        dto({ consentDirectiveId: CONSENT }),
        actor,
      );

      expect(res.blocked).toBe(false);
    });

    it('queues the delivery attempt when a connection is given', async () => {
      const d = build();
      wire(d);

      await d.service.sendConversion(
        DATASET,
        dto({ platformConnectionId: CONNECTION }),
        actor,
      );

      expect(d.dataRepo.createDeliveryAttempt).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          attemptNumber: 1,
          resultConceptId: CONCEPTS.DELIVERY_QUEUED,
        }),
      );
    });

    it('rejects an inactive dataset', async () => {
      const d = build();
      d.dataRepo.findDatasetById.mockResolvedValue({
        id: DATASET,
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.sendConversion(DATASET, dto(), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('uploadOfflineConversions (UC-43-09)', () => {
    function dto(events: any[]): any {
      return {
        adAccountId: ACCOUNT,
        name: 'Ventas julio',
        uploadSource: 'FILE' as const,
        events,
      };
    }

    it('derives the match rate and the attributed value', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue({ id: ACCOUNT });
      const set: any = { id: 'set-1' };
      d.dataRepo.createOfflineSet.mockReturnValue(set);

      const res = await d.service.uploadOfflineConversions(
        dto([
          {
            eventName: 'Purchase',
            matchKeysHashJson: { email: 'abc' },
            valueAmount: '100.00',
            attributedCampaignRefId: CAMPAIGN,
          },
          {
            eventName: 'Purchase',
            matchKeysHashJson: { email: 'def' },
            valueAmount: '50.00',
          },
        ]),
        actor,
      );

      expect(res).toMatchObject({
        totalEvents: 2,
        matchedEvents: 1,
        matchRate: '0.5000',
        attributedValue: '100.00',
        statusConceptId: CONCEPTS.OFFLINE_SET_COMPLETED,
      });
      expect(set.matchRate).toBe('0.5000');
    });

    it('reports a zero match rate when nothing was attributed', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue({ id: ACCOUNT });
      d.dataRepo.createOfflineSet.mockReturnValue({ id: 'set-1' });

      const res = await d.service.uploadOfflineConversions(
        dto([{ eventName: 'Purchase', matchKeysHashJson: { email: 'abc' } }]),
        actor,
      );

      expect(res).toMatchObject({
        matchedEvents: 0,
        matchRate: '0.0000',
        attributedValue: '0.00',
      });
    });

    it('fails when the ad account does not exist', async () => {
      const d = build();
      d.accountsRepo.findAdAccountById.mockResolvedValue(null);

      await expect(
        d.service.uploadOfflineConversions(
          dto([{ eventName: 'Purchase', matchKeysHashJson: {} }]),
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('runFeed (UC-43-13)', () => {
    function dto(items: any[]): any {
      return { items };
    }

    function item(overrides: Record<string, unknown> = {}): any {
      return {
        retailerProductId: 'sku-1',
        title: 'Consulta',
        availability: 'IN_STOCK' as const,
        price: '150.00',
        ...overrides,
      };
    }

    function wire(d: ReturnType<typeof build>) {
      const catalog: any = { id: CATALOG, defaultCurrencyConceptId: CURRENCY };
      d.dataRepo.findCatalogForUpdate.mockResolvedValue(catalog);
      d.dataRepo.findFeedForUpdate.mockResolvedValue({
        id: FEED,
        productCatalogId: CATALOG,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.dataRepo.findDynamicSets.mockResolvedValue([]);
      d.dataRepo.countProducts.mockResolvedValue(1);
      d.dataRepo.createFeedRunLog.mockReturnValue({ id: 'log-1' });
      return catalog;
    }

    it('creates the products it has not seen before', async () => {
      const d = build();
      const catalog = wire(d);
      d.dataRepo.findProductByRetailerId.mockResolvedValue(null);
      d.dataRepo.createProduct.mockReturnValue({ id: 'prod-1' });

      const res = await d.service.runFeed(CATALOG, FEED, dto([item()]), actor);

      expect(res).toMatchObject({
        itemsRead: 1,
        itemsCreated: 1,
        itemsUpdated: 0,
        catalogItemCount: 1,
      });
      expect(catalog.itemCount).toBe(1);
    });

    it('is idempotent: a product already known is updated, not duplicated', async () => {
      const d = build();
      wire(d);
      const existing: any = { id: 'prod-1', title: 'Viejo' };
      d.dataRepo.findProductByRetailerId.mockResolvedValue(existing);

      const res = await d.service.runFeed(CATALOG, FEED, dto([item()]), actor);

      expect(res).toMatchObject({ itemsCreated: 0, itemsUpdated: 1 });
      expect(existing.title).toBe('Consulta');
      expect(d.dataRepo.createProduct).not.toHaveBeenCalled();
    });

    it('adds new products to the dynamic sets and recounts them', async () => {
      const d = build();
      wire(d);
      const set: any = { id: 'set-1', productCount: 0 };
      d.dataRepo.findDynamicSets.mockResolvedValue([set]);
      d.dataRepo.findProductByRetailerId.mockResolvedValue(null);
      d.dataRepo.createProduct.mockReturnValue({ id: 'prod-1' });
      d.dataRepo.findSetMember.mockResolvedValue(null);
      d.dataRepo.countSetMembers.mockResolvedValue(1);

      const res = await d.service.runFeed(CATALOG, FEED, dto([item()]), actor);

      expect(res.setMembershipsAdded).toBe(1);
      expect(set.productCount).toBe(1);
    });

    it('does not re-add a product already in the set', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findDynamicSets.mockResolvedValue([{ id: 'set-1' }]);
      d.dataRepo.findProductByRetailerId.mockResolvedValue({ id: 'prod-1' });
      d.dataRepo.findSetMember.mockResolvedValue({ id: 'member-1' });
      d.dataRepo.countSetMembers.mockResolvedValue(1);

      const res = await d.service.runFeed(CATALOG, FEED, dto([item()]), actor);

      expect(res.setMembershipsAdded).toBe(0);
      expect(d.dataRepo.createSetMember).not.toHaveBeenCalled();
    });

    it('refuses a feed that belongs to another catalog', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findFeedForUpdate.mockResolvedValue({
        id: FEED,
        productCatalogId: 'other-catalog',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await expect(
        d.service.runFeed(CATALOG, FEED, dto([item()]), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive feed', async () => {
      const d = build();
      wire(d);
      d.dataRepo.findFeedForUpdate.mockResolvedValue({
        id: FEED,
        productCatalogId: CATALOG,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.runFeed(CATALOG, FEED, dto([item()]), actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the catalog does not exist', async () => {
      const d = build();
      d.dataRepo.findCatalogForUpdate.mockResolvedValue(null);

      await expect(
        d.service.runFeed(CATALOG, FEED, dto([item()]), actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
