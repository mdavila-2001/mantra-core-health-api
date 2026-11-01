import { PharmacyCatalogFactory } from './pharmacy-catalog.factory';

describe('shared host policy for ERP catalogs', () => {
  const env = { ...process.env };
  beforeEach(() => {
    delete process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS;
    delete process.env.PHARMACY_EXTERNAL_ALLOW_ANY_HOST;
    process.env.NODE_ENV = 'test';
  });
  afterEach(() => {
    process.env = { ...env };
  });
  const access = (baseUrl = 'https://synthetic.invalid/std') => ({
    systemCode: 'ALOVIDA_STANDARD' as const,
    baseUrl,
    pharmacyCode: 'SYNTHETIC',
    apiKey: 'synthetic-only',
    timeoutMs: 3000,
  });
  it('rejects an unlisted host with no transport or network call', () => {
    expect(() => new PharmacyCatalogFactory().forAccess(access())).toThrow();
  });
  it('accepts an explicitly listed host', () => {
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = 'synthetic.invalid';
    expect(
      new PharmacyCatalogFactory().forAccess(access()).isConfigured(),
    ).toBe(true);
  });
  it('rejects a different host even when another host is allowed', () => {
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = 'other.invalid';
    expect(() => new PharmacyCatalogFactory().forAccess(access())).toThrow();
  });
  it('rejects plain HTTP in production even for an allowed host', () => {
    process.env.NODE_ENV = 'production';
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = 'synthetic.invalid';
    expect(() =>
      new PharmacyCatalogFactory().forAccess(
        access('http://synthetic.invalid/std'),
      ),
    ).toThrow();
  });
  it('does not honor allow-any in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.PHARMACY_EXTERNAL_ALLOW_ANY_HOST = 'true';
    expect(() => new PharmacyCatalogFactory().forAccess(access())).toThrow();
  });
});
