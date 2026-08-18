import {
  loadWebAnalyticsEnv,
  webAnalyticsEnvSchema,
  GA4_DEFAULT_ENDPOINT,
} from './web-analytics.env';

const KEYS = [
  'TELEMETRY_WEB_ANALYTICS_ENABLED',
  'TELEMETRY_WEB_ANALYTICS_PROVIDER',
  'TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT',
  'TELEMETRY_WEB_ANALYTICS_SITE_URL',
  'GA4_MEASUREMENT_ID',
  'GA4_API_SECRET',
  'GA4_ENDPOINT',
  'GA4_DEBUG_VALIDATION',
];

describe('web analytics env', () => {
  const original = { ...process.env };

  afterEach(() => {
    for (const key of KEYS) delete process.env[key];
    Object.assign(process.env, original);
  });

  it('is off by default: an untouched deployment forwards nothing', () => {
    for (const key of KEYS) delete process.env[key];
    const env = loadWebAnalyticsEnv();
    expect(env.enabled).toBe(false);
    expect(env.provider).toBe('none');
    expect(env.ga4Endpoint).toBe(GA4_DEFAULT_ENDPOINT);
  });

  it('refuses to start with google_analytics but no credentials', () => {
    process.env.TELEMETRY_WEB_ANALYTICS_ENABLED = 'true';
    process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER = 'google_analytics';
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT = 'a-long-enough-salt';
    expect(() => loadWebAnalyticsEnv()).toThrow(/GA4_MEASUREMENT_ID/u);
  });

  it('refuses to start without a real salt', () => {
    process.env.TELEMETRY_WEB_ANALYTICS_ENABLED = 'true';
    process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER = 'google_analytics';
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT = 'short';
    process.env.GA4_MEASUREMENT_ID = 'G-TEST123';
    process.env.GA4_API_SECRET = 'secret';
    expect(() => loadWebAnalyticsEnv()).toThrow(/SUBJECT_SALT/u);
  });

  it('loads a fully configured deployment', () => {
    process.env.TELEMETRY_WEB_ANALYTICS_ENABLED = 'true';
    process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER = 'google_analytics';
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT = 'a-long-enough-salt';
    process.env.TELEMETRY_WEB_ANALYTICS_SITE_URL = 'https://portal.example/';
    process.env.GA4_MEASUREMENT_ID = 'G-TEST123';
    process.env.GA4_API_SECRET = 'secret';
    process.env.GA4_ENDPOINT = 'https://region1.google-analytics.com/';
    process.env.GA4_DEBUG_VALIDATION = 'true';

    const env = loadWebAnalyticsEnv();

    expect(env).toMatchObject({
      enabled: true,
      provider: 'google_analytics',
      ga4MeasurementId: 'G-TEST123',
      ga4DebugValidation: true,
      // Sin barra final: la ruta se concatena tal cual en el cliente.
      ga4Endpoint: 'https://region1.google-analytics.com',
      siteUrl: 'https://portal.example',
    });
  });

  it('rejects a malformed measurement id at validation time', () => {
    const { error } = webAnalyticsEnvSchema.validate(
      { GA4_MEASUREMENT_ID: 'UA-12345-1' },
      { abortEarly: false },
    );
    expect(error?.message).toMatch(/GA4_MEASUREMENT_ID/u);
  });

  it('rejects an unknown provider at validation time', () => {
    const { error } = webAnalyticsEnvSchema.validate({
      TELEMETRY_WEB_ANALYTICS_PROVIDER: 'matomo',
    });
    expect(error?.message).toMatch(/TELEMETRY_WEB_ANALYTICS_PROVIDER/u);
  });

  it('applies its documented defaults through the schema', () => {
    const { value } = webAnalyticsEnvSchema.validate({});
    expect(value).toMatchObject({
      TELEMETRY_WEB_ANALYTICS_ENABLED: false,
      TELEMETRY_WEB_ANALYTICS_PROVIDER: 'none',
      TELEMETRY_WEB_ANALYTICS_TIMEOUT_MS: 2000,
      GA4_ENDPOINT: GA4_DEFAULT_ENDPOINT,
    });
  });
});
