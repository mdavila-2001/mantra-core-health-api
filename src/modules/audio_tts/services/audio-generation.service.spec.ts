import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AudioGenerationService } from './audio-generation.service';
import { AUDIO_ERROR } from '../domain/audio.errors';
import { AudioValueCipher } from '../application/audio-value-cipher';
import type { AudioTtsConfig } from '../config/audio-tts.env';

const DATA_KEY = 'k'.repeat(32);
const ASSET_KEY = 'asset-key-1';

function config(overrides: Partial<AudioTtsConfig> = {}): AudioTtsConfig {
  return {
    nodeEnv: 'test',
    provider: 'elevenlabs',
    enabled: true,
    allowRuntimeGeneration: true,
    prodLicenseConfirmed: false,
    monthlyBudgetUnits: 1000,
    safetyReserveUnits: 0,
    runtimeGenerationsPerActorDay: 3,
    actorLimitUnlimited: false,
    dataKey: DATA_KEY,
    dataKeyId: 'k1',
    dataKeysPrevious: '',
    leaseSeconds: 300,
    maxAttempts: 4,
    batchSize: 2,
    retryDelaySeconds: 30,
    ...overrides,
  } as AudioTtsConfig;
}

/** Asset reclamado tal como lo devuelve el repositorio, con su texto cifrado. */
function claimedAsset(overrides: Record<string, unknown> = {}) {
  const cipher = new AudioValueCipher({ id: 'k1', secret: DATA_KEY });
  return {
    id: 'asset-1',
    assetKey: ASSET_KEY,
    renderedTextEncrypted: cipher.encrypt('Bienvenido, María.', ASSET_KEY),
    language: 'es-419',
    providerVoiceRef: 'voice-1',
    providerModel: 'eleven_v3',
    outputFormat: 'mp3_44100_128',
    sampleRate: 44_100,
    attempts: 1,
    reservedUnits: 18,
    provider: 'elevenlabs',
    createdAt: new Date('2026-07-31T23:59:00.000Z'),
    correlationId: 'corr-1',
    status: 'GENERATING',
    ...overrides,
  };
}

function build(overrides: Partial<AudioTtsConfig> = {}) {
  const assets = {
    claimBatch: mockFn().mockResolvedValue([]),
    markReady: mockFn().mockResolvedValue({
      firstTime: true,
      reservedUnits: 18,
    }),
    markFailed: mockFn().mockResolvedValue(undefined),
    findById: mockFn().mockResolvedValue(null),
    releaseReservation: mockFn().mockResolvedValue(0),
  };
  const quota = {
    settleBudget: mockFn().mockResolvedValue(undefined),
    releaseBudget: mockFn().mockResolvedValue(undefined),
    readBudget: mockFn().mockResolvedValue({
      reservedUnits: 0,
      settledUnits: 0,
    }),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    debug: mockFn(),
  };
  const service = new AudioGenerationService(
    config(overrides),
    {} as any,
    assets as any,
    quota as any,
    logger as any,
  );
  return { service, assets, quota, logger };
}

