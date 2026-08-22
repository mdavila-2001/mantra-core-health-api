import { jest } from '@jest/globals';
import { GoogleAnalyticsAdapter } from './google-analytics.adapter';
import type { GoogleAnalyticsConfig } from './google-analytics.config';
import type { GoogleAnalyticsHttpClient } from './google-analytics-http.client';
import {
  WebAnalyticsRateLimitedError,
  WebAnalyticsUnauthorizedError,
} from '../../domain/web-analytics.errors';
import type { WebAnalyticsHit } from '../../domain/web-analytics.port';

/**
 * Crea un mock tipado sin arrastrar las firmas de jest a cada llamada.
 *
 * @param impl - Implementación inicial opcional.
 * @returns Función mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Configuración base del adaptador, con la resiliencia acelerada para no
 * alargar la suite.
 *
 * @param overrides - Ajustes de la prueba.
 * @returns Configuración lista para el adaptador.
 */
function config(
  overrides: Partial<GoogleAnalyticsConfig> = {},
): GoogleAnalyticsConfig {
  return {
    measurementId: 'G-TEST123',
    apiSecret: 'secret',
    baseUrl: 'https://ga.example',
    debugValidation: false,
    timeoutMs: 500,
    maxRetries: 1,
    retryBaseMs: 1,
    subjectSalt: 'test-salt',
    batchToleranceMs: 1_000,
    adUserData: false,
    adPersonalization: false,
    maxConcurrency: 2,
    maxQueued: 8,
    circuitFailureThreshold: 2,
    circuitOpenMs: 1_000,
    ...overrides,
  };
}

/**
 * Construye el adaptador con un cliente HTTP controlado.
 *
 * @param options - Comportamiento del cliente y configuración.
 * @returns Adaptador, cliente y logger para inspeccionar.
 */
function build(
  options: {
    /**
     * Credenciales presentes.
     */
    configured?: boolean;
    /**
     * Implementación del envío.
     */
    send?: any;
    /**
     * Ajustes de configuración.
     */
    config?: Partial<GoogleAnalyticsConfig>;
  } = {},
) {
  const send =
    options.send ??
    mockFn(async () => ({ status: 204, validationMessages: [] }));
  const http = {
    configured: options.configured ?? true,
    send,
  } as unknown as GoogleAnalyticsHttpClient;
  const logger = { setContext: mockFn(), warn: mockFn(), error: mockFn() };
  const adapter = new GoogleAnalyticsAdapter(
    http,
    logger as any,
    config(options.config),
  );
  return { adapter, send, logger };
}

/**
 * Envío de ejemplo con identidad y un evento.
 *
 * @param overrides - Campos a sobreescribir.
 * @returns Envío listo para `track`.
 */
function hit(overrides: Partial<WebAnalyticsHit> = {}): WebAnalyticsHit {
  return {
    identity: { subjectKey: 'subject-1', sessionKey: 'journey-1' },
    events: [{ name: 'page_view', occurredAt: new Date() }],
    ...overrides,
  };
}

describe('GoogleAnalyticsAdapter', () => {
  it('delivers a batch to the Measurement Protocol', async () => {
    const d = build();
    const result = await d.adapter.track(hit());

    expect(result).toMatchObject({
      provider: 'google_analytics',
      delivered: 1,
      dropped: 0,
      requests: 1,
    });
    expect(d.send).toHaveBeenCalledTimes(1);
    const [payload] = d.send.mock.calls[0];
    expect(payload.events[0].name).toBe('page_view');
    expect(payload.client_id).toMatch(/^\d+\.\d+$/u);
  });

  it('does not call the provider without credentials', async () => {
    const d = build({ configured: false });
    const result = await d.adapter.track(hit());

    expect(result.skipReason).toBe('NOT_CONFIGURED');
    expect(result.dropped).toBe(1);
    expect(d.send).not.toHaveBeenCalled();
  });

  it('does not call the provider without analytics consent', async () => {
    const d = build();
    const result = await d.adapter.track(
      hit({ consent: { analytics: false } }),
    );

    expect(result.skipReason).toBe('NO_CONSENT');
    expect(d.send).not.toHaveBeenCalled();
  });

  it('does not call the provider without an identity', async () => {
    const d = build();
    const result = await d.adapter.track(hit({ identity: {} }));

    expect(result.skipReason).toBe('NO_IDENTITY');
    expect(d.send).not.toHaveBeenCalled();
  });

  it('reports an empty batch without contacting anyone', async () => {
    const d = build();
    const result = await d.adapter.track(hit({ events: [] }));

    expect(result.skipReason).toBe('EMPTY');
    expect(d.send).not.toHaveBeenCalled();
  });

  it('retries a transient failure and succeeds', async () => {
    let calls = 0;
    const send = mockFn(async () => {
      calls += 1;
      if (calls === 1) throw new WebAnalyticsRateLimitedError('slow down');
      return { status: 204, validationMessages: [] };
    });
    const d = build({ send });

    const result = await d.adapter.track(hit());

    expect(calls).toBe(2);
    expect(result.delivered).toBe(1);
  });

  it('gives up on a permanent failure without retrying, and never throws', async () => {
    let calls = 0;
    const send = mockFn(async () => {
      calls += 1;
      throw new WebAnalyticsUnauthorizedError('bad api secret');
    });
    const d = build({ send });

    const result = await d.adapter.track(hit());

    expect(calls).toBe(1);
    expect(result).toMatchObject({ delivered: 0, dropped: 1, requests: 1 });
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('stops the rest of the batch once the circuit opens', async () => {
    const send = mockFn(async () => {
      throw new WebAnalyticsRateLimitedError('slow down');
    });
    const d = build({
      send,
      config: { maxRetries: 0, circuitFailureThreshold: 2 },
    });
    // Tres peticiones (tres ventanas temporales distintas): tras los dos
    // primeros fallos el circuito abre y la tercera no llega a salir.
    const now = Date.now();
    const result = await d.adapter.track(
      hit({
        events: [0, 5_000, 10_000].map((offset) => ({
          name: 'page_view',
          occurredAt: new Date(now - 20_000 + offset),
        })),
      }),
    );

    expect(send).toHaveBeenCalledTimes(2);
    expect(result.delivered).toBe(0);
    expect(result.dropped).toBe(3);
  });

  it('surfaces GA4 validation messages instead of swallowing them', async () => {
    const send = mockFn(async () => ({
      status: 200,
      validationMessages: [
        {
          fieldPath: 'events[0].name',
          description: 'Event at index 0 has invalid name',
          validationCode: 'NAME_INVALID',
        },
      ],
    }));
    const d = build({ send, config: { debugValidation: true } });

    const result = await d.adapter.track(hit());

    expect(result.validationMessages).toEqual([
      'NAME_INVALID @events[0].name: Event at index 0 has invalid name',
    ]);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('reports its health without exposing credentials', async () => {
    const d = build();
    await expect(d.adapter.health()).resolves.toEqual({
      provider: 'google_analytics',
      enabled: true,
      configured: true,
    });
  });
});
