import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  FIT_HISTORY_SIZE,
  FIT_IDEMPOTENCY_TTL_MS,
  FIT_RESULT_TTL_MS,
} from './fit.constants';
import type { FitDimension, FitReport, FitVerdict } from './fit.types';

export type FitRunStatus = 'EN_CURSO' | 'COMPLETADA' | 'FALLIDA';
export type FitRunTrigger = 'TICK' | 'MANUAL';

export interface FitRun {
  runId: string;
  status: FitRunStatus;
  trigger: FitRunTrigger;
  requestedAt: Date;
  finishedAt: Date | null;
  /** Clase del error si fue `FALLIDA`; nunca el mensaje (puede citar SQL o rutas). */
  errorCode: string | null;
  report: FitReport | null;
}

/** Una línea del historial: lo justo para ver la tendencia sin cargar cada informe. */
export interface FitHistoryEntry {
  runId: string;
  evaluatedAt: string;
  trigger: FitRunTrigger;
  verdict: FitVerdict;
  dimensions: {
    dimension: FitDimension;
    status: string;
    covered: number | null;
    denominator: number | null;
    ratio: number | null;
  }[];
  failedChecks: string[];
  blindSpots: string[];
}

/**
 * Resultados de la sonda de ajuste **en memoria del proceso**, con TTL declarado.
 *
 * Es la corrida en curso, la idempotencia de este proceso y el **respaldo** de lectura: lo que se
 * sirve se lee de `data_catalog.catalog_fit_runs` (`FitRunsRepository`) y sólo si la base no
 * responde se cae a esta memoria (un reinicio la vacía; cada réplica ve lo suyo).
 */
@Injectable()
export class FitResultsStore {
  private running: FitRun | null = null;
  private lastCompleted: FitRun | null = null;
  private lastFailed: FitRun | null = null;
  private history: FitHistoryEntry[] = [];
  private readonly keys = new Map<string, { runId: string; at: number }>();

  /** Abre una corrida `EN_CURSO`. */
  open(trigger: FitRunTrigger, now: Date): FitRun {
    const run: FitRun = {
      runId: randomUUID(),
      status: 'EN_CURSO',
      trigger,
      requestedAt: now,
      finishedAt: null,
      errorCode: null,
      report: null,
    };
    this.running = run;
    return run;
  }

  complete(run: FitRun, report: FitReport, now: Date): void {
    run.status = 'COMPLETADA';
    run.finishedAt = now;
    run.report = report;
    this.lastCompleted = run;
    this.running = null;
    this.history = [
      ...this.history,
      {
        runId: run.runId,
        evaluatedAt: report.evaluatedAt,
        trigger: run.trigger,
        verdict: report.verdict,
        dimensions: report.dimensions.map((d) => ({
          dimension: d.dimension,
          status: d.status,
          covered: d.covered,
          denominator: d.denominator,
          ratio: d.ratio,
        })),
        failedChecks: report.checks
          .filter((c) => c.status === 'FALLA')
          .map((c) => c.id),
        blindSpots: [...report.blindSpots],
      },
    ].slice(-FIT_HISTORY_SIZE);
  }

  fail(run: FitRun, errorCode: string, now: Date): void {
    run.status = 'FALLIDA';
    run.finishedAt = now;
    run.errorCode = errorCode;
    this.lastFailed = run;
    this.running = null;
  }

  inFlight(): FitRun | null {
    return this.running;
  }

  /** El último informe completo que sigue vigente (dentro del TTL), o `null`. */
  current(now: Date): FitRun | null {
    const r = this.lastCompleted;
    if (!r?.finishedAt) return null;
    return now.getTime() - r.finishedAt.getTime() > FIT_RESULT_TTL_MS
      ? null
      : r;
  }

  /** `true` si hubo un informe pero ya venció su TTL. */
  expired(now: Date): boolean {
    return this.lastCompleted !== null && this.current(now) === null;
  }

  /** El último informe completo, vigente o no (la vigencia la decide quien lee). */
  lastCompletedRun(): FitRun | null {
    return this.lastCompleted;
  }

  failure(): FitRun | null {
    return this.lastFailed;
  }

  recentHistory(now: Date): readonly FitHistoryEntry[] {
    const limite = now.getTime() - FIT_RESULT_TTL_MS;
    return this.history.filter(
      (h) => new Date(h.evaluatedAt).getTime() >= limite,
    );
  }

  // ---- idempotencia ------------------------------------------------------------------------

  remember(key: string, runId: string, now: Date): void {
    this.keys.set(key, { runId, at: now.getTime() });
    for (const [k, v] of this.keys)
      if (now.getTime() - v.at > FIT_IDEMPOTENCY_TTL_MS) this.keys.delete(k);
  }

  /** La corrida que ya aceptó esta clave, si la recordamos. */
  runForKey(key: string, now: Date): string | null {
    const v = this.keys.get(key);
    if (!v || now.getTime() - v.at > FIT_IDEMPOTENCY_TTL_MS) return null;
    return v.runId;
  }

  /** Busca una corrida por id entre las que la memoria conserva. */
  find(runId: string): FitRun | null {
    for (const r of [this.running, this.lastCompleted, this.lastFailed])
      if (r?.runId === runId) return r;
    return null;
  }
}
