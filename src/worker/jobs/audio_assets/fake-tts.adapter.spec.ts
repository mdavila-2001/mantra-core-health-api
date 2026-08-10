import { FakeTtsAdapter } from './fake-tts.adapter';

const input = {
  text: 'Hola Pablo',
  language: 'es-419',
  voiceProfile: 'brand_es_latam_v1',
  providerVoiceRef: 'fake-default',
  model: 'fake-v1',
  outputFormat: 'mp3_44100_128',
  requestId: 'request-1',
};

describe('FakeTtsAdapter', () => {
  it('es determinista para la misma síntesis', async () => {
    const adapter = new FakeTtsAdapter();
    expect((await adapter.synthesize(input)).audio).toEqual(
      (await adapter.synthesize({ ...input, requestId: 'request-2' })).audio,
    );
  });

  it('cambia cuando cambia texto, voz o modelo', async () => {
    const adapter = new FakeTtsAdapter();
    const base = (await adapter.synthesize(input)).audio;
    expect(
      (await adapter.synthesize({ ...input, text: 'Hola' })).audio,
    ).not.toEqual(base);
    expect(
      (await adapter.synthesize({ ...input, model: 'fake-v2' })).audio,
    ).not.toEqual(base);
  });
});
