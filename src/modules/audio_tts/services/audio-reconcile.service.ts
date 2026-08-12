import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import { AudioAssetsRepository, AudioQuotaRepository } from '../repositories';
import { monthKeyOf } from '../application/audio-budget.policy';

export interface AudioReconcileReport {
  /** Assets cerrados por agotamiento de intentos. */
  exhausted: number;
  /** Unidades devueltas al presupuesto por esos cierres. */
  releasedUnits: number;
  /** Filas del contador diario por actor borradas por retención. */
  purgedActorDays: number;
  /** Assets pendientes sin progreso pasado el umbral: señal, no corrección. */
  stalled: number;
}

/**
 * Barrido periódico del dominio de audio.
 *
 * En el modelo con broker esto era el consumidor de la dead-letter queue. Aquí no
 * hay broker —la fila del asset es la cola— y el barrido queda reducido a lo que
 * de verdad nadie más puede hacer:
 *
 *   1. **Cerrar los agotados.** Un asset que gastó sus intentos, o que se quedó
 *      `GENERATING` porque el proceso murió a mitad de la generación, no lo va a
 *      reportar nadie. Su reserva de presupuesto quedaría apartada para siempre:
 *      un mes de incidentes bastaría para dejar el presupuesto en cero sin haber
 *      generado un solo audio.
 *   2. **Aplicar retención al contador por actor.** Contiene identificadores de
 *      personas y no tiene ningún valor pasada su ventana.
 *   3. **Contar los encallados.** No los corrige: los publica. Una cola que crece
 *      porque el worker no arranca es, desde fuera, indistinguible de una cola
 *      vacía; este número es lo que las distingue.
 *
 * Lo que *no* hace, y antes sí: republicar trabajos perdidos. Con la fila como
 * cola no existe tal cosa —el `claim` recoge todo lo elegible en el tick
 * siguiente—, y por tanto tampoco existe el modo de fallo de un asset creado cuyo
 * mensaje se perdió.
 */
@Injectable()
export class AudioReconcileService {
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly em: EntityManager,
    private readonly assets: AudioAssetsRepository,
    private readonly quota: AudioQuotaRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioReconcileService.name);
  }

  async runOnce(): Promise<AudioReconcileReport> {
    const exhausted = await this.assets.sweepExhausted(
      this.em,
      this.config.maxAttempts,
      this.config.leaseSeconds,
      this.config.reconcileBatchSize,
    );

    let releasedUnits = 0;
    for (const asset of exhausted) {
      if (asset.reservedUnits <= 0) continue;
      // La ventana es la del alta del asset, no la del mes en curso: liberar
      // contra el mes equivocado descuadra las dos ventanas a la vez.
      await this.quota.releaseBudget(
        this.em,
        { provider: asset.provider, monthKey: monthKeyOf(asset.createdAt) },
        asset.reservedUnits,
      );
      releasedUnits += asset.reservedUnits;
    }

    const purgedActorDays = await this.quota.purgeActorDailyBefore(
      this.em,
      retentionCutoffDay(this.config.actorDailyRetentionDays),
    );
    const stalled = await this.assets.countStalled(
      this.em,
      this.config.reconcileStaleSeconds,
    );

    const report: AudioReconcileReport = {
      exhausted: exhausted.length,
      releasedUnits,
      purgedActorDays,
      stalled,
    };

    // Se registra solo cuando hay algo que decir: un barrido cada cinco minutos
    // que siempre escribe convierte el log en ruido y esconde el barrido en el que
    // sí pasó algo.
    if (
      report.exhausted > 0 ||
      report.purgedActorDays > 0 ||
      report.stalled > 0
    ) {
      this.logger.warn(
        { event: 'audio.reconcile.completed', ...report },
        'Barrido de audio: hay assets cerrados o encallados',
      );
    }
    return report;
  }

  /** Recuento por estado, para la sonda del worker y el diagnóstico operativo. */
  async statusCounts(): Promise<Record<string, number>> {
    return this.assets.statusCounts(this.em);
  }
}

/** Primer día que se conserva, en UTC (`YYYY-MM-DD`). */
export function retentionCutoffDay(
  retentionDays: number,
  now: Date = new Date(),
): string {
  const cutoff = new Date(now.getTime() - retentionDays * 86_400_000);
  return cutoff.toISOString().slice(0, 10);
}
