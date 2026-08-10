import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import type { AudioAssetStatus, AudioDynamicField, AudioGenerationMode, AudioSynthesisProfile } from '../domain/audio.types';
import { AudioAssets, AudioGenerationEvents, AudioGenerationUsage, AudioTemplates } from '../entities';

export interface CreateAudioAssetInput extends AudioSynthesisProfile {
  assetKey: string; templateKey: string; templateVersion: number; strategy: string;
  normalizedValueHash?: string; encryptedRenderedText: string; renderedTextHash: string;
  generationMode: AudioGenerationMode;
}
export interface GenerationEventInput {
  assetKey?: string; eventType: string; provider?: string; templateKey?: string; outcome: string;
  errorCode?: string; durationMs?: number; estimatedCostUnits?: number; correlationId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AudioAssetsRepository {
  constructor(private readonly em: EntityManager) {}

  async findTemplate(templateKey: string, version?: number): Promise<AudioTemplates | null> {
    return version !== undefined
      ? this.em.findOne(AudioTemplates, { templateKey, version, enabled: true })
      : this.em.findOne(AudioTemplates, { templateKey, enabled: true }, { orderBy: { version: 'DESC' } });
  }
  async listEnabledTemplates(templateKeys?: string[]): Promise<AudioTemplates[]> {
    const where = templateKeys?.length ? { enabled: true, templateKey: { $in: templateKeys } } : { enabled: true };
    return this.em.find(AudioTemplates, where, { orderBy: { templateKey: 'ASC', version: 'DESC' } });
  }
  findAssetByKey(assetKey: string): Promise<AudioAssets | null> { return this.em.findOne(AudioAssets, { assetKey }); }
  findAssetById(assetId: string): Promise<AudioAssets | null> { return this.em.findOne(AudioAssets, { id: assetId }); }

  async findReusableReady(renderedTextHash: string, profile: AudioSynthesisProfile): Promise<AudioAssets | null> {
    const rows = await this.em.getConnection().execute<Array<{ id: string }>>(
      `select id from audio_assets.audio_assets where rendered_text_hash=? and language=? and provider=?
       and provider_model=? and voice_profile=? and voice_provider_ref is not distinct from ? and voice_version=?
       and normalizer_version=? and audio_format=? and sample_rate is not distinct from ?
       and generation_status='READY' and storage_key is not null
       order by generated_at desc nulls last limit 1`,
      [renderedTextHash, profile.language, profile.provider, profile.providerModel, profile.voiceProfile,
        profile.providerVoiceRef || null, profile.voiceVersion, profile.normalizerVersion, profile.audioFormat, profile.sampleRate], 'all',
    );
    return rows[0] ? this.findAssetById(rows[0].id) : null;
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
      [randomUUID(), input.assetKey, input.templateKey, input.templateVersion, input.strategy, input.language,
        input.normalizedValueHash ?? null, input.encryptedRenderedText, input.renderedTextHash, input.provider,
        input.providerModel, input.voiceProfile, input.providerVoiceRef || null, input.voiceVersion,
        input.normalizerVersion, input.audioFormat, input.sampleRate,
        JSON.stringify({ generationMode: input.generationMode }), now, now], 'run',
    );
    const asset = await this.findAssetByKey(input.assetKey);
    if (!asset) throw new Error('No se pudo materializar el asset de audio idempotente');
    return asset;
  }

  async markReusedReady(assetId: string, source: AudioAssets): Promise<AudioAssets> {
    await this.em.getConnection().execute(
      `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?,
       generation_status='READY', failure_code=null, generated_at=coalesce(generated_at, now()), updated_at=now(),
       metadata=coalesce(metadata, '{}'::jsonb) || ?::jsonb where id=? and generation_status<>'READY'`,
      [source.storageProvider ?? null, source.storageKey ?? null, source.bytes ?? null, source.durationMs ?? null,
        source.checksumSha256 ?? null, JSON.stringify({ reusedFromAssetId: source.id }), assetId], 'run',
    );
    const result = await this.findAssetById(assetId);
    if (!result) throw new Error('Asset reutilizado no encontrado');
    return result;
  }

  async touchUsage(assetId: string): Promise<void> {
    await this.em.getConnection().execute(
      `update audio_assets.audio_assets set last_used_at=now(), use_count=use_count+1, updated_at=now() where id=?`,
      [assetId], 'run');
  }
  async estimatedUsage(periodKey: string, provider: string): Promise<number> {
    return (await this.em.findOne(AudioGenerationUsage, { periodKey, provider }))?.estimatedCredits ?? 0;
  }
  async countQueuedByActorSince(actorHash: string, since: Date): Promise<number> {
    const rows = await this.em.getConnection().execute<Array<{ count: number }>>(
      `select count(*)::int as count from audio_assets.audio_generation_events
       where event_type='GENERATION_QUEUED' and created_at>=? and metadata->>'actorHash'=?`,
      [since, actorHash], 'all');
    return rows[0]?.count ?? 0;
  }

