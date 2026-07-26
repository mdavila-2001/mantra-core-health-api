import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationExchangesService } from './integration-exchanges.service';
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
  const versionsRepo = { findActiveByContract: mockFn(), findById: mockFn() };
  const recordsRepo = { findById: mockFn(), create: mockFn() };
  const attemptsRepo = { maxAttemptNumber: mockFn().mockResolvedValue(0), lastAttempt: mockFn(), create: mockFn() };
  const idempotencyRepo = { findByKey: mockFn(), create: mockFn() };
  const cursorsRepo = { findByScope: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationExchangesService(
    em as any,
    contractsRepo as any,
    versionsRepo as any,
    recordsRepo as any,
    attemptsRepo as any,
    idempotencyRepo as any,
    cursorsRepo as any,
    logger as any,
  );
  return { service, tx, contractsRepo, versionsRepo, recordsRepo, attemptsRepo, idempotencyRepo, cursorsRepo };
}

describe('IntegrationExchangesService', () => {
  describe('executeExchange (UC-31-05)', () => {
    it('rejects a missing idempotency key (422)', async () => {
      const d = build();
      await expect(d.service.executeExchange('c1', undefined, {} as any, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('creates idempotency, record and first attempt for a fresh key', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1', integrationContractId: 'c1' });
      d.idempotencyRepo.findByKey.mockResolvedValue(null);
      const idem: any = {};
      d.idempotencyRepo.create.mockReturnValue(idem);
      d.recordsRepo.create.mockReturnValue({ id: 'r1', outcomeConceptId: ICON.OUTCOME_PENDING });

      const res = await d.service.executeExchange('c1', 'idem-1', { requestHash: 'h' } as any, actor);

      expect(res).toEqual({
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcome: ICON.OUTCOME_PENDING,
        replayed: false,
      });
      expect(idem.firstExchangeRecordId).toBe('r1');
      expect(d.attemptsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ attemptNumber: 1, outcomeConceptId: ICON.ATTEMPT_IN_PROGRESS }),
      );
    });

    it('replays an existing key without re-executing', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1', integrationContractId: 'c1' });
      d.idempotencyRepo.findByKey.mockResolvedValue({
        id: 'idem1',
        firstExchangeRecordId: 'r1',
        statusConceptId: ICON.IDEMPOTENCY_COMPLETED,
        responseReference: 'resp://1',
        requestHash: 'h',
      });

      const res = await d.service.executeExchange('c1', 'idem-1', { requestHash: 'h' } as any, actor);

      expect(res.replayed).toBe(true);
      expect(res.id).toBe('r1');
      expect(res.responseReference).toBe('resp://1');
      expect(d.recordsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects a payload mismatch under the same key (409)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1', integrationContractId: 'c1' });
      d.idempotencyRepo.findByKey.mockResolvedValue({ id: 'idem1', requestHash: 'OTHER' });
      await expect(
        d.service.executeExchange('c1', 'idem-1', { requestHash: 'h' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when there is no ACTIVE version (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.versionsRepo.findActiveByContract.mockResolvedValue(null);
      await expect(
        d.service.executeExchange('c1', 'idem-1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordAttempt (UC-31-06)', () => {
    it('records a SUCCESS attempt, closes the record and completes idempotency', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        idempotencyKey: 'idem-1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_PENDING,
      };
      d.recordsRepo.findById.mockResolvedValue(record);
      d.attemptsRepo.maxAttemptNumber.mockResolvedValue(1);
      d.attemptsRepo.create.mockReturnValue({ id: 'a2', outcomeConceptId: ICON.ATTEMPT_SUCCESS });
      d.versionsRepo.findById.mockResolvedValue({ id: 'v1', integrationContractId: 'c1' });
      const idem: any = { statusConceptId: ICON.IDEMPOTENCY_PENDING };
      d.idempotencyRepo.findByKey.mockResolvedValue(idem);

      const res = await d.service.recordAttempt('c1', 'r1', { outcome: 'SUCCESS' } as any, actor);

      expect(res).toMatchObject({ attemptNumber: 2, outcome: ICON.ATTEMPT_SUCCESS, recordOutcome: ICON.OUTCOME_SUCCESS });
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_SUCCESS);
      expect(idem.statusConceptId).toBe(ICON.IDEMPOTENCY_COMPLETED);
      expect(idem.responseReference).toBe('r1');
    });

    it('records a FAILED attempt leaving the record FAILED', async () => {
      const d = build();
      const record: any = { id: 'r1', outcomeConceptId: ICON.OUTCOME_PENDING };
      d.recordsRepo.findById.mockResolvedValue(record);
      d.attemptsRepo.create.mockReturnValue({ id: 'a1', outcomeConceptId: ICON.ATTEMPT_FAILED });

      const res = await d.service.recordAttempt('c1', 'r1', { outcome: 'FAILED', retryDecision: 'RETRYABLE' } as any, actor);

      expect(res.recordOutcome).toBe(ICON.OUTCOME_FAILED);
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_FAILED);
    });

    it('throws not found when the record is absent (404)', async () => {
      const d = build();
      d.recordsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordAttempt('c1', 'r1', { outcome: 'SUCCESS' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('retry (UC-31-07)', () => {
    it('retries when the last attempt was FAILED and retryable', async () => {
      const d = build();
      const record: any = { id: 'r1', outcomeConceptId: ICON.OUTCOME_FAILED };
      d.recordsRepo.findById.mockResolvedValue(record);
      d.attemptsRepo.lastAttempt.mockResolvedValue({
        attemptNumber: 1,
        outcomeConceptId: ICON.ATTEMPT_FAILED,
        retryDecisionConceptId: ICON.RETRY_RETRYABLE,
      });
      d.attemptsRepo.create.mockReturnValue({ id: 'a2', outcomeConceptId: ICON.ATTEMPT_SUCCESS });

      const res = await d.service.retry('r1', {} as any, actor);

      expect(res).toMatchObject({ attemptNumber: 2, outcome: ICON.ATTEMPT_SUCCESS });
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_SUCCESS);
    });

    it('rejects retry when the last attempt was not FAILED (422)', async () => {
      const d = build();
      d.recordsRepo.findById.mockResolvedValue({ id: 'r1' });
      d.attemptsRepo.lastAttempt.mockResolvedValue({ attemptNumber: 1, outcomeConceptId: ICON.ATTEMPT_SUCCESS });
      await expect(d.service.retry('r1', {} as any, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('advanceCursor (UC-31-08)', () => {
    it('creates the cursor when it does not exist', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.cursorsRepo.findByScope.mockResolvedValue(null);
      d.cursorsRepo.create.mockReturnValue({ id: 'cur1', cursorValue: '100' });

      const res = await d.service.advanceCursor('c1', 'orders', { cursorValue: '100' } as any, actor);

      expect(res).toEqual({ id: 'cur1', cursorScope: 'orders', cursorValue: '100', created: true });
    });

    it('advances a cursor forward', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      const cursor: any = { id: 'cur1', cursorValue: '100', updatedAt: new Date() };
      d.cursorsRepo.findByScope.mockResolvedValue(cursor);

      const res = await d.service.advanceCursor('c1', 'orders', { cursorValue: '200' } as any, actor);

      expect(res).toEqual({ id: 'cur1', cursorScope: 'orders', cursorValue: '200', created: false });
      expect(cursor.cursorValue).toBe('200');
    });

    it('rejects a regressive cursor (422)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.cursorsRepo.findByScope.mockResolvedValue({ id: 'cur1', cursorValue: '200' });
      await expect(
        d.service.advanceCursor('c1', 'orders', { cursorValue: '100' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.advanceCursor('c1', 'orders', { cursorValue: '1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
