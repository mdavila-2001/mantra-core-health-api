import { bootstrapWorker } from './worker/bootstrap';
import { AudioTtsWorkerModule } from './worker/jobs/audio_tts/audio_tts.worker-module';

void bootstrapWorker(AudioTtsWorkerModule, 'audio_tts');
