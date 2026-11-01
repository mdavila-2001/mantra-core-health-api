import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { FitCheckRegistry } from './fit-check.registry';
import { evaluateFit } from './fit-evaluator';
import { FitInputsCollector } from './fit-inputs.collector';
import { FitRunsRepository } from './fit-runs.repository';
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
  FIT_RUN_RETENTION_MS,
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
  /** Sólo con {@link CatalogFitService.requestAndWait}: si el desenlace quedó en la base. */
  persisted?: boolean;
}

/**
 * Dónde se leyó el resultado servido.
 * - `BASE_DE_DATOS`: `data_catalog.catalog_fit_runs` (sobrevive reinicios y lo ven todas las réplicas).
 * - `MEMORIA_DEL_PROCESO`: no hay repositorio, o la base no respondió (`fallbackReason`).
 */
export type FitRetentionKind = 'BASE_DE_DATOS' | 'MEMORIA_DEL_PROCESO';

/** Desenlace de la última escritura en la base que intentó ESTE proceso. */
export interface FitPersistenceStatus {
  state: 'GUARDADA' | 'CLAVE_REPETIDA' | 'NO_GUARDADA' | 'SIN_INTENTO';
  runId: string | null;
  at: string | null;
  /** Clase del error (nunca el mensaje, que puede citar SQL). */
  errorCode: string | null;
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
    kind: FitRetentionKind;
    /** Por qué se sirve desde memoria cuando había repositorio (la base no respondió); si no, `null`. */
    fallbackReason: string | null;
    ttlSeconds: number;
    historySize: number;
    tickIntervalSeconds: number;
    staleAfterSeconds: number;
    /** Cuánto se conservan las corridas en la base antes de purgarlas. */
    storedForSeconds: number | null;
    lastWrite: FitPersistenceStatus;
    note: string;
  };
}

const NOTE_DB =
  'Los resultados se leen de data_catalog.catalog_fit_runs: sobreviven a un reinicio y los ven todas las réplicas. La corrida en curso es la de este proceso. El tick del worker los renueva.';
const NOTE_MEMORY =
  'Los resultados se leen de la memoria de este proceso: un reinicio los vacía y cada réplica de la API ve las corridas que ella misma hizo. El tick del worker los renueva.';

