import { SpanStatusCode } from '@opentelemetry/api';
import { setupTestTracer, type TestTracer } from './tracer.testing';
import { TracingService, runInTracedSpan } from './tracing.service';
import { TraceContextService } from './trace-context.service';

/**
 * Pruebas de la API de trazas que consume el código de negocio.
 *
 * No se arranca el `NodeSDK` ni se necesita Jaeger: un `NodeTracerProvider` con
 * exportador en memoria basta para verificar nombre, atributos, jerarquía,
 * estado y cierre de cada span.
 */
describe('TracingService', () => {
  let tracer: TestTracer;
  let service: TracingService;

  beforeAll(() => {
    tracer = setupTestTracer();
  });

  afterAll(async () => {
    await tracer.shutdown();
  });

  beforeEach(() => {
    tracer.reset();
    service = new TracingService();
  });

  describe('runInSpan', () => {
    it('crea el span, ejecuta la operación, lo finaliza y devuelve el resultado', async () => {
      const result = await service.runInSpan(
        'billing.invoice.issue',
        { 'app.module': 'billing' },
        () => Promise.resolve(42),
      );

      expect(result).toBe(42);
      const span = tracer.find('billing.invoice.issue');
      expect(span).toBeDefined();
      expect(span?.ended).toBe(true);
      expect(span?.attributes['app.module']).toBe('billing');
      expect(span?.status.code).toBe(SpanStatusCode.UNSET);
    });

    it('descarta los atributos undefined en vez de emitirlos vacíos', async () => {
      await service.runInSpan(
        'billing.invoice.issue',
        { 'app.tenant.id': undefined, 'app.module': 'billing' },
        () => undefined,
      );

      const span = tracer.find('billing.invoice.issue');
      expect(Object.keys(span?.attributes ?? {})).toEqual(['app.module']);
    });

    it('soporta una operación síncrona sin envolverla en promesa el llamador', async () => {
      await expect(
        service.runInSpan('billing.total.compute', {}, () => 7),
      ).resolves.toBe(7);
    });

    it('registra la excepción, marca error, finaliza el span y relanza el error original', async () => {
      const boom = new Error('constraint violation');

      await expect(
        service.runInSpan('billing.invoice.issue', {}, () => {
          throw boom;
        }),
      ).rejects.toBe(boom);

      const span = tracer.find('billing.invoice.issue');
      expect(span?.ended).toBe(true);
      expect(span?.status.code).toBe(SpanStatusCode.ERROR);
      expect(span?.status.message).toBe('constraint violation');
      expect(span?.events.map((event) => event.name)).toContain('exception');
    });

    it('anida los spans hijos bajo el padre activo, en la misma traza', async () => {
      const context = new TraceContextService();
      let innerTraceId: string | undefined;

      await service.runInSpan('outer.operation', {}, async () => {
        await service.runInSpan('inner.operation', {}, () => {
          innerTraceId = context.getActiveTraceId();
        });
      });

      const outer = tracer.find('outer.operation');
      const inner = tracer.find('inner.operation');
      expect(inner?.parentSpanContext?.spanId).toBe(
        outer?.spanContext().spanId,
      );
      expect(inner?.spanContext().traceId).toBe(outer?.spanContext().traceId);
      expect(innerTraceId).toBe(outer?.spanContext().traceId);
    });

    it('adjunta la excepción una sola vez aunque se registre de nuevo el mismo error', async () => {
      const boom = new Error('duplicado');

      await expect(
        service.runInSpan('iam.authenticate', {}, (span) => {
          span.recordException(boom);
          throw boom;
        }),
      ).rejects.toBe(boom);

      const span = tracer.find('iam.authenticate');
      const exceptions = span?.events.filter(
        (event) => event.name === 'exception',
      );
      expect(exceptions).toHaveLength(1);
    });
  });

  describe('runInSpanSync', () => {
    it('devuelve el valor sin promesa y finaliza el span', () => {
      const value = service.runInSpanSync('rules.evaluate', {}, () => 'ok');

      expect(value).toBe('ok');
      expect(tracer.find('rules.evaluate')?.ended).toBe(true);
    });

    it('marca error y relanza en la variante síncrona', () => {
      expect(() =>
        service.runInSpanSync('rules.evaluate', {}, () => {
          throw new Error('regla inválida');
        }),
      ).toThrow('regla inválida');

      expect(tracer.find('rules.evaluate')?.status.code).toBe(
        SpanStatusCode.ERROR,
      );
    });
  });

  describe('eventos y atributos sobre el span activo', () => {
    it('añade eventos y atributos al span en curso', async () => {
      await service.runInSpan('credit.evaluate', {}, () => {
        service.addEvent('rules.started');
        service.setAttribute('credit.decision', 'APPROVED');
        service.setAttributes({ 'app.result.count': 3 });
      });

      const span = tracer.find('credit.evaluate');
      expect(span?.events.map((event) => event.name)).toContain(
        'rules.started',
      );
      expect(span?.attributes['credit.decision']).toBe('APPROVED');
      expect(span?.attributes['app.result.count']).toBe(3);
    });

    it('no falla cuando no hay span activo', () => {
      expect(() => {
        service.addEvent('huérfano');
        service.setAttribute('k', 'v');
        service.setAttributes({ k: 'v' });
        service.recordException(new Error('sin traza'));
      }).not.toThrow();
      expect(tracer.spans()).toHaveLength(0);
    });
  });

  describe('runInTracedSpan (uso desde infraestructura sin inyección)', () => {
    it('produce un span equivalente al del servicio inyectable', async () => {
      await runInTracedSpan(
        'worker.messaging.outbox-relay',
        { 'app.job.name': 'worker.messaging.outbox-relay' },
        () => Promise.resolve(),
      );

      const span = tracer.find('worker.messaging.outbox-relay');
      expect(span?.ended).toBe(true);
      expect(span?.attributes['app.job.name']).toBe(
        'worker.messaging.outbox-relay',
      );
    });
  });
});
