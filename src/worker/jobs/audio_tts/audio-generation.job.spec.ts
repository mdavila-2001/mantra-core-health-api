import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AudioGenerationJob } from './audio-generation.job';
import { resetTickStateForTests } from '../../run-tick.util';
import { TtsProviderError } from '../../../modules/audio_tts/domain';
import type { AudioTtsConfig } from '../../../modules/audio_tts/config/audio-tts.env';

const MP3 = Buffer.concat([
  Buffer.from([0xff, 0xfb, 0x90, 0x64]),
  Buffer.alloc(64, 1),
]);

const job = {
  assetId: '00000000-0000-4000-8000-000000000001',
  text: 'Bienvenido, María.',
  language: 'es-419',
  providerVoiceRef: 'voice-1',
  model: 'eleven_v3',
  outputFormat: 'mp3_44100_128',
  sampleRate: 44_100,
  attempts: 1,
  correlationId: 'corr-1',
};

function build() {
  const config = {
    batchSize: 2,
    voiceProfile: 'brand_es_latam_v1',
  } as AudioTtsConfig;

  const tts = {
    providerName: 'elevenlabs',
    synthesize: mockFn().mockResolvedValue({
      audio: MP3,
      mimeType: 'audio/mpeg',
      provider: 'elevenlabs',
      model: 'eleven_v3',
      usageUnits: 18,
      usageIsReported: false,
      durationMs: 10,
    }),
    health: mockFn().mockResolvedValue({
      provider: 'elevenlabs',
      configured: true,
    }),
  };
  const storage = {
    store: mockFn().mockResolvedValue({
      storageUri: 's3://bucket/audio-assets/00/asset.mp3',
      checksumSha256: 'a'.repeat(64),
      sizeBytes: MP3.length,
    }),
  };
  const api = {
    workerId: mockFn(() => 'audio-generation:1:abcd'),
    post: mockFn(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [], skipped: 0 } : {},
    ),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    debug: mockFn(),
  };

  const jobRunner = new AudioGenerationJob(
    config,
    tts as any,
    storage as any,
    api as any,
    logger as any,
  );
  return { jobRunner, tts, storage, api, logger };
}

/** Filtra las llamadas del cliente HTTP por ruta. */
function callsTo(api: { post: { mock: { calls: any[][] } } }, suffix: string) {
  return api.post.mock.calls.filter((call) => String(call[0]).endsWith(suffix));
}

beforeEach(() => {
  resetTickStateForTests();
});

describe('AudioGenerationJob', () => {
  it('no hace nada más cuando no hay trabajo pendiente', async () => {
    const d = build();
    await d.jobRunner.tick();
    expect(callsTo(d.api, '/jobs/claim')).toHaveLength(1);
    expect(d.tts.synthesize).not.toHaveBeenCalled();
    expect(d.storage.store).not.toHaveBeenCalled();
  });

  it('sintetiza, almacena y reporta el resultado', async () => {
    const d = build();
    d.api.post.mockImplementation(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [job], skipped: 0 } : {},
    );

    await d.jobRunner.tick();

    expect(d.tts.synthesize).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Bienvenido, María.',
        providerVoiceRef: 'voice-1',
        model: 'eleven_v3',
        outputFormat: 'mp3_44100_128',
      }),
    );
    expect(d.storage.store).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: job.assetId, buffer: MP3 }),
    );

    const [path, body, options] = callsTo(d.api, '/complete')[0];
    expect(path).toBe(`/internal/audio-tts/assets/${job.assetId}/complete`);
    expect(body).toEqual({
      storageUri: 's3://bucket/audio-assets/00/asset.mp3',
      mimeType: 'audio/mpeg',
      checksumSha256: 'a'.repeat(64),
      bytes: MP3.length,
      usageUnits: 18,
      provider: 'elevenlabs',
    });
    // Los bytes ya están a salvo: reintentar el reporte es seguro y necesario.
    expect(options).toEqual({ idempotent: true });
  });

  it('no reintenta el reclamo: tiene efecto (consume intento y toma lease)', async () => {
    const d = build();
    await d.jobRunner.tick();
    // Sin `idempotent: true`, `SystemApiClient` no reintenta este POST.
    expect(callsTo(d.api, '/jobs/claim')[0][2]).toBeUndefined();
  });

  it('reporta un fallo del proveedor con su código y su clasificación', async () => {
    const d = build();
    d.api.post.mockImplementation(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [job], skipped: 0 } : {},
    );
    d.tts.synthesize.mockRejectedValue(
      new TtsProviderError('429', 'ELEVENLABS_HTTP_429', true),
    );

    await d.jobRunner.tick();

    expect(callsTo(d.api, '/fail')[0][1]).toEqual({
      code: 'ELEVENLABS_HTTP_429',
      retryable: true,
    });
    expect(callsTo(d.api, '/complete')).toHaveLength(0);
  });

  it('clasifica como transitorio un error desconocido', async () => {
    // El techo de intentos del asset acaba cerrándolo de todas formas; al revés,
    // un ECONNRESET durante un despliegue lo quemaría para siempre.
    const d = build();
    d.api.post.mockImplementation(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [job], skipped: 0 } : {},
    );
    d.storage.store.mockRejectedValue(new Error('disco lleno'));

    await d.jobRunner.tick();

    expect(callsTo(d.api, '/fail')[0][1]).toMatchObject({ retryable: true });
  });

  it('un trabajo fallido no impide procesar el resto del lote', async () => {
    const d = build();
    const second = { ...job, assetId: '00000000-0000-4000-8000-000000000002' };
    d.api.post.mockImplementation(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [job, second], skipped: 0 } : {},
    );
    d.tts.synthesize
      .mockRejectedValueOnce(
        new TtsProviderError('x', 'ELEVENLABS_TIMEOUT', true),
      )
      .mockResolvedValue({
        audio: MP3,
        mimeType: 'audio/mpeg',
        provider: 'elevenlabs',
        model: 'eleven_v3',
        usageUnits: 18,
        usageIsReported: false,
        durationMs: 5,
      });

    await d.jobRunner.tick();

    expect(callsTo(d.api, '/fail')).toHaveLength(1);
    expect(callsTo(d.api, '/complete')).toHaveLength(1);
  });

  it('registra —sin propagar— un fallo al reportar el fallo', async () => {
    // Propagar dejaría el asset en GENERATING hasta que expire su lease, que es el
    // mismo estado en el que quedaría igual; lo que no puede pasar es que el fallo
    // al reportar oculte el original.
    const d = build();
    d.api.post.mockImplementation(async (path: string) => {
      if (path.endsWith('/jobs/claim')) return { jobs: [job], skipped: 0 };
      throw new Error('API caída');
    });
    d.tts.synthesize.mockRejectedValue(
      new TtsProviderError('x', 'ELEVENLABS_TIMEOUT', true),
    );

    await expect(d.jobRunner.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('avisa cuando el reclamo cerró assets sin generarlos', async () => {
    const d = build();
    d.api.post.mockImplementation(async (path: string) =>
      path.endsWith('/jobs/claim') ? { jobs: [], skipped: 3 } : {},
    );
    await d.jobRunner.tick();
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('absorbe un fallo del reclamo para no tumbar el scheduler', async () => {
    const d = build();
    d.api.post.mockRejectedValue(new Error('API caída'));
    await expect(d.jobRunner.tick()).resolves.toBeUndefined();
  });
});
