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
import { IntegrationsErrorReason } from '../integrations.error-reasons';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const systemActor = { id: 'system', roles: ['SYSTEM'] } as any;
const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';
const SECRET = 'secreto-de-la-credencial-activa-0001';

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
 * Construye el sistema bajo prueba con dependencias controladas. El
 * repositorio de conexiones filtra por tenant como el real: una conexión
 * ajena no se encuentra.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(),
  };
  em.fork.mockReturnValue(em);
  const connections = new Map<string, any>();
  const connectionsRepo = {
    findByIdInScope: mockFn(
      async (_em: any, id: string, tenantId: string | undefined) => {
        const connection = connections.get(id);
        if (!connection) return null;
        return tenantId === undefined || connection.tenantId === tenantId
          ? connection
          : null;
      },
    ),
    findIdsByTenant: mockFn(async (_em: any, tenantId: string) =>
      [...connections.values()]
        .filter((connection) => connection.tenantId === tenantId)
        .map((connection) => connection.id),
    ),
  };
  const providersRepo = { findById: mockFn() };
  const endpointsRepo = { findById: mockFn() };
  const outboundRepo = {
    findById: mockFn(),
    findByIdForUpdate: mockFn(),
    findByIdempotencyKey: mockFn(),
    findByCorrelationIdInConnection: mockFn(),
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
    findByIdForUpdate: mockFn(),
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
  // Bóveda: por defecto entrega el secreto de la credencial activa.
  const secrets = {
    resolveActiveSecrets: mockFn().mockResolvedValue([SECRET]),
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
    secrets as any,
    logger as any,
  );
  /** Registra una conexión del tenant dado. */
  const connect = (id: string, tenantId: string, extra: object = {}) => {
    const connection = {
      id,
      tenantId,
      providerId: 'p1',
      stateConceptId: INTEG.CONN_ACTIVE,
      ...extra,
    };
    connections.set(id, connection);
    return connection;
  };
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    em,
    connect,
    connectionsRepo,
    providersRepo,
    endpointsRepo,
    outboundRepo,
    responsesRepo,
    retriesRepo,
    inboundRepo,
    http,
    secrets,
  };
}

