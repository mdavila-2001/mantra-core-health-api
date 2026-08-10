import type { AuthenticatedUser } from '../../../common';
import { ResolveAudioAssetUseCase } from './resolve-audio-asset.use-case';

function template() {
  return { id: 't1', templateKey: 'onboarding.dashboard.intro', version: 1, strategy: 'STATIC', language: 'es-419',
    textTemplate: 'Hola.', fallbackText: undefined, dynamicFieldsJson: [], voiceProfile: 'brand_es_latam_v1', enabled: true,
    metadata: {}, createdAt: new Date(), updatedAt: new Date() };
}

describe('ResolveAudioAssetUseCase concurrency', () => {
  beforeEach(() => {
    process.env.AUDIO_TTS_ENABLED = 'true'; process.env.AUDIO_TTS_PROVIDER = 'fake';
    process.env.AUDIO_TTS_ALLOW_RUNTIME_GENERATION = 'true'; process.env.AUDIO_TTS_VOICE_PROFILE = 'brand_es_latam_v1';
    process.env.AUDIO_TTS_DATA_KEY = 'test-audio-data-key-012345678901234567890123';
  });

  it('tres solicitudes iguales convergen al mismo asset/dedupe key', async () => {
    const assets = new Map<string, any>(); const dedupe = new Set<string>();
    const repository: any = {
      findTemplate: jest.fn(async () => template()), dynamicFields: jest.fn(() => []),
      findAssetByKey: jest.fn(async (key: string) => assets.get(key) ?? null), findReusableReady: jest.fn(async () => null),
      createPendingOrGet: jest.fn(async (input: any) => {
        if (!assets.has(input.assetKey)) assets.set(input.assetKey, { id: 'asset-1', assetKey: input.assetKey,
          templateKey: input.templateKey, templateVersion: 1, generationStatus: 'PENDING', provider: input.provider });
        return assets.get(input.assetKey);
      }), appendEvent: jest.fn(async () => undefined), touchUsage: jest.fn(async () => undefined),
    };
    const budget: any = { canGenerate: jest.fn(async () => ({ allowed: true })) };
    const cipher: any = { encrypt: jest.fn((text: string) => `enc:${text}`) };
    const queue: any = { enqueue: jest.fn(async (_id: string, key: string) => { dedupe.add(key); return 'job-1'; }) };
    const metrics: any = { cacheHit: jest.fn(), fallback: jest.fn(), budgetDenied: jest.fn() };
    const tracing: any = { runInSpan: jest.fn(async (_n: string, _a: unknown, op: () => Promise<unknown>) => op()), addEvent: jest.fn() };
    const useCase = new ResolveAudioAssetUseCase(repository, budget, cipher, queue, metrics, tracing);
    const actor: AuthenticatedUser = { id: 'user-1', roles: ['USER'] };
    const results = await Promise.all(Array.from({ length: 3 }, () => useCase.execute({ templateKey: 'onboarding.dashboard.intro' }, actor)));
    expect(new Set(results.map((result) => result.asset?.id))).toEqual(new Set(['asset-1']));
    expect(new Set(results.map((result) => result.jobId))).toEqual(new Set(['job-1']));
    expect(dedupe.size).toBe(1);
  });
});
