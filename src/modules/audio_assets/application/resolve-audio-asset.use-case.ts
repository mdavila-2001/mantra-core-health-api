import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common';
import { ResourceNotFoundException } from '../../../common';
import { loadAudioEnv } from '../audio.env';
import { buildAudioAssetKey, normalizeRenderedText, sha256Text } from '../domain/audio-asset-key';
import { InvalidDynamicAudioValueError } from '../domain/dynamic-value-normalizer';
import { renderAudioTemplate } from '../domain/template-renderer';
import type { AudioAssetView, AudioGenerationMode, AudioSynthesisProfile } from '../domain/audio.types';
import type { AudioAssets, AudioTemplates } from '../entities';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './audio-budget.policy';
import { AudioValueCipherService } from '../infrastructure/audio-value-cipher.service';
import { AudioJobQueueAdapter } from '../infrastructure/audio-job-queue.adapter';

export interface ResolveAudioAssetInput {
  templateKey: string;
  variables?: Record<string, string>;
  requestedVersion?: number;
  correlationId?: string;
}
export interface ResolveAudioAssetResult {
  status: 'READY' | 'QUEUED' | 'FALLBACK';
  asset?: AudioAssetView;
  fallbackAsset?: AudioAssetView;
  jobId?: string;
  reason?: string;
}

@Injectable()
export class ResolveAudioAssetUseCase {
  private readonly env = loadAudioEnv();
  constructor(
    private readonly repository: AudioAssetsRepository,
    private readonly budget: AudioBudgetPolicy,
    private readonly cipher: AudioValueCipherService,
    private readonly queue: AudioJobQueueAdapter,
  ) {}

  async execute(input: ResolveAudioAssetInput, actor: AuthenticatedUser, mode: AudioGenerationMode = 'RUNTIME'): Promise<ResolveAudioAssetResult> {
    const template = await this.repository.findTemplate(input.templateKey, input.requestedVersion);
    if (!template) throw new ResourceNotFoundException('Plantilla de audio no encontrada', { templateKey: input.templateKey });
    try {
      const rendered = renderAudioTemplate({
        textTemplate: template.textTemplate,
        fields: this.repository.dynamicFields(template),
        variables: input.variables ?? {},
      });
      return await this.resolveRendered(template, rendered.renderedText, rendered.normalizedValues, actor, mode, false, input.correlationId);
    } catch (error) {
      if (!(error instanceof InvalidDynamicAudioValueError)) throw error;
      return this.resolveFallback(template, actor, mode, input.correlationId, 'INVALID_DYNAMIC_VALUE');
    }
  }

  async resolveFallbackByTemplateKey(templateKey: string, actor: AuthenticatedUser, mode: AudioGenerationMode = 'PREGENERATE'): Promise<ResolveAudioAssetResult> {
    const template = await this.repository.findTemplate(templateKey);
    if (!template) throw new ResourceNotFoundException('Plantilla de audio no encontrada', { templateKey });
    return this.resolveFallback(template, actor, mode, undefined, 'EXPLICIT_FALLBACK');
  }

  private async resolveFallback(template: AudioTemplates, actor: AuthenticatedUser, mode: AudioGenerationMode, correlationId?: string, reason?: string): Promise<ResolveAudioAssetResult> {
    if (!template.fallbackText) return { status: 'FALLBACK', reason: reason ?? 'NO_FALLBACK_TEXT' };
    const fallback = await this.resolveRendered(template, template.fallbackText, {}, actor, mode, true, correlationId);
    return {
      status: 'FALLBACK',
      fallbackAsset: fallback.asset ?? fallback.fallbackAsset,
      jobId: fallback.jobId,
      reason,
    };
  }

