import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { workerHealth } from '../../worker-health.registry';
import { defaultIdentityVerificationAdapter } from './dispatch-identity-checks.job';
import { MockProviderWiringService } from './mock-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = { providerAdapter: defaultIdentityVerificationAdapter as any };
  const client = { isConfigured: mockFn(() => isConfigured) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new MockProviderWiringService(
    job as any,
    client as any,
    logger as any,
  );
  return { service, job, client, logger };
}

describe('MockProviderWiringService (identity_assurance)', () => {
  const original = process.env.NODE_ENV;
  beforeEach(() => workerHealth.reset());
  afterEach(() => {
    process.env.NODE_ENV = original;
    workerHealth.reset();
  });

  it('sustituye providerAdapter cuando el emulador está configurado', () => {
    process.env.NODE_ENV = 'test';
    const d = build(true);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).not.toBe(defaultIdentityVerificationAdapter);
  });

  it('deja el adapter por defecto si no está configurado', () => {
    process.env.NODE_ENV = 'test';
    const d = build(false);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).toBe(defaultIdentityVerificationAdapter);
  });

  it('en producción con el adapter por defecto, el worker no está listo', () => {
    process.env.NODE_ENV = 'production';
    const d = build(false);

    d.service.onModuleInit();

    workerHealth.setStatus('running');
    const readiness = workerHealth.readiness();
    expect(readiness.healthy).toBe(false);
    expect(readiness.reasons.join(' ')).toContain(
      'identity_assurance.identity_checks',
    );
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('en producción el emulador no cuenta como proveedor productivo', () => {
    process.env.NODE_ENV = 'production';
    const d = build(true);

    d.service.onModuleInit();

    workerHealth.setStatus('running');
    expect(workerHealth.readiness().healthy).toBe(false);
  });
});
