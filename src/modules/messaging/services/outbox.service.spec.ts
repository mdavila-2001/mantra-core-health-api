import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { OutboxService } from './outbox.service';
import { MessagingTraceService } from '../../../observability';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const EVENT = '11111111-1111-1111-1111-111111111111';
const MESSAGE = '22222222-2222-2222-2222-222222222222';
const SUBSCRIPTION = '33333333-3333-3333-3333-333333333333';
const QUEUE = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const outboxRepo = {
    createDomainEvent: mockFn(() => ({ id: EVENT })),
    findDomainEventById: mockFn(),
    createOutboxMessage: mockFn(() => ({ id: MESSAGE })),
    findOutboxByIdempotencyKey: mockFn(() => Promise.resolve(null)),
    findOutboxByDomainEvent: mockFn(),
    claimPendingOutbox: mockFn(() => Promise.resolve([])),
    findActiveSubscriptions: mockFn(() => Promise.resolve([])),
    createEventDelivery: mockFn(() => ({ id: 'delivery-1' })),
    findEventDelivery: mockFn(() => Promise.resolve(null)),
    findEventDeliveryForUpdate: mockFn(),
  };
  const queuesRepo = {
    findQueueByCode: mockFn(),
    findJobByDedupeKey: mockFn(() => Promise.resolve(null)),
    createJob: mockFn(() => ({ id: 'job-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Servicio real, no un doble: no tiene dependencias y con la telemetría
  // apagada sus métodos son no-ops, así que la prueba ejercita el mismo camino
  // de propagación que producción sin necesitar un SDK arrancado.
  const service = new OutboxService(
    em as any,
    outboxRepo,
    queuesRepo as any,
    logger as any,
    new MessagingTraceService(),
  );
  return { service, tx, outboxRepo, queuesRepo, logger };
}

const INPUT = {
  eventType: 'OrderPlaced',
  aggregateType: 'orders',
  aggregateId: 'order-1',
  payloadJson: { total: 100 },
};

describe('OutboxService', () => {
  describe('publishDomainEvent (UC-35-01)', () => {
    it('writes the event and its outbox message in the caller transaction', async () => {
      const d = build();

      const res = await d.service.publishDomainEvent(d.tx as any, INPUT);

      expect(res).toMatchObject({
        domainEventId: EVENT,
        outboxMessageId: MESSAGE,
        duplicate: false,
      });
      expect((d as any).service).toBeDefined();
      expect(d.outboxRepo.createOutboxMessage).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.OUTBOX_PENDING }),
      );
    });

    it('derives a correlationId when the caller has none to propagate (column is NOT NULL)', async () => {
      const d = build();

      await d.service.publishDomainEvent(d.tx as any, INPUT);

      expect(d.outboxRepo.createDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ correlationId: expect.any(String) }),
      );
      const passed = d.outboxRepo.createDomainEvent.mock.calls[0][1];
      expect(passed.correlationId.length).toBeGreaterThan(0);
    });

    it("propagates the caller's correlationId instead of overriding it", async () => {
      const d = build();

      await d.service.publishDomainEvent(d.tx as any, {
        ...INPUT,
        correlationId: 'req-abc-123',
      });

      expect(d.outboxRepo.createDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ correlationId: 'req-abc-123' }),
      );
    });

    it('never opens its own transaction', async () => {
      const d = build();

      await d.service.publishDomainEvent(d.tx as any, INPUT);

      // Sí llama `tx.flush()` (necesario: `domain_event_id` es un uuid plano,
      // no una relación, así que el evento debe existir en la fila antes de
      // insertar el mensaje que lo referencia) — pero SIEMPRE sobre el `tx`
      // del llamador, nunca abriendo su propia transacción, que es lo que sí
      // podría confirmar el evento sin el cambio de negocio que lo originó.
      expect(d.tx.flush).toHaveBeenCalled();
      expect((d.service as any).em.transactional).not.toHaveBeenCalled();
    });

    it('derives a stable idempotency key from the event content', async () => {
      const d = build();

      const first = await d.service.publishDomainEvent(d.tx as any, INPUT);
      const second = await d.service.publishDomainEvent(d.tx as any, INPUT);

      expect(first.idempotencyKey).toBe(second.idempotencyKey);
      expect(first.idempotencyKey).toContain('OrderPlaced');
    });

    it('does not publish the same fact twice', async () => {
      const d = build();
      d.outboxRepo.findOutboxByIdempotencyKey.mockResolvedValue({
        id: 'message-prev',
        domainEventId: 'event-prev',
      });

      const res = await d.service.publishDomainEvent(d.tx as any, INPUT);

      expect(res).toMatchObject({
        domainEventId: 'event-prev',
        outboxMessageId: 'message-prev',
        duplicate: true,
      });
      expect(d.outboxRepo.createDomainEvent).not.toHaveBeenCalled();
    });

    it('honours an idempotency key given by the caller', async () => {
      const d = build();

      const res = await d.service.publishDomainEvent(d.tx as any, {
        ...INPUT,
        idempotencyKey: 'mi-clave',
      });

      expect(res.idempotencyKey).toBe('mi-clave');
    });
  });

  describe('runRelay (UC-35-02)', () => {
    /**
     * Ejecuta la operación pending.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de pending conforme al contrato `any`.
     */
    function pending(overrides: Record<string, unknown> = {}): any {
      return {
        id: MESSAGE,
        domainEventId: EVENT,
        idempotencyKey: 'k-1',
        statusConceptId: CONCEPTS.OUTBOX_PENDING,
        attempts: 0,
        maxAttempts: 3,
        ...overrides,
      };
    }

    it('publishes the claimed batch', async () => {
      const d = build();
      const message = pending();
      d.outboxRepo.claimPendingOutbox.mockResolvedValue([message]);

      const res = await d.service.runRelay({ workerId: 'relay-1' });

      expect(res).toMatchObject({ claimed: 1, published: 1, exhausted: 0 });
      expect(message.statusConceptId).toBe(CONCEPTS.OUTBOX_PUBLISHED);
      expect(message.publishedAt).toBeInstanceOf(Date);
      expect(message.attempts).toBe(1);
      // El lock se libera al terminar el lote.
      expect(message.lockedBy).toBeUndefined();
    });

    it('marks as exhausted what ran out of attempts', async () => {
      const d = build();
      const message = pending({ attempts: 3, maxAttempts: 3 });
      d.outboxRepo.claimPendingOutbox.mockResolvedValue([message]);

      const res = await d.service.runRelay({ workerId: 'relay-1' });

      expect(res).toMatchObject({ published: 0, exhausted: 1 });
      expect(message.statusConceptId).toBe(CONCEPTS.OUTBOX_FAILED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('returns an empty batch when there is nothing pending', async () => {
      const d = build();

      const res = await d.service.runRelay({ workerId: 'relay-1' });

      expect(res).toEqual({
        claimed: 0,
        published: 0,
        exhausted: 0,
        messages: [],
      });
    });

    it('claims with the requested batch size', async () => {
      const d = build();

      await d.service.runRelay({ workerId: 'relay-1', batchSize: 7 });

      expect(d.outboxRepo.claimPendingOutbox).toHaveBeenCalledWith(
        d.tx,
        CONCEPTS.OUTBOX_PENDING,
        expect.any(Date),
        7,
      );
    });
  });

  describe('dispatchEvent (UC-35-03)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param subscriptions - Valor de subscriptions requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, subscriptions: any[] = []) {
      d.outboxRepo.findDomainEventById.mockResolvedValue({
        id: EVENT,
        eventType: 'OrderPlaced',
        eventVersion: 1,
        tenantId: 'tenant-a',
        payloadJson: { region: 'norte' },
      });
      d.outboxRepo.findOutboxByDomainEvent.mockResolvedValue({
        id: MESSAGE,
        statusConceptId: CONCEPTS.OUTBOX_PUBLISHED,
      });
      d.outboxRepo.findActiveSubscriptions.mockResolvedValue(subscriptions);
    }

    /**
     * Ejecuta la operación subscription.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de subscription conforme al contrato `any`.
     */
    function subscription(overrides: Record<string, unknown> = {}): any {
      return {
        id: SUBSCRIPTION,
        subscriberCode: 'billing',
        filterJson: null,
        ...overrides,
      };
    }

    it('creates one delivery per matching subscription', async () => {
      const d = build();
      wire(d, [subscription()]);

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res).toMatchObject({
        domainEventId: EVENT,
        matched: 1,
        filteredOut: 0,
      });
      expect(res.deliveries[0]).toMatchObject({
        deliveryId: 'delivery-1',
        duplicate: false,
      });
    });

    it("scopes the subscription lookup to the event's own tenant", async () => {
      const d = build();
      wire(d, [subscription()]);

      await d.service.dispatchEvent(EVENT, {}, actor);

      expect(d.outboxRepo.findActiveSubscriptions).toHaveBeenCalledWith(
        d.tx,
        'OrderPlaced',
        1,
        expect.any(String),
        'tenant-a',
      );
    });

    it('skips subscriptions whose filter does not match', async () => {
      const d = build();
      wire(d, [subscription({ filterJson: { region: 'sur' } })]);

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res).toMatchObject({ matched: 0, filteredOut: 1 });
      expect(d.outboxRepo.createEventDelivery).not.toHaveBeenCalled();
    });

    it('keeps a subscription whose filter matches', async () => {
      const d = build();
      wire(d, [subscription({ filterJson: { region: 'norte' } })]);

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res.matched).toBe(1);
    });

    it('does not duplicate a delivery that already exists', async () => {
      const d = build();
      wire(d, [subscription()]);
      d.outboxRepo.findEventDelivery.mockResolvedValue({ id: 'delivery-prev' });

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res.deliveries[0]).toMatchObject({
        deliveryId: 'delivery-prev',
        duplicate: true,
      });
      expect(d.outboxRepo.createEventDelivery).not.toHaveBeenCalled();
    });

    it('enqueues a job for a queue-mode subscription', async () => {
      const d = build();
      wire(d, [
        subscription({
          deliveryModeConceptId: CONCEPTS.MSG_DELIVERY_MODE_QUEUE,
          targetQueue: 'billing-events',
        }),
      ]);
      d.queuesRepo.findQueueByCode.mockResolvedValue({
        id: QUEUE,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        defaultPriority: 3,
        defaultMaxAttempts: 5,
      });

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res.deliveries[0].jobId).toBe('job-1');
      expect(d.queuesRepo.createJob).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.JOB_READY }),
      );
    });

    it('does not enqueue when the target queue is inactive', async () => {
      const d = build();
      wire(d, [
        subscription({
          deliveryModeConceptId: CONCEPTS.MSG_DELIVERY_MODE_QUEUE,
          targetQueue: 'billing-events',
        }),
      ]);
      d.queuesRepo.findQueueByCode.mockResolvedValue({
        id: QUEUE,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      const res = await d.service.dispatchEvent(EVENT, {}, actor);

      expect(res.deliveries[0].jobId).toBeUndefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses dispatching an event that is not published yet', async () => {
      const d = build();
      wire(d);
      d.outboxRepo.findOutboxByDomainEvent.mockResolvedValue({
        id: MESSAGE,
        statusConceptId: CONCEPTS.OUTBOX_PENDING,
      });

      await expect(
        d.service.dispatchEvent(EVENT, {} as any, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the event does not exist', async () => {
      const d = build();
      d.outboxRepo.findDomainEventById.mockResolvedValue(null);

      await expect(
        d.service.dispatchEvent(EVENT, {} as any, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('ackDelivery (UC-35-04)', () => {
    /**
     * Ejecuta la operación dispatched.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de dispatched conforme al contrato `any`.
     */
    function dispatched(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'delivery-1',
        statusConceptId: CONCEPTS.EVENT_DELIVERY_DISPATCHED,
        ...overrides,
      };
    }

    it('marks the delivery as handled', async () => {
      const d = build();
      const delivery = dispatched();
      d.outboxRepo.findEventDeliveryForUpdate.mockResolvedValue(delivery);

      const res = await d.service.ackDelivery('delivery-1', {
        outcome: 'HANDLED',
      } as any);

      expect(res.statusConceptId).toBe(CONCEPTS.EVENT_DELIVERY_HANDLED);
      expect(delivery.handledAt).toBeInstanceOf(Date);
    });

    it('marks the delivery as failed and warns', async () => {
      const d = build();
      d.outboxRepo.findEventDeliveryForUpdate.mockResolvedValue(dispatched());

      const res = await d.service.ackDelivery('delivery-1', {
        outcome: 'FAILED',
        errorText: 'timeout del consumidor',
      } as any);

      expect(res.statusConceptId).toBe(CONCEPTS.EVENT_DELIVERY_FAILED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('demands an error text when the ack is a failure', async () => {
      const d = build();

      await expect(
        d.service.ackDelivery('delivery-1', { outcome: 'FAILED' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses acking a delivery that is already resolved', async () => {
      const d = build();
      d.outboxRepo.findEventDeliveryForUpdate.mockResolvedValue(
        dispatched({ statusConceptId: CONCEPTS.EVENT_DELIVERY_HANDLED }),
      );

      await expect(
        d.service.ackDelivery('delivery-1', { outcome: 'HANDLED' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the delivery does not exist', async () => {
      const d = build();
      d.outboxRepo.findEventDeliveryForUpdate.mockResolvedValue(null);

      await expect(
        d.service.ackDelivery('delivery-1', { outcome: 'HANDLED' } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('backoffSeconds', () => {
    it('grows exponentially and stops at the cap', () => {
      expect(OutboxService.backoffSeconds(1)).toBe(5);
      expect(OutboxService.backoffSeconds(2)).toBe(10);
      expect(OutboxService.backoffSeconds(4)).toBe(40);
      expect(OutboxService.backoffSeconds(99)).toBe(3600);
    });
  });
});
