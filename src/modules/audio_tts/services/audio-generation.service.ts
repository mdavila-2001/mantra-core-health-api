import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type { AudioGenerationJob } from '../domain/audio.types';
import { AUDIO_ERROR, AudioDomainError } from '../domain/audio.errors';
import { AudioAssetsRepository, AudioQuotaRepository } from '../repositories';
import {
  AudioBudgetPolicy,
  monthKeyOf,
} from '../application/audio-budget.policy';
import {
  buildAudioCipher,
  type AudioValueCipher,
} from '../application/audio-value-cipher';

/** Lo que el worker reporta al terminar bien. */
export interface CompleteGenerationInput {
  storageUri: string;
  mimeType: string;
  checksumSha256: string;
  bytes: number;
  usageUnits: number;
  provider: string;
}

/** Lo que el worker reporta al fallar. */
export interface FailGenerationInput {
  code: string;
  retryable: boolean;
}

/**
 * Ciclo de vida de la generación, desde el lado de la base de datos.
 *
 * Es la mitad servidora del worker de audio: éste no toca PostgreSQL: reclama
 * trabajo, llama al proveedor y reporta el resultado por los endpoints
 * `/internal/audio-tts/*`, igual que el worker de `messaging` con el outbox. La
 * consecuencia práctica es el reparto de secretos: la clave de datos vive solo
 * aquí y la credencial del proveedor solo allí.
 *
 * Las tres operaciones son idempotentes por construcción, porque un worker puede
 * morir en cualquier punto y reintentar:
 *   - `claim` no puede entregar dos veces el mismo asset (lease + `SKIP LOCKED`);
 *   - `complete` detecta el segundo pase y no vuelve a imputar consumo;
 *   - `fail` no puede degradar un asset que ya está `READY`.
 */
