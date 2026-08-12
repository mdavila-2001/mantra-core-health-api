import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AudioAssetResolver } from './audio-asset-resolver.service';
import { AUDIO_ERROR } from '../domain/audio.errors';
import { runWithTenant } from '../../../common';
import type { AudioTtsConfig } from '../config/audio-tts.env';

const TENANT = '11111111-1111-1111-1111-111111111111';

const DYNAMIC_TEMPLATE = {
  code: 'onboarding.welcome.named',
  version: 1,
  strategy: 'DYNAMIC' as const,
  templateText: 'Bienvenido, {{name}}.',
  language: 'es-419',
  fallbackTemplateCode: 'onboarding.fallback.generic',
  isActive: true,
};

const FALLBACK_TEMPLATE = {
  code: 'onboarding.fallback.generic',
  version: 1,
  strategy: 'FALLBACK' as const,
  templateText: 'Bienvenido.',
  language: 'es-419',
  isActive: true,
};

function config(overrides: Partial<AudioTtsConfig> = {}): AudioTtsConfig {
  return {
    nodeEnv: 'test',
    enabled: true,
    provider: 'fake',
    allowRuntimeGeneration: true,
    prodLicenseConfirmed: false,
    defaultLanguage: 'es-419',
    defaultFormat: 'mp3_44100_128',
    sampleRate: 44_100,
    voiceProfile: 'brand_es_latam_v1',
    voiceVersion: 1,
    model: 'eleven_v3',
    globalFallbackTemplate: 'onboarding.fallback.generic',
    maxTextLength: 5000,
    monthlyBudgetUnits: 1000,
    safetyReserveUnits: 0,
    runtimeGenerationsPerActorDay: 3,
    actorLimitUnlimited: false,
    dataKey: 'k'.repeat(32),
    dataKeyId: 'k1',
    dataKeysPrevious: '',
    elevenLabsModelId: '',
    elevenLabsOutputFormat: '',
    elevenLabsVoiceId: '',
    ...overrides,
  } as AudioTtsConfig;
}

