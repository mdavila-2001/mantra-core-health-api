import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { FitCheckRegistry } from './fit-check.registry';
import { evaluateFit } from './fit-evaluator';
import { FitInputsCollector } from './fit-inputs.collector';
import {
  FitResultsStore,
  type FitHistoryEntry,
  type FitRun,
  type FitRunTrigger,
} from './fit-results.store';
import {
  FIT_HISTORY_SIZE,
  FIT_MODEL_VERSION,
  FIT_RESULT_TTL_MS,
  FIT_STALE_AFTER_MS,
  FIT_TICK_INTERVAL_MS,
} from './fit.constants';
import { FIT_CLOCK, type FitReport } from './fit.types';

/** Lo que se cuenta de una corrida al aceptarla o al terminarla. */
export interface FitRunView {
  runId: string;
  status: FitRun['status'];
  trigger: FitRunTrigger;
  requestedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
}

export interface FitRunRequest {
  run: FitRunView;
  /** `false` si la petición repetía una clave ya aceptada o se unió a la corrida en vuelo. */
  created: boolean;
  /** Sólo con {@link CatalogFitService.requestAndWait} y una corrida completada. */
  summary?: {
    verdict: FitReport['verdict'];
    failedChecks: number;
    blindSpots: number;
  };
}

export interface FitLatestView {
  modelVersion: string;
  /** `SIN_RESULTADO`: nunca corrió o venció su TTL. `ATRASADO`: se sirve, pero es viejo (S7). */
  state: 'SIN_RESULTADO' | 'VIGENTE' | 'ATRASADO';
  noResultReason: 'NUNCA_EJECUTADA' | 'EXPIRADO' | null;
  ageSeconds: number | null;
  running: FitRunView | null;
  lastRun: FitRunView | null;
  lastFailure: FitRunView | null;
  report: FitReport | null;
  history: readonly FitHistoryEntry[];
  retention: {
    kind: 'MEMORIA_DEL_PROCESO';
    ttlSeconds: number;
    historySize: number;
    tickIntervalSeconds: number;
    staleAfterSeconds: number;
    note: string;
  };
}

const view = (run: FitRun): FitRunView => ({
  runId: run.runId,
  status: run.status,
  trigger: run.trigger,
  requestedAt: run.requestedAt.toISOString(),
  finishedAt: run.finishedAt?.toISOString() ?? null,
  durationMs: run.finishedAt
    ? run.finishedAt.getTime() - run.requestedAt.getTime()
    : null,
  errorCode: run.errorCode,
});

/**
 * Sonda de ajuste de la catalogación: corre las comprobaciones, guarda el último resultado y
 * responde si el catálogo sigue ajustado a la realidad.
 *
 * - **Una corrida a la vez por proceso.** Pedir otra mientras una corre devuelve la que corre
 *   (`created: false`); la misma `Idempotency-Key` devuelve la corrida que ya la aceptó.
 * - **Nunca lanza por una fuente caída**: cada fuente que no se pudo leer deja `SIN_DATO` a sus
 *   comprobaciones. Sólo un fallo del propio evaluador deja la corrida `FALLIDA`.
 */
@Injectable()
export class CatalogFitService {
  private readonly logger = new Logger(CatalogFitService.name);
  private pending: Promise<void> | null = null;

  constructor(
    private readonly collector: FitInputsCollector,
    private readonly registry: FitCheckRegistry,
    private readonly store: FitResultsStore,
    @Optional() @Inject(FIT_CLOCK) private readonly clock?: () => Date,
  ) {}

  private now(): Date {
    return this.clock ? this.clock() : new Date();
  }

  /** Espera a que termine la corrida en vuelo. Existe para las pruebas y el cierre ordenado. */
  async drain(): Promise<void> {
    await this.pending;
  }

