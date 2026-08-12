import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AudioAssets, AudioTemplates } from '../entities';
import type {
  AudioAssetRecord,
  AudioRenderIdentity,
  AudioTemplateRecord,
  AudioTemplateStrategy,
} from '../domain/audio.types';

/** Alta de un asset pendiente de generar. */
export interface NewAudioAsset extends AudioRenderIdentity {
  id: string;
  assetKey: string;
  tenantId?: string;
  templateCode: string;
  templateVersion: number;
  renderedTextEncrypted: string;
  providerModel: string;
  reservedUnits: number;
  correlationId?: string;
}

export interface ClaimBatchInput {
  claimedBy: string;
  leaseSeconds: number;
  maxAttempts: number;
  limit: number;
}

export interface MarkReadyInput {
  assetId: string;
  storageUri: string;
  mimeType: string;
  checksumSha256: string;
  bytes: number;
  usageUnits: number;
  provider: string;
  monthKey: string;
}

/** Asset que agotó sus intentos y hay que cerrar liberando su reserva. */
export interface ExhaustedAudioAsset {
  id: string;
  provider: string;
  reservedUnits: number;
  createdAt: Date;
  lastErrorCode?: string;
}

/**
 * Acceso a datos de `audio_tts.audio_assets` y `audio_tts.audio_templates`.
 *
 * Stateless: cada método recibe el `EntityManager` activo, de modo que el
 * servicio controla la unidad de trabajo. Las operaciones que deciden quién gana
 * una carrera (`createPendingIfMissing`, `claimBatch`, `markReady`) van en SQL
 * directo y no por el ORM: su corrección depende de que la comprobación y la
 * escritura ocurran en la **misma** sentencia, y un `find` seguido de un
 * `persist` deja entre las dos exactamente la ventana que hay que cerrar.
 */
@Injectable()
export class AudioAssetsRepository {
  /**
   * Reclama un lote de assets generables y toma su lease.
   *
   * La subconsulta con `FOR UPDATE SKIP LOCKED` es lo que permite que N workers
   * (o N ticks solapados del mismo) trabajen sobre la misma tabla sin disputarse
   * filas: cada uno se lleva las que nadie tiene bloqueadas. Es la misma
   * mecánica del relevo del outbox de `messaging`.
   *
   * Un asset es elegible cuando:
   *   - está `PENDING` o `FAILED_RETRYABLE` y su espera de reintento ya pasó, o
   *   - está `GENERATING` pero su lease expiró — el worker que lo tenía murió.
   *
   * En los dos casos se exige `attempts < maxAttempts`. Los que superan el techo
   * los cierra `sweepExhausted`, no este método: cerrarlos aquí mezclaría
   * "reclamar trabajo" con "liberar presupuesto" en una sentencia que corre en el
   * camino caliente.
   */
  async claimBatch(
    em: EntityManager,
    input: ClaimBatchInput,
  ): Promise<AudioAssetRecord[]> {
    const rows = await em.getConnection().execute<AudioAssetRow[]>(
      `UPDATE audio_tts.audio_assets a
            SET status = 'GENERATING',
                claimed_at = now(),
                claimed_by = ?,
                attempts = a.attempts + 1,
                last_error_code = NULL,
                updated_at = now()
          WHERE a.id IN (
                  SELECT id
                    FROM audio_tts.audio_assets
                   WHERE attempts < ?
                     AND (
                           (status IN ('PENDING', 'FAILED_RETRYABLE')
                            AND (next_attempt_at IS NULL OR next_attempt_at <= now()))
                        OR (status = 'GENERATING'
                            AND (claimed_at IS NULL
                                 OR claimed_at < now() - make_interval(secs => ?)))
                         )
                   ORDER BY created_at
                     FOR UPDATE SKIP LOCKED
                   LIMIT ?
                )
      RETURNING a.*`,
      [input.claimedBy, input.maxAttempts, input.leaseSeconds, input.limit],
      'all',
      em.getTransactionContext(),
    );
    return (rows ?? []).map(toAssetRecord);
  }

