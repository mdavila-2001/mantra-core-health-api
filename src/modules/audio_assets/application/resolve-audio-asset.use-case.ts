import { Injectable } from '@nestjs/common';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { loadAudioEnv } from '../audio.env';
import {
  buildAudioAssetKey,
  normalizeRenderedText,
  sha256Text,
} from '../domain/audio-asset-key';
import { InvalidDynamicAudioValueError } from '../domain/dynamic-value-normalizer';
import { renderAudioTemplate } from '../domain/template-renderer';
import type {
  AudioAssetView,
  AudioGenerationMode,
} from '../domain/audio.types';
import type { AudioAssets, AudioTemplates } from '../entities';
import { AudioValueCipherService } from '../infrastructure/audio-value-cipher.service';
import { AudioJobQueueAdapter } from '../infrastructure/audio-job-queue.adapter';
import { AudioMetricsService } from '../infrastructure/audio-metrics.service';
import { TracingService } from '../../../observability/tracing.service';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './audio-budget.policy';
import { recordAudioResolutionEvent } from './audio-resolution-events';
import {
  buildAudioSynthesisProfile,
  buildCreateAudioAssetInput,
  findReadyFallbackView,
  toAudioAssetView,
} from './audio-asset-resolution.mapper';
import type {
  ResolveAudioAssetInput,
  ResolveAudioAssetResult,
} from './resolve-audio-asset.types';
export type {
  ResolveAudioAssetInput,
  ResolveAudioAssetResult,
} from './resolve-audio-asset.types';

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

  async execute(
    input: ResolveAudioAssetInput,
    actor: AuthenticatedUser,
    mode: AudioGenerationMode = 'RUNTIME',
  ): Promise<ResolveAudioAssetResult> {
    return this.tracing.runInSpan(
      'audio.resolve',
      { 'audio.template': input.templateKey, 'audio.mode': mode },
      async () => {
        const template = await this.repository.findTemplate(
          input.templateKey,
          input.requestedVersion,
        );
        if (!template)
          throw new ResourceNotFoundException(
            'Plantilla de audio no encontrada',
            { templateKey: input.templateKey },
          );
        try {
          const rendered = renderAudioTemplate({
            textTemplate: template.textTemplate,
            fields: this.repository.dynamicFields(template),
            variables: input.variables ?? {},
          });
          return this.resolveRendered(
            template,
            rendered.renderedText,
            rendered.normalizedValues,
            actor,
            mode,
            false,
            input.correlationId,
          );
        } catch (error) {
          if (!(error instanceof InvalidDynamicAudioValueError)) throw error;
          return this.runtimeFallback(template, 'INVALID_DYNAMIC_VALUE');
        }
      },
    );
  }

  async resolveFallbackByTemplateKey(
    templateKey: string,
    actor: AuthenticatedUser,
    mode: AudioGenerationMode = 'PREGENERATE',
  ): Promise<ResolveAudioAssetResult> {
    const template = await this.repository.findTemplate(templateKey);
    if (!template)
      throw new ResourceNotFoundException('Plantilla de audio no encontrada', {
        templateKey,
      });
    if (mode === 'RUNTIME')
      return this.runtimeFallback(template, 'EXPLICIT_FALLBACK');
    if (!template.fallbackText)
      return { status: 'FALLBACK', reason: 'NO_INLINE_FALLBACK' };
    const result = await this.resolveRendered(
      template,
      template.fallbackText,
      {},
      actor,
      mode,
      true,
    );
    return {
      status: 'FALLBACK',
      fallbackAsset: result.asset,
      jobId: result.jobId,
      reason: 'PREGENERATING_FALLBACK',
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
    const profile = buildAudioSynthesisProfile(template, this.env);
    const normalizedText = normalizeRenderedText(renderedText);
    const assetKey = buildAudioAssetKey({
      ...profile,
      templateId: template.templateKey,
      templateVersion: template.version,
      normalizedText,
      variant: fallback ? 'FALLBACK' : 'PRIMARY',
    });
    const existing = await this.repository.findAssetByKey(assetKey);
    if (existing?.generationStatus === 'READY') {
      await this.repository.touchUsage(existing.id);
      this.metrics.cacheHit('asset');
      this.tracing.addEvent('audio.cache.hit');
      await recordAudioResolutionEvent(
        this.repository,
        existing,
        'CACHE_HIT',
        'READY',
        correlationId,
      );
      return { status: 'READY', asset: toAudioAssetView(existing) };
    }

    const renderedTextHash = sha256Text(renderedText);
    if (this.env.crossTemplateDedup) {
      const reusable = await this.repository.findReusableReady(
        renderedTextHash,
        profile,
      );
      if (reusable && reusable.assetKey !== assetKey) {
        const asset =
          existing ??
          (await this.repository.createPendingOrGet(
            buildCreateAudioAssetInput({
              template,
              assetKey,
              renderedTextHash,
              normalizedValues,
              profile,
              mode,
              fallback,
              encryptedRenderedText: this.cipher.encrypt(renderedText),
            }),
          ));
        const ready = await this.repository.markReusedReady(asset.id, reusable);
        this.metrics.cacheHit('binary-reuse');
        this.tracing.addEvent('audio.binary.reused');
        await recordAudioResolutionEvent(
          this.repository,
          ready,
          'BINARY_REUSED',
          'READY',
          correlationId,
        );
        return { status: 'READY', asset: toAudioAssetView(ready) };
      }
    }

    if (
      existing &&
      ['PENDING', 'GENERATING', 'FAILED_RETRYABLE'].includes(
        existing.generationStatus,
      )
    ) {
      const jobId = await this.queue.enqueue(existing.id, assetKey, actor);
      return {
        status: 'QUEUED',
        asset: toAudioAssetView(existing),
        jobId,
        fallbackAsset: fallback
          ? undefined
          : await findReadyFallbackView(template, this.repository, this.env),
      };
    }

    const actorHash = mode === 'RUNTIME' ? sha256Text(actor.id) : undefined;
    const estimatedUnits = Array.from(renderedText).length;
    const decision = await this.budget.canGenerate(
      mode,
      estimatedUnits,
      actorHash,
    );
    if (!decision.allowed) {
      this.metrics.budgetDenied(decision.reason);
      this.tracing.addEvent('audio.budget.denied', { reason: decision.reason });
      return fallback
        ? { status: 'FALLBACK', reason: decision.reason }
        : this.runtimeFallback(template, decision.reason);
    }

    const asset = await this.repository.createPendingOrGet(
      buildCreateAudioAssetInput({
        template,
        assetKey,
        renderedTextHash,
        normalizedValues,
        profile,
        mode,
        fallback,
        encryptedRenderedText: this.cipher.encrypt(renderedText),
      }),
    );
    if (asset.generationStatus === 'READY')
      return { status: 'READY', asset: toAudioAssetView(asset) };
    const jobId = await this.queue.enqueue(asset.id, asset.assetKey, actor);
    await recordAudioResolutionEvent(
      this.repository,
      asset,
      'GENERATION_QUEUED',
      'QUEUED',
      correlationId,
      estimatedUnits,
      actorHash,
    );
    return {
      status: 'QUEUED',
      asset: toAudioAssetView(asset),
      jobId,
      fallbackAsset: fallback
        ? undefined
        : await findReadyFallbackView(template, this.repository, this.env),
    };
  }

  private async runtimeFallback(
    template: AudioTemplates,
    reason: string,
  ): Promise<ResolveAudioAssetResult> {
    this.metrics.fallback(reason);
    this.tracing.addEvent('audio.fallback', { reason });
    return {
      status: 'FALLBACK',
      fallbackAsset: await findReadyFallbackView(
        template,
        this.repository,
        this.env,
      ),
      reason,
    };
  }
}
