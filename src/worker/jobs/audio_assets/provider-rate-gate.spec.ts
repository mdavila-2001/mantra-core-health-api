import { ProviderRateGate } from './provider-rate-gate';

describe('ProviderRateGate', () => {
  it('permite hasta el límite inmediato configurado', async () => {
    const gate = new ProviderRateGate(2);
    const startedAt = Date.now();
    await Promise.all([gate.waitTurn(), gate.waitTurn()]);
    expect(Date.now() - startedAt).toBeLessThan(500);
  });
});