  /**
   * Crea el asset pendiente, o devuelve el que ya existía.
   *
   * `ON CONFLICT (asset_key) DO NOTHING` convierte la carrera entre dos
   * peticiones del mismo audio en una sola generación: la perdedora no ve filas,
   * lee la ganadora y se adhiere. Sin esta forma, ambas insertarían y el audio se
   * pagaría dos veces (o una fallaría con un error crudo de unicidad).
   */
  async createPendingIfMissing(
    em: EntityManager,
    input: NewAudioAsset,
  ): Promise<{ asset: AudioAssetRecord; created: boolean }> {
    const inserted = await em.getConnection().execute<AudioAssetRow[]>(
      `INSERT INTO audio_tts.audio_assets (
           id, asset_key, tenant_id, template_code, template_version, status,
           rendered_text_encrypted, language, provider, provider_model,
           provider_voice_ref, voice_profile, voice_version, output_format,
           sample_rate, reserved_units, attempts, correlation_id,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, now(), now())
         ON CONFLICT (asset_key) DO NOTHING
         RETURNING *`,
      [
        input.id,
        input.assetKey,
        input.tenantId ?? null,
        input.templateCode,
        input.templateVersion,
        input.renderedTextEncrypted,
        input.language,
        input.provider,
        input.providerModel,
        input.providerVoiceRef,
        input.voiceProfile,
        input.voiceVersion,
        input.outputFormat,
        input.sampleRate,
        input.reservedUnits,
        input.correlationId ?? null,
      ],
      'all',
      em.getTransactionContext(),
    );

    const row = inserted?.[0];
    if (row) return { asset: toAssetRecord(row), created: true };

    const existing = await this.findByAssetKey(em, input.assetKey);
    if (!existing) {
      // La fila desapareció entre el conflicto y la lectura. No es un caso
      // esperable, y devolver "creado" mentiría sobre quién es el dueño de la
      // reserva de presupuesto.
      throw new Error(
        `Conflicto de asset_key ${input.assetKey} sin fila correspondiente: estado inconsistente`,
      );
    }
    return { asset: existing, created: false };
  }

  /**
   * Marca el asset como listo y registra su consumo, en una transacción.
   *
   * @returns `firstTime: false` si el asset ya estaba `READY`: este pase es un
   *          duplicado y el llamador **no** debe volver a imputar presupuesto.
   *          `reservedUnits` es lo que la fila tenía apartado antes de este
   *          marcado, que es exactamente lo que hay que liquidar.
   *
   * La reserva se pone a cero en la misma sentencia que la lee (`prev` bloquea la
   * fila con `FOR UPDATE`). Devolverla desde el `RETURNING` del propio UPDATE
   * daría el valor ya puesto a cero, y la liquidación restaría 0 dejando las
   * unidades apartadas para siempre.
   */
  async markReady(
    em: EntityManager,
    input: MarkReadyInput,
  ): Promise<{ firstTime: boolean; reservedUnits: number }> {
    return em.transactional(async (tx) => {
      const updated = await tx
        .getConnection()
        .execute<{ reserved_units: number }[]>(
          `WITH prev AS (
           SELECT id, reserved_units
             FROM audio_tts.audio_assets
            WHERE id = ? AND status <> 'READY'
              FOR UPDATE
         ), upd AS (
           UPDATE audio_tts.audio_assets a
              SET status = 'READY',
                  storage_uri = ?,
                  mime_type = ?,
                  checksum_sha256 = ?,
                  bytes = ?,
                  last_error_code = NULL,
                  claimed_at = NULL,
                  claimed_by = NULL,
                  next_attempt_at = NULL,
                  reserved_units = 0,
                  updated_at = now()
             FROM prev
            WHERE a.id = prev.id
          RETURNING a.id
         )
         SELECT prev.reserved_units
           FROM prev
           JOIN upd ON upd.id = prev.id`,
          [
            input.assetId,
            input.storageUri,
            input.mimeType,
            input.checksumSha256,
            input.bytes,
          ],
          'all',
          tx.getTransactionContext(),
        );

      // El consumo se inserta siempre, no solo cuando el UPDATE cambió algo: el
      // UNIQUE de `asset_id` es quien garantiza que no se duplique, y así un
      // reproceso que llegó tarde deja igualmente registrado el gasto si el
      // primer pase murió entre el UPDATE y este INSERT.
      await tx.getConnection().execute(
        `INSERT INTO audio_tts.audio_generation_usage
           (id, asset_id, provider, usage_units, month_key, created_at)
         VALUES (gen_random_uuid(), ?, ?, ?, ?, now())
         ON CONFLICT (asset_id) DO NOTHING`,
        [input.assetId, input.provider, input.usageUnits, input.monthKey],
        'run',
        tx.getTransactionContext(),
      );

      const row = updated?.[0];
      return {
        firstTime: row !== undefined,
        reservedUnits: Number(row?.reserved_units ?? 0),
      };
    });
  }