describe('AudioGenerationService', () => {
  describe('claim', () => {
    it('entrega el trabajo con el texto ya descifrado', async () => {
      const d = build();
      d.assets.claimBatch.mockResolvedValue([claimedAsset()]);

      const result = await d.service.claim('worker-1');

      expect(result.skipped).toBe(0);
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0]).toMatchObject({
        assetId: 'asset-1',
        text: 'Bienvenido, María.',
        model: 'eleven_v3',
        attempts: 1,
        correlationId: 'corr-1',
      });
    });

    it('acota el lote al configurado aunque el worker pida más', async () => {
      const d = build({ batchSize: 2 });
      await d.service.claim('worker-1', 50);
      expect(d.assets.claimBatch.mock.calls[0][1]).toMatchObject({
        limit: 2,
        maxAttempts: 4,
        leaseSeconds: 300,
        claimedBy: 'worker-1',
      });
    });

    it('cierra el asset y devuelve su reserva si el presupuesto se agotó mientras esperaba', async () => {
      // Es la última oportunidad de no hacer la única llamada que ya no se puede
      // deshacer: entre la reserva y la generación pueden pasar horas.
      const d = build();
      d.assets.claimBatch.mockResolvedValue([claimedAsset()]);
      d.quota.readBudget.mockResolvedValue({
        reservedUnits: 0,
        settledUnits: 1000,
      });
      d.assets.findById.mockResolvedValue(claimedAsset());
      d.assets.releaseReservation.mockResolvedValue(18);

      const result = await d.service.claim('worker-1');

      expect(result).toMatchObject({ jobs: [], skipped: 1 });
      expect(d.assets.markFailed).toHaveBeenCalledWith(
        {},
        'asset-1',
        AUDIO_ERROR.budgetExhaustedAtGeneration,
        false,
        0,
      );
      // La ventana es la del ALTA del asset (julio), no la del mes en curso.
      expect(d.quota.releaseBudget).toHaveBeenCalledWith(
        {},
        { provider: 'elevenlabs', monthKey: '2026-07' },
        18,
      );
    });

    it('cierra de forma permanente un asset cuyo texto ya no se puede descifrar', async () => {
      // Clave rotada sin conservar la anterior: reintentarlo no lo arregla y cada
      // intento vuelve a reclamarlo.
      const d = build();
      d.assets.claimBatch.mockResolvedValue([
        claimedAsset({ renderedTextEncrypted: 'v2.k9.aaa.bbb.ccc' }),
      ]);
      d.assets.findById.mockResolvedValue(claimedAsset());

      const result = await d.service.claim('worker-1');

      expect(result).toMatchObject({ jobs: [], skipped: 1 });
      expect(d.assets.markFailed).toHaveBeenCalledWith(
        {},
        'asset-1',
        AUDIO_ERROR.cipherAuthFailed,
        false,
        0,
      );
    });

    it('no falla el lote entero por un asset ilegible', async () => {
      const d = build({ batchSize: 2 });
      d.assets.claimBatch.mockResolvedValue([
        claimedAsset({ id: 'bad', renderedTextEncrypted: 'basura' }),
        claimedAsset({ id: 'good' }),
      ]);
      d.assets.findById.mockResolvedValue(claimedAsset());

      const result = await d.service.claim('worker-1');
      expect(result.skipped).toBe(1);
      expect(result.jobs.map((j) => j.assetId)).toEqual(['good']);
    });
  });

  describe('complete', () => {
    const outcome = {
      storageUri: 's3://b/k',
      mimeType: 'audio/mpeg',
      checksumSha256: 'a'.repeat(64),
      bytes: 2048,
      usageUnits: 20,
      provider: 'elevenlabs',
    };

    it('liquida la reserva con las unidades apartadas y el consumo real', async () => {
      const d = build();
      await expect(d.service.complete('asset-1', outcome)).resolves.toEqual({
        applied: true,
      });
      expect(d.quota.settleBudget).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ provider: 'elevenlabs' }),
        18, // reservado al autorizar
        20, // consumido de verdad
      );
    });

    it('no vuelve a imputar consumo en un reporte duplicado', async () => {
      // Cualquier mecanismo de reintento entrega al menos una vez.
      const d = build();
      d.assets.markReady.mockResolvedValue({
        firstTime: false,
        reservedUnits: 0,
      });
      await expect(d.service.complete('asset-1', outcome)).resolves.toEqual({
        applied: false,
      });
      expect(d.quota.settleBudget).not.toHaveBeenCalled();
    });
  });

  describe('fail', () => {
    it('mantiene reintentable un fallo transitorio con intentos disponibles', async () => {
      const d = build();
      d.assets.findById.mockResolvedValue(claimedAsset({ attempts: 1 }));

      await expect(
        d.service.fail('asset-1', {
          code: 'ELEVENLABS_HTTP_429',
          retryable: true,
        }),
      ).resolves.toEqual({ status: 'FAILED_RETRYABLE' });

      expect(d.assets.markFailed).toHaveBeenCalledWith(
        {},
        'asset-1',
        'ELEVENLABS_HTTP_429',
        true,
        30, // espera antes del siguiente intento
      );
      expect(d.assets.releaseReservation).not.toHaveBeenCalled();
    });

    it('convierte en permanente un fallo transitorio que agotó los intentos', async () => {
      const d = build({ maxAttempts: 4 });
      d.assets.findById.mockResolvedValue(claimedAsset({ attempts: 4 }));
      d.assets.releaseReservation.mockResolvedValue(18);

      await expect(
        d.service.fail('asset-1', {
          code: 'ELEVENLABS_TIMEOUT',
          retryable: true,
        }),
      ).resolves.toEqual({ status: 'FAILED_PERMANENT' });

      // Y devuelve la reserva sin esperar al barrido: si no, un error de
      // configuración consumiría presupuesto del mes sin generar nada.
      expect(d.quota.releaseBudget).toHaveBeenCalledWith(
        {},
        { provider: 'elevenlabs', monthKey: '2026-07' },
        18,
      );
    });

    it('cierra de inmediato un fallo no reintentable', async () => {
      const d = build();
      d.assets.findById.mockResolvedValue(claimedAsset({ attempts: 1 }));
      d.assets.releaseReservation.mockResolvedValue(18);

      await expect(
        d.service.fail('asset-1', {
          code: 'ELEVENLABS_HTTP_401',
          retryable: false,
        }),
      ).resolves.toEqual({ status: 'FAILED_PERMANENT' });
      expect(d.quota.releaseBudget).toHaveBeenCalled();
    });

    it('no devuelve presupuesto dos veces por el mismo asset', async () => {
      // `releaseReservation` pone la reserva a cero en la misma sentencia que la
      // lee, así que el segundo camino lee 0 y no devuelve nada.
      const d = build();
      d.assets.findById.mockResolvedValue(claimedAsset({ attempts: 1 }));
      d.assets.releaseReservation.mockResolvedValue(0);

      await d.service.fail('asset-1', { code: 'X', retryable: false });
      expect(d.quota.releaseBudget).not.toHaveBeenCalled();
    });

    it('rechaza un reporte sobre un asset inexistente', async () => {
      const d = build();
      await expect(
        d.service.fail('asset-x', { code: 'X', retryable: true }),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.assetNotFound });
    });
  });
});
