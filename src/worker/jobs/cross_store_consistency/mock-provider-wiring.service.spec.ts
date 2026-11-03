import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { workerHealth } from '../../worker-health.registry';
import { MockProviderWiringService } from './mock-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = {
    executionAdapter: 'DEFAULT_EXEC' as any,
    verificationAdapter: 'DEFAULT_VERIFY' as any,
  };
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

  describe('capacidad de proveedor', () => {
    const original = process.env.NODE_ENV;
    beforeEach(() => workerHealth.reset());
    afterEach(() => {
      process.env.NODE_ENV = original;
      workerHealth.reset();
    });

    it('con el adapter por defecto en producción el worker NO está listo y lo registra como error', () => {
      process.env.NODE_ENV = 'production';
      const d = build(false);

      d.service.onModuleInit();

      expect(workerHealth.snapshot().providerCapabilities).toEqual([
        { capability: 'cross_store_consistency.deletion', binding: 'none' },
      ]);
      workerHealth.setStatus('running');
      const readiness = workerHealth.readiness();
      expect(readiness.healthy).toBe(false);
      expect(readiness.reasons.join(' ')).toContain(
        'cross_store_consistency.deletion',
      );
      expect(d.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          capability: 'cross_store_consistency.deletion',
          binding: 'none',
        }),
        expect.any(String),
      );
    });

    it('con el emulador en producción tampoco cuenta como proveedor productivo', () => {
      process.env.NODE_ENV = 'production';
      const d = build(true);

      d.service.onModuleInit();

      workerHealth.setStatus('running');
      expect(workerHealth.readiness().healthy).toBe(false);
    });

    it('fuera de producción el emulador deja el worker listo y el default solo avisa', () => {
      process.env.NODE_ENV = 'test';
      const mocked = build(true);
      mocked.service.onModuleInit();
      workerHealth.setStatus('running');
      expect(workerHealth.readiness().healthy).toBe(true);

      const bare = build(false);
      bare.service.onModuleInit();
      expect(bare.logger.warn).toHaveBeenCalled();
      expect(bare.logger.error).not.toHaveBeenCalled();
      expect(workerHealth.readiness().healthy).toBe(true);
    });
  });
});
