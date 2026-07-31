import { DeletionsService } from './deletions.service';
import type { MockProviderEnv } from '../common/env';

function build(env: Partial<MockProviderEnv> = {}) {
  const fullEnv: MockProviderEnv = {
    port: 4100,
    apiKey: undefined,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
    identityVerificationDelayMs: 0,
    identityVerificationRejectionRate: 0,
    ...env,
  };
  return new DeletionsService(fullEnv);
}

describe('DeletionsService', () => {
  it('execute exitoso deja verify consistente (verifiedAbsent=true)', async () => {
    const service = build();

    const executed = await service.execute({
      backendCode: 'MONGO',
      targetLocator: 'doc-1',
    });
    expect(executed.succeeded).toBe(true);
    expect(executed.providerReceipt).toContain('mock-deletion-');

    const verified = await service.verify({
      backendCode: 'MONGO',
      targetLocator: 'doc-1',
    });
    expect(verified.verifiedAbsent).toBe(true);
    expect(verified.residualReferenceCount).toBe(0);
  });

  it('verify de un objetivo nunca ejecutado devuelve verifiedAbsent=false', async () => {
    const service = build();

    const verified = await service.verify({
      backendCode: 'OPENSEARCH',
      targetLocator: 'idx:doc-99',
    });

    expect(verified.verifiedAbsent).toBe(false);
    expect(verified.residualReferenceCount).toBe(1);
  });

  it('execute con tasa de fallo 1 no queda registrado como borrado', async () => {
    const service = build({ deletionsFailureRate: 1 });

    const executed = await service.execute({
      backendCode: 'REDIS',
      targetLocator: 'key-1',
    });
    expect(executed.succeeded).toBe(false);
    expect(executed.errorCode).toBe('SIMULATED_BACKEND_ERROR');

    const verified = await service.verify({
      backendCode: 'REDIS',
      targetLocator: 'key-1',
    });
    expect(verified.verifiedAbsent).toBe(false);
  });

  it('objetivos con el mismo locator en distinto backend no se confunden', async () => {
    const service = build();
    await service.execute({ backendCode: 'MONGO', targetLocator: 'x' });

    const verified = await service.verify({
      backendCode: 'OPENSEARCH',
      targetLocator: 'x',
    });

    expect(verified.verifiedAbsent).toBe(false);
  });
});
