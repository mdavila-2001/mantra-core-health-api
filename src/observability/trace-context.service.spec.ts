import { setupTestTracer, type TestTracer } from './tracer.testing';
import { TracingService } from './tracing.service';
import {
  TraceContextService,
  currentTraceContext,
} from './trace-context.service';

/**
 * Pruebas de la lectura del contexto de traza, que es lo que hace posible
 * correlacionar un log de pino, una cabecera `x-trace-id` y una traza de Jaeger.
 */
describe('TraceContextService', () => {
  let tracer: TestTracer;
  const context = new TraceContextService();
  const tracing = new TracingService();

  beforeAll(() => {
    tracer = setupTestTracer();
  });

  afterAll(async () => {
    await tracer.shutdown();
  });

  beforeEach(() => tracer.reset());

  it('devuelve el trace_id y el span_id del span activo', async () => {
    let observed: ReturnType<typeof currentTraceContext> = {};

    await tracing.runInSpan('iam.authenticate', {}, () => {
      observed = currentTraceContext();
    });

    const span = tracer.find('iam.authenticate');
    expect(observed.trace_id).toBe(span?.spanContext().traceId);
    expect(observed.span_id).toBe(span?.spanContext().spanId);
    expect(observed.trace_flags).toBe(1);
  });

  it('cada span hijo tiene su propio span_id dentro del mismo trace_id', async () => {
    const seen: Array<{ trace?: string; span?: string }> = [];

    await tracing.runInSpan('outer', {}, async () => {
      seen.push({
        trace: context.getActiveTraceId(),
        span: context.getActiveSpanId(),
      });
      await tracing.runInSpan('inner', {}, () => {
        seen.push({
          trace: context.getActiveTraceId(),
          span: context.getActiveSpanId(),
        });
      });
    });

    expect(seen[0].trace).toBe(seen[1].trace);
    expect(seen[0].span).not.toBe(seen[1].span);
  });

  it('devuelve un objeto vacío fuera de toda traza, sin inventar identificadores', () => {
    expect(currentTraceContext()).toEqual({});
    expect(context.getActiveTraceId()).toBeUndefined();
    expect(context.getActiveSpanId()).toBeUndefined();
  });
});
