import { loadAudioEnv } from '../../../../modules/audio_assets/audio.env';

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
}

export function loadElevenLabsConfig(): ElevenLabsConfig {
  const env = loadAudioEnv();
  return {
    apiKey: env.elevenLabsApiKey,
    baseUrl: env.elevenLabsBaseUrl.replace(/\/+$/u, ''),
    timeoutMs: env.requestTimeoutMs,
    maxRetries: env.maxRetries,
    retryBaseMs: env.retryBaseMs,
  };
}
