import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import {
  isKnownPhysicalIdentity,
  samePhysicalObject,
} from '../../../common/storage/physical-object-identity';
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
  tenantId?: string,
): Promise<AudioAssets | null> {
  const rows = await em.getConnection().execute<Array<{ id: string }>>(
    // `is not distinct from` y no `=`: con tenant compartido el valor es NULL, y
    // `tenant_id = NULL` no es cierto para ninguna fila — la reutilización de los
    // audios compartidos, que es la que más ahorra, dejaría de funcionar.
    `select id from audio_assets.audio_assets where rendered_text_hash=? and tenant_id is not distinct from ?
     and language=? and provider=?
     and provider_model=? and voice_profile=? and voice_provider_ref is not distinct from ? and voice_version=?
     and normalizer_version=? and audio_format=? and sample_rate is not distinct from ?
     and generation_status='READY' and storage_key is not null
     order by generated_at desc nulls last limit 1`,
    [
      renderedTextHash,
      tenantId ?? null,
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
    // La ventana se persiste junto a la reserva: la liquidación y la devolución
    // ocurren después y pueden caer en otro mes. Sin esto, un asset reservado el
    // día 31 y generado el 1 imputa su consumo a una ventana que no tiene fila de
    // reserva, el UPDATE no afecta nada y el mes anterior se queda con crédito
    // apartado que nadie devuelve.
    await tx
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set budget_reserved_units=?, budget_period_key=?, generation_status='GENERATING', updated_at=now() where id=?`,
        [units, periodKey, assetId],
        'run',
        tx.getTransactionContext(),
      );
    return true;
  });
}

export async function markAudioAssetReady(
  em: EntityManager,
  input: MarkAudioAssetReadyInput,
  publicationTx?: EntityManager,
): Promise<AudioAssets> {
  const publish = async (tx: EntityManager) => {
    const rows = await tx.getConnection().execute<
      Array<{
        generation_status: string;
        budget_reserved_units: number | null;
        budget_period_key: string | null;
        provider: string;
        storage_key: string | null;
        checksum_sha256: string | null;
        bytes: number | null;
        metadata: { storagePhysicalIdentity?: unknown } | null;
      }>
    >(`select generation_status, budget_reserved_units, budget_period_key, provider, storage_key, checksum_sha256, bytes, metadata from audio_assets.audio_assets where id=? for update`, [input.assetId], 'all', tx.getTransactionContext());
    const asset = rows[0];
    if (!asset) throw new StorageLifecycleDenied('PUBLICATION_TARGET_MISSING');
    if (asset.generation_status === 'READY') {
      if (
        asset.storage_key !== input.storageUri ||
        asset.checksum_sha256 !== input.checksum ||
        Number(asset.bytes) !== input.bytes
      )
        throw new StorageLifecycleDenied('PUBLICATION_REPLAY_MISMATCH');
      if (
        input.physicalIdentity &&
        (!isKnownPhysicalIdentity(asset.metadata?.storagePhysicalIdentity) ||
          !samePhysicalObject(
            input.physicalIdentity,
            asset.metadata.storagePhysicalIdentity,
          ) ||
          input.physicalIdentity.bindingRevision !==
            asset.metadata.storagePhysicalIdentity.bindingRevision)
      )
        throw new StorageLifecycleDenied(
          'PUBLICATION_REPLAY_IDENTITY_MISMATCH',
        );
      return;
    }
    await tx.getConnection().execute(
      // `budget_reserved_units` se pone a NULL en el mismo paso: es lo que hace
      // que la devolución de reserva sea exactamente-una-vez. Un fallo posterior
      // sobre un asset ya READY leería NULL y no devolvería nada al presupuesto.
      `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?, metadata=coalesce(metadata, '{}'::jsonb) || ?::jsonb, generation_status='READY', failure_code=null, budget_reserved_units=null, generated_at=now(), updated_at=now() where id=?`,
      [
        input.storageUri.startsWith('s3://') ? 's3' : 'local',
        input.storageUri,
        input.bytes,
        input.durationMs ?? null,
        input.checksum,
        JSON.stringify(
          input.physicalIdentity
            ? { storagePhysicalIdentity: input.physicalIdentity }
            : {},
        ),
        input.assetId,
      ],
      'run',
      tx.getTransactionContext(),
    );
    await tx.getConnection().execute(
      `update audio_assets.audio_generation_usage set consumed_credits=coalesce(consumed_credits,0)+?, success_count=success_count+1, updated_at=now() where period_key=? and provider=?`,
      [
        input.consumedCredits ?? asset.budget_reserved_units ?? 0,
        // La ventana de la reserva, no la del reloj: ver `budget_period_key`.
        // El `??` cubre las filas creadas antes de que existiera la columna.
        asset.budget_period_key ?? currentPeriodKey(),
        asset.provider,
      ],
      'run',
      tx.getTransactionContext(),
    );
  };
  if (publicationTx) await publish(publicationTx);
  else await em.transactional(publish);
  const result = await (publicationTx ?? em).findOne(
    AudioAssets,
    { id: input.assetId },
    { refresh: true },
  );
  if (!result) throw new Error('Asset READY no encontrado');
  return result;
}

/**
 * Devuelve al presupuesto una reserva que ya nunca se va a gastar.
 *
 * Existe porque `estimated_credits` sólo crecía: un asset que fallaba de forma
 * permanente dejaba apartado para siempre el crédito que estimó consumir, así que
 * una racha de fallos del proveedor agotaba el presupuesto del mes **sin haber
 * generado un solo audio** y todo acababa degradando a `FALLBACK` sin explicación.
 *
 * La lectura y la puesta a NULL ocurren en la misma transacción con la fila
 * bloqueada (`for update`), de modo que dos caminos que intenten devolver la misma
 * reserva —el marcado de fallo permanente y el de "sólo fallback"— sólo pueden
 * tener éxito una vez; el segundo lee NULL y no devuelve nada.
 *
 * @returns unidades devueltas; `0` si no había reserva viva.
 */
export async function releaseAudioGenerationBudget(
  em: EntityManager,
  assetId: string,
): Promise<number> {
  return em.transactional(async (tx) => {
    const rows = await tx.getConnection().execute<
      Array<{
        budget_reserved_units: number | null;
        budget_period_key: string | null;
        provider: string;
      }>
    >(`select budget_reserved_units, budget_period_key, provider from audio_assets.audio_assets where id=? for update`, [assetId], 'all', tx.getTransactionContext());
    const asset = rows[0];
    const reserved = asset?.budget_reserved_units ?? 0;
    if (!asset || reserved <= 0) return 0;

    await tx
      .getConnection()
      .execute(
        `update audio_assets.audio_assets set budget_reserved_units=null, updated_at=now() where id=?`,
        [assetId],
        'run',
        tx.getTransactionContext(),
      );
    // `greatest(0, …)` protege la invariante de la columna frente a una doble
    // devolución que el bloqueo no alcanzara: preferimos un contador que no baja
    // de cero a una transacción abortada en el camino de un fallo.
    await tx.getConnection().execute(
      `update audio_assets.audio_generation_usage
            set estimated_credits=greatest(0, estimated_credits-?), failure_count=failure_count+1, updated_at=now()
          where period_key=? and provider=?`,
      [reserved, asset.budget_period_key ?? currentPeriodKey(), asset.provider],
      'run',
      tx.getTransactionContext(),
    );
    return reserved;
  });
}

/** Ventana mensual del reloj, en UTC. Sólo como red para filas sin ventana persistida. */
function currentPeriodKey(): string {
  return new Date().toISOString().slice(0, 7);
}
