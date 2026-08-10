import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../../common';
import { loadAudioEnv } from '../../../modules/audio_assets/audio.env';
import { TTS_PROVIDER } from '../../../modules/audio_assets/domain/tts-provider.port';
import { QueueJob } from '../messaging/queue.job';
import { AudioGenerationJob } from './audio-generation.job';
import { DisabledTtsAdapter } from './disabled-tts.adapter';
import { ElevenLabsHttpClient } from './elevenlabs/elevenlabs-http.client';
import { ElevenLabsTtsAdapter } from './elevenlabs/elevenlabs-tts.adapter';

@Module({
  imports: [FileStorageModule],
  providers: [
    QueueJob, AudioGenerationJob, DisabledTtsAdapter, ElevenLabsHttpClient, ElevenLabsTtsAdapter,
    {
      provide: TTS_PROVIDER,
      inject: [DisabledTtsAdapter, ElevenLabsTtsAdapter],
      useFactory: (disabled: DisabledTtsAdapter, elevenLabs: ElevenLabsTtsAdapter) => {
        switch (loadAudioEnv().provider) {
          case 'disabled': return disabled;
          case 'elevenlabs': return elevenLabs;
          default: throw new Error('AUDIO_TTS_PROVIDER no soportado');
        }
      },
    },
  ],
})
export class AudioAssetsWorkerModule {}
