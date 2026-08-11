import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import type {
  AudioAssetStatus,
  AudioDynamicField,
  AudioSynthesisProfile,
} from '../domain/audio.types';
import {
  AudioAssets,
  AudioGenerationEvents,
  AudioGenerationUsage,
  AudioTemplates,
} from '../entities';
import {
  countQueuedAudioJobsByActorSince,
  findReusableReadyAudioAsset,
  getAudioDynamicFields,
  listEnabledAudioTemplates,
  markAudioAssetReady,
  reserveAudioGenerationBudget,
} from './audio-assets.repository.queries';
import type {
  CreateAudioAssetInput,
  GenerationEventInput,
  MarkAudioAssetReadyInput,
} from './audio-assets.repository.types';
@Injectable()
export class AudioAssetsRepository {
  constructor(private readonly em: EntityManager) {}

  async findTemplate(
    templateKey: string,
    version?: number,
  ): Promise<AudioTemplates | null> {
    return version !== undefined
      ? this.em.findOne(AudioTemplates, { templateKey, version, enabled: true })
      : this.em.findOne(
          AudioTemplates,
          { templateKey, enabled: true },
          { orderBy: { version: 'DESC' } },
        );
  }
  listEnabledTemplates(templateKeys?: string[]): Promise<AudioTemplates[]> {
    return listEnabledAudioTemplates(this.em, templateKeys);
  }
  findAssetByKey(assetKey: string): Promise<AudioAssets | null> {
    return this.em.findOne(AudioAssets, { assetKey });
  }
  findAssetById(assetId: string): Promise<AudioAssets | null> {
    return this.em.findOne(AudioAssets, { id: assetId });
  }

  findReusableReady(
    renderedTextHash: string,
    profile: AudioSynthesisProfile,
  ): Promise<AudioAssets | null> {
    return findReusableReadyAudioAsset(this.em, renderedTextHash, profile);
  }

  /** La constraint UNIQUE(asset_key) es la garantía final frente a carreras. */
  async createPendingOrGet(input: CreateAudioAssetInput): Promise<AudioAssets> {
    const now = new Date();
    await this.em.getConnection().execute(
      `insert into audio_assets.audio_assets (
        id, asset_key, template_key, template_version, strategy, language, normalized_value_hash,
        display_value_encrypted, rendered_text_hash, provider, provider_model, voice_profile,
        voice_provider_ref, voice_version, normalizer_version, audio_format, sample_rate,
        generation_status, use_count, metadata, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?::jsonb, ?, ?)
      on conflict (asset_key) do nothing`,
      [
        randomUUID(),
        input.assetKey,
        input.templateKey,
        input.templateVersion,
        input.strategy,
        input.language,
        input.normalizedValueHash ?? null,
        input.encryptedRenderedText,
        input.renderedTextHash,
        input.provider,
        input.providerModel,
        input.voiceProfile,
        input.providerVoiceRef || null,
        input.voiceVersion,
        input.normalizerVersion,
        input.audioFormat,
        input.sampleRate,
        JSON.stringify({ generationMode: input.generationMode }),
        now,
        now,
      ],
      'run',
    );
    const asset = await this.findAssetByKey(input.assetKey);
    if (!asset)
      throw new Error('No se pudo materializar el asset de audio idempotente');
    return asset;
  }

  async markReusedReady(
    assetId: string,
    source: AudioAssets,
  ): Promise<AudioAssets> {
    await this.em.getConnection().execute(
      `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?,
       generation_status='READY', failure_code=null, generated_at=coalesce(generated_at, now()), updated_at=now(),
       metadata=coalesce(metadata, '{}'::jsonb) || ?::jsonb where id=? and generation_status<>'READY'`,
      [
        source.storageProvider ?? null,
        source.storageKey ?? null,
        source.bytes ?? null,
        source.durationMs ?? null,
        source.checksumSha256 ?? null,
        JSON.stringify({ reusedFromAssetId: source.id }),
        assetId,
      ],
      'run',
    );
    const result = await this.findAssetById(assetId);
    if (!result) throw new Error('Asset reutilizado no encontrado');
    return result;
  }

  async touchUsage(assetId: string): Promise<void> {
    await this.em
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set last_used_at=now(), use_count=use_count+1, updated_at=now() where id=?`,
        [assetId],
        'run',
      );
  }
  async estimatedUsage(periodKey: string, provider: string): Promise<number> {
    return (
      (await this.em.findOne(AudioGenerationUsage, { periodKey, provider }))
        ?.estimatedCredits ?? 0
    );
  }
  countQueuedByActorSince(actorHash: string, since: Date): Promise<number> {
    return countQueuedAudioJobsByActorSince(this.em, actorHash, since);
  }

  reserveBudget(
    assetId: string,
    periodKey: string,
    provider: string,
    units: number,
    usableLimit: number,
  ): Promise<boolean> {
    return reserveAudioGenerationBudget(
      this.em,
      assetId,
      periodKey,
      provider,
      units,
      usableLimit,
    );
  }

  markReady(input: MarkAudioAssetReadyInput): Promise<AudioAssets> {
    return markAudioAssetReady(this.em, input);
  }

  async markFailed(
    assetId: string,
    failureCode: string,
    retryable: boolean,
  ): Promise<void> {
    const status: AudioAssetStatus = retryable
      ? 'FAILED_RETRYABLE'
      : 'FAILED_PERMANENT';
    await this.em.nativeUpdate(
      AudioAssets,
      { id: assetId },
      { generationStatus: status, failureCode, updatedAt: new Date() },
    );
  }
  async markFallbackOnly(assetId: string, reason: string): Promise<void> {
    await this.em.nativeUpdate(
      AudioAssets,
      { id: assetId },
      {
        generationStatus: 'FALLBACK_ONLY',
        failureCode: reason,
        updatedAt: new Date(),
      },
    );
  }
  async appendEvent(input: GenerationEventInput): Promise<void> {
    const event = this.em.create(AudioGenerationEvents, {
      id: randomUUID(),
      assetKey: input.assetKey,
      eventType: input.eventType,
      provider: input.provider,
      templateKey: input.templateKey,
      outcome: input.outcome,
      errorCode: input.errorCode,
      durationMs: input.durationMs,
      estimatedCostUnits: input.estimatedCostUnits,
      correlationId: input.correlationId,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    });
    this.em.persist(event);
    await this.em.flush();
  }
  dynamicFields(template: AudioTemplates): AudioDynamicField[] {
    return getAudioDynamicFields(template);
  }
}
