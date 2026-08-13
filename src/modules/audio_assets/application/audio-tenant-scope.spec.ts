import { jest } from '@jest/globals';
import { runWithTenant, type AuthenticatedUser } from '../../../common';
import {
  buildAudioAssetKey,
  buildAudioSynthesisFingerprint,
} from '../domain/audio-asset-key';
import type { AudioDynamicField } from '../domain/audio.types';
import { requiresTenantScope } from './audio-asset-resolution.mapper';
import { ResolveAudioAssetUseCase } from './resolve-audio-asset.use-case';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

const profile = {
  provider: 'fake',
  providerModel: 'fake-model',
  language: 'es-419',
  voiceProfile: 'brand_es_latam_v1',
  providerVoiceRef: 'voice-1',
  voiceVersion: 1,
  audioFormat: 'mp3_44100_128',
  sampleRate: 44_100,
  normalizerVersion: 1,
};

const NAME_FIELD: AudioDynamicField = {
  name: 'name',
  type: 'PERSON_NAME',
  required: true,
};

/**
 * Aislamiento de la caché entre tenants.
 *
 * El riesgo que cubren estas pruebas es concreto: el texto renderizado de una
 * plantilla dinámica puede llevar el nombre de un paciente, y si la fila se
 * comparte entre tenants, un acierto de caché es la prueba de que ese nombre
 * existe en el otro tenant. No hace falta leer el audio para filtrar el dato.
 */
