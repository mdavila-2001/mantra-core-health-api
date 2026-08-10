import * as Joi from 'joi';

export const AUDIO_TTS_PROVIDERS = ['disabled', 'elevenlabs'] as const;
export type AudioTtsProviderName = (typeof AUDIO_TTS_PROVIDERS)[number];

export const audioEnvSchema = Joi.object({
  AUDIO_TTS_ENABLED: Joi.boolean().default(false),
  AUDIO_TTS_PROVIDER: Joi.string().valid(...AUDIO_TTS_PROVIDERS).default('disabled'),
  AUDIO_TTS_DEFAULT_LANGUAGE: Joi.string().max(20).default('es-419'),
  AUDIO_TTS_DEFAULT_FORMAT: Joi.string().max(40).default('mp3_44100_128'),
  AUDIO_TTS_SAMPLE_RATE: Joi.number().integer().min(8000).max(192000).default(44100),
  AUDIO_TTS_VOICE_PROFILE: Joi.string().max(100).default('brand_es_latam_v1'),
  AUDIO_TTS_VOICE_VERSION: Joi.number().integer().min(1).default(1),
  AUDIO_TTS_MODEL: Joi.string().max(128).default('eleven_v3'),
  AUDIO_TTS_ALLOW_RUNTIME_GENERATION: Joi.boolean().default(false),
  AUDIO_TTS_MONTHLY_BUDGET_UNITS: Joi.number().integer().min(0).default(10000),
  AUDIO_TTS_SAFETY_RESERVE_UNITS: Joi.number().integer().min(0).default(1000),
  AUDIO_TTS_REQUEST_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(10000),
  AUDIO_TTS_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),
  AUDIO_TTS_PROD_LICENSE_CONFIRMED: Joi.boolean().default(false),
  AUDIO_TTS_DATA_KEY: Joi.string().allow('').default(() =>
    process.env.NODE_ENV === 'production' ? '' : 'dev-only-audio-data-key-change-before-production',
  ),
  ELEVENLABS_API_KEY: Joi.string().allow('').default(''),
  ELEVENLABS_BASE_URL: Joi.string().uri().default('https://api.elevenlabs.io'),
  ELEVENLABS_VOICE_ID: Joi.string().max(255).allow('').default(''),
  ELEVENLABS_MODEL_ID: Joi.string().max(128).allow('').default(''),
  ELEVENLABS_OUTPUT_FORMAT: Joi.string().max(64).allow('').default(''),
}).unknown(true);

export interface AudioEnv {
  enabled: boolean;
  provider: AudioTtsProviderName;
  defaultLanguage: string;
  outputFormat: string;
  sampleRate: number;
  voiceProfile: string;
  voiceVersion: number;
  providerModel: string;
  providerVoiceRef: string;
  allowRuntimeGeneration: boolean;
  monthlyBudgetUnits: number;
  safetyReserveUnits: number;
  requestTimeoutMs: number;
  maxRetries: number;
  prodLicenseConfirmed: boolean;
  dataKey: string;
  elevenLabsApiKey: string;
  elevenLabsBaseUrl: string;
}

export function loadAudioEnv(): AudioEnv {
  const provider = (process.env.AUDIO_TTS_PROVIDER ?? 'disabled') as AudioTtsProviderName;
  const dataKey = process.env.AUDIO_TTS_DATA_KEY ??
    (process.env.NODE_ENV === 'production' ? '' : 'dev-only-audio-data-key-change-before-production');
  if (process.env.NODE_ENV === 'production' && dataKey.length < 32) {
    throw new Error('AUDIO_TTS_DATA_KEY (>=32 caracteres) es obligatoria en producción');
  }
  const model =
    provider === 'elevenlabs' && process.env.ELEVENLABS_MODEL_ID
      ? process.env.ELEVENLABS_MODEL_ID
      : process.env.AUDIO_TTS_MODEL ?? 'eleven_v3';
  const format =
    provider === 'elevenlabs' && process.env.ELEVENLABS_OUTPUT_FORMAT
      ? process.env.ELEVENLABS_OUTPUT_FORMAT
      : process.env.AUDIO_TTS_DEFAULT_FORMAT ?? 'mp3_44100_128';
  return {
    enabled: process.env.AUDIO_TTS_ENABLED === 'true',
    provider,
    defaultLanguage: process.env.AUDIO_TTS_DEFAULT_LANGUAGE ?? 'es-419',
    outputFormat: format,
    sampleRate: Number(process.env.AUDIO_TTS_SAMPLE_RATE ?? 44100),
    voiceProfile: process.env.AUDIO_TTS_VOICE_PROFILE ?? 'brand_es_latam_v1',
    voiceVersion: Number(process.env.AUDIO_TTS_VOICE_VERSION ?? 1),
    providerModel: model,
    providerVoiceRef: provider === 'elevenlabs' ? process.env.ELEVENLABS_VOICE_ID ?? '' : '',
    allowRuntimeGeneration: process.env.AUDIO_TTS_ALLOW_RUNTIME_GENERATION === 'true',
    monthlyBudgetUnits: Number(process.env.AUDIO_TTS_MONTHLY_BUDGET_UNITS ?? 10000),
    safetyReserveUnits: Number(process.env.AUDIO_TTS_SAFETY_RESERVE_UNITS ?? 1000),
    requestTimeoutMs: Number(process.env.AUDIO_TTS_REQUEST_TIMEOUT_MS ?? 10000),
    maxRetries: Number(process.env.AUDIO_TTS_MAX_RETRIES ?? 3),
    prodLicenseConfirmed: process.env.AUDIO_TTS_PROD_LICENSE_CONFIRMED === 'true',
    dataKey,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? '',
    elevenLabsBaseUrl: process.env.ELEVENLABS_BASE_URL ?? 'https://api.elevenlabs.io',
  };
}
