import {
  renderIdentityOf,
  resolveAudioIdentity,
  shouldScopeByTenant,
} from './audio-identity';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type { AudioTemplateRecord } from '../domain/audio.types';

function config(overrides: Partial<AudioTtsConfig> = {}): AudioTtsConfig {
  return {
    provider: 'elevenlabs',
    defaultLanguage: 'es-419',
    defaultFormat: 'mp3_44100_128',
    sampleRate: 44_100,
    voiceProfile: 'brand_es_latam_v1',
    voiceVersion: 1,
    model: 'eleven_v3',
    elevenLabsVoiceId: 'voice-1',
    elevenLabsModelId: '',
    elevenLabsOutputFormat: '',
    ...overrides,
  } as AudioTtsConfig;
}

const template: AudioTemplateRecord = {
  code: 'onboarding.welcome.named',
  version: 1,
  strategy: 'DYNAMIC',
  templateText: 'Bienvenido, {{name}}.',
  language: 'pt-BR',
  isActive: true,
};

describe('audio-identity', () => {
  it('toma la voz del proveedor activo', () => {
    expect(renderIdentityOf(config(), template).providerVoiceRef).toBe(
      'voice-1',
    );
    expect(
      renderIdentityOf(config({ provider: 'fake' }), template).providerVoiceRef,
    ).toBe('fake-default');
    expect(
      renderIdentityOf(config({ provider: 'disabled' }), template)
        .providerVoiceRef,
    ).toBe('');
  });

  it('prefiere el idioma explícito, luego el de la plantilla y luego el global', () => {
    expect(renderIdentityOf(config(), template, 'es-MX').language).toBe(
      'es-mx',
    );
    expect(renderIdentityOf(config(), template).language).toBe('pt-br');
    expect(
      renderIdentityOf(config(), { ...template, language: undefined }).language,
    ).toBe('es-419');
  });

  it('deja que el nombre de modelo y formato del proveedor pisen los genéricos', () => {
    const identity = renderIdentityOf(
      config({
        elevenLabsModelId: 'eleven_turbo',
        elevenLabsOutputFormat: 'wav_44100',
      }),
      template,
    );
    expect(identity.model).toBe('eleven_turbo');
    expect(identity.providerModel).toBe('eleven_turbo');
    expect(identity.outputFormat).toBe('wav_44100');
  });

  it('incluye el tenant en la clave cuando se le pasa', () => {
    const withTenant = resolveAudioIdentity(
      config(),
      template,
      'Hola',
      undefined,
      't1',
    );
    const shared = resolveAudioIdentity(config(), template, 'Hola');
    expect(withTenant.assetKey).not.toBe(shared.assetKey);
  });

  it('acota por tenant solo las plantillas dinámicas', () => {
    // La decisión va por la estrategia declarada y no por si el render de hoy
    // sustituyó algo: una DYNAMIC puede llevar un nombre mañana.
    expect(shouldScopeByTenant(template)).toBe(true);
    expect(shouldScopeByTenant({ ...template, strategy: 'STATIC' })).toBe(
      false,
    );
    expect(shouldScopeByTenant({ ...template, strategy: 'FALLBACK' })).toBe(
      false,
    );
  });
});