  /**
   * Acepta una corrida (202) sin esperarla. Idempotente: con la misma clave, o con una corrida ya
   * en vuelo, no crea otra.
   */
  request(
    trigger: FitRunTrigger,
    idempotencyKey: string | null,
  ): FitRunRequest {
    const now = this.now();
    if (idempotencyKey) {
      const previa = this.store.runForKey(idempotencyKey, now);
      const run = previa ? this.store.find(previa) : null;
      if (run) return { run: view(run), created: false };
    }
    const enVuelo = this.store.inFlight();
    if (enVuelo) {
      if (idempotencyKey)
        this.store.remember(idempotencyKey, enVuelo.runId, now);
      return { run: view(enVuelo), created: false };
    }
    const run = this.store.open(trigger, now);
    if (idempotencyKey) this.store.remember(idempotencyKey, run.runId, now);
    this.pending = this.execute(run).finally(() => {
      this.pending = null;
    });
    return { run: view(run), created: true };
  }

  /** Como {@link request} pero espera a que la corrida termine (la usa el worker, que necesita el desenlace). */
  async requestAndWait(
    trigger: FitRunTrigger,
    idempotencyKey: string | null,
  ): Promise<FitRunRequest> {
    const aceptada = this.request(trigger, idempotencyKey);
    await this.pending;
    const run = this.store.find(aceptada.run.runId);
    const report = run?.report ?? null;
    return {
      run: run ? view(run) : aceptada.run,
      created: aceptada.created,
      ...(report
        ? {
            summary: {
              verdict: report.verdict,
              failedChecks: report.checks.filter((c) => c.status === 'FALLA')
                .length,
              blindSpots: report.blindSpots.length,
            },
          }
        : {}),
    };
  }

  private async execute(run: FitRun): Promise<void> {
    try {
      const inputs = await this.collector.collect(this.now());
      const report = evaluateFit(inputs, this.registry.all());
      this.store.complete(run, report, this.now());
      this.logger.log(
        {
          runId: run.runId,
          verdict: report.verdict,
          blindSpots: report.blindSpots.length,
        },
        'Sonda de ajuste del catálogo: corrida completada',
      );
    } catch (error) {
      const code = error instanceof Error ? error.name : 'UNKNOWN';
      this.store.fail(run, code, this.now());
      this.logger.error(
        {
          runId: run.runId,
          err: error instanceof Error ? error.message : String(error),
        },
        'Sonda de ajuste del catálogo: la corrida falló',
      );
    }
  }

  /** Último resultado, con su antigüedad y su historial. Sólo lee la memoria del proceso. */
  latest(): FitLatestView {
    const now = this.now();
    const vigente = this.store.current(now);
    const enVuelo = this.store.inFlight();
    const falla = this.store.failure();
    const edadMs = vigente?.finishedAt
      ? now.getTime() - vigente.finishedAt.getTime()
      : null;
    return {
      modelVersion: FIT_MODEL_VERSION,
      state: !vigente
        ? 'SIN_RESULTADO'
        : edadMs! > FIT_STALE_AFTER_MS
          ? 'ATRASADO'
          : 'VIGENTE',
      noResultReason: vigente
        ? null
        : this.store.expired(now)
          ? 'EXPIRADO'
          : 'NUNCA_EJECUTADA',
      ageSeconds: edadMs === null ? null : Math.round(edadMs / 1000),
      running: enVuelo ? view(enVuelo) : null,
      lastRun: vigente ? view(vigente) : null,
      lastFailure: falla ? view(falla) : null,
      report: vigente?.report ?? null,
      history: this.store.recentHistory(now),
      retention: {
        kind: 'MEMORIA_DEL_PROCESO',
        ttlSeconds: FIT_RESULT_TTL_MS / 1000,
        historySize: FIT_HISTORY_SIZE,
        tickIntervalSeconds: FIT_TICK_INTERVAL_MS / 1000,
        staleAfterSeconds: FIT_STALE_AFTER_MS / 1000,
        note: 'Los resultados viven en la memoria de este proceso: un reinicio los vacía y cada réplica de la API ve las corridas que ella misma hizo. El tick del worker los renueva.',
      },
    };
  }
}
