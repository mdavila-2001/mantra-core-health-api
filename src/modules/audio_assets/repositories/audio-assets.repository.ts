import { Injectable, Optional } from '@nestjs/common';
import { StoragePublicationService } from '../../../common/storage/storage-publication.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import { loadStorageEnv } from '../../../common/storage/storage.env';
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
  releaseAudioGenerationBudget,
  reserveAudioGenerationBudget,
} from './audio-assets.repository.queries';
import type {
  CreateAudioAssetInput,
  GenerationEventInput,
  MarkAudioAssetReadyInput,
} from './audio-assets.repository.types';
@Injectable()
export class AudioAssetsRepository {
  constructor(
    private readonly em: EntityManager,
    @Optional() private readonly publication?: StoragePublicationService,
  ) {}

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

  /**
   * Binario ya generado que sirve para el mismo texto y perfil.
   *
   * `tenantId` acota la búsqueda al mismo alcance: reutilizar el binario de otro
   * tenant sería la misma filtración que compartir la fila, sólo por otra puerta.
   */
  findReusableReady(
    renderedTextHash: string,
    profile: AudioSynthesisProfile,
    tenantId?: string,
  ): Promise<AudioAssets | null> {
    return findReusableReadyAudioAsset(
      this.em,
      renderedTextHash,
      profile,
      tenantId,
    );
  }

  /** La constraint UNIQUE(asset_key) es la garantía final frente a carreras. */
  async createPendingOrGet(input: CreateAudioAssetInput): Promise<AudioAssets> {
    const now = new Date();
    await this.em.getConnection().execute(
      `insert into audio_assets.audio_assets (
        id, asset_key, tenant_id, template_key, template_version, strategy, language, normalized_value_hash,
        display_value_encrypted, rendered_text_hash, provider, provider_model, voice_profile,
        voice_provider_ref, voice_version, normalizer_version, audio_format, sample_rate,
        generation_status, use_count, metadata, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?::jsonb, ?, ?)
      on conflict (asset_key) do nothing`,
      [
        randomUUID(),
        input.assetKey,
        input.tenantId ?? null,
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
    if (loadStorageEnv().lifecycleBinding && !this.publication)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
    const write = async (tx: EntityManager) => {
      let physicalIdentity;
      if (this.publication?.protectedNamespace) {
        await this.publication.lockNamespace(tx);
        const target = await tx.findOne(
          AudioAssets,
          { id: assetId },
          { refresh: true },
        );
        const persistedSource = await tx.findOne(
          AudioAssets,
          { id: source.id },
          { refresh: true },
        );
        if (
          !target?.tenantId ||
          !persistedSource ||
          target.tenantId !== persistedSource.tenantId ||
          persistedSource.generationStatus !== 'READY' ||
          persistedSource.storageKey !== source.storageKey ||
          !source.storageKey ||
          !source.checksumSha256 ||
          !source.bytes
        )
          throw new StorageLifecycleDenied('PRODUCER_OWNERSHIP_UNKNOWN');
        physicalIdentity = await this.publication.guardLocator(
          tx,
          source.storageKey,
          {
            contentHash: source.checksumSha256,
            sizeBytes: Number(source.bytes),
          },
        );
      }
      await tx.getConnection().execute(
        `update audio_assets.audio_assets set storage_provider=?, storage_key=?, bytes=?, duration_ms=?, checksum_sha256=?,
       generation_status='READY', failure_code=null, generated_at=coalesce(generated_at, now()), updated_at=now(),
       metadata=coalesce(metadata, '{}'::jsonb) || ?::jsonb where id=? and generation_status<>'READY'`,
        [
          source.storageProvider ?? null,
          source.storageKey ?? null,
          source.bytes ?? null,
          source.durationMs ?? null,
          source.checksumSha256 ?? null,
          JSON.stringify({
            reusedFromAssetId: source.id,
            ...(physicalIdentity
              ? { storagePhysicalIdentity: physicalIdentity }
              : {}),
          }),
          assetId,
        ],
        'run',
        tx.getTransactionContext(),
      );
      const result = await tx.findOne(
        AudioAssets,
        { id: assetId },
        { refresh: true },
      );
      if (!result) throw new Error('Asset reutilizado no encontrado');
      return result;
    };
    return this.em.transactional(write);
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

  markReady(
    input: MarkAudioAssetReadyInput,
    publicationTx?: EntityManager,
  ): Promise<AudioAssets> {
    if (loadStorageEnv().lifecycleBinding && !publicationTx)
      throw new StorageLifecycleDenied('PUBLICATION_TRANSACTION_REQUIRED');
    return markAudioAssetReady(this.em, input, publicationTx);
  }

  /**
   * Registra el fallo y, si es terminal, **devuelve la reserva al presupuesto**.
   *
   * La devolución sólo ocurre en el fallo permanente: uno reintentable conserva su
   * reserva porque el siguiente intento la va a usar, y devolverla ahí abriría una
   * ventana en la que otro asset podría quedarse con ese crédito y dejar a este sin
   * poder terminar.
   *
   * @returns unidades devueltas al presupuesto (`0` si no había reserva viva).
   */
  async markFailed(
    assetId: string,
    failureCode: string,
    retryable: boolean,
  ): Promise<number> {
    const status: AudioAssetStatus = retryable
      ? 'FAILED_RETRYABLE'
      : 'FAILED_PERMANENT';
    await this.em.nativeUpdate(
      AudioAssets,
      { id: assetId, generationStatus: { $ne: 'READY' } },
      { generationStatus: status, failureCode, updatedAt: new Date() },
    );
    return retryable ? 0 : this.releaseBudget(assetId);
  }

  /**
   * Deja el asset servido sólo por fallback y devuelve su reserva.
   *
   * Es un estado terminal igual que el fallo permanente —el asset ya no se va a
   * generar—, así que retener su crédito estimado tendría el mismo efecto: agotar
   * el presupuesto del mes con generaciones que no ocurrieron.
   */
  async markFallbackOnly(assetId: string, reason: string): Promise<number> {
    await this.em.nativeUpdate(
      AudioAssets,
      { id: assetId, generationStatus: { $ne: 'READY' } },
      {
        generationStatus: 'FALLBACK_ONLY',
        failureCode: reason,
        updatedAt: new Date(),
      },
    );
    return this.releaseBudget(assetId);
  }

  releaseBudget(assetId: string): Promise<number> {
    return releaseAudioGenerationBudget(this.em, assetId);
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
