import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MockProviderWiringService } from './mock-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = {
    executionAdapter: 'DEFAULT_EXEC' as any,
    verificationAdapter: 'DEFAULT_VERIFY' as any,
  };
  const client = { isConfigured: mockFn(() => isConfigured) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new MockProviderWiringService(
    job as any,
    client as any,
    logger as any,
  );
  return { service, job, client, logger };
}

describe('MockProviderWiringService (cross_store_consistency)', () => {
  it('sustituye ambos adapters cuando el emulador está configurado', () => {
    const d = build(true);

    d.service.onModuleInit();

    expect(d.job.executionAdapter).not.toBe('DEFAULT_EXEC');
    expect(d.job.verificationAdapter).not.toBe('DEFAULT_VERIFY');
  });

  it('deja los adapters por defecto si no está configurado', () => {
    const d = build(false);

    d.service.onModuleInit();

    expect(d.job.executionAdapter).toBe('DEFAULT_EXEC');
    expect(d.job.verificationAdapter).toBe('DEFAULT_VERIFY');
  });
});
