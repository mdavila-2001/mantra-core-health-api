import { storageEnvSchema } from './common';
import { audioEnvSchema } from './modules/audio_assets/audio.env';
import { bootstrapWorker } from './worker/bootstrap';
import { AudioAssetsWorkerModule } from './worker/jobs/audio_assets/audio-assets.worker-module';

void bootstrapWorker(
  AudioAssetsWorkerModule,
  'audio-assets',
  storageEnvSchema.concat(audioEnvSchema),
);
