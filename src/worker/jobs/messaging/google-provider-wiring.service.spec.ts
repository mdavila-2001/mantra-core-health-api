import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { GoogleProviderWiringService } from './google-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = { providerAdapter: 'DEFAULT' as any };
  const client = { isConfigured: mockFn(() => isConfigured) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new GoogleProviderWiringService(
    job as any,
    client as any,
    logger as any,
  );
  return { service, job, client, logger };
}

describe('GoogleProviderWiringService (messaging)', () => {
  it('sustituye providerAdapter cuando las 4 variables GOOGLE_OAUTH_*/GOOGLE_SENDER_EMAIL están configuradas', () => {
    const d = build(true);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).not.toBe('DEFAULT');
    expect(d.logger.info).toHaveBeenCalled();
  });

  it('deja el adapter tal como estaba si falta alguna variable de Google', () => {
    const d = build(false);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).toBe('DEFAULT');
    expect(d.logger.info).not.toHaveBeenCalled();
  });
});
