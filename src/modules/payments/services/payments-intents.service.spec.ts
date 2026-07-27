import { jest } from '@jest/globals';

// Mock laxo: conserva el runtime de jest pero evita los tipos Mock<never> estrictos
// de @jest/globals bajo el tsconfig raíz (mismo criterio que los specs de iam).
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PaymentsIntentsService } from './payments-intents.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const intentsRepo = {
    create: mockFn(),
    findByIdempotencyKey: mockFn(),
    findByIdForUpdate: mockFn(),
  };
  const flowRepo = {
    createFxLock: mockFn(),
    findActiveFxLock: mockFn(),
    createRiskAssessment: mockFn(),
    createSplit: mockFn(),
    findSplitsByIntent: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PaymentsIntentsService(
    em as any,
    intentsRepo as any,
    flowRepo as any,
    logger as any,
  );
  return { service, tx, em, intentsRepo, flowRepo, logger };
}

const baseIntentDto = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  gatewayId: '22222222-2222-2222-2222-222222222222',
  amount: '150.00',
  currency: 'BOB' as const,
  purpose: 'INVOICE' as const,
  idempotencyKey: 'key-1',
};

describe('PaymentsIntentsService', () => {
  describe('createIntent (UC-42-01)', () => {
    it('creates the intent when the idempotency key is new', async () => {
      const d = build();
      d.intentsRepo.findByIdempotencyKey.mockResolvedValue(null);
      d.intentsRepo.create.mockReturnValue({
        id: 'intent-1',
        tenantId: baseIntentDto.tenantId,
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PENDING,
        idempotencyKey: 'key-1',
      });

      const res = await d.service.createIntent(baseIntentDto, actor);

      expect(res).toEqual({
        id: 'intent-1',
        tenantId: baseIntentDto.tenantId,
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PENDING,
        idempotencyKey: 'key-1',
        reused: false,
      });
      expect(d.intentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.PI_PENDING }),
      );
    });

    it('returns the existing intent on an idempotent retry instead of charging twice', async () => {
      const d = build();
      d.intentsRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'intent-1',
        tenantId: baseIntentDto.tenantId,
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PENDING,
        idempotencyKey: 'key-1',
      });

      const res = await d.service.createIntent(baseIntentDto, actor);

      expect(res.reused).toBe(true);
      expect(res.id).toBe('intent-1');
      expect(d.intentsRepo.create).not.toHaveBeenCalled();
      expect(d.em.transactional).not.toHaveBeenCalled();
    });
  });

  describe('lockFxRate (UC-42-03)', () => {
    const fxDto = {
      fromCurrency: 'USD' as const,
      toCurrency: 'BOB' as const,
      lockedRate: '6.96',
      expiresAt: '2026-12-31T00:00:00Z',
    };

    it('locks the rate and restates the intent amount in the target currency', async () => {
      const d = build();
      const intent = {
        id: 'intent-1',
        amount: '100.00',
        currencyConceptId: CONCEPTS.CURRENCY_USD,
        statusConceptId: CONCEPTS.PI_PENDING,
      };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.findActiveFxLock.mockResolvedValue(null);
      d.flowRepo.createFxLock.mockReturnValue({ id: 'fx-1' });

      const res = await d.service.lockFxRate('intent-1', fxDto, actor);

      expect(res.convertedAmount).toBe('696.00');
      expect(intent.amount).toBe('696.00');
      expect(intent.currencyConceptId).toBe(CONCEPTS.CURRENCY_BOB);
    });

    it('rejects a second active lock on the same intent', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        amount: '100.00',
        statusConceptId: CONCEPTS.PI_PENDING,
      });
      d.flowRepo.findActiveFxLock.mockResolvedValue({ id: 'fx-existing' });

      await expect(
        d.service.lockFxRate('intent-1', fxDto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects locking when the intent is no longer pending', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        amount: '100.00',
        statusConceptId: CONCEPTS.PI_SUCCEEDED,
      });

      await expect(
        d.service.lockFxRate('intent-1', fxDto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects same-currency locks before touching the database', async () => {
      const d = build();
      await expect(
        d.service.lockFxRate(
          'intent-1',
          { ...fxDto, fromCurrency: 'BOB', toCurrency: 'BOB' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.em.transactional).not.toHaveBeenCalled();
    });

    it('throws when the intent does not exist', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(null);

      await expect(
        d.service.lockFxRate('missing', fxDto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('assessRisk (UC-42-04)', () => {
    it('derives HIGH level and fails the intent when the engine declines', async () => {
      const d = build();
      const intent = { id: 'intent-1', statusConceptId: CONCEPTS.PI_PENDING };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.createRiskAssessment.mockReturnValue({ id: 'risk-1' });

      const res = await d.service.assessRisk(
        'intent-1',
        { riskScore: '85', decision: 'DECLINE' },
        actor,
      );

      expect(res.riskLevel).toBe('HIGH');
      expect(intent.statusConceptId).toBe(CONCEPTS.PI_FAILED);
    });

    it('keeps the intent usable when the engine approves', async () => {
      const d = build();
      const intent = { id: 'intent-1', statusConceptId: CONCEPTS.PI_PENDING };
      d.intentsRepo.findByIdForUpdate.mockResolvedValue(intent);
      d.flowRepo.createRiskAssessment.mockReturnValue({ id: 'risk-1' });

      const res = await d.service.assessRisk(
        'intent-1',
        { riskScore: '10', decision: 'APPROVE', threeDsAuthenticated: true },
        actor,
      );

      expect(res.riskLevel).toBe('LOW');
      expect(intent.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      expect(d.flowRepo.createRiskAssessment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          threeDsStatusConceptId: CONCEPTS.THREEDS_AUTHENTICATED,
        }),
      );
    });
  });

  describe('addSplit (UC-42-11)', () => {
    const splitBase = {
      payeeConnectedAccountId: '33333333-3333-3333-3333-333333333333',
    };

    it('resolves a percentage split against the intent amount', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        amount: '200.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      d.flowRepo.findSplitsByIntent.mockResolvedValue([]);
      d.flowRepo.createSplit.mockReturnValue({ id: 'split-1' });

      const res = await d.service.addSplit(
        'intent-1',
        { ...splitBase, splitType: 'PERCENTAGE', percentage: '15' },
        actor,
      );

      expect(res.amount).toBe('30.00');
    });

    it('rejects splits whose sum exceeds the intent amount', async () => {
      const d = build();
      d.intentsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'intent-1',
        amount: '100.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      d.flowRepo.findSplitsByIntent.mockResolvedValue([{ amount: '80.00' }]);

      await expect(
        d.service.addSplit(
          'intent-1',
          { ...splitBase, splitType: 'AMOUNT', amount: '50.00' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires an amount for AMOUNT splits', async () => {
      const d = build();
      await expect(
        d.service.addSplit(
          'intent-1',
          { ...splitBase, splitType: 'AMOUNT' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