  /**
   * Pone a cero la reserva de un asset y devuelve lo que tenía apartado.
   *
   * Es la primitiva que hace que la compensación de presupuesto sea **exactamente
   * una vez**: el bloqueo de fila y la puesta a cero ocurren en la misma
   * sentencia, así que dos caminos que intenten liberar la misma reserva —el
   * marcado de fallo permanente y el barrido de agotados— solo pueden tener éxito
   * una vez; el segundo lee 0 y no devuelve nada al presupuesto.
   */
  async releaseReservation(
    em: EntityManager,
    assetId: string,
  ): Promise<number> {
    const rows = await em.getConnection().execute<{ reserved_units: number }[]>(
      `WITH prev AS (
         SELECT id, reserved_units
           FROM audio_tts.audio_assets
          WHERE id = ? AND reserved_units > 0
            FOR UPDATE
       ), upd AS (
         UPDATE audio_tts.audio_assets a
            SET reserved_units = 0, updated_at = now()
           FROM prev
          WHERE a.id = prev.id
        RETURNING a.id
       )
       SELECT prev.reserved_units
         FROM prev
         JOIN upd ON upd.id = prev.id`,
      [assetId],
      'all',
      em.getTransactionContext(),
    );
    return Number(rows?.[0]?.reserved_units ?? 0);
  }

  /**
   * Registra un fallo.
   *
   * Un fallo transitorio programa el siguiente intento (`next_attempt_at`) en vez
   * de dejar la fila inmediatamente reclamable: sin esa espera, el tick siguiente
   * —cinco segundos después— consumiría otro intento contra el mismo proveedor
   * caído, y los cuatro intentos del asset se agotarían en veinte segundos.
   *
   * El `WHERE status <> 'READY'` protege el caso en que el marcado de éxito llegó
   * por otra vía: un asset con audio válido no puede pasar a fallido.
   */
  async markFailed(
    em: EntityManager,
    assetId: string,
    code: string,
    retryable: boolean,
    retryDelaySeconds: number,
  ): Promise<void> {
    await em.getConnection().execute(
      `UPDATE audio_tts.audio_assets
          SET status = ?,
              last_error_code = ?,
              claimed_at = NULL,
              claimed_by = NULL,
              next_attempt_at = CASE WHEN ?::boolean THEN now() + make_interval(secs => ?) ELSE NULL END,
              updated_at = now()
        WHERE id = ? AND status <> 'READY'`,
      [
        retryable ? 'FAILED_RETRYABLE' : 'FAILED_PERMANENT',
        code,
        retryable,
        retryDelaySeconds,
        assetId,
      ],
      'run',
      em.getTransactionContext(),
    );
  }

  /**
   * Cierra los assets que ya no volverán a intentarse y devuelve lo necesario
   * para compensar su reserva de presupuesto.
   *
   * Cubre los dos caminos por los que un asset agota sus intentos:
   *   - falló y quedó `FAILED_RETRYABLE` con el techo alcanzado;
   *   - se quedó `GENERATING` porque el proceso murió durante la generación, y su
   *     lease ya expiró.
   *
   * El segundo es el que hace imprescindible este barrido: nadie lo reportaría, y
   * su reserva quedaría apartada del presupuesto para siempre.
   */
  async sweepExhausted(
    em: EntityManager,
    maxAttempts: number,
    leaseSeconds: number,
    limit: number,
  ): Promise<ExhaustedAudioAsset[]> {
    const rows = await em.getConnection().execute<
      {
        id: string;
        provider: string;
        reserved_units: number;
        created_at: Date;
        last_error_code: string | null;
      }[]
    >(
      // El CTE captura los valores **antes** del UPDATE y el SELECT final solo
      // devuelve los que la escritura confirmó. Leer `reserved_units` desde el
      // `RETURNING` del propio UPDATE devolvería el valor ya puesto a cero, y la
      // compensación de presupuesto liberaría 0 unidades sin que nada fallara.
      `WITH candidates AS (
         SELECT id, provider, reserved_units, created_at, last_error_code
           FROM audio_tts.audio_assets
          WHERE attempts >= ?
            AND (
                  status = 'FAILED_RETRYABLE'
               OR (status = 'GENERATING'
                   AND claimed_at IS NOT NULL
                   AND claimed_at < now() - make_interval(secs => ?))
                )
          ORDER BY updated_at
            FOR UPDATE SKIP LOCKED
          LIMIT ?
       ), closed AS (
         UPDATE audio_tts.audio_assets a
            SET status = 'FAILED_PERMANENT',
                last_error_code = COALESCE(a.last_error_code, 'AUDIO_MAX_ATTEMPTS_REACHED'),
                claimed_at = NULL,
                claimed_by = NULL,
                next_attempt_at = NULL,
                reserved_units = 0,
                updated_at = now()
           FROM candidates c
          WHERE a.id = c.id
        RETURNING a.id
       )
       SELECT c.id, c.provider, c.reserved_units, c.created_at, c.last_error_code
         FROM candidates c
         JOIN closed ON closed.id = c.id`,
      [maxAttempts, leaseSeconds, limit],
      'all',
      em.getTransactionContext(),
    );

    return (rows ?? []).map((row) => ({
      id: row.id,
      provider: row.provider,
      reservedUnits: Number(row.reserved_units ?? 0),
      createdAt: new Date(row.created_at),
      lastErrorCode: row.last_error_code ?? undefined,
    }));
  }