const errorClass = (error: unknown): string =>
  error instanceof Error ? error.name : 'UNKNOWN';

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
 * - **Persistencia**: cada desenlace se inserta en `data_catalog.catalog_fit_runs`
 *   ({@link FitRunsRepository}) y `latest()` lee de ahí. Si la base no responde, la lectura cae a
 *   la memoria del proceso y lo dice (`retention.kind = MEMORIA_DEL_PROCESO`, `fallbackReason`);
 *   si la escritura falla, la corrida no falla (la sonda observa, no es la base la que se mide) y
 *   `retention.lastWrite` lo cuenta.
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
    @Optional() private readonly runs?: FitRunsRepository,
  ) {}

  private lastWrite: FitPersistenceStatus = {
    state: 'SIN_INTENTO',
    runId: null,
    at: null,
    errorCode: null,
  };

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
    this.pending = this.execute(run, idempotencyKey).finally(() => {
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
      ...(this.runs && run && run.status !== 'EN_CURSO'
        ? {
            persisted:
              this.lastWrite.runId === run.runId &&
              this.lastWrite.state === 'GUARDADA',
          }
        : {}),
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

  private async execute(
    run: FitRun,
    idempotencyKey: string | null,
  ): Promise<void> {
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
    await this.persist(run, idempotencyKey);
  }

  /** Inserta el desenlace y purga lo vencido. Nunca lanza: un fallo queda en `lastWrite`. */
  private async persist(
    run: FitRun,
    idempotencyKey: string | null,
  ): Promise<void> {
    if (!this.runs) return;
    const at = this.now();
    try {
      const state = await this.runs.save(run, idempotencyKey);
      this.lastWrite = {
        state,
        runId: run.runId,
        at: at.toISOString(),
        errorCode: null,
      };
    } catch (error) {
      this.lastWrite = {
        state: 'NO_GUARDADA',
        runId: run.runId,
        at: at.toISOString(),
        errorCode: errorClass(error),
      };
      this.logger.error(
        {
          runId: run.runId,
          err: error instanceof Error ? error.message : String(error),
        },
        'Sonda de ajuste del catálogo: no se pudo guardar la corrida en data_catalog.catalog_fit_runs',
      );
      return;
    }
    try {
      await this.runs.purgeBefore(
        new Date(at.getTime() - FIT_RUN_RETENTION_MS),
      );
    } catch (error) {
      this.logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'Sonda de ajuste del catálogo: la purga por retención falló (se reintenta en la próxima corrida)',
      );
    }
  }

  /**
   * Último resultado, con su antigüedad y su historial. Lee de la base si hay repositorio; si la
   * base no responde, de la memoria del proceso, y lo declara en `retention`.
   */
  async latest(): Promise<FitLatestView> {
    const now = this.now();
    const enVuelo = this.store.inFlight();
    let fuente: {
      kind: FitRetentionKind;
      fallbackReason: string | null;
      ultima: FitRun | null;
      falla: FitRun | null;
      history: readonly FitHistoryEntry[];
    };
    if (this.runs) {
      try {
        const [ultima, falla, history] = await Promise.all([
          this.runs.latestCompleted(),
          this.runs.latestFailed(),
          this.runs.history(
            new Date(now.getTime() - FIT_RESULT_TTL_MS),
            FIT_HISTORY_SIZE,
          ),
        ]);
        fuente = {
          kind: 'BASE_DE_DATOS',
          fallbackReason: null,
          ultima,
          falla,
          history,
        };
      } catch (error) {
        this.logger.warn(
          { err: error instanceof Error ? error.message : String(error) },
          'Sonda de ajuste del catálogo: la base no respondió; se sirve la memoria del proceso',
        );
        fuente = this.fromMemory(now, `BD_NO_DISPONIBLE:${errorClass(error)}`);
      }
    } else {
      fuente = this.fromMemory(now, null);
    }
    const { ultima, falla } = fuente;
    const edadUltima = ultima?.finishedAt
      ? now.getTime() - ultima.finishedAt.getTime()
      : null;
    const vigente =
      ultima && edadUltima !== null && edadUltima <= FIT_RESULT_TTL_MS
        ? ultima
        : null;
    const edadMs = vigente ? edadUltima : null;
    return {
      modelVersion: FIT_MODEL_VERSION,
      state: !vigente
        ? 'SIN_RESULTADO'
        : edadMs! > FIT_STALE_AFTER_MS
          ? 'ATRASADO'
          : 'VIGENTE',
      noResultReason: vigente ? null : ultima ? 'EXPIRADO' : 'NUNCA_EJECUTADA',
      ageSeconds: edadMs === null ? null : Math.round(edadMs / 1000),
      running: enVuelo ? view(enVuelo) : null,
      lastRun: vigente ? view(vigente) : null,
      lastFailure: falla ? view(falla) : null,
      report: vigente?.report ?? null,
      history: fuente.history,
      retention: {
        kind: fuente.kind,
        fallbackReason: fuente.fallbackReason,
        ttlSeconds: FIT_RESULT_TTL_MS / 1000,
        historySize: FIT_HISTORY_SIZE,
        tickIntervalSeconds: FIT_TICK_INTERVAL_MS / 1000,
        staleAfterSeconds: FIT_STALE_AFTER_MS / 1000,
        storedForSeconds: this.runs ? FIT_RUN_RETENTION_MS / 1000 : null,
        lastWrite: { ...this.lastWrite },
        note: fuente.kind === 'BASE_DE_DATOS' ? NOTE_DB : NOTE_MEMORY,
      },
    };
  }

  private fromMemory(now: Date, fallbackReason: string | null) {
    return {
      kind: 'MEMORIA_DEL_PROCESO' as const,
      fallbackReason,
      // El último completado aunque haya vencido: `latest()` decide si vale (TTL) o si EXPIRADO.
      ultima: this.store.lastCompletedRun(),
      falla: this.store.failure(),
      history: this.store.recentHistory(now),
    };
  }
}
