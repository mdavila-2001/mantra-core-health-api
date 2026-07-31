import { of } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { setupTestTracer, type TestTracer } from './tracer.testing';
import { TracingService } from './tracing.service';
import { TraceResponseInterceptor } from './trace-response.interceptor';
import { TRACE_ID_HEADER } from './telemetry.constants';
import { loadTelemetryConfig } from './telemetry.config';

/** Respuesta de Express mínima: solo lo que el interceptor toca. */
function fakeResponse(headersSent = false) {
  const headers: Record<string, string> = {};
  return {
    headersSent,
    headers,
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  } as unknown as Response & {
    headers: Record<string, string>;
  };
}

/** Contexto de ejecución HTTP mínimo. */
function httpContext(response: Response, type = 'http'): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ExecutionContext;
}

const nextHandler: CallHandler = { handle: () => of({ ok: true }) };

describe('TraceResponseInterceptor', () => {
  let tracer: TestTracer;
  const tracing = new TracingService();

  beforeAll(() => {
    tracer = setupTestTracer();
  });

  afterAll(async () => {
    await tracer.shutdown();
  });

  beforeEach(() => tracer.reset());

  it('añade x-trace-id con el trace_id del span activo', async () => {
    const interceptor = new TraceResponseInterceptor(loadTelemetryConfig({}));
    const response = fakeResponse();

    await tracing.runInSpan('iam.authenticate', {}, () => {
      interceptor.intercept(httpContext(response), nextHandler);
    });

    const span = tracer.find('iam.authenticate');
    expect(response.headers[TRACE_ID_HEADER]).toBe(span?.spanContext().traceId);
  });

  it('conserva la respuesta del handler sin tocarla', async () => {
    const interceptor = new TraceResponseInterceptor(loadTelemetryConfig({}));
    const emitted: unknown[] = [];

    await tracing.runInSpan('iam.authenticate', {}, () => {
      interceptor
        .intercept(httpContext(fakeResponse()), nextHandler)
        .subscribe((value) => emitted.push(value));
    });

    expect(emitted).toEqual([{ ok: true }]);
  });

  it('no falla ni escribe cabecera cuando no hay span activo', () => {
    const interceptor = new TraceResponseInterceptor(loadTelemetryConfig({}));
    const response = fakeResponse();

    expect(() =>
      interceptor.intercept(httpContext(response), nextHandler),
    ).not.toThrow();
    expect(response.headers[TRACE_ID_HEADER]).toBeUndefined();
  });

  it('no escribe si la respuesta ya se envió', async () => {
    const interceptor = new TraceResponseInterceptor(loadTelemetryConfig({}));
    const response = fakeResponse(true);

    await tracing.runInSpan('iam.authenticate', {}, () => {
      interceptor.intercept(httpContext(response), nextHandler);
    });

    expect(response.headers[TRACE_ID_HEADER]).toBeUndefined();
  });

  it('respeta OTEL_TRACE_RESPONSE_HEADER=false', async () => {
    const interceptor = new TraceResponseInterceptor(
      loadTelemetryConfig({ OTEL_TRACE_RESPONSE_HEADER: 'false' }),
    );
    const response = fakeResponse();

    await tracing.runInSpan('iam.authenticate', {}, () => {
      interceptor.intercept(httpContext(response), nextHandler);
    });

    expect(response.headers[TRACE_ID_HEADER]).toBeUndefined();
  });

  it('ignora contextos que no son HTTP', async () => {
    const interceptor = new TraceResponseInterceptor(loadTelemetryConfig({}));
    const response = fakeResponse();

    await tracing.runInSpan('iam.authenticate', {}, () => {
      interceptor.intercept(httpContext(response, 'rpc'), nextHandler);
    });

    expect(response.headers[TRACE_ID_HEADER]).toBeUndefined();
  });
});
