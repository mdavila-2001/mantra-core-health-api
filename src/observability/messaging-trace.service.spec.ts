import { SpanKind } from '@opentelemetry/api';
import { setupTestTracer, type TestTracer } from './tracer.testing';
import { TracingService } from './tracing.service';
import { MessagingTraceService } from './messaging-trace.service';
import { TRACE_CARRIER_KEY } from './telemetry.constants';

/**
 * Pruebas de la propagación del contexto a través del outbox: es lo único que
 * mantiene unida la traza cuando el trabajo cruza de la API a un worker minutos
 * después.
 */
describe('MessagingTraceService', () => {
  let tracer: TestTracer;
  const messaging = new MessagingTraceService();
  const tracing = new TracingService();

  beforeAll(() => {
    tracer = setupTestTracer();
  });

  afterAll(async () => {
    await tracer.shutdown();
  });

  beforeEach(() => tracer.reset());

  describe('inject / attach', () => {
    it('inyecta traceparent cuando hay traza activa', async () => {
      let carrier: Record<string, string> = {};

      await tracing.runInSpan('scheduling.appointment.book', {}, () => {
        carrier = messaging.inject();
      });

      expect(carrier.traceparent).toMatch(
        /^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/,
      );
    });

    it('devuelve un carrier vacío fuera de toda traza', () => {
      expect(messaging.inject()).toEqual({});
    });

    it('adjunta el carrier al payload sin mutar el original', async () => {
      const payload = { orderId: 'o-1' };
      let attached: Record<string, unknown> = {};

      await tracing.runInSpan('orders.place', {}, () => {
        attached = messaging.attach(payload);
      });

      expect(payload).toEqual({ orderId: 'o-1' });
      expect(attached.orderId).toBe('o-1');
      expect(attached[TRACE_CARRIER_KEY]).toBeDefined();
    });

    it('deja el payload intacto cuando no hay traza que propagar', () => {
      const payload = { orderId: 'o-1' };
      expect(messaging.attach(payload)).toBe(payload);
    });
  });

  describe('extract', () => {
    it('recupera el carrier de un payload que lo lleva', () => {
      const carrier = {
        traceparent: '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01',
      };
      expect(messaging.extract({ [TRACE_CARRIER_KEY]: carrier })).toEqual(
        carrier,
      );
    });

    it('tolera payloads antiguos sin metadata de traza', () => {
      expect(messaging.extract({ orderId: 'o-1' })).toEqual({});
      expect(messaging.extract(undefined)).toEqual({});
      expect(messaging.extract('no es un objeto')).toEqual({});
      expect(messaging.extract({ [TRACE_CARRIER_KEY]: 'roto' })).toEqual({});
    });

    it('descarta valores no textuales de un carrier corrupto', () => {
      expect(
        messaging.extract({ [TRACE_CARRIER_KEY]: { traceparent: 42 } }),
      ).toEqual({});
    });
  });

  describe('productor y consumidor', () => {
    it('el span productor es PRODUCER y entrega un carrier con su propio contexto', async () => {
      let carrier: Record<string, string> = {};

      await messaging.runInProducerSpan(
        'messaging.outbox publish',
        {},
        (_span, injected) => {
          carrier = injected;
        },
      );

      const span = tracer.find('messaging.outbox publish');
      expect(span?.kind).toBe(SpanKind.PRODUCER);
      expect(carrier.traceparent).toContain(span?.spanContext().traceId);
      expect(carrier.traceparent).toContain(span?.spanContext().spanId);
    });

    it('el consumidor continúa la traza del productor y es hijo suyo', async () => {
      let carrier: Record<string, string> = {};
      await messaging.runInProducerSpan(
        'messaging.outbox publish',
        {},
        (_s, c) => {
          carrier = c;
        },
      );
      const producer = tracer.find('messaging.outbox publish');

      await messaging.runInConsumerSpan(
        'messaging.outbox process',
        {},
        carrier,
        () => undefined,
      );

      const consumer = tracer.find('messaging.outbox process');
      expect(consumer?.kind).toBe(SpanKind.CONSUMER);
      expect(consumer?.spanContext().traceId).toBe(
        producer?.spanContext().traceId,
      );
      expect(consumer?.parentSpanContext?.spanId).toBe(
        producer?.spanContext().spanId,
      );
    });

    it('sin carrier, el consumidor cuelga de la traza actual en vez de fallar', async () => {
      await tracing.runInSpan('worker.messaging.outbox-relay', {}, async () => {
        await messaging.runInConsumerSpan(
          'messaging.outbox process',
          {},
          {},
          () => undefined,
        );
      });

      const tick = tracer.find('worker.messaging.outbox-relay');
      const consumer = tracer.find('messaging.outbox process');
      expect(consumer?.spanContext().traceId).toBe(tick?.spanContext().traceId);
      expect(consumer?.links).toHaveLength(0);
    });

    it('enlaza el consumidor con el tick cuando ambas trazas son distintas', async () => {
      let carrier: Record<string, string> = {};
      await messaging.runInProducerSpan(
        'messaging.outbox publish',
        {},
        (_s, c) => {
          carrier = c;
        },
      );

      await tracing.runInSpan('worker.messaging.outbox-relay', {}, async () => {
        await messaging.runInConsumerSpan(
          'messaging.outbox process',
          {},
          carrier,
          () => undefined,
        );
      });

      const tick = tracer.find('worker.messaging.outbox-relay');
      const consumer = tracer.find('messaging.outbox process');
      expect(consumer?.links).toHaveLength(1);
      expect(consumer?.links[0].context.spanId).toBe(
        tick?.spanContext().spanId,
      );
    });

    it('relanza el error del consumidor tras marcar el span', async () => {
      const boom = new Error('proveedor caído');
      await expect(
        messaging.runInConsumerSpan('messaging.outbox process', {}, {}, () => {
          throw boom;
        }),
      ).rejects.toBe(boom);

      expect(tracer.find('messaging.outbox process')?.ended).toBe(true);
    });
  });
});
