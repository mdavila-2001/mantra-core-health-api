import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import type { AudioAssetStatus, AudioDynamicField, AudioGenerationMode } from '../domain/audio.types';
import { AudioAssets, AudioGenerationEvents, AudioGenerationUsage, AudioTemplates } from '../entities';

export interface CreateAudioAssetInput {
  assetKey: string;
  templateKey: string;
  templateVersion: number;
  strategy: string;
  language: string;
  normalizedValueHash?: string;
  encryptedRenderedText: string;
  renderedTextHash: string;
  provider: string;
  providerModel: string;
  voiceProfile: string;
  voiceProviderRef?: string;
  voiceVersion: number;
  normalizerVersion: number;
  audioFormat: string;
  sampleRate: number;
  generationMode: AudioGenerationMode;
}

export interface GenerationEventInput {
  assetKey?: string;
  eventType: string;
  provider?: string;
  templateKey?: string;
  outcome: string;
  errorCode?: string;
  durationMs?: number;
  estimatedCostUnits?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AudioAssetsRepository {
  constructor(private readonly em: EntityManager) {}

  async findTemplate(templateKey: string, version?: number): Promise<AudioTemplates | null> {
    if (version !== undefined) {
      return this.em.findOne(AudioTemplates, { templateKey, version, enabled: true });
    }
    return this.em.findOne(AudioTemplates, { templateKey, enabled: true }, { orderBy: { version: 'DESC' } });
  }

  async listEnabledTemplates(templateKeys?: string[]): Promise<AudioTemplates[]> {
    const where = templateKeys?.length ? { enabled: true, templateKey: { $in: templateKeys } } : { enabled: true };
    return this.em.find(AudioTemplates, where, { orderBy: { templateKey: 'ASC', version: 'DESC' } });
  }

  async findAssetByKey(assetKey: string): Promise<AudioAssets | null> {
    return this.em.findOne(AudioAssets, { assetKey });
  }

  async findAssetById(assetId: string): Promise<AudioAssets | null> {
    return this.em.findOne(AudioAssets, { id: assetId });
  }
  /** INSERT ... ON CONFLICT hace de la constraint DB la garantía de idempotencia. */
  async createPendingOrGet(input: CreateAudioAssetInput): Promise<AudioAssets> {
    const id = randomUUID();
    const now = new Date();
    await this.em.getConnection().execute(
      `insert into audio_assets.audio_assets (
        id, asset_key, template_key, template_version, strategy, language,
        normalized_value_hash, display_value_encrypted, rendered_text_hash,
        provider, provider_model, voice_profile, voice_provider_ref, voice_version,
        normalizer_version, audio_format, sample_rate, generation_status,
        use_count, metadata, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?::jsonb, ?, ?)
      on conflict (asset_key) do nothing`,
      [
        id, input.assetKey, input.templateKey, input.templateVersion, input.strategy,
        input.language, input.normalizedValueHash ?? null, input.encryptedRenderedText,
        input.renderedTextHash, input.provider, input.providerModel, input.voiceProfile,
        input.voiceProviderRef ?? null, input.voiceVersion, input.normalizerVersion,
        input.audioFormat, input.sampleRate, JSON.stringify({ generationMode: input.generationMode }),
        now, now,
      ],
      'run',
    );
    const asset = await this.findAssetByKey(input.assetKey);
    if (!asset) throw new Error('No se pudo materializar el asset de audio idempotente');
    return asset;
  }
  async touchUsage(assetId: string): Promise<void> {
    await this.em.getConnection().execute(
      `update audio_assets.audio_assets
       set last_used_at = now(), use_count = use_count + 1, updated_at = now()
       where id = ?`,
      [assetId],
      'run',
    );
  }
  async estimatedUsage(periodKey: string, provider: string): Promise<number> {
    const usage = await this.em.findOne(AudioGenerationUsage, { periodKey, provider });
    return usage?.estimatedCredits ?? 0;
  }
  /** Reserva presupuesto bajo lock de asset y upsert atómico del periodo. */
  async reserveBudget(assetId: string, periodKey: string, provider: string, units: number, usableLimit: number): Promise<boolean> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<Array<{ generation_status: string; budget_reserved_units: number | null }>>(
        `select generation_status, budget_reserved_units from audio_assets.audio_assets where id = ? for update`,
        [assetId], 'all', tx.getTransactionContext(),
      );
      const asset = rows[0];
      if (!asset) return false;
      if (asset.generation_status === 'READY') return true;
      if (asset.budget_reserved_units !== null) {
        await tx.getConnection().execute(
          `update audio_assets.audio_assets set generation_status='GENERATING', updated_at=now() where id=?`,
          [assetId], 'run', tx.getTransactionContext(),
        );
        return true;
      }
      if (units > usableLimit) return false;
      const reserved = await tx.getConnection().execute<Array<{ estimated_credits: number }>>(
        `insert into audio_assets.audio_generation_usage (
          id, period_key, provider, estimated_credits, consumed_credits,
          request_count, success_count, failure_count, created_at, updated_at
        ) values (?, ?, ?, ?, 0, 1, 0, 0, now(), now())
        on conflict (period_key, provider) do update set
          estimated_credits = audio_generation_usage.estimated_credits + excluded.estimated_credits,
          request_count = audio_generation_usage.request_count + 1,
          updated_at = now()
        where audio_generation_usage.estimated_credits + excluded.estimated_credits <= ?
        returning estimated_credits`,
        [randomUUID(), periodKey, provider, units, usableLimit], 'all', tx.getTransactionContext(),
      );
      if (reserved.length === 0) return false;
      await tx.getConnection().execute(
        `update audio_assets.audio_assets
         set budget_reserved_units=?, generation_status='GENERATING', updated_at=now()
         where id=?`,
        [units, assetId], 'run', tx.getTransactionContext(),
      );
      return true;
    });
  }
  async markReady(input: { assetId: string; storageUri: string; checksum: string; bytes: number; durationMs?: number; consumedCredits?: number }): Promise<AudioAssets> {
    await this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<Array<{ generation_status: string; budget_reserved_units: number | null; provider: string }>>(
        `select generation_status, budget_reserved_units, provider from audio_assets.audio_assets where id=? for update`,
        [input.assetId], 'all', tx.getTransactionContext(),
      );
      const asset = rows[0];
      if (!asset || asset.generation_status === 'READY') return;
      const storageProvider = input.storageUri.startsWith('s3://') ? 's3' : 'local';
      await tx.getConnection().execute(
        `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?,
          checksum_sha256=?, generation_status='READY', failure_code=null, generated_at=now(), updated_at=now()
         where id=?`,
        [storageProvider, input.storageUri, input.bytes, input.durationMs ?? null, input.checksum, input.assetId],
        'run', tx.getTransactionContext(),
      );
      const periodKey = new Date().toISOString().slice(0, 7);
      await tx.getConnection().execute(
        `update audio_assets.audio_generation_usage set
          consumed_credits = coalesce(consumed_credits, 0) + ?, success_count = success_count + 1, updated_at=now()
         where period_key=? and provider=?`,
        [input.consumedCredits ?? asset.budget_reserved_units ?? 0, periodKey, asset.provider],
        'run', tx.getTransactionContext(),
      );
    });
    const result = await this.findAssetById(input.assetId);
    if (!result) throw new Error('Asset generado no encontrado después de persistirlo');
    return result;
  }

  async markFailed(assetId: string, failureCode: string, retryable: boolean): Promise<void> {
    const status: AudioAssetStatus = retryable ? 'FAILED_RETRYABLE' : 'FAILED_PERMANENT';
    await this.em.transactional(async (tx) => {
      const rows = await tx.getConnection().execute<Array<{ generation_status: string; provider: string }>>(
        `select generation_status, provider from audio_assets.audio_assets where id=? for update`,
        [assetId], 'all', tx.getTransactionContext(),
      );
      const asset = rows[0];
      if (!asset || asset.generation_status === 'READY') return;
      await tx.getConnection().execute(
        `update audio_assets.audio_assets set generation_status=?, failure_code=?, updated_at=now() where id=?`,
        [status, failureCode, assetId], 'run', tx.getTransactionContext(),
      );
      const periodKey = new Date().toISOString().slice(0, 7);
      await tx.getConnection().execute(
        `update audio_assets.audio_generation_usage set failure_count=failure_count+1, updated_at=now()
         where period_key=? and provider=?`,
        [periodKey, asset.provider], 'run', tx.getTransactionContext(),
      );
    });
  }

  async markFallbackOnly(assetId: string, reason: string): Promise<void> {
    await this.em.nativeUpdate(AudioAssets, { id: assetId }, {
      generationStatus: 'FALLBACK_ONLY', failureCode: reason, updatedAt: new Date(),
    });
  }

  async appendEvent(input: GenerationEventInput): Promise<void> {
    const event = this.em.create(AudioGenerationEvents, {
      id: randomUUID(), assetKey: input.assetKey, eventType: input.eventType,
      provider: input.provider, templateKey: input.templateKey, outcome: input.outcome,
      errorCode: input.errorCode, durationMs: input.durationMs,
      estimatedCostUnits: input.estimatedCostUnits, correlationId: input.correlationId,
      metadata: input.metadata ?? {}, createdAt: new Date(),
    });
    await this.em.persistAndFlush(event);
  }

  dynamicFields(template: AudioTemplates): AudioDynamicField[] {
    return Array.isArray(template.dynamicFieldsJson) ? template.dynamicFieldsJson as AudioDynamicField[] : [];
  }
}
