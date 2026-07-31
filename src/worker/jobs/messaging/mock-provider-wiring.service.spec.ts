import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MockProviderWiringService } from './mock-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = { providerAdapter: 'DEFAULT' as any };
  const client = { isConfigured: mockFn(() => isConfigured) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new MockProviderWiringService(
    job as any,
    client as any,
    logger as any,
  );
  return { service, job, client, logger };
}

describe('MockProviderWiringService (messaging)', () => {
  it('sustituye providerAdapter cuando el emulador está configurado', () => {
    const d = build(true);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).not.toBe('DEFAULT');
    expect(d.logger.info).toHaveBeenCalled();
  });

  it('deja el adapter por defecto si MOCK_PROVIDER_BASE_URL no está configurada', () => {
    const d = build(false);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).toBe('DEFAULT');
    expect(d.logger.info).not.toHaveBeenCalled();
  });
});
