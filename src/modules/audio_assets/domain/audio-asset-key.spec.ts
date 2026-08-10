import { buildAudioAssetKey, buildAudioSynthesisFingerprint, normalizeRenderedText } from './audio-asset-key';

const profile = {
  provider: 'elevenlabs', providerModel: 'eleven_v3', language: 'es-419',
  voiceProfile: 'brand_es_latam_v1', providerVoiceRef: 'voice-1', voiceVersion: 1,
  audioFormat: 'mp3_44100_128', sampleRate: 44100, normalizerVersion: 1,
};

describe('audio asset keys', () => {
  it('normaliza Unicode, espacios y mayúsculas antes de hashear', () => {
    expect(normalizeRenderedText('  HOLA   Pablo  ')).toBe('hola pablo');
  });

  it('mantiene asset_key específico por plantilla', () => {
    const base = { ...profile, templateVersion: 1, normalizedText: 'hola', variant: 'PRIMARY' as const };
    expect(buildAudioAssetKey({ ...base, templateId: 'a' }))
      .not.toBe(buildAudioAssetKey({ ...base, templateId: 'b' }));
  });

  it('permite reutilizar síntesis idéntica entre plantillas', () => {
    const a = buildAudioSynthesisFingerprint({ ...profile, normalizedText: 'hola pablo' });
    const b = buildAudioSynthesisFingerprint({ ...profile, normalizedText: 'hola pablo' });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('invalida la identidad cuando cambia la voz o el modelo', () => {
    const base = buildAudioSynthesisFingerprint({ ...profile, normalizedText: 'hola' });
    expect(buildAudioSynthesisFingerprint({ ...profile, voiceVersion: 2, normalizedText: 'hola' })).not.toBe(base);
    expect(buildAudioSynthesisFingerprint({ ...profile, providerModel: 'next-model', normalizedText: 'hola' })).not.toBe(base);
  });
});
