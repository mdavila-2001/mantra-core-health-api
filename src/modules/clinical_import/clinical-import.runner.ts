import { evaluateRow, type EvaluatorPorts } from './clinical-import.evaluator';
import { messageFor } from './clinical-import.messages';
import { kindSpec } from './clinical-import.schema';
import type {
  BatchRepositoryPort,
  ClinicalRecordWriterPort,
  ImportAuditPort,
  ReportRow,
} from './clinical-import.types';

/* ============================================================================
    Ejecutor asíncrono de un lote confirmado.

    Garantías (cada una tiene su prueba en `clinical-import.runner.spec.ts`):
    - Una fila mala NO aborta el resto: se informa `RECHAZADA` o `FALLIDA` y se sigue.
    - Cada fila corre con plazo y reintento (el `guard` del módulo: `withTimeout`
      + `retry` de `common/resilience`). Reintentar es seguro porque la escritura
      es `appendIfAbsent`: repetirla no duplica.
    - El lote entero tiene plazo: al agotarse, lo que falta queda `NO_PROCESADA`
      y el lote `FALLIDO` con `BATCH_TIMEOUT`.
    - Tomar el lote es compare-and-set (EN_COLA → PROCESANDO): dos ejecutores del
      mismo lote no lo procesan dos veces.
    - SOLO AGREGA. No hay actualización ni borrado en ningún puerto.
    - Sin rastro de auditoría no se sigue escribiendo.
    - Al terminar se descartan las filas: el archivo original no se conserva.
    - Nada de lo que se registra contiene datos de la fila: sólo identificadores.
    ========================================================================== */

/** Plazo y reintento de UNA operación. En el módulo es `withTimeout` + `retry` de `common/resilience`. */
export interface OperationGuard {
  run<T>(operation: string, work: () => Promise<T>): Promise<T>;
  isTimeout(error: unknown): boolean;
}

export interface RunnerDeps {
  readonly repo: BatchRepositoryPort;
  readonly ports: EvaluatorPorts;
  readonly writer: ClinicalRecordWriterPort;
  readonly audit: ImportAuditPort;
  readonly guard: OperationGuard;
  readonly now: () => number;
  /** Registro de eventos sin datos clínicos: nombre y contadores/identificadores. */
  readonly log: (
    event: string,
    data: Readonly<Record<string, string | number>>,
  ) => void;
  readonly batchTimeoutMs: number;
}

export interface RunnerJob {
  readonly tenantId: string;
  readonly batchId: string;
  readonly actorUserId: string;
}

const outcomeRow = (
  row: number,
  outcome: ReportRow['outcome'],
  reason?: string,
  field?: string,
): ReportRow => ({
  row,
  outcome,
  ...(reason === undefined ? {} : { reason, message: messageFor(reason) }),
  ...(field === undefined ? {} : { field }),
});

class AuditGap extends Error {}