  /**
   * Cuenta los assets sin progreso pasado el umbral.
   *
   * No corrige nada: es la señal de que el worker no está corriendo o que el
   * proveedor lleva rato caído. Sin ella, una cola que crece es indistinguible de
   * una cola vacía desde fuera.
   */
  async countStalled(em: EntityManager, staleSeconds: number): Promise<number> {
    const rows = await em.getConnection().execute<{ total: string }[]>(
      `SELECT count(*)::text AS total
         FROM audio_tts.audio_assets
        WHERE status IN ('PENDING', 'FAILED_RETRYABLE')
          AND updated_at < now() - make_interval(secs => ?)`,
      [staleSeconds],
      'all',
      em.getTransactionContext(),
    );
    return Number(rows?.[0]?.total ?? 0);
  }

  /** Profundidad de la cola por estado, para la sonda y el diagnóstico. */
  async statusCounts(em: EntityManager): Promise<Record<string, number>> {
    const rows = await em
      .getConnection()
      .execute<{ status: string; total: string }[]>(
        `SELECT status, count(*)::text AS total
         FROM audio_tts.audio_assets
        GROUP BY status`,
        [],
        'all',
        em.getTransactionContext(),
      );
    const counts: Record<string, number> = {};
    for (const row of rows ?? []) counts[row.status] = Number(row.total);
    return counts;
  }

  async findTemplate(
    em: EntityManager,
    code: string,
  ): Promise<AudioTemplateRecord | null> {
    const row = await em.findOne(AudioTemplates, { code });
    return row ? toTemplateRecord(row) : null;
  }

  async findReadyByAssetKey(
    em: EntityManager,
    assetKey: string,
  ): Promise<AudioAssetRecord | null> {
    const row = await em.findOne(AudioAssets, { assetKey, status: 'READY' });
    return row ? toAssetRecordFromEntity(row) : null;
  }

  async findByAssetKey(
    em: EntityManager,
    assetKey: string,
  ): Promise<AudioAssetRecord | null> {
    const row = await em.findOne(AudioAssets, { assetKey });
    return row ? toAssetRecordFromEntity(row) : null;
  }

  async findById(
    em: EntityManager,
    assetId: string,
  ): Promise<AudioAssetRecord | null> {
    const row = await em.findOne(AudioAssets, { id: assetId });
    return row ? toAssetRecordFromEntity(row) : null;
  }

