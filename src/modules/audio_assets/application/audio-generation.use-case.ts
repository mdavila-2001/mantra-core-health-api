import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { loadAudioEnv } from '../audio.env';
import { AudioValueCipherService } from '../infrastructure/audio-value-cipher.service';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './audio-budget.policy';

export type PrepareAudioGenerationResult =
  | { action: 'SKIP_READY' }
  | { action: 'DENIED'; reason: string }
  | {
      action: 'GENERATE'; assetId: string; text: string; language: string;
      provider: string; providerModel: string; voiceProfile: string;
      providerVoiceRef: string; audioFormat: string; sampleRate: number; requestId: string;
    };

@Injectable()
export class AudioGenerationUseCase {
  private readonly env = loadAudioEnv();
  constructor(
    private readonly repository: AudioAssetsRepository,
    private readonly budget: AudioBudgetPolicy,
    private readonly cipher: AudioValueCipherService,
  ) {}

  async prepare(assetId: string): Promise<PrepareAudioGenerationResult> {
    const asset = await this.repository.findAssetById(assetId);
    if (!asset) throw new ResourceNotFoundException('Asset de audio no encontrado', { assetId });
    if (asset.generationStatus === 'READY') return { action: 'SKIP_READY' };
    if (asset.generationStatus === 'FAILED_PERMANENT') return { action: 'DENIED', reason: asset.failureCode ?? 'FAILED_PERMANENT' };
    const mode = this.generationMode(asset.metadata);
    const environment = this.budget.environmentDecision(mode);
    if (!environment.allowed) {
      await this.repository.markFallbackOnly(assetId, environment.reason);
      return { action: 'DENIED', reason: environment.reason };
    }
    const text = this.cipher.decrypt(asset.displayValueEncrypted);
    const estimatedUnits = Array.from(text).length;
    if (asset.budgetReservedUnits === undefined) {
      const precheck = await this.budget.canGenerate(mode, estimatedUnits);
      if (!precheck.allowed) {
        await this.repository.markFallbackOnly(assetId, precheck.reason);
        return { action: 'DENIED', reason: precheck.reason };
      }
    }
    const reserved = await this.repository.reserveBudget(
      assetId, this.budget.periodKey(), asset.provider, estimatedUnits, this.budget.usableMonthlyLimit(),
    );
    if (!reserved) {
      await this.repository.markFallbackOnly(assetId, 'MONTHLY_LIMIT_REACHED');
      return { action: 'DENIED', reason: 'MONTHLY_LIMIT_REACHED' };
    }
    await this.repository.appendEvent({
      assetKey: asset.assetKey, eventType: 'GENERATION_STARTED', provider: asset.provider,
      templateKey: asset.templateKey, outcome: 'GENERATING', estimatedCostUnits: estimatedUnits,
    });
    return {
      action: 'GENERATE', assetId: asset.id, text, language: asset.language,
      provider: asset.provider, providerModel: asset.providerModel,
      voiceProfile: asset.voiceProfile, providerVoiceRef: asset.voiceProviderRef ?? '',
      audioFormat: asset.audioFormat, sampleRate: asset.sampleRate ?? this.env.sampleRate,
      requestId: asset.id,
    };
  }

  async generated(input: { assetId: string; storageUri: string; checksumSha256: string; bytes: number; durationMs?: number; credits?: number }): Promise<void> {
    const asset = await this.repository.markReady({
      assetId: input.assetId, storageUri: input.storageUri, checksum: input.checksumSha256,
      bytes: input.bytes, durationMs: input.durationMs, consumedCredits: input.credits,
    });
    await this.repository.appendEvent({
      assetKey: asset.assetKey, eventType: 'GENERATION_SUCCEEDED', provider: asset.provider,
      templateKey: asset.templateKey, outcome: 'READY', durationMs: input.durationMs,
    });
  }

  async failed(input: { assetId: string; code: string; retryable: boolean; durationMs?: number }): Promise<void> {
    const asset = await this.repository.findAssetById(input.assetId);
    if (!asset) throw new ResourceNotFoundException('Asset de audio no encontrado', { assetId: input.assetId });
    await this.repository.markFailed(input.assetId, input.code, input.retryable);
    await this.repository.appendEvent({
      assetKey: asset.assetKey, eventType: 'GENERATION_FAILED', provider: asset.provider,
      templateKey: asset.templateKey, outcome: input.retryable ? 'RETRYABLE' : 'PERMANENT',
      errorCode: input.code, durationMs: input.durationMs,
    });
  }

  private generationMode(metadata: unknown): 'RUNTIME' | 'PREGENERATE' {
    if (metadata && typeof metadata === 'object' && 'generationMode' in metadata && (metadata as { generationMode?: unknown }).generationMode === 'PREGENERATE') {
      return 'PREGENERATE';
    }
    return 'RUNTIME';
  }
}
