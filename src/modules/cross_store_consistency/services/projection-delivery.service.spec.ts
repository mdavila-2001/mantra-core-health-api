import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ProjectionDeliveryService } from './projection-delivery.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const SOURCE_DATASET = '22222222-2222-2222-2222-222222222222';
const TARGET_DATASET = '33333333-3333-3333-3333-333333333333';
const SUBSCRIPTION_ID = '44444444-4444-4444-4444-444444444444';
const OUTBOX_EVENT_ID = '55555555-5555-5555-5555-555555555555';
const ATTEMPT_ID = '66666666-6666-6666-6666-666666666666';
const DEAD_LETTER_ID = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const projectionRepo = {
    findDefinitionByVersion: mockFn(async () => null),
    createDefinition: mockFn((_tx: any, data: any) => ({
      id: 'def-1',
      ...data,
    })),
    createSubscription: mockFn((_tx: any, data: any) => ({
      id: SUBSCRIPTION_ID,
      ...data,
    })),
    findSubscriptionById: mockFn(async () => ({
      id: SUBSCRIPTION_ID,
      state: 'ACTIVE',
      consumerCode: 'search-consumer',
      deadLetterEnabled: true,
    })),
    findSloForUpdate: mockFn(async () => null),
    createSlo: mockFn((_tx: any, data: any) => ({ id: 'slo-1', ...data })),
    findConsumerByCodeForUpdate: mockFn(async () => null),
    createConsumer: mockFn((_tx: any, data: any) => ({
      id: 'consumer-1',
      ...data,
    })),
    findAttemptByIdempotencyKey: mockFn(async () => null),
    countAttempts: mockFn(async () => 0),
    createAttempt: mockFn((_tx: any, data: any) => ({
      id: ATTEMPT_ID,
      ...data,
    })),
    findAttemptForUpdate: mockFn(async () => null),
    findCheckpointForUpdate: mockFn(async () => null),
    createCheckpoint: mockFn((_tx: any, data: any) => ({
      id: 'cp-1',
      ...data,
    })),
    findDeadLetterByAttempt: mockFn(async () => null),
    createDeadLetter: mockFn((_tx: any, data: any) => ({
      id: DEAD_LETTER_ID,
      ...data,
    })),
    findDeadLetterForUpdate: mockFn(async () => null),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ProjectionDeliveryService(
    em as any,
    projectionRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, projectionRepo, outbox, logger };
}

const REGISTER_DTO = {
  code: 'encounters-to-search',
  sourceDatasetId: SOURCE_DATASET,
  targetDatasetId: TARGET_DATASET,
  projectionVersion: '1',
  subscriptions: [
    {
      sourceEventType: 'EncounterCreated',
      consumerCode: 'search-consumer',
      targetBackendCode: 'opensearch',
    },
  ],
} as any;

const DELIVERY_DTO = {
  projectionSubscriptionId: SUBSCRIPTION_ID,
  outboxEventId: OUTBOX_EVENT_ID,
  tenantId: TENANT_ID,
  payloadHash: 'ph-1',
  partitionKey: 'p-1',
  sourcePosition: '100',
} as any;

