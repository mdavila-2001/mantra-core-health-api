import { EmbeddingsService } from './embeddings.service';
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
  return new EmbeddingsService(fullEnv);
}

describe('EmbeddingsService', () => {
  it('el mismo texto produce siempre el mismo vector (determinista)', async () => {
    const service = build();

    const first = await service.compute({ inputs: ['hola mundo'] });
    const second = await service.compute({ inputs: ['hola mundo'] });

    expect(first.data[0].embedding).toEqual(second.data[0].embedding);
  });

  it('textos distintos producen vectores distintos', async () => {
    const service = build();

    const res = await service.compute({ inputs: ['texto A', 'texto B'] });

    expect(res.data[0].embedding).not.toEqual(res.data[1].embedding);
  });

  it('el vector queda normalizado (magnitud ~1) y con la dimensión declarada', async () => {
    const service = build();

    const res = await service.compute({ inputs: ['cualquier cosa'] });
    const vector = res.data[0].embedding;
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

    expect(vector).toHaveLength(res.dimension);
    expect(magnitude).toBeCloseTo(1, 5);
  });

  it('usa el modelo por defecto si no se declara uno', async () => {
    const service = build();

    const res = await service.compute({ inputs: ['x'] });

    expect(res.model).toBe('mock-embedding-v1');
  });

  it('respeta el modelo declarado y calcula un índice/tokenCount por entrada', async () => {
    const service = build();

    const res = await service.compute({
      model: 'custom-model',
      inputs: ['uno', 'dos y tres'],
    });

    expect(res.model).toBe('custom-model');
    expect(res.data.map((d) => d.index)).toEqual([0, 1]);
    expect(res.data[1].tokenCount).toBeGreaterThan(res.data[0].tokenCount);
  });
});
