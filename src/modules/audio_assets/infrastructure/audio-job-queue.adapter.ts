import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common';
import { QueuesService } from '../../messaging/services/queues.service';
import { loadAudioEnv } from '../audio.env';
import { AUDIO_GENERATION_JOB_TYPE, AUDIO_GENERATION_QUEUE } from '../domain/audio-queue.constants';

@Injectable()
export class AudioJobQueueAdapter {
  private readonly env = loadAudioEnv();
  constructor(private readonly queues: QueuesService) {}

  async enqueue(assetId: string, assetKey: string, actor: AuthenticatedUser): Promise<string> {
    const result = await this.queues.enqueueJob(
      AUDIO_GENERATION_QUEUE,
      {
        jobType: AUDIO_GENERATION_JOB_TYPE,
        dedupeKey: `${AUDIO_GENERATION_JOB_TYPE}:${assetKey}`,
        payloadJson: { assetId },
        maxAttempts: this.env.maxRetries + 1,
      },
      actor,
    );
    return result.id;
  }
}