describe('ProjectionDeliveryService', () => {
  describe('registerProjection (UC-62-01)', () => {
    it('crea la definición con sus suscripciones', async () => {
      const d = build();

      const result = await d.service.registerProjection(REGISTER_DTO, actor);

      expect(result.state).toBe('ACTIVE');
      expect(result.subscriptionIds).toHaveLength(1);
      expect(
        d.projectionRepo.createDefinition.mock.calls[0][1].deliverySemantics,
      ).toBe('AT_LEAST_ONCE');
    });

    it('rechaza proyectar un dataset sobre sí mismo', async () => {
      const d = build();

      await expect(
        d.service.registerProjection(
          { ...REGISTER_DTO, targetDatasetId: SOURCE_DATASET },
          actor,
        ),
      ).rejects.toThrow(/no pueden ser el mismo/);
    });

    it('rechaza una versión ya registrada', async () => {
      const d = build();
      d.projectionRepo.findDefinitionByVersion.mockResolvedValue({
        id: 'otra',
      });

      await expect(
        d.service.registerProjection(REGISTER_DTO, actor),
      ).rejects.toThrow(/Ya existe esa versión/);
    });

    it('rechaza dos suscripciones con el mismo evento y consumidor', async () => {
      const d = build();

      await expect(
        d.service.registerProjection(
          {
            ...REGISTER_DTO,
            subscriptions: [
              REGISTER_DTO.subscriptions[0],
              REGISTER_DTO.subscriptions[0],
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/mismo tipo de evento y consumidor/);
    });

    it('crea el SLO si se declara', async () => {
      const d = build();

      const result = await d.service.registerProjection(
        {
          ...REGISTER_DTO,
          slo: {
            maxProjectionLagSeconds: 60,
            reconciliationIntervalMinutes: 30,
          },
        },
        actor,
      );

      expect(result.sloId).toBe('slo-1');
    });

    it('actualiza el SLO existente en vez de duplicarlo', async () => {
      const d = build();
      const slo = {
        id: 'slo-previo',
        maxProjectionLagSeconds: 10,
        state: 'RETIRED',
      };
      d.projectionRepo.findSloForUpdate.mockResolvedValue(slo);

      const result = await d.service.registerProjection(
        {
          ...REGISTER_DTO,
          slo: {
            maxProjectionLagSeconds: 60,
            reconciliationIntervalMinutes: 30,
          },
        },
        actor,
      );

      expect(slo.maxProjectionLagSeconds).toBe(60);
      expect(slo.state).toBe('ACTIVE');
      expect(result.sloId).toBe('slo-previo');
      expect(d.projectionRepo.createSlo).not.toHaveBeenCalled();
    });
  });

  describe('processDelivery (UC-62-02 y 03)', () => {
    it('registra el intento y avanza el checkpoint', async () => {
      const d = build();

      const result = await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(result.status).toBe('SUCCEEDED');
      expect(result.attemptNumber).toBe(1);
      expect(result.checkpointAdvanced).toBe(true);
    });

    it('devuelve el intento previo sin volver a aplicar', async () => {
      const d = build();
      d.projectionRepo.findAttemptByIdempotencyKey.mockResolvedValue({
        id: 'attempt-previo',
        attemptNumber: 1,
        status: 'SUCCEEDED',
      });

      const result = await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.projectionRepo.createAttempt).not.toHaveBeenCalled();
      expect(d.projectionRepo.createCheckpoint).not.toHaveBeenCalled();
    });

    it('la misma clave se deriva del evento y del payload', async () => {
      const d1 = build();
      await d1.service.processDelivery(DELIVERY_DTO, actor);
      const key1 =
        d1.projectionRepo.createAttempt.mock.calls[0][1].idempotencyKey;

      const d2 = build();
      await d2.service.processDelivery(DELIVERY_DTO, actor);
      const key2 =
        d2.projectionRepo.createAttempt.mock.calls[0][1].idempotencyKey;

      expect(key1).toBe(key2);
    });

    it('no avanza el checkpoint si la escritura no se confirmó durable', async () => {
      const d = build();

      const result = await d.service.processDelivery(
        { ...DELIVERY_DTO, durableWriteConfirmed: false, errorCode: 'TIMEOUT' },
        actor,
      );

      expect(result.status).toBe('FAILED');
      expect(result.checkpointAdvanced).toBe(false);
      expect(d.projectionRepo.createCheckpoint).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('el checkpoint no retrocede', async () => {
      const d = build();
      const checkpoint = { sourcePosition: '200', checkpointedAt: new Date() };
      d.projectionRepo.findCheckpointForUpdate.mockResolvedValue(checkpoint);

      const result = await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(result.checkpointAdvanced).toBe(false);
      expect(checkpoint.sourcePosition).toBe('200');
    });

    it('compara la posición como entero grande, no como texto', async () => {
      const d = build();
      const checkpoint = { sourcePosition: '99', checkpointedAt: new Date() };
      d.projectionRepo.findCheckpointForUpdate.mockResolvedValue(checkpoint);

      // '100' < '99' como texto, pero 100 > 99 como número: sí debe avanzar.
      const result = await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(result.checkpointAdvanced).toBe(true);
      expect(checkpoint.sourcePosition).toBe('100');
    });

    it('registra el latido del consumidor', async () => {
      const d = build();

      await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(d.projectionRepo.createConsumer).toHaveBeenCalled();
    });

    it('rechaza una suscripción que no está activa', async () => {
      const d = build();
      d.projectionRepo.findSubscriptionById.mockResolvedValue({
        id: SUBSCRIPTION_ID,
        state: 'PAUSED',
      });

      await expect(
        d.service.processDelivery(DELIVERY_DTO, actor),
      ).rejects.toThrow(/no está activa/);
    });

    it('un reintento conserva la clave del intento anterior', async () => {
      const d = build();
      d.projectionRepo.findAttemptByIdempotencyKey.mockResolvedValue({
        id: 'attempt-previo',
        attemptNumber: 1,
        status: 'FAILED',
        idempotencyKey: 'clave-original',
      });
      d.projectionRepo.countAttempts.mockResolvedValue(1);

      await d.service.processDelivery(DELIVERY_DTO, actor);

      expect(
        d.projectionRepo.createAttempt.mock.calls[0][1].idempotencyKey,
      ).toBe('clave-original');
      expect(
        d.projectionRepo.createAttempt.mock.calls[0][1].attemptNumber,
      ).toBe(2);
    });
  });

  describe('sendToDeadLetter (UC-62-04)', () => {
    const DTO = {
      projectionDeliveryAttemptId: ATTEMPT_ID,
      reasonCode: 'MAX_ATTEMPTS',
    } as any;

    /**
     * Ejecuta la operación with attempt.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de with attempt.
     */
    function withAttempt(d: ReturnType<typeof build>) {
      const attempt = {
        id: ATTEMPT_ID,
        projectionSubscriptionId: SUBSCRIPTION_ID,
        outboxEventId: OUTBOX_EVENT_ID,
        tenantId: TENANT_ID,
        status: 'IN_PROGRESS',
      };
      d.projectionRepo.findAttemptForUpdate.mockResolvedValue(attempt);
      return attempt;
    }

    it('marca el intento fallido y crea la entrada', async () => {
      const d = build();
      const attempt = withAttempt(d);

      const result = await d.service.sendToDeadLetter(DTO, actor);

      expect(attempt.status).toBe('FAILED');
      expect(result.state).toBe('OPEN');
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('no registra dos veces el mismo intento', async () => {
      const d = build();
      withAttempt(d);
      d.projectionRepo.findDeadLetterByAttempt.mockResolvedValue({
        id: 'dl-previo',
        state: 'OPEN',
      });

      const result = await d.service.sendToDeadLetter(DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.projectionRepo.createDeadLetter).not.toHaveBeenCalled();
    });

    it('rechaza si la suscripción no tiene cola muerta habilitada', async () => {
      const d = build();
      withAttempt(d);
      d.projectionRepo.findSubscriptionById.mockResolvedValue({
        id: SUBSCRIPTION_ID,
        deadLetterEnabled: false,
      });

      await expect(d.service.sendToDeadLetter(DTO, actor)).rejects.toThrow(
        /cola muerta/,
      );
    });
  });

  describe('replayDeadLetter (UC-62-04)', () => {
    /**
     * Ejecuta la operación with dead letter.
     *
     * @param d - Valor de d requerido por la operación.
     * @param state - Valor de state requerido por la operación.
     * @returns Resultado de with dead letter.
     */
    function withDeadLetter(d: ReturnType<typeof build>, state = 'OPEN') {
      const deadLetter = {
        id: DEAD_LETTER_ID,
        projectionDeliveryAttemptId: ATTEMPT_ID,
        state,
      };
      d.projectionRepo.findDeadLetterForUpdate.mockResolvedValue(deadLetter);
      d.projectionRepo.findAttemptForUpdate.mockResolvedValue({
        id: ATTEMPT_ID,
        projectionSubscriptionId: SUBSCRIPTION_ID,
        outboxEventId: OUTBOX_EVENT_ID,
        tenantId: TENANT_ID,
        idempotencyKey: 'clave-original',
        payloadHash: 'ph-1',
      });
      return deadLetter;
    }

    it('crea un intento nuevo conservando la clave', async () => {
      const d = build();
      const deadLetter = withDeadLetter(d);
      d.projectionRepo.countAttempts.mockResolvedValue(3);

      const result = await d.service.replayDeadLetter(
        DEAD_LETTER_ID,
        {},
        actor,
      );

      expect(result.idempotencyKey).toBe('clave-original');
      expect(result.attemptNumber).toBe(4);
      expect(deadLetter.state).toBe('REPLAYED');
    });

    it('rechaza reprocesar una entrada que no está abierta', async () => {
      const d = build();
      withDeadLetter(d, 'REPLAYED');

      await expect(
        d.service.replayDeadLetter(DEAD_LETTER_ID, {} as any, actor),
      ).rejects.toThrow(/no está abierta/);
    });
  });
});
