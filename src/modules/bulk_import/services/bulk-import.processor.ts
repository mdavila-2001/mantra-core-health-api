import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  OperationTimeoutError,
  isTransientError,
  retry,
  type AuthenticatedUser,
} from '../../../common';
import {
  BULK_IMPORT_TIMEOUTS,
  BulkImportStatus,
  RowOutcome,
} from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import {
  BULK_IMPORT_AUDIT,
  BULK_IMPORT_BATCH_REPOSITORY,
  BULK_IMPORT_CLINICAL_WRITER,
  BULK_IMPORT_USER_PROVISIONER,
  type BatchRecord,
  type BatchReport,
  type BulkImportAuditPort,
  type BulkImportBatchRepository,
  type ClinicalRecordWriterPort,
  type ReportRow,
  type StoredRow,
  type UserProvisionerPort,
} from '../ports/bulk-import.ports';
import type { KindSchema, NormalizedRow } from '../schema/field-schema';
import { findKindSchema } from '../schema/registry';
import {
  BulkImportValidationService,
  sha256Hex,
  type PatientCache,
} from './validation.service';

/** Plazos del procesador; se pueden acortar en pruebas. */
export interface ProcessorTimeouts {
  readonly rowMs: number;
  readonly batchMs: number;
  readonly rowAttempts: number;
}

/** Token para sustituir los plazos (pruebas). */
export const BULK_IMPORT_TIMEOUTS_TOKEN = Symbol('BULK_IMPORT_TIMEOUTS_TOKEN');

/** Espera `promise` hasta `ms`; si se agota, falla con `OperationTimeoutError`. */
function withDeadline<T>(
  operation: string,
  ms: number,
  promise: Promise<T>,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new OperationTimeoutError(operation, ms)),
      ms,
    );
    timer.unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Contenido canónico de una fila (columnas ordenadas) para decidir duplicado vs. conflicto. */
export function canonicalRowHash(row: NormalizedRow): string {
  const sorted = Object.keys(row)
    .sort()
    .map((k) => [k, row[k]]);
  return sha256Hex(JSON.stringify(sorted));
}

/**
 * Procesa los lotes confirmados, en segundo plano y fila por fila.
 *
 * - **Una fila que falla no aborta el resto**: cada fila corre aislada, con su
 *   plazo, y cualquier error se vuelve un resultado `FALLIDA`/`RECHAZADA` de esa
 *   fila.
 * - **Plazo de fila y de lote.** Una llamada que se cuelga cuesta `rowMs`, no el
 *   lote. Si se agota `batchMs`, las filas restantes quedan `NO_PROCESADA` y el
 *   lote termina `FALLIDO` con `BATCH_TIMEOUT`: el informe lo dice, no lo esconde.
 * - **Reintento sólo ante errores transitorios** (`isTransientError`), nunca ante
 *   un plazo agotado ni ante un rechazo del colaborador.
 * - **Estados con precondición en la escritura**: `EN_COLA → PROCESANDO` y el
 *   cierre usan `transition(from, to)`; si dos procesadores toman el mismo lote,
 *   sólo uno gana.
 * - **Los datos personales no sobreviven al lote**: el cierre escribe el informe
 *   y vacía las filas en la misma transición.
 *
 * El procesamiento es en proceso (`enqueue` agenda con `setImmediate`); una cola
 * durable es trabajo pendiente (ver `README.md`).
 */
@Injectable()
export class BulkImportProcessor {
  private readonly inFlight = new Set<Promise<void>>();

  constructor(
    @Inject(BULK_IMPORT_BATCH_REPOSITORY)
    private readonly batches: BulkImportBatchRepository,
    @Inject(BULK_IMPORT_USER_PROVISIONER)
    private readonly users: UserProvisionerPort,
    @Inject(BULK_IMPORT_CLINICAL_WRITER)
    private readonly clinical: ClinicalRecordWriterPort,
    @Inject(BULK_IMPORT_AUDIT)
    private readonly audit: BulkImportAuditPort,
    private readonly validation: BulkImportValidationService,
    private readonly logger: PinoLogger,
    @Inject(BULK_IMPORT_TIMEOUTS_TOKEN)
    private readonly timeouts: ProcessorTimeouts = BULK_IMPORT_TIMEOUTS,
  ) {
    this.logger.setContext(BulkImportProcessor.name);
  }