  private async resolveRendered(
    template: AudioTemplates,
    renderedText: string,
    normalizedValues: Record<string, string>,
    actor: AuthenticatedUser,
    mode: AudioGenerationMode,
    fallback: boolean,
    correlationId?: string,
  ): Promise<ResolveAudioAssetResult> {
    const profile = this.profile(template);
    const normalizedText = normalizeRenderedText(renderedText);
    const assetKey = buildAudioAssetKey({
      ...profile, templateId: template.templateKey, templateVersion: template.version,
      normalizedText, variant: fallback ? 'FALLBACK' : 'PRIMARY',
    });
    const existing = await this.repository.findAssetByKey(assetKey);
    if (existing?.generationStatus === 'READY') {
      await this.repository.touchUsage(existing.id);
      await this.event(existing, 'CACHE_HIT', 'READY', correlationId);
      return { status: 'READY', asset: this.toView(existing) };
    }
    if (existing && ['PENDING', 'GENERATING', 'FAILED_RETRYABLE'].includes(existing.generationStatus)) {
      const jobId = await this.queue.enqueue(existing.id, assetKey, actor);
      return { status: 'QUEUED', asset: this.toView(existing), jobId };
    }

    const estimatedUnits = Array.from(renderedText).length;
    const decision = await this.budget.canGenerate(mode, estimatedUnits);
    if (!decision.allowed) {
      if (!fallback) return this.resolveFallback(template, actor, mode, correlationId, decision.reason);
      return { status: 'FALLBACK', reason: decision.reason };
    }

    const normalizedValueHash = Object.keys(normalizedValues).length
      ? sha256Text(JSON.stringify(Object.keys(normalizedValues).sort().map((key) => [key, normalizedValues[key]])))
      : undefined;
    const asset = await this.repository.createPendingOrGet({
      assetKey, templateKey: template.templateKey, templateVersion: template.version,
      strategy: fallback ? 'FALLBACK' : template.strategy, language: profile.language,
      normalizedValueHash, encryptedRenderedText: this.cipher.encrypt(renderedText),
      renderedTextHash: sha256Text(renderedText), provider: profile.provider,
      providerModel: profile.providerModel, voiceProfile: profile.voiceProfile,
      voiceProviderRef: profile.providerVoiceRef || undefined, voiceVersion: profile.voiceVersion,
      normalizerVersion: profile.normalizerVersion, audioFormat: profile.audioFormat,
      sampleRate: profile.sampleRate, generationMode: mode,
    });
    if (asset.generationStatus === 'READY') return { status: 'READY', asset: this.toView(asset) };
    const jobId = await this.queue.enqueue(asset.id, asset.assetKey, actor);
    await this.event(asset, 'GENERATION_QUEUED', 'QUEUED', correlationId, estimatedUnits);
    return { status: 'QUEUED', asset: this.toView(asset), jobId };
  }

  private profile(template: AudioTemplates): AudioSynthesisProfile {
    return {
      provider: this.env.provider, providerModel: this.env.providerModel,
      language: template.language || this.env.defaultLanguage,
      voiceProfile: template.voiceProfile || this.env.voiceProfile,
      providerVoiceRef: this.env.providerVoiceRef, voiceVersion: this.env.voiceVersion,
      audioFormat: this.env.outputFormat, sampleRate: this.env.sampleRate, normalizerVersion: 1,
    };
  }

  private toView(asset: AudioAssets): AudioAssetView {
    return {
      id: asset.id, templateKey: asset.templateKey, templateVersion: asset.templateVersion,
      status: asset.generationStatus as AudioAssetView['status'],
      contentUrl: asset.generationStatus === 'READY' ? `/audio-assets/${asset.id}/content` : undefined,
      checksumSha256: asset.checksumSha256, bytes: asset.bytes, durationMs: asset.durationMs,
    };
  }

  private async event(asset: AudioAssets, eventType: string, outcome: string, correlationId?: string, estimatedCostUnits?: number): Promise<void> {
    await this.repository.appendEvent({ assetKey: asset.assetKey, eventType, provider: asset.provider,
      templateKey: asset.templateKey, outcome, correlationId, estimatedCostUnits });
  }
}
