import { AxiosError, AxiosHeaders } from 'axios';
import {
  deriveClientId,
  deriveSessionId,
  mapGoogleAnalyticsError,
  sanitizeEventName,
  sanitizeParams,
  toMeasurementProtocolPayloads,
  GA4_MAX_EVENTS_PER_REQUEST,
  GA4_MAX_EVENT_AGE_MS,
  GA4_MAX_PARAM_VALUE_LENGTH,
  type Ga4MappingOptions,
} from './google-analytics.mapper';
import {
  WebAnalyticsInvalidRequestError,
  WebAnalyticsNetworkError,
  WebAnalyticsRateLimitedError,
  WebAnalyticsTimeoutError,
  WebAnalyticsUnauthorizedError,
  WebAnalyticsUnavailableError,
} from '../../domain/web-analytics.errors';
import type { WebAnalyticsEvent } from '../../domain/web-analytics.port';

const NOW = new Date('2026-08-17T12:00:00.000Z');

/**
 * Construye las opciones de mapeo con el reloj fijado.
 *
 * @param overrides - Ajustes que la prueba quiera cambiar.
 * @returns Opciones listas para `toMeasurementProtocolPayloads`.
 */
function options(
  overrides: Partial<Ga4MappingOptions> = {},
): Ga4MappingOptions {
  return {
    subjectSalt: 'test-salt',
    defaultConsent: { analytics: true },
    batchToleranceMs: 1_000,
    now: NOW,
    ...overrides,
  };
}

/**
 * Construye un evento del puerto con valores por defecto.
 *
 * @param overrides - Campos a sobreescribir.
 * @returns Evento listo para el mapper.
 */
function event(overrides: Partial<WebAnalyticsEvent> = {}): WebAnalyticsEvent {
  return { name: 'page_view', occurredAt: NOW, ...overrides };
}

describe('deriveClientId', () => {
  it('is stable for the same key and salt', () => {
    expect(deriveClientId('subject-1', 'salt')).toBe(
      deriveClientId('subject-1', 'salt'),
    );
  });

  it('changes with the salt, so GA4 cannot correlate internal ids', () => {
    expect(deriveClientId('subject-1', 'salt-a')).not.toBe(
      deriveClientId('subject-1', 'salt-b'),
    );
  });

  it('never leaks the internal identifier', () => {
    expect(deriveClientId('subject-1', 'salt')).not.toContain('subject-1');
  });

  it('uses the numeric shape GA4 generates by itself', () => {
    expect(deriveClientId('subject-1', 'salt')).toMatch(
      /^\d{1,10}\.\d{1,10}$/u,
    );
  });
});

describe('deriveSessionId', () => {
  it('is a stable positive integer', () => {
    const id = deriveSessionId('journey-1', 'salt');
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThanOrEqual(0);
    expect(deriveSessionId('journey-1', 'salt')).toBe(id);
  });
});

describe('sanitizeEventName', () => {
  it('normalizes casing and separators', () => {
    expect(sanitizeEventName('Doctor Profile-Viewed')).toBe(
      'doctor_profile_viewed',
    );
  });

  it('rescues names that start with a digit', () => {
    expect(sanitizeEventName('3d_tour')).toBe('evt_3d_tour');
  });

  it('rescues reserved GA4 names instead of losing the event', () => {
    expect(sanitizeEventName('session_start')).toBe('evt_session_start');
  });

  it('truncates to the 40 character limit', () => {
    expect(sanitizeEventName('a'.repeat(60))).toHaveLength(40);
  });

  it('returns null when nothing usable remains', () => {
    expect(sanitizeEventName('***')).toBeNull();
  });
});

describe('sanitizeParams', () => {
  it('drops undefined values and reserved prefixes', () => {
    expect(
      sanitizeParams({
        keep: 'yes',
        drop: undefined,
        ga_session: 'nope',
        firebase_id: 'nope',
        _private: 'nope',
      }),
    ).toEqual({ keep: 'yes' });
  });

  it('truncates long values and normalizes booleans', () => {
    const result = sanitizeParams({
      long: 'x'.repeat(200),
      flag: true,
      count: 3,
    });
    expect(result.long).toHaveLength(GA4_MAX_PARAM_VALUE_LENGTH);
    expect(result.flag).toBe('true');
    expect(result.count).toBe(3);
  });

  it('drops non-finite numbers', () => {
    expect(sanitizeParams({ ratio: Number.NaN })).toEqual({});
  });

  it('keeps at most 25 parameters', () => {
    const many = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`p${i}`, i]),
    );
    expect(Object.keys(sanitizeParams(many))).toHaveLength(25);
  });
});

