import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FILE_STORAGE_ADAPTER, type FileStorageAdapter } from '../../../common';
import { AUDIO_GENERATION_JOB_TYPE } from '../../../modules/audio_assets/domain/audio-queue.constants';
import { TTS_PROVIDER, type TtsProviderPort } from '../../../modules/audio_assets/domain/tts-provider.port';
import { TtsProviderError } from '../../../modules/audio_assets/domain/tts-provider.errors';
import { SystemApiClient } from '../../system-api-client.service';
import { registerQueueJobHandler } from '../messaging/queue.job';

interface ClaimedAudioJob { id: string; payloadJson: unknown; attempts: number }
type PrepareResponse =
  | { action: 'SKIP_READY' }
  | { action: 'DENIED'; reason: string }
  | {
      action: 'GENERATE'; assetId: string; text: string; language: string; provider: string;
      providerModel: string; voiceProfile: string; providerVoiceRef: string;
      audioFormat: string; sampleRate: number; requestId: string;
    };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

@Injectable()
export class AudioGenerationJob implements OnModuleInit {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(FILE_STORAGE_ADAPTER) private readonly storage: FileStorageAdapter,
    @Inject(TTS_PROVIDER) private readonly tts: TtsProviderPort,
  ) { this.logger.setContext(AudioGenerationJob.name); }

  onModuleInit(): void {
    registerQueueJobHandler(AUDIO_GENERATION_JOB_TYPE, (job) => this.handle(job));
  }

  private async handle(job: ClaimedAudioJob): Promise<Record<string, unknown>> {
    const assetId = parseAssetId(job.payloadJson);
    const prepared = await this.api.post<PrepareResponse>(
      `/internal/audio-assets/${assetId}/prepare-generation`, {}, { idempotent: true },
    );
    if (prepared.action !== 'GENERATE') return { assetId, status: prepared.action, reason: 'reason' in prepared ? prepared.reason : undefined };
    try {
      const result = await this.tts.synthesize({
        text: prepared.text, language: prepared.language, voiceProfile: prepared.voiceProfile,
        providerVoiceRef: prepared.providerVoiceRef, model: prepared.providerModel,
        outputFormat: prepared.audioFormat, sampleRate: prepared.sampleRate, requestId: prepared.requestId,
      });
      const stored = await this.storage.store({
        buffer: result.audio, originalName: `${assetId}.audio`, mimeType: result.mimeType,
      });
      await this.api.post(
        `/internal/audio-assets/${assetId}/generated`,
        {
          storageUri: stored.storageUri, checksumSha256: stored.contentHash,
          bytes: stored.sizeBytes, durationMs: result.durationMs,
          credits: result.usage?.credits ?? result.usage?.characters,
        },
        { idempotent: true },
      );
      this.logger.info({ operation: 'audio.generate', assetId, bytes: stored.sizeBytes }, 'Audio asset generated');
      return { assetId, status: 'READY', bytes: stored.sizeBytes };
    } catch (error) {
      await this.reportFailure(assetId, error);
      if (error instanceof TtsProviderError && !error.retryable) {
        return { assetId, status: 'FAILED_PERMANENT', code: error.code };
      }
      throw error;
    }
  }

  private async reportFailure(assetId: string, error: unknown): Promise<void> {
    const code = error instanceof TtsProviderError ? error.code : 'AUDIO_GENERATION_INFRASTRUCTURE_FAILURE';
    const retryable = error instanceof TtsProviderError ? error.retryable : true;
    await this.api.post(
      `/internal/audio-assets/${assetId}/generation-failed`, { code, retryable }, { idempotent: true },
    );
    this.logger.warn({ operation: 'audio.generate', assetId, code, retryable }, 'Audio generation failed');
  }
}

function parseAssetId(payload: unknown): string {
  if (!payload || typeof payload !== 'object' || !('assetId' in payload)) throw new Error('audio.generate payload sin assetId');
  const value = (payload as { assetId?: unknown }).assetId;
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error('audio.generate assetId inválido');
  return value;
}