export async function runBatch(
  deps: RunnerDeps,
  job: RunnerJob,
): Promise<void> {
  const { repo, audit, now, log } = deps;
  const started = await repo.transition(
    job.tenantId,
    job.batchId,
    'EN_COLA',
    'PROCESANDO',
    {
      view: {
        startedAt: new Date(now()).toISOString(),
        updatedAt: new Date(now()).toISOString(),
      },
    },
  );
  if (!started) {
    log('clinical_import.job_skipped', { batchId: job.batchId });
    return;
  }

  const stored = await repo.find(job.tenantId, job.batchId);
  const spec = stored === null ? undefined : kindSpec(stored.view.kind);
  if (stored === null || spec === undefined) {
    await repo.transition(job.tenantId, job.batchId, 'PROCESANDO', 'FALLIDO', {
      view: {
        failureReason: 'RUNNER_ERROR',
        finishedAt: new Date(now()).toISOString(),
      },
    });
    return;
  }

  const deadline = now() + deps.batchTimeoutMs;
  const done = new Set(stored.outcomes.map((o) => o.row));
  const todo = stored.pending.filter((r) => !done.has(r.row));
  const context = {
    tenantId: job.tenantId,
    batchId: job.batchId,
    importedByUserId: job.actorUserId,
    declaration: stored.view.declaration,
  };

  let failureReason: string | undefined;
  for (let i = 0; i < todo.length; i += 1) {
    const row = todo[i];
    if (row === undefined) continue;
    if (failureReason !== undefined || now() > deadline) {
      failureReason ??= 'BATCH_TIMEOUT';
      await repo.recordOutcome(
        job.tenantId,
        job.batchId,
        outcomeRow(row.row, 'NO_PROCESADA', failureReason),
      );
      continue;
    }
    try {
      await processRow(deps, spec.kind, row, context, job, spec);
    } catch (error) {
      if (error instanceof AuditGap) {
        failureReason = 'AUDIT_UNAVAILABLE';
      } else {
        // Un error inesperado de UNA fila no tumba el lote: se informa y se sigue.
        await repo.recordOutcome(
          job.tenantId,
          job.batchId,
          outcomeRow(row.row, 'FALLIDA', 'WRITE_FAILED'),
        );
        log('clinical_import.row_failed', {
          batchId: job.batchId,
          row: row.row,
        });
      }
    }
  }

  const finishedAt = new Date(now()).toISOString();
  const after = await repo.find(job.tenantId, job.batchId);
  const processed = after?.outcomes.length ?? 0;
  const ok = await repo.transition(
    job.tenantId,
    job.batchId,
    'PROCESANDO',
    failureReason === undefined ? 'COMPLETADO' : 'FALLIDO',
    {
      view: {
        finishedAt,
        updatedAt: finishedAt,
        progress: { processed, total: stored.view.counts.valid },
        ...(failureReason === undefined ? {} : { failureReason }),
      },
    },
  );
  await repo.purgePending(job.tenantId, job.batchId);
  if (ok) {
    try {
      await audit.record({
        action: 'CLINICAL_IMPORT_BATCH_FINISHED',
        tenantId: job.tenantId,
        actorUserId: job.actorUserId,
        batchId: job.batchId,
      });
    } catch {
      log('clinical_import.audit_failed', {
        batchId: job.batchId,
        action: 'BATCH_FINISHED',
      });
    }
  }
  log('clinical_import.job_finished', {
    batchId: job.batchId,
    processed,
    failed: failureReason === undefined ? 0 : 1,
  });
}

async function processRow(
  deps: RunnerDeps,
  kind: string,
  row: Parameters<typeof evaluateRow>[1],
  context: Parameters<typeof evaluateRow>[3],
  job: RunnerJob,
  spec: NonNullable<ReturnType<typeof kindSpec>>,
): Promise<void> {
  const { repo, writer, audit, guard } = deps;
  let outcome: ReportRow;
  let loaded:
    { row: number; kind: string; entity: string; targetId: string } | undefined;
  try {
    outcome = await guard.run(
      `clinical-import:${job.batchId}:${row.row}`,
      async () => {
        const evaluation = await evaluateRow(spec, row, deps.ports, context);
        if (!evaluation.ok) {
          const first = evaluation.issues[0];
          return outcomeRow(row.row, 'RECHAZADA', first?.code, first?.field);
        }
        const result = await writer.appendIfAbsent(evaluation.record);
        if (result.outcome === 'CREATED') {
          loaded = {
            row: row.row,
            kind,
            entity: result.entity,
            targetId: result.targetId,
          };
          return outcomeRow(row.row, 'CREADA');
        }
        // Lo escrito por un intento anterior de ESTE lote (un plazo que venció después de escribir,
        // o una reanudación) es una creación nuestra: se informa y se audita como tal, no como «ya existía».
        if (result.sameContent && result.batchId === job.batchId) {
          loaded = {
            row: row.row,
            kind,
            entity: result.entity,
            targetId: result.targetId,
          };
          return outcomeRow(row.row, 'CREADA');
        }
        return result.sameContent
          ? outcomeRow(row.row, 'OMITIDA', 'ALREADY_LOADED')
          : outcomeRow(row.row, 'CONFLICTO', 'CONTENT_CONFLICT');
      },
    );
  } catch (error) {
    outcome = outcomeRow(
      row.row,
      'FALLIDA',
      guard.isTimeout(error) ? 'ROW_TIMEOUT' : 'WRITE_FAILED',
    );
    deps.log('clinical_import.row_failed', {
      batchId: job.batchId,
      row: row.row,
    });
  }

  await repo.recordOutcome(job.tenantId, job.batchId, outcome, loaded);
  if (loaded !== undefined) {
    try {
      await guard.run(`clinical-import-audit:${job.batchId}:${row.row}`, () =>
        audit.record({
          action: 'CLINICAL_IMPORT_RECORD_ADDED',
          tenantId: job.tenantId,
          actorUserId: job.actorUserId,
          batchId: job.batchId,
          row: row.row,
          kind,
          targetId: loaded?.targetId ?? '',
        }),
      );
    } catch {
      throw new AuditGap();
    }
  }
}
