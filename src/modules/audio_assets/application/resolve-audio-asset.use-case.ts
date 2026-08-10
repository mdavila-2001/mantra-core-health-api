import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException, type AuthenticatedUser } from '../../../common';
import { loadAudioEnv } from '../audio.env';
import { buildAudioAssetKey, normalizeRenderedText, sha256Text } from '../domain/audio-asset-key';
import { InvalidDynamicAudioValueError } from '../domain/dynamic-value-normalizer';
import { renderAudioTemplate } from '../domain/template-renderer';
import type { AudioAssetView, AudioGenerationMode, AudioSynthesisProfile } from '../domain/audio.types';
import type { AudioAssets, AudioTemplates } from '../entities';
import { AudioValueCipherService } from '../infrastructure/audio-value-cipher.service';
import { AudioJobQueueAdapter } from '../infrastructure/audio-job-queue.adapter';
import { AudioMetricsService } from '../infrastructure/audio-metrics.service';
import { TracingService } from '../../../observability/tracing.service';
import { AudioAssetsRepository, type CreateAudioAssetInput } from '../repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './audio-budget.policy';

export interface ResolveAudioAssetInput { templateKey: string; variables?: Record<string, string>; requestedVersion?: number; correlationId?: string; }
export interface ResolveAudioAssetResult { status: 'READY' | 'QUEUED' | 'FALLBACK'; asset?: AudioAssetView; fallbackAsset?: AudioAssetView; jobId?: string; reason?: string; }

@Injectable()
export class ResolveAudioAssetUseCase {
  private readonly env = loadAudioEnv();
  constructor(
    private readonly repository: AudioAssetsRepository,
    private readonly budget: AudioBudgetPolicy,
    private readonly cipher: AudioValueCipherService,
    private readonly queue: AudioJobQueueAdapter,
    private readonly metrics: AudioMetricsService,
    private readonly tracing: TracingService,
  ) {}

  async execute(input: ResolveAudioAssetInput, actor: AuthenticatedUser, mode: AudioGenerationMode = 'RUNTIME'): Promise<ResolveAudioAssetResult> {
    return this.tracing.runInSpan('audio.resolve', { 'audio.template': input.templateKey, 'audio.mode': mode }, async () => {
      const template = await this.repository.findTemplate(input.templateKey, input.requestedVersion);
      if (!template) throw new ResourceNotFoundException('Plantilla de audio no encontrada', { templateKey: input.templateKey });
      try {
        const rendered = renderAudioTemplate({ textTemplate: template.textTemplate, fields: this.repository.dynamicFields(template), variables: input.variables ?? {} });
        return this.resolveRendered(template, rendered.renderedText, rendered.normalizedValues, actor, mode, false, input.correlationId);
      } catch (error) {
        if (!(error instanceof InvalidDynamicAudioValueError)) throw error;
        return this.runtimeFallback(template, 'INVALID_DYNAMIC_VALUE');
      }
    });
  }

  async resolveFallbackByTemplateKey(templateKey: string, actor: AuthenticatedUser, mode: AudioGenerationMode = 'PREGENERATE'): Promise<ResolveAudioAssetResult> {
    const template = await this.repository.findTemplate(templateKey);
    if (!template) throw new ResourceNotFoundException('Plantilla de audio no encontrada', { templateKey });
    if (mode === 'RUNTIME') return this.runtimeFallback(template, 'EXPLICIT_FALLBACK');
    if (!template.fallbackText) return { status: 'FALLBACK', reason: 'NO_INLINE_FALLBACK' };
    const result = await this.resolveRendered(template, template.fallbackText, {}, actor, mode, true);
    return { status: 'FALLBACK', fallbackAsset: result.asset, jobId: result.jobId, reason: 'PREGENERATING_FALLBACK' };
  }

