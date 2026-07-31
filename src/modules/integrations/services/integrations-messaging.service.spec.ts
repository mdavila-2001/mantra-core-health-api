import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsMessagingService } from './integrations-messaging.service';
import { INTEG } from '../integrations.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(),
  };
  em.fork.mockReturnValue(em);
  const connectionsRepo = { findById: mockFn() };
  const providersRepo = { findById: mockFn() };
  const endpointsRepo = { findById: mockFn() };
  const outboundRepo = {
    findById: mockFn(),
    findByIdForUpdate: mockFn(),
    findByIdempotencyKey: mockFn(),
    findByCorrelationId: mockFn(),
    create: mockFn(),
    findQueuedForDispatch: mockFn().mockResolvedValue([]),
    findFailed: mockFn().mockResolvedValue([]),
  };
  const responsesRepo = { create: mockFn() };
  const retriesRepo = {
    maxAttempt: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const inboundRepo = {
    findById: mockFn(),
    findReceived: mockFn().mockResolvedValue([]),
  };
  // Despacho HTTP real mockeado: por defecto responde 2xx.
  const http = {
    post: mockFn().mockResolvedValue({
      ok: true,
      httpStatus: 200,
      latencyMs: 12,
      signature: 'sig',
      responseBody: { ok: true },
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsMessagingService(
    em as any,
    connectionsRepo as any,
    providersRepo as any,
    endpointsRepo as any,
    outboundRepo as any,
    responsesRepo,
    retriesRepo,
    inboundRepo as any,
    http,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    connectionsRepo,
    providersRepo,
    endpointsRepo,
    outboundRepo,
    responsesRepo,
    retriesRepo,
    inboundRepo,
    http,
  };
}

describe('IntegrationsMessagingService', () => {
  describe('enqueueOutbound (UC-12-05)', () => {
    it('rejects when the connection is not active (precondition)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c1',
        stateConceptId: INTEG.CONN_PAUSED,
      });
      await expect(
        d.service.enqueueOutbound(
          {
            connectionId: 'c1',
            idempotencyKey: 'k',
            requestPayloadJson: {},
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('returns the existing row on idempotency-key match', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c1',
        stateConceptId: INTEG.CONN_ACTIVE,
      });
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'm0',
        statusConceptId: INTEG.MSG_QUEUED,
        correlationId: 'k',
      });
      const res = await d.service.enqueueOutbound(
        {
          connectionId: 'c1',
          idempotencyKey: 'k',
          requestPayloadJson: {},
        },
        actor,
      );
      expect(res.idempotent).toBe(true);
      expect(res.id).toBe('m0');
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
    });

    it('queues a new message with the idempotency key as default correlation', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c1',
        stateConceptId: INTEG.CONN_ACTIVE,
      });
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue(null);
      d.outboundRepo.create.mockReturnValue({
        id: 'm1',
        statusConceptId: INTEG.MSG_QUEUED,
      });
      const res = await d.service.enqueueOutbound(
        {
          connectionId: 'c1',
          idempotencyKey: 'k',
          requestPayloadJson: {},
        },
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
      d.outboundRepo.findByIdForUpdate.mockResolvedValue({
        id: 'm1',
        statusConceptId: INTEG.MSG_SENT,
      });
      await expect(
        d.service.dispatch('m1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * Ejecuta la operación wire dispatch.
     *
     * @param d - Valor de d requerido por la operación.
     * @param msg - Valor de msg requerido por la operación.
     * @returns Resultado de wire dispatch.
     */
    function wireDispatch(d: ReturnType<typeof build>, msg: any) {
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c1',
        providerId: 'p1',
      });
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        baseUrl: 'https://provider.example/api',
      });
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });
    }

    it('marks SENT and records the real successful response', async () => {
      const d = build();
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: { a: 1 },
        updatedAt: new Date(),
      };
      wireDispatch(d, msg);

      const res = await d.service.dispatch('m1', {}, actor);

      expect(d.http.post).toHaveBeenCalledTimes(1);
      expect(res.isSuccess).toBe(true);
      expect(msg.statusConceptId).toBe(INTEG.MSG_SENT);
      expect(d.responsesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ httpStatus: 200, latencyMs: 12 }),
      );
      // Lee con FOR UPDATE: dos ticks del worker que descubren el mismo
      // mensaje QUEUED no deben poder despacharlo al proveedor real dos veces.
      expect(d.outboundRepo.findByIdForUpdate).toHaveBeenCalledWith(d.tx, 'm1');
    });

    it('marks FAILED when the provider responds with an error', async () => {
      const d = build();
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
        updatedAt: new Date(),
      };
      wireDispatch(d, msg);
      d.http.post.mockResolvedValue({
        ok: false,
        httpStatus: 502,
        latencyMs: 30,
        signature: 'sig',
        responseBody: undefined,
        errorText: 'HTTP 502',
      });

      const res = await d.service.dispatch('m1', {}, actor);

      expect(res.isSuccess).toBe(false);
      expect(msg.statusConceptId).toBe(INTEG.MSG_FAILED);
    });

    it('rejects when the provider has no base_url configured (precondition)', async () => {
      const d = build();
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
      };
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.connectionsRepo.findById.mockResolvedValue({
        id: 'c1',
        providerId: 'p1',
      });
      d.providersRepo.findById.mockResolvedValue({ id: 'p1' });

      await expect(d.service.dispatch('m1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('retry (UC-12-07)', () => {
    it('rejects a message not in FAILED (precondition)', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        statusConceptId: INTEG.MSG_QUEUED,
      });
      await expect(d.service.retry('m1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('schedules the next attempt and requeues the message', async () => {
      const d = build();
      const msg: any = {
        id: 'm1',
        statusConceptId: INTEG.MSG_FAILED,
        payloadVersion: 1,
        requestPayloadJson: {},
        updatedAt: new Date(),
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.retriesRepo.maxAttempt.mockResolvedValue(1);
      const res = await d.service.retry('m1', actor);
      expect(res.attemptNumber).toBe(2);
      expect(msg.statusConceptId).toBe(INTEG.MSG_QUEUED);
      expect(res.nextRetryAt).toBeInstanceOf(Date);
    });

    it('rejects once attempts are exhausted (precondition)', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        statusConceptId: INTEG.MSG_FAILED,
        payloadVersion: 1,
      });
      d.retriesRepo.maxAttempt.mockResolvedValue(5);
      await expect(d.service.retry('m1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('deadLetter (UC-12-08)', () => {
    it('is idempotent when already dead-lettered', async () => {
      const d = build();
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        statusConceptId: INTEG.MSG_DEAD_LETTER,
      });
      const res = await d.service.deadLetter('m1', actor);
      expect(res.alreadyDeadLettered).toBe(true);
      expect(d.retriesRepo.create).not.toHaveBeenCalled();
    });

    it('moves a FAILED message to dead-letter and records the exhausted retry', async () => {
      const d = build();
      const msg: any = {
        id: 'm1',
        statusConceptId: INTEG.MSG_FAILED,
        payloadVersion: 1,
        requestPayloadJson: {},
        updatedAt: new Date(),
      };
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
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('throws when no outbound matches the correlation', async () => {
      const d = build();
      d.inboundRepo.findById.mockResolvedValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
        correlationId: 'k',
      });
      d.outboundRepo.findByCorrelationId.mockResolvedValue(null);
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('acknowledges the outbound, records the response and marks inbound processed', async () => {
      const d = build();
      const inbound: any = {
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
        correlationId: 'k',
        payloadJson: { a: 1 },
        updatedAt: new Date(),
      };
      const outbound: any = {
        id: 'm1',
        statusConceptId: INTEG.MSG_SENT,
        updatedAt: new Date(),
      };
      d.inboundRepo.findById.mockResolvedValue(inbound);
      d.outboundRepo.findByCorrelationId.mockResolvedValue(outbound);

      const res = await d.service.correlate('i1', actor);

      expect(outbound.statusConceptId).toBe(INTEG.MSG_ACKNOWLEDGED);
      expect(inbound.statusConceptId).toBe(INTEG.INBOUND_PROCESSED);
      expect(res.outboundMessageId).toBe('m1');
      expect(d.responsesRepo.create).toHaveBeenCalled();
    });
  });

  describe('listQueuedForDispatch (Fase 5, descubrimiento UC-12-06)', () => {
    it('proyecta sólo los ids de los mensajes QUEUED encontrados', async () => {
      const d = build();
      d.outboundRepo.findQueuedForDispatch.mockResolvedValue([
        { id: 'm1' },
        { id: 'm2' },
      ]);
      const res = await d.service.listQueuedForDispatch();
      expect(res).toEqual({ messages: [{ id: 'm1' }, { id: 'm2' }] });
      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        50,
      );
    });

    it('respeta el límite explícito', async () => {
      const d = build();
      await d.service.listQueuedForDispatch(5);
      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        5,
      );
    });
  });

  describe('listFailedForRetry (Fase 5, descubrimiento UC-12-07/08)', () => {
    it('marca exhausted cuando el próximo intento excede MAX_ATTEMPTS', async () => {
      const d = build();
      d.outboundRepo.findFailed.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      d.retriesRepo.maxAttempt.mockImplementation(
        async (_em: any, id: string) => (id === 'm1' ? 1 : 5),
      );
      const res = await d.service.listFailedForRetry();
      expect(res).toEqual({
        messages: [
          { id: 'm1', nextAttemptNumber: 2, exhausted: false },
          { id: 'm2', nextAttemptNumber: 6, exhausted: true },
        ],
      });
    });
  });

  describe('listReceivedForCorrelation (Fase 5, descubrimiento UC-12-10)', () => {
    it('proyecta sólo los ids de los mensajes entrantes RECEIVED', async () => {
      const d = build();
      d.inboundRepo.findReceived.mockResolvedValue([{ id: 'i1' }]);
      const res = await d.service.listReceivedForCorrelation();
      expect(res).toEqual({ messages: [{ id: 'i1' }] });
      expect(d.inboundRepo.findReceived).toHaveBeenCalledWith(
        d.em,
        INTEG.INBOUND_RECEIVED,
        50,
      );
    });
  });
});
