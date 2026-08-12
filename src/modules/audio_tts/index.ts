export { AudioTtsModule } from './audio-tts.module';
export { AudioAssetResolver, AudioPlaybackService } from './services';
export * from './domain';
export {
  audioTtsEnvSchema,
  loadAudioTtsConfig,
  assertAudioTtsEnvCoherent,
  AUDIO_TTS_PROVIDERS,
  AUDIO_STORAGE_DRIVERS,
  PUBLISHED_DEV_DATA_KEY,
} from './config/audio-tts.env';
export type {
  AudioTtsConfig,
  AudioTtsProviderName,
  AudioStorageDriver,
} from './config/audio-tts.env';
export { AudioStorageModule } from './storage';
