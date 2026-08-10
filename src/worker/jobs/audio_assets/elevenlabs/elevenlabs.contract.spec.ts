import { ElevenLabsHttpClient } from './elevenlabs-http.client';

const runContract =
  process.env.RUN_ELEVENLABS_CONTRACT_TESTS === 'true'
    ? describe
    : describe.skip;

runContract('ElevenLabs contract', () => {
  it('devuelve bytes para una síntesis mínima con credenciales explícitas', async () => {
    const client = new ElevenLabsHttpClient();
    const result = await client.synthesize({
      text: 'Hola.',
      language: 'es-419',
      voiceProfile: process.env.AUDIO_TTS_VOICE_PROFILE ?? 'brand_es_latam_v1',
      providerVoiceRef: process.env.ELEVENLABS_VOICE_ID ?? '',
      model: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_v3',
      outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT ?? 'mp3_44100_128',
      sampleRate: 44100,
      requestId: 'contract-test',
    });
    expect(result.audio.byteLength).toBeGreaterThan(0);
  });
});