@Injectable()
export class AudioGenerationService {
  private readonly cipher: AudioValueCipher;
  private readonly policy: AudioBudgetPolicy;

  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly em: EntityManager,
    private readonly assets: AudioAssetsRepository,
    private readonly quota: AudioQuotaRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioGenerationService.name);
    this.cipher = buildAudioCipher(config);
    this.policy = new AudioBudgetPolicy(quota, config);
  }

  /**
   * Entrega un lote de trabajos al worker.
   *
   * Antes de entregar cada uno se revalida el presupuesto: un asset pudo esperar
   * horas desde que reservó, y en ese tiempo otras liquidaciones pueden haber
   * agotado el mes. Es la última oportunidad de no hacer la única llamada que ya
   * no se puede deshacer, y el asset que no la pasa se cierra aquí mismo
   * devolviendo su reserva en vez de quedar dando vueltas.
   *
   * @param limit tope solicitado; se acota al configurado para que un worker mal
   *        configurado no pueda pedir un lote arbitrario.
   */
  async claim(
    workerId: string,
    limit?: number,
  ): Promise<{ jobs: AudioGenerationJob[]; skipped: number }> {
    const size = Math.max(
      1,
      Math.min(limit ?? this.config.batchSize, this.config.batchSize),
    );
    const claimed = await this.assets.claimBatch(this.em, {
      claimedBy: workerId,
      leaseSeconds: this.config.leaseSeconds,
      maxAttempts: this.config.maxAttempts,
      limit: size,
    });

    const jobs: AudioGenerationJob[] = [];
    let skipped = 0;

    for (const asset of claimed) {
      if (
        !(await this.policy.stillWithinBudget(this.em, asset.reservedUnits))
      ) {
        await this.closePermanently(
          asset.id,
          AUDIO_ERROR.budgetExhaustedAtGeneration,
        );
        skipped += 1;
        continue;
      }

      try {
        jobs.push({
          assetId: asset.id,
          text: this.cipher.decrypt(
            asset.renderedTextEncrypted,
            asset.assetKey,
          ),
          language: asset.language,
          providerVoiceRef: asset.providerVoiceRef,
          model: asset.providerModel,
          outputFormat: asset.outputFormat,
          sampleRate: asset.sampleRate,
          attempts: asset.attempts,
          correlationId: asset.correlationId,
        });
      } catch (error) {
        // Texto ilegible: clave rotada sin conservar la anterior, o fila
        // manipulada. Reintentarlo no lo arregla y cada intento vuelve a
        // reclamarlo, así que se cierra de forma permanente.
        this.logger.error(
          {
            event: 'audio.claim.decrypt_failed',
            assetId: asset.id,
            correlationId: asset.correlationId,
            err: error,
          },
          'No fue posible descifrar el texto del asset: se cierra de forma permanente',
        );
        await this.closePermanently(asset.id, AUDIO_ERROR.cipherAuthFailed);
        skipped += 1;
      }
    }

    if (jobs.length > 0 || skipped > 0) {
      this.logger.info(
        {
          event: 'audio.claim.batch',
          workerId,
          claimed: claimed.length,
          delivered: jobs.length,
          skipped,
        },
        'Lote de generación de audio entregado',
      );
    }
    return { jobs, skipped };
  }

  /**
   * Registra el audio generado y liquida su reserva.
   *
   * La liquidación usa las unidades que la fila tenía apartadas —no las que el
   * proveedor reporta— porque son las que se restaron del presupuesto al
   * autorizar; el consumo real se suma aparte. Confundirlas descuadra la
   * contabilidad cada vez que la estimación no coincide con la factura.
   */
  async complete(
    assetId: string,
    input: CompleteGenerationInput,
  ): Promise<{ applied: boolean }> {
    const monthKey = monthKeyOf(new Date());
    const { firstTime, reservedUnits } = await this.assets.markReady(this.em, {
      assetId,
      storageUri: input.storageUri,
      mimeType: input.mimeType,
      checksumSha256: input.checksumSha256,
      bytes: input.bytes,
      usageUnits: input.usageUnits,
      provider: input.provider,
      monthKey,
    });

    if (!firstTime) {
      this.logger.warn(
        { event: 'audio.complete.duplicate', assetId },
        'El asset ya estaba READY: no se vuelve a imputar consumo',
      );
      return { applied: false };
    }

    await this.quota.settleBudget(
      this.em,
      { provider: input.provider, monthKey },
      reservedUnits,
      input.usageUnits,
    );
    this.logger.info(
      {
        event: 'audio.generation.ready',
        assetId,
        provider: input.provider,
        bytes: input.bytes,
        usageUnits: input.usageUnits,
      },
      'Audio generado y almacenado',
    );
    return { applied: true };
  }

  /**
   * Registra un fallo de generación.
   *
   * Un fallo permanente devuelve la reserva de inmediato: dejarla apartada
   * hasta el barrido significaría que un error de configuración —una credencial
   * inválida, por ejemplo— consume presupuesto del mes sin haber generado nada.
   */
  async fail(
    assetId: string,
    input: FailGenerationInput,
  ): Promise<{ status: 'FAILED_RETRYABLE' | 'FAILED_PERMANENT' }> {
    const asset = await this.assets.findById(this.em, assetId);
    if (!asset) {
      throw new AudioDomainError(
        `Asset de audio no encontrado: ${assetId}`,
        AUDIO_ERROR.assetNotFound,
      );
    }

    // El techo de intentos se evalúa aquí y no solo en el barrido: así el asset
    // queda cerrado en el mismo momento en que se sabe que ya no se reintentará,
    // y su reserva vuelve al presupuesto sin esperar cinco minutos.
    const exhausted = asset.attempts >= this.config.maxAttempts;
    const retryable = input.retryable && !exhausted;

    await this.assets.markFailed(
      this.em,
      assetId,
      input.code,
      retryable,
      this.config.retryDelaySeconds,
    );

    if (!retryable) {
      await this.releaseReservationOf(assetId, asset.provider, asset.createdAt);
    }

    this.logger[retryable ? 'warn' : 'error'](
      {
        event: 'audio.generation.failed',
        assetId,
        correlationId: asset.correlationId,
        code: input.code,
        retryable,
        attempts: asset.attempts,
      },
      retryable
        ? 'Generación de audio fallida: se reintentará'
        : 'Generación de audio fallida de forma permanente',
    );

    return { status: retryable ? 'FAILED_RETRYABLE' : 'FAILED_PERMANENT' };
  }

  /** Cierra un asset sin pasar por el worker (presupuesto agotado, texto ilegible). */
  private async closePermanently(assetId: string, code: string): Promise<void> {
    await this.assets.markFailed(this.em, assetId, code, false, 0);
    const asset = await this.assets.findById(this.em, assetId);
    if (asset) {
      await this.releaseReservationOf(assetId, asset.provider, asset.createdAt);
    }
  }

  /**
   * Devuelve al presupuesto lo que el asset tenía apartado.
   *
   * La ventana es la del **alta** del asset y no la del mes en curso: una reserva
   * hecha el 31 se liberaría contra el mes siguiente si se usara `now()`, dejando
   * el mes anterior con unidades apartadas para siempre y el nuevo con un saldo
   * inflado.
   */
  private async releaseReservationOf(
    assetId: string,
    provider: string,
    createdAt: Date,
  ): Promise<void> {
    const released = await this.assets.releaseReservation(this.em, assetId);
    if (released <= 0) return;
    await this.quota.releaseBudget(
      this.em,
      { provider, monthKey: monthKeyOf(createdAt) },
      released,
    );
  }
}