  private async resolveRendered(template: AudioTemplates, renderedText: string, normalizedValues: Record<string, string>, actor: AuthenticatedUser, mode: AudioGenerationMode, fallback: boolean, correlationId?: string): Promise<ResolveAudioAssetResult> {
    const profile = this.profile(template); const normalizedText = normalizeRenderedText(renderedText);
    const assetKey = buildAudioAssetKey({ ...profile, templateId: template.templateKey, templateVersion: template.version, normalizedText, variant: fallback ? 'FALLBACK' : 'PRIMARY' });
    const existing = await this.repository.findAssetByKey(assetKey);
    if (existing?.generationStatus === 'READY') {
      await this.repository.touchUsage(existing.id); this.metrics.cacheHit('asset'); this.tracing.addEvent('audio.cache.hit'); await this.event(existing, 'CACHE_HIT', 'READY', correlationId);
      return { status: 'READY', asset: this.toView(existing) };
    }

    const renderedTextHash = sha256Text(renderedText);
    if (this.env.crossTemplateDedup) {
      const reusable = await this.repository.findReusableReady(renderedTextHash, profile);
      if (reusable && reusable.assetKey !== assetKey) {
        const asset = existing ?? await this.repository.createPendingOrGet(this.createInput(template, assetKey, renderedText, renderedTextHash, normalizedValues, profile, mode, fallback));
        const ready = await this.repository.markReusedReady(asset.id, reusable);
        this.metrics.cacheHit('binary-reuse'); this.tracing.addEvent('audio.binary.reused'); await this.event(ready, 'BINARY_REUSED', 'READY', correlationId);
        return { status: 'READY', asset: this.toView(ready) };
      }
    }

    if (existing && ['PENDING', 'GENERATING', 'FAILED_RETRYABLE'].includes(existing.generationStatus)) {
      const jobId = await this.queue.enqueue(existing.id, assetKey, actor);
      return { status: 'QUEUED', asset: this.toView(existing), jobId, fallbackAsset: fallback ? undefined : await this.readyFallbackView(template) };
    }

    const actorHash = mode === 'RUNTIME' ? sha256Text(actor.id) : undefined;
    const estimatedUnits = Array.from(renderedText).length;
    const decision = await this.budget.canGenerate(mode, estimatedUnits, actorHash);
    if (!decision.allowed) { this.metrics.budgetDenied(decision.reason); this.tracing.addEvent('audio.budget.denied', { reason: decision.reason }); return fallback ? { status: 'FALLBACK', reason: decision.reason } : this.runtimeFallback(template, decision.reason); }

    const asset = await this.repository.createPendingOrGet(this.createInput(template, assetKey, renderedText, renderedTextHash, normalizedValues, profile, mode, fallback));
    if (asset.generationStatus === 'READY') return { status: 'READY', asset: this.toView(asset) };
    const jobId = await this.queue.enqueue(asset.id, asset.assetKey, actor);
    await this.event(asset, 'GENERATION_QUEUED', 'QUEUED', correlationId, estimatedUnits, actorHash);
    return { status: 'QUEUED', asset: this.toView(asset), jobId, fallbackAsset: fallback ? undefined : await this.readyFallbackView(template) };
  }

  private createInput(template: AudioTemplates, assetKey: string, renderedText: string, renderedTextHash: string, normalizedValues: Record<string, string>, profile: AudioSynthesisProfile, mode: AudioGenerationMode, fallback: boolean): CreateAudioAssetInput {
    const normalizedValueHash = Object.keys(normalizedValues).length
      ? sha256Text(JSON.stringify(Object.keys(normalizedValues).sort().map((key) => [key, normalizedValues[key]]))) : undefined;
    return { ...profile, assetKey, templateKey: template.templateKey, templateVersion: template.version,
      strategy: fallback ? 'FALLBACK' : template.strategy, normalizedValueHash,
      encryptedRenderedText: this.cipher.encrypt(renderedText), renderedTextHash, generationMode: mode };
  }

  private async runtimeFallback(template: AudioTemplates, reason: string): Promise<ResolveAudioAssetResult> {
    this.metrics.fallback(reason); this.tracing.addEvent('audio.fallback', { reason });
    return { status: 'FALLBACK', fallbackAsset: await this.readyFallbackView(template), reason };
  }
  private async readyFallbackView(template: AudioTemplates): Promise<AudioAssetView | undefined> {
    const inline = template.fallbackText ? await this.readyAssetForText(template, template.fallbackText, true) : null;
    if (inline) return this.toView(inline);
    if (!this.env.globalFallbackTemplate || this.env.globalFallbackTemplate === template.templateKey) return undefined;
    const global = await this.repository.findTemplate(this.env.globalFallbackTemplate);
    if (!global || this.repository.dynamicFields(global).length > 0) return undefined;
    const asset = await this.readyAssetForText(global, global.textTemplate, false);
    return asset ? this.toView(asset) : undefined;
  }
  private async readyAssetForText(template: AudioTemplates, text: string, fallback: boolean): Promise<AudioAssets | null> {
    const profile = this.profile(template);
    const key = buildAudioAssetKey({ ...profile, templateId: template.templateKey, templateVersion: template.version,
      normalizedText: normalizeRenderedText(text), variant: fallback ? 'FALLBACK' : 'PRIMARY' });
    const asset = await this.repository.findAssetByKey(key);
    return asset?.generationStatus === 'READY' ? asset : null;
  }

  private profile(template: AudioTemplates): AudioSynthesisProfile {
    if (template.voiceProfile !== this.env.voiceProfile) throw new Error(`Voice profile no configurado: ${template.voiceProfile}`);
    return { provider: this.env.provider, providerModel: this.env.providerModel, language: template.language || this.env.defaultLanguage,
      voiceProfile: template.voiceProfile, providerVoiceRef: this.env.providerVoiceRef, voiceVersion: this.env.voiceVersion,
      audioFormat: this.env.outputFormat, sampleRate: this.env.sampleRate, normalizerVersion: 1 };
  }
  private toView(asset: AudioAssets): AudioAssetView { return { id: asset.id, templateKey: asset.templateKey, templateVersion: asset.templateVersion,
    status: asset.generationStatus as AudioAssetView['status'], contentUrl: asset.generationStatus === 'READY' ? `/audio-assets/${asset.id}/content` : undefined,
    checksumSha256: asset.checksumSha256, bytes: asset.bytes, durationMs: asset.durationMs }; }
  private async event(asset: AudioAssets, eventType: string, outcome: string, correlationId?: string, estimatedCostUnits?: number, actorHash?: string): Promise<void> {
    await this.repository.appendEvent({ assetKey: asset.assetKey, eventType, provider: asset.provider, templateKey: asset.templateKey,
      outcome, correlationId, estimatedCostUnits, metadata: actorHash ? { actorHash } : {} });
  }
}
