import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import type {
  AudioDynamicField,
  AudioSynthesisProfile,
} from '../domain/audio.types';
import { AudioAssets, AudioTemplates } from '../entities';
import type { MarkAudioAssetReadyInput } from './audio-assets.repository.types';

export function listEnabledAudioTemplates(
  em: EntityManager,
  templateKeys?: string[],
): Promise<AudioTemplates[]> {
  const where = templateKeys?.length
    ? { enabled: true, templateKey: { $in: templateKeys } }
    : { enabled: true };
  return em.find(AudioTemplates, where, {
    orderBy: { templateKey: 'ASC', version: 'DESC' },
  });
}

export function getAudioDynamicFields(
  template: AudioTemplates,
): AudioDynamicField[] {
  return Array.isArray(template.dynamicFieldsJson)
    ? (template.dynamicFieldsJson as AudioDynamicField[])
    : [];
}

export async function findReusableReadyAudioAsset(
  em: EntityManager,
  renderedTextHash: string,
  profile: AudioSynthesisProfile,
): Promise<AudioAssets | null> {
  const rows = await em.getConnection().execute<Array<{ id: string }>>(
    `select id from audio_assets.audio_assets where rendered_text_hash=? and language=? and provider=?
     and provider_model=? and voice_profile=? and voice_provider_ref is not distinct from ? and voice_version=?
     and normalizer_version=? and audio_format=? and sample_rate is not distinct from ?
     and generation_status='READY' and storage_key is not null
     order by generated_at desc nulls last limit 1`,
    [
      renderedTextHash,
      profile.language,
      profile.provider,
      profile.providerModel,
      profile.voiceProfile,
      profile.providerVoiceRef || null,
      profile.voiceVersion,
      profile.normalizerVersion,
      profile.audioFormat,
      profile.sampleRate,
    ],
    'all',
  );
  return rows[0] ? em.findOne(AudioAssets, { id: rows[0].id }) : null;
}

export async function countQueuedAudioJobsByActorSince(
  em: EntityManager,
  actorHash: string,
  since: Date,
): Promise<number> {
  const rows = await em.getConnection().execute<Array<{ count: number }>>(
    `select count(*)::int as count from audio_assets.audio_generation_events
     where event_type='GENERATION_QUEUED' and created_at>=? and metadata->>'actorHash'=?`,
    [since, actorHash],
    'all',
  );
  return rows[0]?.count ?? 0;
}

export async function reserveAudioGenerationBudget(
  em: EntityManager,
  assetId: string,
  periodKey: string,
  provider: string,
  units: number,
  usableLimit: number,
): Promise<boolean> {
  return em.transactional(async (tx) => {
    const rows = await tx.getConnection().execute<
      Array<{
        generation_status: string;
        budget_reserved_units: number | null;
      }>
    >(`select generation_status, budget_reserved_units from audio_assets.audio_assets where id=? for update`, [assetId], 'all', tx.getTransactionContext());
    const asset = rows[0];
    if (!asset) return false;
    if (asset.generation_status === 'READY') return true;
    if (asset.budget_reserved_units !== null) {
      await tx
        .getConnection()
        .execute(
          `update audio_assets.audio_assets set generation_status='GENERATING', updated_at=now() where id=?`,
          [assetId],
          'run',
          tx.getTransactionContext(),
        );
      return true;
    }
    if (units > usableLimit) return false;
    const reserved = await tx
      .getConnection()
      .execute<Array<{ estimated_credits: number }>>(
        `insert into audio_assets.audio_generation_usage (id, period_key, provider, estimated_credits, consumed_credits,
       request_count, success_count, failure_count, created_at, updated_at) values (?, ?, ?, ?, 0, 1, 0, 0, now(), now())
       on conflict (period_key, provider) do update set estimated_credits=audio_generation_usage.estimated_credits+excluded.estimated_credits,
       request_count=audio_generation_usage.request_count+1, updated_at=now()
       where audio_generation_usage.estimated_credits+excluded.estimated_credits<=? returning estimated_credits`,
        [randomUUID(), periodKey, provider, units, usableLimit],
        'all',
        tx.getTransactionContext(),
      );
    if (reserved.length === 0) return false;
    await tx
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set budget_reserved_units=?, generation_status='GENERATING', updated_at=now() where id=?`,
        [units, assetId],
        'run',
        tx.getTransactionContext(),
      );
    return true;
  });
}

export async function markAudioAssetReady(
  em: EntityManager,
  input: MarkAudioAssetReadyInput,
): Promise<AudioAssets> {
  await em.transactional(async (tx) => {
    const rows = await tx.getConnection().execute<
      Array<{
        generation_status: string;
        budget_reserved_units: number | null;
        provider: string;
      }>
    >(`select generation_status, budget_reserved_units, provider from audio_assets.audio_assets where id=? for update`, [input.assetId], 'all', tx.getTransactionContext());
    const asset = rows[0];
    if (!asset || asset.generation_status === 'READY') return;
    await tx
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?, generation_status='READY', failure_code=null, generated_at=now(), updated_at=now() where id=?`,
        [
          input.storageUri.startsWith('s3://') ? 's3' : 'local',
          input.storageUri,
          input.bytes,
          input.durationMs ?? null,
          input.checksum,
          input.assetId,
        ],
        'run',
        tx.getTransactionContext(),
      );
    await tx
      .getConnection()
      .execute(
        `update audio_assets.audio_generation_usage set consumed_credits=coalesce(consumed_credits,0)+?, success_count=success_count+1, updated_at=now() where period_key=? and provider=?`,
        [
          input.consumedCredits ?? asset.budget_reserved_units ?? 0,
          new Date().toISOString().slice(0, 7),
          asset.provider,
        ],
        'run',
        tx.getTransactionContext(),
      );
  });
  const result = await em.findOne(AudioAssets, { id: input.assetId });
  if (!result) throw new Error('Asset READY no encontrado');
  return result;
}