  /**
   * Fallback listo, filtrado por la identidad **completa**.
   *
   * Sin filtrar por idioma, voz, modelo y formato se serviría como degradación un
   * audio de otro idioma o de la voz anterior: técnicamente hay audio, y el
   * usuario oye algo que no corresponde. El tenant entra igual: un fallback
   * compartido (`tenant_id IS NULL`) vale para todos, pero uno de otro tenant no.
   */
  async findReadyFallback(
    em: EntityManager,
    templateCode: string,
    identity: AudioRenderIdentity,
    tenantId?: string,
  ): Promise<AudioAssetRecord | null> {
    const row = await em.findOne(
      AudioAssets,
      {
        templateCode,
        status: 'READY',
        language: identity.language,
        provider: identity.provider,
        providerModel: identity.model,
        providerVoiceRef: identity.providerVoiceRef,
        voiceProfile: identity.voiceProfile,
        voiceVersion: identity.voiceVersion,
        outputFormat: identity.outputFormat,
        sampleRate: identity.sampleRate,
        $or: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
      { orderBy: { createdAt: 'desc' } },
    );
    return row ? toAssetRecordFromEntity(row) : null;
  }

  /** Alta o actualización idempotente de una plantilla (catálogo de arranque). */
  async upsertTemplate(
    em: EntityManager,
    template: AudioTemplateRecord,
  ): Promise<void> {
    await em.getConnection().execute(
      `INSERT INTO audio_tts.audio_templates
         (code, version, strategy, template_text, language, fallback_template_code,
          is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, now(), now())
       ON CONFLICT (code) DO UPDATE
          SET version = excluded.version,
              strategy = excluded.strategy,
              template_text = excluded.template_text,
              language = excluded.language,
              fallback_template_code = excluded.fallback_template_code,
              is_active = excluded.is_active`,
      [
        template.code,
        template.version,
        template.strategy,
        template.templateText,
        template.language ?? null,
        template.fallbackTemplateCode ?? null,
        template.isActive,
      ],
      'run',
      em.getTransactionContext(),
    );
  }
}

/** Fila cruda tal como la devuelve PostgreSQL. */
interface AudioAssetRow {
  id: string;
  asset_key: string;
  tenant_id: string | null;
  template_code: string;
  template_version: number;
  status: string;
  rendered_text_encrypted: string;
  language: string;
  provider: string;
  provider_model: string;
  provider_voice_ref: string;
  voice_profile: string;
  voice_version: number;
  output_format: string;
  sample_rate: number;
  reserved_units: number;
  attempts: number;
  correlation_id: string | null;
  claimed_at: Date | null;
  claimed_by: string | null;
  next_attempt_at: Date | null;
  storage_uri: string | null;
  mime_type: string | null;
  checksum_sha256: string | null;
  bytes: number | null;
  last_error_code: string | null;
  created_at: Date;
  updated_at: Date;
}

function toAssetRecord(row: AudioAssetRow): AudioAssetRecord {
  return {
    id: row.id,
    assetKey: row.asset_key,
    tenantId: row.tenant_id ?? undefined,
    templateCode: row.template_code,
    templateVersion: Number(row.template_version),
    status: row.status as AudioAssetRecord['status'],
    renderedTextEncrypted: row.rendered_text_encrypted,
    language: row.language,
    provider: row.provider,
    model: row.provider_model,
    providerModel: row.provider_model,
    providerVoiceRef: row.provider_voice_ref,
    voiceProfile: row.voice_profile,
    voiceVersion: Number(row.voice_version),
    outputFormat: row.output_format,
    sampleRate: Number(row.sample_rate),
    reservedUnits: Number(row.reserved_units),
    attempts: Number(row.attempts),
    correlationId: row.correlation_id ?? undefined,
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : undefined,
    claimedBy: row.claimed_by ?? undefined,
    storageUri: row.storage_uri ?? undefined,
    mimeType: row.mime_type ?? undefined,
    checksumSha256: row.checksum_sha256 ?? undefined,
    bytes: row.bytes === null ? undefined : Number(row.bytes),
    lastErrorCode: row.last_error_code ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toAssetRecordFromEntity(entity: AudioAssets): AudioAssetRecord {
  return {
    id: entity.id,
    assetKey: entity.assetKey,
    tenantId: entity.tenantId,
    templateCode: entity.templateCode,
    templateVersion: entity.templateVersion,
    status: entity.status as AudioAssetRecord['status'],
    renderedTextEncrypted: entity.renderedTextEncrypted,
    language: entity.language,
    provider: entity.provider,
    model: entity.providerModel,
    providerModel: entity.providerModel,
    providerVoiceRef: entity.providerVoiceRef,
    voiceProfile: entity.voiceProfile,
    voiceVersion: entity.voiceVersion,
    outputFormat: entity.outputFormat,
    sampleRate: entity.sampleRate,
    reservedUnits: entity.reservedUnits,
    attempts: entity.attempts,
    correlationId: entity.correlationId,
    claimedAt: entity.claimedAt,
    claimedBy: entity.claimedBy,
    storageUri: entity.storageUri,
    mimeType: entity.mimeType,
    checksumSha256: entity.checksumSha256,
    bytes: entity.bytes,
    lastErrorCode: entity.lastErrorCode,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toTemplateRecord(entity: AudioTemplates): AudioTemplateRecord {
  return {
    code: entity.code,
    version: entity.version,
    strategy: entity.strategy as AudioTemplateStrategy,
    templateText: entity.templateText,
    language: entity.language,
    fallbackTemplateCode: entity.fallbackTemplateCode,
    isActive: entity.isActive,
  };
}