describe('IntegrationsMessagingService', () => {
  describe('enqueueOutbound (UC-12-05)', () => {
    it('rejects when the connection is not active (precondition)', async () => {
      const d = build();
      d.connect('c1', TENANT, { stateConceptId: INTEG.CONN_PAUSED });
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
      d.connect('c1', TENANT);
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'm0',
        connectionId: 'c1',
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
      d.connect('c1', TENANT);
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
      d.connect('c1', TENANT);
      const msg = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_SENT,
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
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
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.connect('c1', TENANT);
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
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.connect('c1', TENANT);
      d.providersRepo.findById.mockResolvedValue({ id: 'p1' });

      await expect(d.service.dispatch('m1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('retry (UC-12-07)', () => {
    it('rejects a message not in FAILED (precondition)', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
      });
      await expect(d.service.retry('m1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('schedules the next attempt and requeues the message', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
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
      d.connect('c1', TENANT);
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        connectionId: 'c1',
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
      d.connect('c1', TENANT);
      d.outboundRepo.findById.mockResolvedValue({
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_DEAD_LETTER,
      });
      const res = await d.service.deadLetter('m1', actor);
      expect(res.alreadyDeadLettered).toBe(true);
      expect(d.retriesRepo.create).not.toHaveBeenCalled();
    });

    it('moves a FAILED message to dead-letter and records the exhausted retry', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
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
      d.connect('c1', TENANT);
      const inbound = {
        id: 'i1',
        connectionId: 'c1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
        correlationId: 'k',
      };
      d.inboundRepo.findById.mockResolvedValue(inbound);
      d.inboundRepo.findByIdForUpdate.mockResolvedValue(inbound);
      d.outboundRepo.findByCorrelationIdInConnection.mockResolvedValue(null);
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('acknowledges the outbound, records the response and marks inbound processed', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const inbound: any = {
        id: 'i1',
        connectionId: 'c1',
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
      d.inboundRepo.findByIdForUpdate.mockResolvedValue(inbound);
      d.outboundRepo.findByCorrelationIdInConnection.mockResolvedValue(
        outbound,
      );

      const res = await d.service.correlate('i1', actor);

      expect(outbound.statusConceptId).toBe(INTEG.MSG_ACKNOWLEDGED);
      expect(inbound.statusConceptId).toBe(INTEG.INBOUND_PROCESSED);
      expect(res.outboundMessageId).toBe('m1');
      expect(d.responsesRepo.create).toHaveBeenCalled();
      // Sólo correlaciona con salientes de la misma conexión del callback.
      expect(
        d.outboundRepo.findByCorrelationIdInConnection,
      ).toHaveBeenCalledWith(d.tx, 'c1', 'k');
    });
  });

  describe('listQueuedForDispatch (Fase 5, descubrimiento UC-12-06)', () => {
    it('proyecta sólo los ids de los mensajes QUEUED encontrados', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.outboundRepo.findQueuedForDispatch.mockResolvedValue([
        { id: 'm1' },
        { id: 'm2' },
      ]);
      const res = await d.service.listQueuedForDispatch(actor);
      expect(res).toEqual({ messages: [{ id: 'm1' }, { id: 'm2' }] });
      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        50,
        ['c1'],
      );
    });

    it('respeta el límite explícito', async () => {
      const d = build();
      d.connect('c1', TENANT);
      await d.service.listQueuedForDispatch(actor, 5);
      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        5,
        ['c1'],
      );
    });
  });

  describe('listFailedForRetry (Fase 5, descubrimiento UC-12-07/08)', () => {
    it('marca exhausted cuando el próximo intento excede MAX_ATTEMPTS', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.outboundRepo.findFailed.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      d.retriesRepo.maxAttempt.mockImplementation(
        async (_em: any, id: string) => (id === 'm1' ? 1 : 5),
      );
      const res = await d.service.listFailedForRetry(actor);
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
      d.connect('c1', TENANT);
      d.inboundRepo.findReceived.mockResolvedValue([{ id: 'i1' }]);
      const res = await d.service.listReceivedForCorrelation(actor);
      expect(res).toEqual({ messages: [{ id: 'i1' }] });
      expect(d.inboundRepo.findReceived).toHaveBeenCalledWith(
        d.em,
        INTEG.INBOUND_RECEIVED,
        50,
        ['c1'],
      );
    });
  });

  describe('aislamiento por tenant (INT-01)', () => {
    const notAvailable = (error: any, message: string) => {
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
      );
      expect(error.details).toBeUndefined();
      expect(error.message).toBe(message);
    };

    it('encolar sobre una conexión de otro tenant responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.connect('c-b', OTHER_TENANT);
      const dto = {
        connectionId: 'c-b',
        idempotencyKey: 'k',
        requestPayloadJson: { dato: 'sensible' },
      } as any;

      const foreign = await d.service
        .enqueueOutbound(dto, actor)
        .catch((e: any) => e);
      const missing = await d.service
        .enqueueOutbound({ ...dto, connectionId: 'no-existe' }, actor)
        .catch((e: any) => e);

      notAvailable(foreign, 'Conexión no encontrada');
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
      expect(d.connectionsRepo.findByIdInScope).toHaveBeenCalledWith(
        d.tx,
        'c-b',
        TENANT,
      );
    });

    it('defensa en profundidad: una conexión ajena devuelta por el repositorio también se rechaza', async () => {
      const d = build();
      d.connectionsRepo.findByIdInScope.mockResolvedValue({
        id: 'c-b',
        tenantId: OTHER_TENANT,
        stateConceptId: INTEG.CONN_ACTIVE,
      });
      await expect(
        d.service.enqueueOutbound(
          { connectionId: 'c-b', idempotencyKey: 'k' } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
      });
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
    });

    it('una clave de idempotencia usada por otra conexión no devuelve ese mensaje', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.outboundRepo.findByIdempotencyKey.mockResolvedValue({
        id: 'm-ajeno',
        connectionId: 'c-b',
        statusConceptId: INTEG.MSG_QUEUED,
        correlationId: 'k',
      });
      const attempt = d.service.enqueueOutbound(
        { connectionId: 'c1', idempotencyKey: 'k', requestPayloadJson: {} },
        actor,
      );
      await expect(attempt).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt).rejects.toMatchObject({
        reason: IntegrationsErrorReason.INTEGRATIONS_IDEMPOTENCY_KEY_IN_USE,
      });
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant activo un actor que no es SYSTEM no encola nada (TENANT_REQUIRED)', async () => {
      const d = build();
      d.connect('c1', TENANT);
      await expect(
        d.raw.enqueueOutbound(
          { connectionId: 'c1', idempotencyKey: 'k' } as any,
          actor,
        ),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      expect(d.outboundRepo.create).not.toHaveBeenCalled();
    });

    it('despachar un mensaje de otro tenant no lo bloquea, no firma y no llama al proveedor', async () => {
      const d = build();
      d.connect('c-b', OTHER_TENANT);
      const msg: any = {
        id: 'm-b',
        connectionId: 'c-b',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: { dato: 'sensible' },
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);

      const foreign = await d.service
        .dispatch('m-b', {} as any, actor)
        .catch((e: any) => e);
      d.outboundRepo.findById.mockResolvedValue(null);
      const missing = await d.service
        .dispatch('m-b', {} as any, actor)
        .catch((e: any) => e);

      notAvailable(foreign, 'Mensaje no encontrado');
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.outboundRepo.findByIdForUpdate).not.toHaveBeenCalled();
      expect(d.secrets.resolveActiveSecrets).not.toHaveBeenCalled();
      expect(d.http.post).not.toHaveBeenCalled();
      expect(msg.statusConceptId).toBe(INTEG.MSG_QUEUED);
    });

    it.each([
      [
        'reintentar',
        (d: ReturnType<typeof build>) => d.service.retry('m-b', actor),
      ],
      [
        'enviar a dead-letter',
        (d: ReturnType<typeof build>) => d.service.deadLetter('m-b', actor),
      ],
    ])(
      '%s un mensaje de otro tenant responde 404 uniforme y no cambia estado',
      async (_name, op) => {
        const d = build();
        d.connect('c-b', OTHER_TENANT);
        const msg: any = {
          id: 'm-b',
          connectionId: 'c-b',
          statusConceptId: INTEG.MSG_FAILED,
          payloadVersion: 1,
          requestPayloadJson: {},
        };
        d.outboundRepo.findById.mockResolvedValue(msg);
        const foreign = await op(d).catch((e: any) => e);
        d.outboundRepo.findById.mockResolvedValue(null);
        const missing = await op(d).catch((e: any) => e);

        notAvailable(foreign, 'Mensaje no encontrado');
        expect(foreign.getResponse()).toEqual(missing.getResponse());
        expect(msg.statusConceptId).toBe(INTEG.MSG_FAILED);
        expect(d.retriesRepo.create).not.toHaveBeenCalled();
      },
    );

    it('correlar un callback de otro tenant no toca el callback ni ningún saliente', async () => {
      const d = build();
      d.connect('c-b', OTHER_TENANT);
      const inbound: any = {
        id: 'i-b',
        connectionId: 'c-b',
        statusConceptId: INTEG.INBOUND_RECEIVED,
        correlationId: 'k',
        payloadJson: {},
      };
      d.inboundRepo.findById.mockResolvedValue(inbound);
      d.inboundRepo.findByIdForUpdate.mockResolvedValue(inbound);

      const foreign = await d.service
        .correlate('i-b', actor)
        .catch((e: any) => e);
      d.inboundRepo.findById.mockResolvedValue(null);
      const missing = await d.service
        .correlate('i-b', actor)
        .catch((e: any) => e);

      notAvailable(foreign, 'Mensaje entrante no encontrado');
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(
        d.outboundRepo.findByCorrelationIdInConnection,
      ).not.toHaveBeenCalled();
      expect(d.responsesRepo.create).not.toHaveBeenCalled();
      expect(inbound.statusConceptId).toBe(INTEG.INBOUND_RECEIVED);
    });

    it('límite: dos correlaciones del mismo callback — la segunda lo ve procesado y no duplica la respuesta', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const inbound: any = {
        id: 'i1',
        connectionId: 'c1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
        correlationId: 'k',
        payloadJson: {},
        updatedAt: new Date(),
      };
      const outbound: any = {
        id: 'm1',
        statusConceptId: INTEG.MSG_SENT,
        updatedAt: new Date(),
      };
      d.inboundRepo.findById.mockResolvedValue(inbound);
      d.inboundRepo.findByIdForUpdate.mockResolvedValue(inbound);
      d.outboundRepo.findByCorrelationIdInConnection.mockResolvedValue(
        outbound,
      );

      await d.service.correlate('i1', actor);
      await expect(d.service.correlate('i1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );

      expect(d.responsesRepo.create).toHaveBeenCalledTimes(1);
      expect(d.inboundRepo.findByIdForUpdate).toHaveBeenCalledWith(d.tx, 'i1');
    });

    it('los listados de los jobs sólo incluyen las conexiones del tenant activo', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.connect('c-b', OTHER_TENANT);
      await d.service.listQueuedForDispatch(actor);
      await d.service.listFailedForRetry(actor);
      await d.service.listReceivedForCorrelation(actor);

      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        50,
        ['c1'],
      );
      expect(d.outboundRepo.findFailed).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_FAILED,
        50,
        ['c1'],
      );
      expect(d.inboundRepo.findReceived).toHaveBeenCalledWith(
        d.em,
        INTEG.INBOUND_RECEIVED,
        50,
        ['c1'],
      );
    });

    it('un tenant sin conexiones no descubre ningún mensaje ni consulta la tabla', async () => {
      const d = build();
      d.connect('c-b', OTHER_TENANT);
      const res = await d.service.listQueuedForDispatch(actor);
      expect(res).toEqual({ messages: [] });
      expect(d.outboundRepo.findQueuedForDispatch).not.toHaveBeenCalled();
    });

    it('el barrido interno de SYSTEM sin tenant recorre todas las conexiones', async () => {
      const d = build();
      d.connect('c1', TENANT);
      d.connect('c-b', OTHER_TENANT);
      const queued: any = {
        id: 'm-b',
        connectionId: 'c-b',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
      };
      d.outboundRepo.findById.mockResolvedValue(queued);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(queued);
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        baseUrl: 'https://provider.example/api',
      });
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });

      await d.raw.listQueuedForDispatch(systemActor);
      expect(d.outboundRepo.findQueuedForDispatch).toHaveBeenCalledWith(
        d.em,
        INTEG.MSG_QUEUED,
        expect.any(Date),
        50,
        undefined,
      );
      const res = await d.raw.dispatch('m-b', {}, systemActor);
      expect(res.isSuccess).toBe(true);
    });

    it('SYSTEM con X-Tenant-Id queda acotado a ese tenant', async () => {
      const d = build();
      d.connect('c-b', OTHER_TENANT);
      const msg: any = {
        id: 'm-b',
        connectionId: 'c-b',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      await expect(
        d.service.dispatch('m-b', {}, systemActor),
      ).rejects.toMatchObject({
        reason: IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
      });
      expect(d.http.post).not.toHaveBeenCalled();
    });

    it('un actor que no es SYSTEM no barre sin tenant (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(d.raw.listQueuedForDispatch(actor)).rejects.toMatchObject({
        details: { reason: 'TENANT_REQUIRED' },
      });
    });
  });

  describe('secreto de la credencial activa (INT-02)', () => {
    it('firma el despacho con el secreto que entrega la bóveda para esa conexión', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: { a: 1 },
        updatedAt: new Date(),
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        baseUrl: 'https://provider.example/api',
      });
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });

      await d.service.dispatch('m1', {}, actor);

      expect(d.secrets.resolveActiveSecrets).toHaveBeenCalledWith(d.tx, 'c1');
      expect(d.http.post).toHaveBeenCalledWith(
        expect.objectContaining({ secret: SECRET }),
      );
    });

    it('durante una rotación firma con la clave nueva (la primera de la referencia)', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
        updatedAt: new Date(),
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        baseUrl: 'https://provider.example/api',
      });
      d.responsesRepo.create.mockReturnValue({ id: 'r1' });
      d.secrets.resolveActiveSecrets.mockResolvedValue([
        'clave-nueva-de-la-rotacion-0000000001',
        'clave-anterior-de-la-rotacion-00000002',
      ]);

      await d.service.dispatch('m1', {}, actor);

      expect(d.http.post).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: 'clave-nueva-de-la-rotacion-0000000001',
        }),
      );
    });

    it('sin secreto activo no se despacha: error catalogado y el mensaje sigue en cola', async () => {
      const d = build();
      d.connect('c1', TENANT);
      const msg: any = {
        id: 'm1',
        connectionId: 'c1',
        statusConceptId: INTEG.MSG_QUEUED,
        requestPayloadJson: {},
      };
      d.outboundRepo.findById.mockResolvedValue(msg);
      d.outboundRepo.findByIdForUpdate.mockResolvedValue(msg);
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        baseUrl: 'https://provider.example/api',
      });
      d.secrets.resolveActiveSecrets.mockRejectedValue(
        new PreconditionFailedException(
          'La conexión no tiene un secreto activo disponible',
          { connectionId: 'c1' },
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
        ),
      );

      await expect(d.service.dispatch('m1', {}, actor)).rejects.toMatchObject({
        reason:
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
      });
      expect(d.http.post).not.toHaveBeenCalled();
      expect(msg.statusConceptId).toBe(INTEG.MSG_QUEUED);
    });
  });
});