  async reserveBudget(assetId: string, periodKey: string, provider: string, units: number, usableLimit: number): Promise<boolean> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<Array<{ generation_status: string; budget_reserved_units: number | null }>>(
        `select generation_status, budget_reserved_units from audio_assets.audio_assets where id=? for update`,
        [assetId], 'all', tx.getTransactionContext());
      const asset = rows[0];
      if (!asset) return false;
      if (asset.generation_status === 'READY') return true;
      if (asset.budget_reserved_units !== null) {
        await tx.getConnection().execute(`update audio_assets.audio_assets set generation_status='GENERATING', updated_at=now() where id=?`, [assetId], 'run', tx.getTransactionContext());
        return true;
      }
      if (units > usableLimit) return false;
      const reserved = await tx.getConnection().execute<Array<{ estimated_credits: number }>>(
        `insert into audio_assets.audio_generation_usage (id, period_key, provider, estimated_credits, consumed_credits,
         request_count, success_count, failure_count, created_at, updated_at) values (?, ?, ?, ?, 0, 1, 0, 0, now(), now())
         on conflict (period_key, provider) do update set estimated_credits=audio_generation_usage.estimated_credits+excluded.estimated_credits,
         request_count=audio_generation_usage.request_count+1, updated_at=now()
         where audio_generation_usage.estimated_credits+excluded.estimated_credits<=? returning estimated_credits`,
        [randomUUID(), periodKey, provider, units, usableLimit], 'all', tx.getTransactionContext());
      if (reserved.length === 0) return false;
      await tx.getConnection().execute(`update audio_assets.audio_assets set budget_reserved_units=?, generation_status='GENERATING', updated_at=now() where id=?`, [units, assetId], 'run', tx.getTransactionContext());
      return true;
    });
  }

  async markReady(input: { assetId: string; storageUri: string; checksum: string; bytes: number; durationMs?: number; consumedCredits?: number }): Promise<AudioAssets> {
    await this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<Array<{ generation_status: string; budget_reserved_units: number | null; provider: string }>>(
        `select generation_status, budget_reserved_units, provider from audio_assets.audio_assets where id=? for update`, [input.assetId], 'all', tx.getTransactionContext());
      const asset = rows[0]; if (!asset || asset.generation_status === 'READY') return;
      await tx.getConnection().execute(
        `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?, generation_status='READY', failure_code=null, generated_at=now(), updated_at=now() where id=?`,
        [input.storageUri.startsWith('s3://') ? 's3' : 'local', input.storageUri, input.bytes, input.durationMs ?? null, input.checksum, input.assetId], 'run', tx.getTransactionContext());
      await tx.getConnection().execute(
        `update audio_assets.audio_generation_usage set consumed_credits=coalesce(consumed_credits,0)+?, success_count=success_count+1, updated_at=now() where period_key=? and provider=?`,
        [input.consumedCredits ?? asset.budget_reserved_units ?? 0, new Date().toISOString().slice(0, 7), asset.provider], 'run', tx.getTransactionContext());
    });
    const result = await this.findAssetById(input.assetId); if (!result) throw new Error('Asset READY no encontrado'); return result;
  }

  async markFailed(assetId: string, failureCode: string, retryable: boolean): Promise<void> {
    const status: AudioAssetStatus = retryable ? 'FAILED_RETRYABLE' : 'FAILED_PERMANENT';
    await this.em.nativeUpdate(AudioAssets, { id: assetId }, { generationStatus: status, failureCode, updatedAt: new Date() });
  }
  async markFallbackOnly(assetId: string, reason: string): Promise<void> {
    await this.em.nativeUpdate(AudioAssets, { id: assetId }, { generationStatus: 'FALLBACK_ONLY', failureCode: reason, updatedAt: new Date() });
  }
  async appendEvent(input: GenerationEventInput): Promise<void> {
    await this.em.persistAndFlush(this.em.create(AudioGenerationEvents, {
      id: randomUUID(), assetKey: input.assetKey, eventType: input.eventType, provider: input.provider,
      templateKey: input.templateKey, outcome: input.outcome, errorCode: input.errorCode,
      durationMs: input.durationMs, estimatedCostUnits: input.estimatedCostUnits,
      correlationId: input.correlationId, metadata: input.metadata ?? {}, createdAt: new Date(),
    }));
  }
  dynamicFields(template: AudioTemplates): AudioDynamicField[] {
    return Array.isArray(template.dynamicFieldsJson) ? template.dynamicFieldsJson as AudioDynamicField[] : [];
  }
}
