import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { workerHealth } from '../../worker-health.registry';
import { MockProviderWiringService } from './mock-provider-wiring.service';

function build(isConfigured: boolean) {
  const job = { providerAdapter: 'DEFAULT' as any };
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

describe('MockProviderWiringService (vector_rag)', () => {
  it('sustituye providerAdapter cuando el emulador está configurado', () => {
    const d = build(true);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).not.toBe('DEFAULT');
  });

  it('deja el adapter por defecto si no está configurado', () => {
    const d = build(false);

    d.service.onModuleInit();

    expect(d.job.providerAdapter).toBe('DEFAULT');
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
        { capability: 'vector_rag.embeddings', binding: 'none' },
      ]);
      workerHealth.setStatus('running');
      const readiness = workerHealth.readiness();
      expect(readiness.healthy).toBe(false);
      expect(readiness.reasons.join(' ')).toContain('vector_rag.embeddings');
      expect(d.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          capability: 'vector_rag.embeddings',
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
