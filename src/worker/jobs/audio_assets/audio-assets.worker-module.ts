import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../../common';
import { loadAudioEnv } from '../../../modules/audio_assets/audio.env';
import { TTS_PROVIDER } from '../../../modules/audio_assets/domain/tts-provider.port';
import { QueueJob } from '../messaging/queue.job';
import { AudioGenerationJob } from './audio-generation.job';
import { DisabledTtsAdapter } from './disabled-tts.adapter';
import { ElevenLabsHttpClient } from './elevenlabs/elevenlabs-http.client';
import { ElevenLabsTtsAdapter } from './elevenlabs/elevenlabs-tts.adapter';
import { FakeTtsAdapter } from './fake-tts.adapter';
import { AudioMetricsService } from '../../../modules/audio_assets/infrastructure/audio-metrics.service';

@Module({
  imports: [FileStorageModule],
  providers: [
    QueueJob, AudioGenerationJob, AudioMetricsService, DisabledTtsAdapter, FakeTtsAdapter, ElevenLabsHttpClient, ElevenLabsTtsAdapter,
    {
      provide: TTS_PROVIDER,
      inject: [DisabledTtsAdapter, ElevenLabsTtsAdapter, FakeTtsAdapter],
      useFactory: (disabled: DisabledTtsAdapter, elevenLabs: ElevenLabsTtsAdapter, fake: FakeTtsAdapter) => {
        switch (loadAudioEnv().provider) {
          case 'disabled': return disabled;
          case 'elevenlabs': return elevenLabs;
          case 'fake': return fake;
          default: throw new Error('AUDIO_TTS_PROVIDER no soportado');
        }
      },
    },
  ],
})
export class AudioAssetsWorkerModule {}
