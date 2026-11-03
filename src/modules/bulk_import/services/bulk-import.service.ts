import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import {
  BULK_IMPORT_FORMATS,
  BULK_IMPORT_LIMITS,
  BulkImportStatus,
  RowOutcome,
  type BulkImportFormat,
  type BulkImportPermission,
} from '../bulk-import.constants';
import {
  BULK_IMPORT_ENGINE_STATUS,
  type BulkImportEngineStatus,
} from '../bulk-import.engine-status';
import { BulkImportReason } from '../bulk-import.error-reasons';
import {
  badRequest,
  batchNotAvailable,
  conflict,
  kindUnknown,
  permissionRequired,
} from '../bulk-import.errors';
import { parseSource } from '../parsing/source-parser';
import {
  BULK_IMPORT_ACCESS_POLICY,
  BULK_IMPORT_AUDIT,
  BULK_IMPORT_BATCH_REPOSITORY,
  type BatchDeclaration,
  type BatchRecord,
  type BulkImportAccessPolicyPort,
  type BulkImportAuditPort,
  type BulkImportBatchRepository,
  type ReportRow,
  type RowIssue,
} from '../ports/bulk-import.ports';
import {
  isRealDate,
  type FieldIssue,
  type KindSchema,
} from '../schema/field-schema';
import { findKindSchema } from '../schema/registry';
import { BulkImportProcessor } from './bulk-import.processor';
import { REASON_MESSAGES } from './row-messages';
import { TemplateService, type TemplateFile } from './template.service';
import { BulkImportValidationService } from './validation.service';

/** Lo que el controlador entrega al servicio para crear un lote. */
export interface CreateBatchCommand {
  readonly kind: string;
  readonly declaration: BatchDeclaration;
  /** Exactamente una de las dos: el archivo subido o las filas del cuerpo JSON. */
  readonly source: {
    readonly file?: {
      readonly buffer: Buffer;
      readonly fileName?: string;
      readonly mimeType?: string;
    };
    readonly rows?: readonly unknown[];
  };
}

/** Vista pública de un lote (nunca trae filas ni valores). */
export interface BatchView {
  readonly id: string;
  readonly kind: string;
  readonly kindVersion: string;
  readonly group: string;
  readonly status: BulkImportStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly declaration: BatchDeclaration;
  readonly source: {
    readonly format: BulkImportFormat;
    readonly byteSize: number;
  };
  readonly counts: {
    readonly total: number;
    readonly valid: number;
    readonly rejected: number;
  };
  readonly fileIssues: readonly FieldIssue[];
  readonly issues: {
    readonly total: number;
    readonly truncated: boolean;
    readonly items: readonly RowIssue[];
  };
  readonly progress: { readonly processed: number; readonly total: number };
  readonly confirmedAt?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly failureReason?: BulkImportReason;
}

/** Fila del informe con su texto. */
export interface ReportRowView extends ReportRow {
  readonly message?: string;
}

/** Informe de un lote. */
export interface ReportView {
  readonly batchId: string;
  readonly kind: string;
  readonly status: BulkImportStatus;
  readonly generatedAt: string;
  readonly totals: Record<string, number>;
  readonly fileIssues: readonly FieldIssue[];
  readonly rows: readonly ReportRowView[];
}

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._:-]+$/;

/**
 * Casos de uso del motor de cargas masivas: catálogo y plantillas, crear un lote
 * (validar + vista previa), confirmarlo de forma idempotente, consultarlo y
 * entregar su informe.
 *
 * Autorización en dos capas: el rol de gestión lo exige el controlador
 * (`@Roles`); el **permiso fino** del tipo de carga, y la pertenencia del lote a
 * la organización del actor (otra organización → 404), se resuelven acá.
 */
