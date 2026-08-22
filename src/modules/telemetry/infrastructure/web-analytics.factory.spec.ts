import { DisabledWebAnalyticsAdapter } from './disabled-web-analytics.adapter';
import { selectWebAnalyticsAdapter } from './web-analytics.factory';
import type { GoogleAnalyticsAdapter } from './google-analytics/google-analytics.adapter';
import type { WebAnalyticsEnv } from '../web-analytics.env';

const disabled = new DisabledWebAnalyticsAdapter();
const googleAnalytics = {
  providerName: 'google_analytics',
} as GoogleAnalyticsAdapter;
const adapters = { disabled, googleAnalytics };

/**
 * Construye una configuración mínima con lo que la selección mira.
 *
 * @param overrides - Campos relevantes para la prueba.
 * @returns Configuración utilizable por la fábrica.
 */
function env(overrides: Partial<WebAnalyticsEnv>): WebAnalyticsEnv {
  return { enabled: false, provider: 'none', ...overrides } as WebAnalyticsEnv;
}

describe('selectWebAnalyticsAdapter', () => {
  it('wires the disabled adapter by default', () => {
    expect(selectWebAnalyticsAdapter(adapters, env({}))).toBe(disabled);
  });

  it('wires Google Analytics when enabled and selected', () => {
    expect(
      selectWebAnalyticsAdapter(
        adapters,
        env({ enabled: true, provider: 'google_analytics' }),
      ),
    ).toBe(googleAnalytics);
  });

  it('lets the kill switch win over the configured provider', () => {
    expect(
      selectWebAnalyticsAdapter(
        adapters,
        env({ enabled: false, provider: 'google_analytics' }),
      ),
    ).toBe(disabled);
  });

  it('fails loudly on a provider without implementation', () => {
    expect(() =>
      selectWebAnalyticsAdapter(
        adapters,
        env({ enabled: true, provider: 'matomo' as never }),
      ),
    ).toThrow(/TELEMETRY_WEB_ANALYTICS_PROVIDER/u);
  });
});

describe('DisabledWebAnalyticsAdapter', () => {
  it('drops the batch without contacting anyone and never throws', async () => {
    await expect(
      disabled.track({
        identity: { subjectKey: 'subject-1' },
        events: [{ name: 'page_view' }, { name: 'page_view' }],
      }),
    ).resolves.toEqual({
      provider: 'disabled',
      delivered: 0,
      dropped: 2,
      requests: 0,
      skipReason: 'DISABLED',
    });
  });

  it('reports itself as inactive', async () => {
    await expect(disabled.health()).resolves.toEqual({
      provider: 'disabled',
      enabled: false,
      configured: false,
    });
  });
});