function build(overrides: Partial<AudioTtsConfig> = {}) {
  const templates: Record<string, unknown> = {
    [DYNAMIC_TEMPLATE.code]: DYNAMIC_TEMPLATE,
    [FALLBACK_TEMPLATE.code]: FALLBACK_TEMPLATE,
  };
  const assets = {
    findTemplate: mockFn(
      async (_em: unknown, code: string) => templates[code] ?? null,
    ),
    findReadyByAssetKey: mockFn().mockResolvedValue(null),
    findReadyFallback: mockFn().mockResolvedValue(null),
    findById: mockFn().mockResolvedValue(null),
    createPendingIfMissing: mockFn(async (_em: unknown, input: any) => ({
      asset: { ...input, status: 'PENDING' },
      created: true,
    })),
  };
  const quota = {
    reserveBudget: mockFn().mockResolvedValue(true),
    releaseBudget: mockFn().mockResolvedValue(undefined),
    claimActorGeneration: mockFn().mockResolvedValue(true),
    releaseActorGeneration: mockFn().mockResolvedValue(undefined),
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
  const resolver = new AudioAssetResolver(
    config(overrides),
    {} as any,
    assets as any,
    quota as any,
    logger as any,
  );
  return { resolver, assets, quota, logger, templates };
}

describe('AudioAssetResolver', () => {
  describe('resolve', () => {
    it('sirve de caché sin tocar cuota ni crear filas', async () => {
      const d = build();
      d.assets.findReadyByAssetKey.mockResolvedValue({
        id: 'asset-1',
        storageUri: 's3://b/k',
      });

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );

      expect(result).toEqual({
        status: 'READY',
        assetId: 'asset-1',
        storageUri: 's3://b/k',
        cacheHit: true,
      });
      expect(d.quota.reserveBudget).not.toHaveBeenCalled();
      expect(d.assets.createPendingIfMissing).not.toHaveBeenCalled();
    });

    it('encola el asset con el texto cifrado y el tenant del contexto', async () => {
      const d = build();
      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );

      expect(result).toMatchObject({ status: 'QUEUED', cacheHit: false });
      const input = d.assets.createPendingIfMissing.mock.calls[0][1];
      expect(input.tenantId).toBe(TENANT);
      // El texto nunca se persiste en claro: podría llevar el nombre de un paciente.
      expect(input.renderedTextEncrypted).not.toContain('María');
      expect(input.renderedTextEncrypted.startsWith('v2.k1.')).toBe(true);
      // 18 caracteres de "Bienvenido, María." son las unidades reservadas.
      expect(input.reservedUnits).toBe(18);
    });

    it('devuelve la reserva cuando otra petición ganó la carrera', async () => {
      // Sin esto, cada petición concurrente del mismo audio deja unidades
      // apartadas del presupuesto que nada volvería a liberar.
      const d = build();
      d.assets.createPendingIfMissing.mockResolvedValue({
        asset: { id: 'asset-x', status: 'PENDING' },
        created: false,
      });

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );

      expect(result).toMatchObject({ status: 'QUEUED', assetId: 'asset-x' });
      expect(d.quota.releaseBudget).toHaveBeenCalled();
      expect(d.quota.releaseActorGeneration).toHaveBeenCalled();
    });

    it('sirve el asset ya listo si la carrera la ganó una generación completa', async () => {
      const d = build();
      d.assets.createPendingIfMissing.mockResolvedValue({
        asset: { id: 'asset-x', status: 'READY', storageUri: 's3://b/x' },
        created: false,
      });

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );
      expect(result).toMatchObject({ status: 'READY', cacheHit: true });
    });

    it('degrada a FALLBACK cuando el presupuesto está agotado', async () => {
      const d = build();
      d.quota.reserveBudget.mockResolvedValue(false);
      d.assets.findReadyFallback.mockResolvedValue({
        id: 'fb-1',
        storageUri: 's3://b/fb',
      });

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );

      expect(result).toEqual({
        status: 'FALLBACK',
        assetId: 'fb-1',
        storageUri: 's3://b/fb',
        reason: 'MONTHLY_BUDGET_RESERVED',
      });
    });

    it('degrada a UNAVAILABLE si el fallback no está pre-generado', async () => {
      const d = build();
      d.quota.reserveBudget.mockResolvedValue(false);
      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );
      expect(result).toEqual({
        status: 'UNAVAILABLE',
        reason: 'MONTHLY_BUDGET_RESERVED',
      });
    });

    it('no sirve como degradación una plantilla que no es FALLBACK', async () => {
      // Podría llevar variables, y se serviría un texto a medio renderizar.
      const d = build();
      d.quota.reserveBudget.mockResolvedValue(false);
      d.templates[FALLBACK_TEMPLATE.code] = {
        ...FALLBACK_TEMPLATE,
        strategy: 'STATIC',
      };

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );
      expect(result).toMatchObject({ status: 'UNAVAILABLE' });
      expect(d.assets.findReadyFallback).not.toHaveBeenCalled();
    });

    it('no convierte un fallo al degradar en una excepción para el llamador', async () => {
      const d = build();
      d.quota.reserveBudget.mockResolvedValue(false);
      d.assets.findReadyFallback.mockRejectedValue(new Error('base caída'));

      const result = await runWithTenant(TENANT, () =>
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
          actorId: 'actor-1',
        }),
      );
      expect(result).toMatchObject({ status: 'UNAVAILABLE' });
    });

    it('exige tenant en contexto para una plantilla dinámica', async () => {
      // Cachear en el ámbito compartido el audio del nombre de una persona sería
      // una filtración silenciosa entre tenants; se prefiere fallar visible.
      const d = build();
      await expect(
        d.resolver.resolve({
          templateCode: DYNAMIC_TEMPLATE.code,
          variables: { name: 'María' },
        }),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.tenantRequired });
    });

    it('rechaza una plantilla inexistente o desactivada', async () => {
      const d = build();
      await expect(
        d.resolver.resolve({ templateCode: 'no.existe' }),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.templateNotFound });

      d.templates[DYNAMIC_TEMPLATE.code] = {
        ...DYNAMIC_TEMPLATE,
        isActive: false,
      };
      await expect(
        runWithTenant(TENANT, () =>
          d.resolver.resolve({
            templateCode: DYNAMIC_TEMPLATE.code,
            variables: { name: 'María' },
          }),
        ),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.templateNotFound });
    });

    it('rechaza una solicitud que no valida antes de tocar la base', async () => {
      const d = build();
      await expect(
        d.resolver.resolve({ templateCode: 'MAYÚSCULAS' }),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.requestInvalid });
      expect(d.assets.findTemplate).not.toHaveBeenCalled();
    });
  });

  describe('prewarm', () => {
    it('pre-genera una plantilla sin variables y sin tenant', async () => {
      const d = build();
      const result = await d.resolver.prewarm(FALLBACK_TEMPLATE.code);
      expect(result).toMatchObject({ status: 'QUEUED' });
      // Los audios sin variables se comparten: un solo asset para toda la plataforma.
      expect(
        d.assets.createPendingIfMissing.mock.calls[0][1].tenantId,
      ).toBeUndefined();
    });

    it('funciona con la generación en caliente cerrada', async () => {
      const d = build({ allowRuntimeGeneration: false });
      await expect(
        d.resolver.prewarm(FALLBACK_TEMPLATE.code),
      ).resolves.toMatchObject({
        status: 'QUEUED',
      });
    });

    it('rechaza pre-generar una plantilla con variables', async () => {
      const d = build();
      await expect(
        d.resolver.prewarm(DYNAMIC_TEMPLATE.code),
      ).rejects.toMatchObject({
        audioCode: AUDIO_ERROR.prewarmDynamic,
      });
    });
  });

  describe('findAsset', () => {
    it('oculta con 404 un asset de otro tenant', async () => {
      // Un 403 confirmaría que el identificador es válido.
      const d = build();
      d.assets.findById.mockResolvedValue({
        id: 'asset-1',
        status: 'READY',
        templateCode: DYNAMIC_TEMPLATE.code,
        tenantId: '22222222-2222-2222-2222-222222222222',
      });
      await expect(
        runWithTenant(TENANT, () => d.resolver.findAsset('asset-1')),
      ).rejects.toMatchObject({ audioCode: AUDIO_ERROR.assetNotFound });
    });

    it('devuelve el asset compartido a cualquier tenant', async () => {
      const d = build();
      d.assets.findById.mockResolvedValue({
        id: 'asset-1',
        status: 'READY',
        templateCode: FALLBACK_TEMPLATE.code,
        storageUri: 's3://b/k',
      });
      await expect(
        runWithTenant(TENANT, () => d.resolver.findAsset('asset-1')),
      ).resolves.toMatchObject({ assetId: 'asset-1', status: 'READY' });
    });
  });
});