  /** Agenda el procesamiento sin bloquear la respuesta de la confirmación. */
  enqueue(tenantId: string, batchId: string, actor: AuthenticatedUser): void {
    const task = new Promise<void>((resolve) => {
      setImmediate(() => {
        this.process(tenantId, batchId, actor)
          .catch((error: unknown) => {
            this.logger.error(
              {
                operation: 'bulk-import.batch.process.crashed',
                batchId,
                tenantId,
                errorName: error instanceof Error ? error.name : 'unknown',
              },
              'Bulk import processor crashed',
            );
          })
          .finally(resolve);
      });
    });
    this.inFlight.add(task);
    void task.finally(() => this.inFlight.delete(task));
  }

  /** Espera a que terminen los lotes en curso (apagado ordenado y pruebas). */
  async drain(): Promise<void> {
    while (this.inFlight.size > 0) await Promise.all([...this.inFlight]);
  }

  /** Procesa un lote `EN_COLA`. Si otro procesador ya lo tomó, no hace nada. */
  async process(
    tenantId: string,
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const batch = await this.batches.transition(
      tenantId,
      batchId,
      [BulkImportStatus.QUEUED],
      BulkImportStatus.PROCESSING,
      { startedAt: new Date().toISOString() },
    );
    if (!batch) return;
    const schema = findKindSchema(batch.kind);
    const outcomes: ReportRow[] = [...batch.rejectedRows];
    let failureReason: BulkImportReason | undefined;

    try {
      if (!schema) throw new Error('Tipo de carga desconocido');
      const deadline = Date.now() + this.timeouts.batchMs;
      const patientCache: PatientCache = new Map();
      const codeCache = new Map<string, string>();
      let processed = 0;
      for (const stored of batch.rows) {
        if (Date.now() > deadline) {
          failureReason = BulkImportReason.BATCH_TIMEOUT;
          outcomes.push({
            row: stored.row,
            outcome: RowOutcome.NOT_PROCESSED,
            reason: BulkImportReason.BATCH_TIMEOUT,
          });
          continue;
        }
        outcomes.push(
          await this.processRow(
            batch,
            schema,
            stored,
            actor,
            patientCache,
            codeCache,
          ),
        );
        processed += 1;
        if (processed % 25 === 0) {
          await this.batches.recordProgress(tenantId, batchId, processed);
        }
      }
    } catch (error) {
      failureReason = BulkImportReason.WRITE_FAILED;
      this.logger.error(
        {
          operation: 'bulk-import.batch.process.failed',
          batchId,
          tenantId,
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        'Bulk import batch failed',
      );
      const done = new Set(outcomes.map((o) => o.row));
      for (const stored of batch.rows) {
        if (!done.has(stored.row)) {
          outcomes.push({
            row: stored.row,
            outcome: RowOutcome.NOT_PROCESSED,
            reason: BulkImportReason.WRITE_FAILED,
          });
        }
      }
    }

    outcomes.sort((a, b) => a.row - b.row);
    const status = failureReason
      ? BulkImportStatus.FAILED
      : BulkImportStatus.COMPLETED;
    const report = this.buildReport(batch, status, outcomes);
    const closed = await this.batches.transition(
      tenantId,
      batchId,
      [BulkImportStatus.PROCESSING],
      status,
      {
        report,
        rows: [],
        processedRows: outcomes.filter(
          (o) => o.outcome !== RowOutcome.NOT_PROCESSED,
        ).length,
        finishedAt: new Date().toISOString(),
        failureReason,
      },
    );
    this.logger.info(
      {
        operation: 'bulk-import.batch.finished',
        batchId,
        tenantId,
        kind: batch.kind,
        status,
        closed: closed !== null,
        totals: report.totals,
      },
      'Bulk import batch finished',
    );
  }

  private buildReport(
    batch: BatchRecord,
    status: BulkImportStatus,
    rows: ReportRow[],
  ): BatchReport {
    const totals: Record<string, number> = { total: rows.length };
    for (const outcome of Object.values(RowOutcome)) totals[outcome] = 0;
    for (const r of rows) totals[r.outcome] += 1;
    return {
      batchId: batch.id,
      kind: batch.kind,
      status,
      generatedAt: new Date().toISOString(),
      totals: totals as BatchReport['totals'],
      rows,
    };
  }

  /** Una fila, aislada: nunca lanza. */
  private async processRow(
    batch: BatchRecord,
    schema: KindSchema,
    stored: StoredRow,
    actor: AuthenticatedUser,
    patientCache: PatientCache,
    codeCache: Map<string, string>,
  ): Promise<ReportRow> {
    try {
      return await withDeadline(
        'bulk-import.row',
        this.timeouts.rowMs,
        retry(
          'bulk-import.row',
          () =>
            schema.group === 'USERS'
              ? this.provisionUser(batch, schema, stored, actor)
              : this.appendClinical(
                  batch,
                  schema,
                  stored,
                  actor,
                  patientCache,
                  codeCache,
                ),
          {
            attempts: this.timeouts.rowAttempts,
            baseDelayMs: 50,
            maxDelayMs: 500,
            isRetryable: (error) =>
              !(error instanceof OperationTimeoutError) &&
              isTransientError(error),
          },
        ),
      );
    } catch (error) {
      const timedOut = error instanceof OperationTimeoutError;
      this.logger.warn(
        {
          operation: 'bulk-import.row.failed',
          batchId: batch.id,
          row: stored.row,
          reason: timedOut
            ? BulkImportReason.ROW_TIMEOUT
            : BulkImportReason.WRITE_FAILED,
        },
        'Bulk import row failed',
      );
      return {
        row: stored.row,
        outcome: RowOutcome.FAILED,
        reason: timedOut
          ? BulkImportReason.ROW_TIMEOUT
          : BulkImportReason.WRITE_FAILED,
      };
    }
  }

  private async provisionUser(
    batch: BatchRecord,
    schema: KindSchema,
    stored: StoredRow,
    actor: AuthenticatedUser,
  ): Promise<ReportRow> {
    const result = await this.users.provision({
      tenantId: batch.tenantId,
      actor,
      kind: schema.kind,
      row: stored.data,
      reason: batch.declaration.reason ?? '',
      batchId: batch.id,
      rowKey: stored.rowKey,
    });
    if (result.status === 'CREATED') {
      await this.audit.record({
        actorId: actor.id,
        tenantId: batch.tenantId,
        batchId: batch.id,
        group: batch.group,
        kind: batch.kind,
        action: 'ROW_WRITTEN',
        row: stored.row,
        recordId: result.userId,
      });
      return { row: stored.row, outcome: RowOutcome.CREATED };
    }
    if (result.status === 'EXISTS') {
      return {
        row: stored.row,
        outcome: RowOutcome.SKIPPED,
        reason: BulkImportReason.ALREADY_LOADED,
      };
    }
    return {
      row: stored.row,
      outcome: RowOutcome.REJECTED,
      reason: result.reason,
    };
  }

  private async appendClinical(
    batch: BatchRecord,
    schema: KindSchema,
    stored: StoredRow,
    actor: AuthenticatedUser,
    patientCache: PatientCache,
    codeCache: Map<string, string>,
  ): Promise<ReportRow> {
    // No se hereda nada de la vista previa: el padrón, el consentimiento y la
    // terminología pueden haber cambiado entre validar y confirmar.
    const refs = await this.validation.resolveForWrite(
      batch.tenantId,
      schema,
      stored.data,
      patientCache,
      codeCache,
    );
    if (refs.issues.length > 0 || !refs.patientProfileId) {
      return {
        row: stored.row,
        outcome: RowOutcome.REJECTED,
        reason: refs.issues[0]?.code ?? BulkImportReason.PATIENT_NOT_FOUND,
        field: refs.issues[0]?.field,
      };
    }
    const result = await this.clinical.append({
      tenantId: batch.tenantId,
      actor,
      kind: schema.kind,
      patientProfileId: refs.patientProfileId,
      row: stored.data,
      concepts: refs.concepts,
      provenance: {
        sourceOrganization: batch.declaration.sourceOrganization ?? '',
        legalBasis: batch.declaration.legalBasis ?? '',
        loadedAt: batch.declaration.loadedAt ?? '',
        batchId: batch.id,
        sourceRecordId: stored.data.sourceRecordId,
      },
      contentHash: canonicalRowHash(stored.data),
    });
    switch (result.status) {
      case 'CREATED':
        await this.audit.record({
          actorId: actor.id,
          tenantId: batch.tenantId,
          batchId: batch.id,
          group: batch.group,
          kind: batch.kind,
          action: 'ROW_WRITTEN',
          row: stored.row,
          recordId: result.recordId,
        });
        return { row: stored.row, outcome: RowOutcome.CREATED };
      case 'DUPLICATE':
        return {
          row: stored.row,
          outcome: RowOutcome.SKIPPED,
          reason: BulkImportReason.ALREADY_LOADED,
        };
      case 'CONFLICT':
        return {
          row: stored.row,
          outcome: RowOutcome.CONFLICT,
          reason: BulkImportReason.CONTENT_CONFLICT,
        };
      case 'REJECTED':
        return {
          row: stored.row,
          outcome: RowOutcome.REJECTED,
          reason: result.reason,
        };
    }
  }
}