@Injectable()
export class BulkImportService {
  constructor(
    @Inject(BULK_IMPORT_BATCH_REPOSITORY)
    private readonly batches: BulkImportBatchRepository,
    @Inject(BULK_IMPORT_ACCESS_POLICY)
    private readonly policy: BulkImportAccessPolicyPort,
    @Inject(BULK_IMPORT_AUDIT)
    private readonly audit: BulkImportAuditPort,
    @Inject(BULK_IMPORT_ENGINE_STATUS)
    private readonly engine: BulkImportEngineStatus,
    private readonly templates: TemplateService,
    private readonly validation: BulkImportValidationService,
    private readonly processor: BulkImportProcessor,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BulkImportService.name);
  }

  // --- Catálogo y plantillas -------------------------------------------------

  /** Catálogo de plantillas, topes y estado declarado del motor. */
  catalog(): {
    templates: ReturnType<TemplateService['catalog']>;
    limits: typeof BULK_IMPORT_LIMITS;
    formats: readonly BulkImportFormat[];
    engine: BulkImportEngineStatus;
  } {
    return {
      templates: this.templates.catalog(),
      limits: BULK_IMPORT_LIMITS,
      formats: BULK_IMPORT_FORMATS,
      engine: this.engine,
    };
  }

  /** La plantilla de un tipo en el formato pedido. */
  template(kind: string, format: string): TemplateFile {
    const schema = findKindSchema(kind);
    if (!schema) throw kindUnknown();
    if (!(BULK_IMPORT_FORMATS as readonly string[]).includes(format)) {
      throw badRequest(BulkImportReason.FORMAT_UNSUPPORTED, {
        supported: BULK_IMPORT_FORMATS,
      });
    }
    return this.templates.file(schema, format as BulkImportFormat);
  }

  // --- Crear y validar -------------------------------------------------------

  /**
   * Crea un lote: valida el archivo entero y deja el lote `VALIDADO` (hay al
   * menos una fila aceptable y el archivo es legible) o `RECHAZADO`. No escribe
   * nada en el sistema: eso ocurre sólo al confirmar.
   */
  async create(
    actor: AuthenticatedUser,
    tenantId: string,
    command: CreateBatchCommand,
  ): Promise<BatchView> {
    const schema = findKindSchema(command.kind);
    if (!schema) throw kindUnknown();
    await this.assertPermission(actor, tenantId, schema.permission);
    this.assertDeclaration(schema, command.declaration);
    const { file, rows } = command.source;
    if ((file === undefined) === (rows === undefined)) {
      throw badRequest(BulkImportReason.SOURCE_AMBIGUOUS);
    }

    const parsed = parseSource(
      schema,
      file
        ? {
            file: file.buffer,
            fileName: file.fileName,
            mimeType: file.mimeType,
          }
        : { rows: rows ?? [] },
    );
    const outcome = await this.validation.validate(tenantId, schema, parsed);
    const status =
      outcome.fileIssues.length === 0 && outcome.validRows.length > 0
        ? BulkImportStatus.VALIDATED
        : BulkImportStatus.REJECTED;
    const now = new Date().toISOString();
    const byteSize = file
      ? file.buffer.byteLength
      : Buffer.byteLength(JSON.stringify(rows ?? []));
    const record: BatchRecord = {
      id: randomUUID(),
      tenantId,
      kind: schema.kind,
      kindVersion: schema.version,
      group: schema.group,
      status,
      createdByUserId: actor.id,
      createdAt: now,
      updatedAt: now,
      declaration: command.declaration,
      source: { format: parsed.format, byteSize },
      counts: {
        total: outcome.total,
        valid: outcome.validRows.length,
        rejected: outcome.total - outcome.validRows.length,
      },
      fileIssues: outcome.fileIssues,
      previewIssues: outcome.previewIssues,
      issuesTotal: outcome.issuesTotal,
      rejectedRows: outcome.rejectedRows,
      rows: status === BulkImportStatus.VALIDATED ? outcome.validRows : [],
      processedRows: 0,
    };
    await this.batches.create(record);
    this.logger.info(
      {
        operation: 'bulk-import.batch.created',
        batchId: record.id,
        tenantId,
        kind: schema.kind,
        status,
        total: record.counts.total,
        valid: record.counts.valid,
        actorId: actor.id,
      },
      'Bulk import batch created',
    );
    return this.view(record);
  }

  // --- Confirmar -------------------------------------------------------------

  /**
   * Confirma un lote `VALIDADO` y lo encola. Idempotente por la clave:
   * repetir la confirmación con la misma clave devuelve el lote como está, sin
   * volver a encolarlo; otra clave sobre un lote ya confirmado es un conflicto.
   */
  async confirm(
    actor: AuthenticatedUser,
    tenantId: string,
    batchId: string,
    idempotencyKey: string | undefined,
  ): Promise<BatchView> {
    if (
      !idempotencyKey ||
      idempotencyKey.length > BULK_IMPORT_LIMITS.maxIdempotencyKeyLength ||
      !IDEMPOTENCY_KEY_RE.test(idempotencyKey)
    ) {
      throw badRequest(BulkImportReason.IDEMPOTENCY_KEY_REQUIRED);
    }
    const batch = await this.requireBatch(actor, tenantId, batchId);

    if (batch.confirmKey !== undefined) {
      if (batch.confirmKey === idempotencyKey) return this.view(batch);
      throw conflict(BulkImportReason.BATCH_ALREADY_CONFIRMED);
    }
    const holder = await this.batches.findByConfirmKey(
      tenantId,
      idempotencyKey,
    );
    if (holder && holder.id !== batch.id) {
      throw conflict(BulkImportReason.IDEMPOTENCY_KEY_REUSED);
    }
    if (batch.status !== BulkImportStatus.VALIDATED) {
      throw conflict(BulkImportReason.BATCH_NOT_CONFIRMABLE);
    }

    const queued = await this.batches.transition(
      tenantId,
      batch.id,
      [BulkImportStatus.VALIDATED],
      BulkImportStatus.QUEUED,
      {
        confirmKey: idempotencyKey,
        confirmedAt: new Date().toISOString(),
        confirmedByUserId: actor.id,
      },
    );
    if (!queued) {
      // Perdió la carrera: otra confirmación ya movió el lote. Si fue con la
      // misma clave es un reintento y la respuesta correcta es la de siempre.
      const current = await this.batches.findById(tenantId, batch.id);
      if (current?.confirmKey === idempotencyKey) return this.view(current);
      throw conflict(
        current?.confirmKey !== undefined
          ? BulkImportReason.BATCH_ALREADY_CONFIRMED
          : BulkImportReason.TRANSITION_LOST,
      );
    }
    this.logger.info(
      {
        operation: 'bulk-import.batch.confirmed',
        batchId: batch.id,
        tenantId,
        kind: batch.kind,
        actorId: actor.id,
      },
      'Bulk import batch confirmed',
    );
    this.processor.enqueue(tenantId, batch.id, actor);
    return this.view(queued);
  }

  // --- Consultar -------------------------------------------------------------

  /** Un lote, con su vista previa y su avance. */
  async get(
    actor: AuthenticatedUser,
    tenantId: string,
    batchId: string,
  ): Promise<BatchView> {
    const batch = await this.requireBatch(actor, tenantId, batchId);
    await this.auditRead(actor, batch, 'BATCH_READ');
    return this.view(batch);
  }

  /** Los lotes de la organización que el actor tiene permiso de ver. */
  async list(
    actor: AuthenticatedUser,
    tenantId: string,
    limit: number,
  ): Promise<readonly BatchView[]> {
    const allowed = new Set<BulkImportPermission>();
    for (const permission of [
      'bulk_import.users',
      'bulk_import.clinical',
    ] as const) {
      if (await this.policy.isAllowed(actor, tenantId, permission)) {
        allowed.add(permission);
      }
    }
    if (allowed.size === 0) throw permissionRequired('bulk_import.*');
    const records = await this.batches.list(
      tenantId,
      Math.min(Math.max(limit, 1), 100),
    );
    return records
      .filter((b) => {
        const schema = findKindSchema(b.kind);
        return schema !== undefined && allowed.has(schema.permission);
      })
      .map((b) => this.view(b));
  }

  /** El informe de un lote terminado (o rechazado). Sin datos clínicos ni personales. */
  async report(
    actor: AuthenticatedUser,
    tenantId: string,
    batchId: string,
  ): Promise<ReportView> {
    const batch = await this.requireBatch(actor, tenantId, batchId);
    await this.auditRead(actor, batch, 'REPORT_READ');
    if (batch.status === BulkImportStatus.REJECTED) {
      return this.reportOfRejected(batch);
    }
    if (!batch.report) throw conflict(BulkImportReason.REPORT_NOT_READY);
    return {
      batchId: batch.id,
      kind: batch.kind,
      status: batch.status,
      generatedAt: batch.report.generatedAt,
      totals: { ...batch.report.totals },
      fileIssues: [],
      rows: batch.report.rows.map((r) => this.reportRow(r)),
    };
  }

  /** El informe como CSV (`fila,resultado,motivo,columna,mensaje`). */
  reportCsv(report: ReportView): TemplateFile {
    const cell = (v: string | number | undefined): string => {
      const text = String(v ?? '');
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = ['row,outcome,reason,field,message'];
    for (const issue of report.fileIssues) {
      lines.push(
        ['', '', issue.code, issue.field, issue.message].map(cell).join(','),
      );
    }
    for (const r of report.rows) {
      lines.push(
        [r.row, r.outcome, r.reason, r.field, r.message].map(cell).join(','),
      );
    }
    return {
      content: Buffer.from(`${lines.join('\n')}\n`, 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      fileName: `informe-${report.batchId}.csv`,
    };
  }

  // --- Internos --------------------------------------------------------------

  /**
   * Carga el lote respetando el aislamiento y el permiso: primero el tenant
   * (otra organización → 404, igual que inexistente), después el permiso fino
   * (403). En ese orden, para no revelar a nadie que un lote ajeno existe.
   */
  private async requireBatch(
    actor: AuthenticatedUser,
    tenantId: string,
    batchId: string,
  ): Promise<BatchRecord> {
    const batch = await this.batches.findById(tenantId, batchId);
    if (!batch || batch.tenantId !== tenantId) throw batchNotAvailable();
    const schema = findKindSchema(batch.kind);
    if (!schema) throw batchNotAvailable();
    await this.assertPermission(actor, tenantId, schema.permission);
    return batch;
  }

  private async assertPermission(
    actor: AuthenticatedUser,
    tenantId: string,
    permission: BulkImportPermission,
  ): Promise<void> {
    if (!(await this.policy.isAllowed(actor, tenantId, permission))) {
      throw permissionRequired(permission);
    }
  }

  private assertDeclaration(schema: KindSchema, d: BatchDeclaration): void {
    const bad = (field: string): never => {
      throw badRequest(BulkImportReason.DECLARATION_INVALID, { field });
    };
    const text = (
      value: string | undefined,
      min: number,
      max: number,
    ): boolean =>
      value !== undefined &&
      value.trim().length >= min &&
      value.trim().length <= max;
    if (schema.group === 'USERS') {
      if (!text(d.reason, 1, 500)) bad('reason');
      for (const extra of [
        'sourceOrganization',
        'legalBasis',
        'loadedAt',
      ] as const) {
        if (d[extra] !== undefined) bad(extra);
      }
      return;
    }
    if (!text(d.sourceOrganization, 1, 200)) bad('sourceOrganization');
    if (!text(d.legalBasis, 3, 500)) bad('legalBasis');
    if (
      d.loadedAt === undefined ||
      !isRealDate(d.loadedAt) ||
      d.loadedAt > new Date().toISOString().slice(0, 10)
    ) {
      bad('loadedAt');
    }
    if (d.reason !== undefined) bad('reason');
  }

  private async auditRead(
    actor: AuthenticatedUser,
    batch: BatchRecord,
    action: 'BATCH_READ' | 'REPORT_READ',
  ): Promise<void> {
    if (batch.group !== 'CLINICAL') return;
    await this.audit.record({
      actorId: actor.id,
      tenantId: batch.tenantId,
      batchId: batch.id,
      group: batch.group,
      kind: batch.kind,
      action,
    });
  }

  private reportRow(r: ReportRow): ReportRowView {
    return { ...r, message: r.reason ? REASON_MESSAGES[r.reason] : undefined };
  }

  private reportOfRejected(batch: BatchRecord): ReportView {
    const totals: Record<string, number> = { total: batch.counts.total };
    for (const outcome of Object.values(RowOutcome)) totals[outcome] = 0;
    totals[RowOutcome.REJECTED] = batch.rejectedRows.length;
    return {
      batchId: batch.id,
      kind: batch.kind,
      status: batch.status,
      generatedAt: batch.updatedAt,
      totals,
      fileIssues: batch.fileIssues,
      rows: batch.rejectedRows.map((r) => this.reportRow(r)),
    };
  }

  private view(b: BatchRecord): BatchView {
    return {
      id: b.id,
      kind: b.kind,
      kindVersion: b.kindVersion,
      group: b.group,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      declaration: b.declaration,
      source: b.source,
      counts: b.counts,
      fileIssues: b.fileIssues,
      issues: {
        total: b.issuesTotal,
        truncated: b.issuesTotal > b.previewIssues.length,
        items: b.previewIssues,
      },
      progress: { processed: b.processedRows, total: b.counts.valid },
      confirmedAt: b.confirmedAt,
      startedAt: b.startedAt,
      finishedAt: b.finishedAt,
      failureReason: b.failureReason,
    };
  }
}
