import { jest } from '@jest/globals';
import { SupportEffectiveAccessJob } from './support-effective-access.job';
import { SupportRecertificationJob } from './support-recertification.job';
import { SupportRequestsExpiryJob } from './support-requests-expiry.job';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Logger doble con los cuatro niveles que usa `runTick`. */
function loggerDouble() {
  return {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
}

describe('jobs de mantenimiento del personal de apoyo', () => {
  it('vencimiento de solicitudes: llama a su ruta e informa cuando venció alguna', async () => {
    const api = { post: mockFn().mockResolvedValue({ expiredRequests: 2 }) };
    const logger = loggerDouble();
    await new SupportRequestsExpiryJob(api as any, logger as any).tick();
    expect(api.post).toHaveBeenCalledWith(
      '/delegated-access/support/expire-requests',
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('vencimiento de solicitudes: calla cuando no venció ninguna', async () => {
    const api = { post: mockFn().mockResolvedValue({ expiredRequests: 0 }) };
    const logger = loggerDouble();
    await new SupportRequestsExpiryJob(api as any, logger as any).tick();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('recertificación: llama a su ruta e informa las suspensiones', async () => {
    const api = {
      post: mockFn().mockResolvedValue({ suspendedEngagements: 1 }),
    };
    const logger = loggerDouble();
    await new SupportRecertificationJob(api as any, logger as any).tick();
    expect(api.post).toHaveBeenCalledWith(
      '/delegated-access/support/recertification-sweep',
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('acceso efectivo: llama a su ruta y calla si no hay organizaciones con vínculos', async () => {
    const api = {
      post: mockFn().mockResolvedValue({
        tenants: 0,
        rows: 0,
        delegationsCreated: 0,
      }),
    };
    const logger = loggerDouble();
    await new SupportEffectiveAccessJob(api as any, logger as any).tick();
    expect(api.post).toHaveBeenCalledWith(
      '/delegated-access/support/refresh-effective-access',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('un fallo de la API no revienta el tick: queda registrado', async () => {
    const api = { post: mockFn().mockRejectedValue(new Error('caído')) };
    const logger = loggerDouble();
    await expect(
      new SupportEffectiveAccessJob(api as any, logger as any).tick(),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
