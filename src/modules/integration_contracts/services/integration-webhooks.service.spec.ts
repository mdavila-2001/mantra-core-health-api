import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationWebhooksService } from './integration-webhooks.service';
import { ICON } from '../integration_contracts.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const contractsRepo = { findById: mockFn() };
  const versionsRepo = { findActiveByContract: mockFn() };
  const subscriptionsRepo = {
    findById: mockFn(),
    findDuplicate: mockFn(),
    create: mockFn(),
  };
  const exchangeRecordsRepo = { create: mockFn() };
  const evidenceRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationWebhooksService(
    em as any,
    contractsRepo as any,
    versionsRepo as any,
    subscriptionsRepo as any,
    exchangeRecordsRepo as any,
    evidenceRepo,
    logger as any,
  );
  return {
    service,
    tx,
    contractsRepo,
    versionsRepo,
    subscriptionsRepo,
    exchangeRecordsRepo,
    evidenceRepo,
  };
}

describe('IntegrationWebhooksService', () => {
  describe('subscribe (UC-31-04)', () => {
    it('subscribes a webhook on an ACTIVE contract', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.subscriptionsRepo.findDuplicate.mockResolvedValue(null);
      d.subscriptionsRepo.create.mockReturnValue({
        id: 's1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });

      const res = await d.service.subscribe(
        'c1',
        { callbackUri: 'https://x/cb' },
        actor,
      );

      expect(res).toEqual({
        id: 's1',
        integrationContractId: 'c1',
        status: ICON.SUBSCRIPTION_ACTIVE,
      });
    });

    it('rejects subscribing when the contract is not ACTIVE (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_DRAFT,
      });
      await expect(
        d.service.subscribe(
          'c1',
          { callbackUri: 'https://x/cb' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate subscription (409)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({
        id: 'c1',
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.subscriptionsRepo.findDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.subscribe(
          'c1',
          { callbackUri: 'https://x/cb' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deliver (UC-31-09)', () => {
    it('records an OUTBOUND exchange and delivery evidence, flushing the record first', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1' });
      d.exchangeRecordsRepo.create.mockReturnValue({
        id: 'r1',
        outcomeConceptId: ICON.OUTCOME_SUCCESS,
      });
      d.evidenceRepo.create.mockReturnValue({
        id: 'e1',
        outcomeConceptId: ICON.DELIVERY_DELIVERED,
      });

      const res = await d.service.deliver(
        's1',
        { outcome: 'DELIVERED' } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'e1',
        integrationExchangeRecordId: 'r1',
        outcome: ICON.DELIVERY_DELIVERED,
      });
      expect(d.exchangeRecordsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          directionConceptId: ICON.DIRECTION_OUTBOUND,
          messageTypeConceptId: ICON.MESSAGE_WEBHOOK,
          integrationContractVersionId: 'v1',
        }),
      );
      expect(d.evidenceRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          integrationExchangeRecordId: 'r1',
          webhookSubscriptionId: 's1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('throws not found when the subscription is absent (404)', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.deliver('s1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects delivery when there is no ACTIVE contract version (422)', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue(null);
      await expect(
        d.service.deliver('s1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
