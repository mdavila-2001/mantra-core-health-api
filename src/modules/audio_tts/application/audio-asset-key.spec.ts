import {
  buildAudioAssetKey,
  normalizeAudioText,
  type AudioAssetIdentity,
} from './audio-asset-key';

const base: AudioAssetIdentity = {
  templateCode: 'onboarding.welcome.named',
  templateVersion: 1,
  renderedText: 'Bienvenido, María.',
  language: 'es-419',
  provider: 'elevenlabs',
  model: 'eleven_v3',
  voiceProfile: 'brand_es_latam_v1',
  voiceVersion: 1,
  providerVoiceRef: 'voice-1',
  outputFormat: 'mp3_44100_128',
  sampleRate: 44_100,
};

describe('audio-asset-key', () => {
  it('normaliza forma Unicode y espacios antes de la huella', () => {
    expect(normalizeAudioText('  Hola   mundo\n')).toBe('Hola mundo');
    // NFKC: la misma letra compuesta y descompuesta debe dar el mismo texto, o el
    // mismo audio se pagaría dos veces.
    expect(normalizeAudioText('María')).toBe(normalizeAudioText('María'));
  });

  it('es estable para la misma identidad', () => {
    expect(buildAudioAssetKey(base)).toBe(buildAudioAssetKey({ ...base }));
  });

  it('ignora diferencias de espaciado en el texto renderizado', () => {
    expect(
      buildAudioAssetKey({ ...base, renderedText: 'Bienvenido,   María.  ' }),
    ).toBe(buildAudioAssetKey(base));
  });

  it('trata el idioma sin distinguir mayúsculas', () => {
    expect(buildAudioAssetKey({ ...base, language: 'ES-419' })).toBe(
      buildAudioAssetKey(base),
    );
  });

  it.each([
    ['templateVersion', { templateVersion: 2 }],
    ['renderedText', { renderedText: 'Bienvenido, Juan.' }],
    ['language', { language: 'pt-BR' }],
    ['provider', { provider: 'otro' }],
    ['model', { model: 'eleven_v2' }],
    ['voiceProfile', { voiceProfile: 'otra_voz' }],
    ['voiceVersion', { voiceVersion: 2 }],
    ['providerVoiceRef', { providerVoiceRef: 'voice-2' }],
    ['outputFormat', { outputFormat: 'wav_44100' }],
    ['sampleRate', { sampleRate: 22_050 }],
  ] as const)('cambia la huella cuando cambia %s', (_dimension, override) => {
    expect(buildAudioAssetKey({ ...base, ...override })).not.toBe(
      buildAudioAssetKey(base),
    );
  });

  it('separa los assets por tenant', () => {
    // Es lo que impide que dos tenants compartan el audio del nombre de una
    // persona: sin el tenant en la huella, un acierto de caché revelaría que ese
    // nombre existe en el otro tenant.
    const a = buildAudioAssetKey({ ...base, tenantId: 'tenant-a' });
    const b = buildAudioAssetKey({ ...base, tenantId: 'tenant-b' });
    const shared = buildAudioAssetKey(base);
    expect(new Set([a, b, shared]).size).toBe(3);
  });
});
