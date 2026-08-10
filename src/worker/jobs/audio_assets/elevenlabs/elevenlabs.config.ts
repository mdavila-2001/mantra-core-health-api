import { loadAudioEnv } from '../../../../modules/audio_assets/audio.env';
export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  httpMaxRetries: number;
  retryBaseMs: number;
}
export function loadElevenLabsConfig(): ElevenLabsConfig {
  const env = loadAudioEnv();
  if (
    env.enabled &&
    env.provider === 'elevenlabs' &&
    (!env.elevenLabsApiKey || !env.providerVoiceRef)
  ) {
    throw new Error(
      'ElevenLabs habilitado requiere ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID en el worker',
    );
  }
  return {
    apiKey: env.elevenLabsApiKey,
    baseUrl: env.elevenLabsBaseUrl.replace(/\/+$/u, ''),
    timeoutMs: env.requestTimeoutMs,
    httpMaxRetries: env.httpMaxRetries,
    retryBaseMs: env.retryBaseMs,
  };
}