describe('toMeasurementProtocolPayloads', () => {
  it('builds one request with the derived identity and consent', () => {
    const { payloads, dropped } = toMeasurementProtocolPayloads(
      {
        identity: { subjectKey: 'subject-1', sessionKey: 'journey-1' },
        consent: {
          analytics: true,
          adUserData: true,
          adPersonalization: false,
        },
        events: [event({ params: { route_template: '/doctores/:id' } })],
      },
      options(),
    );

    expect(dropped).toBe(0);
    expect(payloads).toHaveLength(1);
    expect(payloads[0].client_id).toBe(
      deriveClientId('subject-1', 'test-salt'),
    );
    expect(payloads[0].timestamp_micros).toBe(NOW.getTime() * 1000);
    expect(payloads[0].consent).toEqual({
      ad_user_data: 'GRANTED',
      ad_personalization: 'DENIED',
    });
    expect(payloads[0].events[0]).toEqual({
      name: 'page_view',
      params: {
        route_template: '/doctores/:id',
        session_id: deriveSessionId('journey-1', 'test-salt'),
        engagement_time_msec: 1,
      },
    });
  });

  it('falls back to the session key when there is no subject', () => {
    const { payloads } = toMeasurementProtocolPayloads(
      { identity: { sessionKey: 'journey-1' }, events: [event()] },
      options(),
    );
    expect(payloads[0].client_id).toBe(
      deriveClientId('journey-1', 'test-salt'),
    );
  });

  it('drops everything when there is no identity to attribute to', () => {
    const result = toMeasurementProtocolPayloads(
      { identity: {}, events: [event(), event()] },
      options(),
    );
    expect(result.payloads).toHaveLength(0);
    expect(result.dropped).toBe(2);
  });

  it('drops events older than the GA4 backdating window', () => {
    const stale = new Date(NOW.getTime() - GA4_MAX_EVENT_AGE_MS - 1_000);
    const result = toMeasurementProtocolPayloads(
      {
        identity: { subjectKey: 'subject-1' },
        events: [event({ occurredAt: stale }), event()],
      },
      options(),
    );
    expect(result.dropped).toBe(1);
    expect(result.payloads[0].events).toHaveLength(1);
  });

  it('splits batches at the 25 events per request limit', () => {
    const events = Array.from({ length: 60 }, () => event());
    const { payloads } = toMeasurementProtocolPayloads(
      { identity: { subjectKey: 'subject-1' }, events },
      options(),
    );
    expect(payloads).toHaveLength(3);
    expect(payloads[0].events).toHaveLength(GA4_MAX_EVENTS_PER_REQUEST);
    expect(payloads[2].events).toHaveLength(10);
  });

  it('splits batches when the events do not share a timestamp window', () => {
    const { payloads } = toMeasurementProtocolPayloads(
      {
        identity: { subjectKey: 'subject-1' },
        events: [
          event({ occurredAt: new Date(NOW.getTime() - 10_000) }),
          event({ occurredAt: NOW }),
        ],
      },
      options({ batchToleranceMs: 1_000 }),
    );
    // Un único `timestamp_micros` por petición: agrupar eventos separados diez
    // segundos falsearía la marca de uno de los dos.
    expect(payloads).toHaveLength(2);
    expect(payloads[0].timestamp_micros).toBeLessThan(
      payloads[1].timestamp_micros,
    );
  });

  it('reports nothing to send for an empty batch', () => {
    const result = toMeasurementProtocolPayloads(
      { identity: { subjectKey: 'subject-1' }, events: [] },
      options(),
    );
    expect(result).toEqual({ payloads: [], dropped: 0 });
  });

  it('keeps every request under the 130kB payload limit', () => {
    const events = Array.from({ length: 25 }, () =>
      event({
        params: Object.fromEntries(
          Array.from({ length: 25 }, (_, i) => [`p${i}`, 'x'.repeat(100)]),
        ),
      }),
    );
    const { payloads } = toMeasurementProtocolPayloads(
      { identity: { subjectKey: 'subject-1' }, events },
      options(),
    );
    for (const payload of payloads) {
      expect(Buffer.byteLength(JSON.stringify(payload), 'utf8')).toBeLessThan(
        130_000,
      );
    }
  });
});

describe('mapGoogleAnalyticsError', () => {
  /**
   * Construye un `AxiosError` con la respuesta indicada.
   *
   * @param status - Código HTTP devuelto.
   * @param headers - Cabeceras de la respuesta.
   * @returns Error tal como lo lanzaría axios.
   */
  function axiosError(
    status: number,
    headers: Record<string, string> = {},
  ): AxiosError {
    const error = new AxiosError('failed');
    error.response = {
      status,
      statusText: '',
      headers,
      config: { headers: new AxiosHeaders() },
      data: {},
    };
    return error;
  }

  it('classifies rate limiting as retryable and honours Retry-After', () => {
    const mapped = mapGoogleAnalyticsError(
      axiosError(429, { 'retry-after': '2' }),
    );
    expect(mapped).toBeInstanceOf(WebAnalyticsRateLimitedError);
    expect(mapped.retryable).toBe(true);
    expect(mapped.retryAfterMs).toBe(2000);
  });

  it('classifies rejected credentials as permanent', () => {
    const mapped = mapGoogleAnalyticsError(axiosError(401));
    expect(mapped).toBeInstanceOf(WebAnalyticsUnauthorizedError);
    expect(mapped.retryable).toBe(false);
  });

  it('classifies a bad payload as permanent', () => {
    expect(mapGoogleAnalyticsError(axiosError(400))).toBeInstanceOf(
      WebAnalyticsInvalidRequestError,
    );
  });

  it('classifies provider failures as retryable', () => {
    const mapped = mapGoogleAnalyticsError(axiosError(503));
    expect(mapped).toBeInstanceOf(WebAnalyticsUnavailableError);
    expect(mapped.retryable).toBe(true);
  });

  it('classifies timeouts and network failures', () => {
    const timeout = new AxiosError('timeout');
    timeout.code = 'ECONNABORTED';
    expect(mapGoogleAnalyticsError(timeout)).toBeInstanceOf(
      WebAnalyticsTimeoutError,
    );
    expect(mapGoogleAnalyticsError(new Error('boom'))).toBeInstanceOf(
      WebAnalyticsNetworkError,
    );
  });
});
