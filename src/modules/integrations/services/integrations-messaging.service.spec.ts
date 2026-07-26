import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsMessagingService } from './integrations-messaging.service';
import { INTEG } from '../integrations.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const connectionsRepo = { findById: mockFn() };
  const outboundRepo = {
    findById: mockFn(),
    findByIdempotencyKey: mockFn(),
    findByCorrelationId: mockFn(),
    create: mockFn(),
  };
  const responsesRepo = { create: mockFn() };
  const retriesRepo = { maxAttempt: mockFn().mockResolvedValue(0), create: mockFn() };
  const inboundRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsMessagingService(
    em as any,
    connectionsRepo as any,
    outboundRepo as any,
    responsesRepo as any,
    retriesRepo as any,
    inboundRepo as any,
    logger as any,
  );
  return { service, tx, connectionsRepo, outboundRepo, responsesRepo, retriesRepo, inboundRepo };
}

describe('IntegrationsMessagingService', () => {
  describe('enqueueOutbound (UC-12-05)', () => {
    it('rejects when the connection is not active (precondition)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1', stateConceptId: INTEG.CONN_PAUSED });
      await expect(
        d.service.enqueueOutbound({ connectionId: 'c1', idempotencyKey: 'k', requestPayloadJson: {} } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('returns the existing row on idempotency-key match', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1', stateConceptId: INTEG.CONN_ACTIVE });
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue({ id: 'm0', statusConceptId: INTEG.MSG_QUEUED, correlationId: 'k' });
      const res = await d.service.enqueueOutbound(
        { connectionId: 'c1', idempotencyKey: 'k', requestPayloadJson: {} } as any,
        actor,
      );
      expect(res.idempotent).toBe(true);
      expect(res.id).toBe('m0');
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
    });

    it('queues a new message with the idempotency key as default correlation', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1', stateConceptId: INTEG.CONN_ACTIVE });
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue(null);
      d.outboundRepo.create.mockReturnValue({ id: 'm1', statusConceptId: INTEG.MSG_QUEUED });
      const res = await d.service.enqueueOutbound(
        { connectionId: 'c1', idempotencyKey: 'k', requestPayloadJson: {} } as any,
        actor,
      );
      expect(res.idempotent).toBe(false);
      expect(res.correlationId).toBe('k');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispatch (UC-12-06)', () => {
    it('rejects a message not in queue (precondition)', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({ id: 'm1', statusConceptId: INTEG.MSG_SENT });
      await expect(d.service.dispatch('m1', {} as any, actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('marks SENT and records a successful response', async () => {
      const d = build();
      const msg: any = { id: 'm1', statusConceptId: INTEG.MSG_QUEUED, updatedAt: new Date() };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });
      const res = await d.service.dispatch('m1', {} as any, actor);
      expect(res.isSuccess).toBe(true);
      expect(msg.statusConceptId).toBe(INTEG.MSG_SENT);
    });

    it('marks FAILED when simulateFailure is set', async () => {
      const d = build();
      const msg: any = { id: 'm1', statusConceptId: INTEG.MSG_QUEUED, updatedAt: new Date() };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });
      const res = await d.service.dispatch('m1', { simulateFailure: true } as any, actor);
      expect(res.isSuccess).toBe(false);
      expect(msg.statusConceptId).toBe(INTEG.MSG_FAILED);
    });
  });

  describe('retry (UC-12-07)', () => {
    it('rejects a message not in FAILED (precondition)', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({ id: 'm1', statusConceptId: INTEG.MSG_QUEUED });
      await expect(d.service.retry('m1', actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('schedules the next attempt and requeues the message', async () => {
      const d = build();
      const msg: any = { id: 'm1', statusConceptId: INTEG.MSG_FAILED, payloadVersion: 1, requestPayloadJson: {}, updatedAt: new Date() };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.retriesRepo.maxAttempt.mockResolvedValue(1);
      const res = await d.service.retry('m1', actor);
      expect(res.attemptNumber).toBe(2);
      expect(msg.statusConceptId).toBe(INTEG.MSG_QUEUED);
      expect(res.nextRetryAt).toBeInstanceOf(Date);
    });

    it('rejects once attempts are exhausted (precondition)', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({ id: 'm1', statusConceptId: INTEG.MSG_FAILED, payloadVersion: 1 });
      d.retriesRepo.maxAttempt.mockResolvedValue(5);
      await expect(d.service.retry('m1', actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('deadLetter (UC-12-08)', () => {
    it('is idempotent when already dead-lettered', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({ id: 'm1', statusConceptId: INTEG.MSG_DEAD_LETTER });
      const res = await d.service.deadLetter('m1', actor);
      expect(res.alreadyDeadLettered).toBe(true);
      expect(d.retriesRepo.create).not.toHaveBeenCalled();
    });

    it('moves a FAILED message to dead-letter and records the exhausted retry', async () => {
      const d = build();
      const msg: any = { id: 'm1', statusConceptId: INTEG.MSG_FAILED, payloadVersion: 1, requestPayloadJson: {}, updatedAt: new Date() };
      d.outboundRepo.findById.mockResolvedValue(msg);
      const res = await d.service.deadLetter('m1', actor);
      expect(msg.statusConceptId).toBe(INTEG.MSG_DEAD_LETTER);
      expect(res.alreadyDeadLettered).toBe(false);
      expect(d.retriesRepo.create).toHaveBeenCalled();
    });
  });

  describe('correlate (UC-12-10)', () => {
    it('throws when the inbound message is missing', async () => {
      const d = build();
      d.inboundRepo.findById.mockResolvedValue(null);
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('throws when no outbound matches the correlation', async () => {
      const d = build();
      d.inboundRepo.findById.mockResolvedValue({ id: 'i1', statusConceptId: INTEG.INBOUND_RECEIVED, correlationId: 'k' });
      d.outboundRepo.findByCorrelationId.mockResolvedValue(null);
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('acknowledges the outbound, records the response and marks inbound processed', async () => {
      const d = build();
      const inbound: any = { id: 'i1', statusConceptId: INTEG.INBOUND_RECEIVED, correlationId: 'k', payloadJson: { a: 1 }, updatedAt: new Date() };
      const outbound: any = { id: 'm1', statusConceptId: INTEG.MSG_SENT, updatedAt: new Date() };
      d.inboundRepo.findById.mockResolvedValue(inbound);
      d.outboundRepo.findByCorrelationId.mockResolvedValue(outbound);

      const res = await d.service.correlate('i1', actor);

      expect(outbound.statusConceptId).toBe(INTEG.MSG_ACKNOWLEDGED);
      expect(inbound.statusConceptId).toBe(INTEG.INBOUND_PROCESSED);
      expect(res.outboundMessageId).toBe('m1');
      expect(d.responsesRepo.create).toHaveBeenCalled();
    });
  });
});