describe('alcance por tenant de la caché de audio', () => {
  describe('requiresTenantScope', () => {
    it('acota cuando el render sustituyó el nombre de una persona', () => {
      expect(requiresTenantScope([NAME_FIELD], { name: 'maría' })).toBe(true);
    });

    it('acota también con texto libre: ninguna lista blanca lo hace anónimo', () => {
      const free: AudioDynamicField = {
        name: 'nota',
        type: 'SAFE_TEXT',
        required: false,
      };
      expect(requiresTenantScope([free], { nota: 'lo que sea' })).toBe(true);
    });

    it('comparte los enumerados: son un conjunto cerrado, no identifican a nadie', () => {
      const enumerated: AudioDynamicField = {
        name: 'turno',
        type: 'ENUM',
        required: true,
        allowedValues: ['mañana', 'tarde'],
      };
      expect(requiresTenantScope([enumerated], { turno: 'mañana' })).toBe(
        false,
      );
    });

    it('comparte cuando la plantilla no tiene campos dinámicos', () => {
      expect(requiresTenantScope([], {})).toBe(false);
    });

    it('comparte si el campo está declarado pero el render no lo sustituyó', () => {
      expect(requiresTenantScope([NAME_FIELD], {})).toBe(false);
    });
  });

  describe('identidad del asset', () => {
    const base = {
      ...profile,
      templateId: 'onboarding.welcome.named',
      templateVersion: 1,
      normalizedText: 'hola, maría.',
      variant: 'PRIMARY' as const,
    };

    it('da claves distintas a dos tenants con el mismo texto', () => {
      const a = buildAudioAssetKey({ ...base, tenantId: TENANT_A });
      const b = buildAudioAssetKey({ ...base, tenantId: TENANT_B });
      const shared = buildAudioAssetKey(base);
      expect(new Set([a, b, shared]).size).toBe(3);
    });

    it('mantiene estable la clave del audio compartido', () => {
      expect(buildAudioAssetKey(base)).toBe(
        buildAudioAssetKey({ ...base, tenantId: undefined }),
      );
    });

    it('separa también la huella de reutilización de binario', () => {
      // Cerrar la puerta de la clave y dejar abierta la del binario reutilizable
      // no aislaría nada: el audio de otro tenant se serviría igual.
      const withText = { ...profile, normalizedText: 'hola, maría.' };
      expect(
        buildAudioSynthesisFingerprint({ ...withText, tenantId: TENANT_A }),
      ).not.toBe(
        buildAudioSynthesisFingerprint({ ...withText, tenantId: TENANT_B }),
      );
    });
  });

  describe('ResolveAudioAssetUseCase', () => {
    const actor = { id: 'actor-1', roles: [] } as unknown as AuthenticatedUser;

    function build(fields: AudioDynamicField[], textTemplate: string) {
      const template = {
        id: 't1',
        templateKey: 'onboarding.welcome.named',
        version: 1,
        strategy: fields.length ? 'CACHED_DYNAMIC' : 'STATIC',
        language: 'es-419',
        textTemplate,
        fallbackText: undefined,
        dynamicFieldsJson: fields,
        voiceProfile: 'brand_es_latam_v1',
        enabled: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const created: any[] = [];
      const repository: any = {
        findTemplate: jest.fn(async () => template),
        dynamicFields: jest.fn(() => fields),
        findAssetByKey: jest.fn(async () => null),
        findReusableReady: jest.fn(async () => null),
        createPendingOrGet: jest.fn(async (input: any) => {
          created.push(input);
          return {
            id: `asset-${created.length}`,
            assetKey: input.assetKey,
            templateKey: input.templateKey,
            templateVersion: 1,
            generationStatus: 'PENDING',
            provider: input.provider,
          };
        }),
        appendEvent: jest.fn(async () => undefined),
        touchUsage: jest.fn(async () => undefined),
      };
      const useCase = new ResolveAudioAssetUseCase(
        repository,
        { canGenerate: jest.fn(async () => ({ allowed: true })) } as any,
        { encrypt: jest.fn((t: string) => `enc:${t}`) } as any,
        { enqueue: jest.fn(async () => 'job-1') } as any,
        {
          cacheHit: jest.fn(),
          fallback: jest.fn(),
          budgetDenied: jest.fn(),
        } as any,
        {
          runInSpan: jest.fn(async (_n: string, _a: unknown, fn: any) => fn()),
          addEvent: jest.fn(),
        } as any,
      );
      return { useCase, repository, created };
    }

    beforeEach(() => {
      process.env.AUDIO_TTS_ENABLED = 'true';
      process.env.AUDIO_TTS_PROVIDER = 'fake';
      process.env.AUDIO_TTS_ALLOW_RUNTIME_GENERATION = 'true';
      process.env.AUDIO_TTS_VOICE_PROFILE = 'brand_es_latam_v1';
      process.env.AUDIO_TTS_DATA_KEY =
        'test-audio-data-key-012345678901234567890123';
    });

    it('el mismo nombre en dos tenants produce dos assets distintos', async () => {
      const d = build([NAME_FIELD], 'Hola, {{name}}.');

      await runWithTenant(TENANT_A, () =>
        d.useCase.execute(
          {
            templateKey: 'onboarding.welcome.named',
            variables: { name: 'María' },
          },
          actor,
        ),
      );
      await runWithTenant(TENANT_B, () =>
        d.useCase.execute(
          {
            templateKey: 'onboarding.welcome.named',
            variables: { name: 'María' },
          },
          actor,
        ),
      );

      expect(d.created).toHaveLength(2);
      expect(d.created[0].tenantId).toBe(TENANT_A);
      expect(d.created[1].tenantId).toBe(TENANT_B);
      expect(d.created[0].assetKey).not.toBe(d.created[1].assetKey);
      // Y la búsqueda de binario reutilizable se hizo con el alcance de cada uno.
      expect(
        d.repository.findReusableReady.mock.calls.map((c: any[]) => c[2]),
      ).toEqual(expect.arrayContaining([TENANT_A, TENANT_B]));
    });

    it('un audio sin datos de nadie se comparte entre tenants', async () => {
      const d = build([], 'Bienvenido.');

      await runWithTenant(TENANT_A, () =>
        d.useCase.execute({ templateKey: 'onboarding.welcome.named' }, actor),
      );
      await runWithTenant(TENANT_B, () =>
        d.useCase.execute({ templateKey: 'onboarding.welcome.named' }, actor),
      );

      expect(d.created[0].tenantId).toBeUndefined();
      // Misma clave: el segundo tenant reutiliza el asset del primero, que es lo
      // que permite pre-generar el catálogo una sola vez para toda la plataforma.
      expect(d.created[0].assetKey).toBe(d.created[1].assetKey);
    });
  });
});
