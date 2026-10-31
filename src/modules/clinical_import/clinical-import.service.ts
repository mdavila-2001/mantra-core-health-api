import { randomUUID } from 'node:crypto';

import { evaluateRow, type EvaluatorPorts } from './clinical-import.evaluator';
import { messageFor } from './clinical-import.messages';
import { parseFile, detectFormat } from './clinical-import.parser';
import { runBatch, type OperationGuard } from './clinical-import.runner';
import { KIND_SPECS, kindSpec } from './clinical-import.schema';
import { isFinished } from './clinical-import.state';
import { buildTemplate, type TemplateFile } from './clinical-import.template';
import {
  invalidDeclarationField,
  validateRows,
} from './clinical-import.validator';
import type {
  BatchReport,
  BatchRepositoryPort,
  BatchView,
  ClinicalRecordWriterPort,
  CollaboratorStatus,
  FieldIssue,
  ImportAuditPort,
  ImportDeclaration,
  ImportFormat,
  ImportJobSchedulerPort,
  LoadedRecordRef,
  ParsedRow,
  ReportRow,
  RowIssue,
  StoredBatch,
} from './clinical-import.types';

/* ============================================================================
    Casos de uso de la carga masiva de historias clínicas (H7). Sin NestJS: el
    controlador traduce `ImportError` a la respuesta HTTP y el módulo cablea
    los adaptadores. Todo está acotado al tenant que llega por parámetro.
    ========================================================================== */

export const LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  maxRows: 5_000,
  maxPreviewIssues: 200,
  maxIdempotencyKeyLength: 128,
  /** Cuántas filas se resuelven a la vez en la vista previa. */
  previewConcurrency: 8,
  /** Plazo de todo el lote. */
  batchTimeoutMs: 10 * 60 * 1000,
} as const;

export type ImportErrorKind =
  'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'PAYLOAD_TOO_LARGE';

/** Un error de negocio con `reason` estable. El controlador lo mapea a HTTP; su mensaje nunca lleva datos. */
export class ImportError extends Error {
  constructor(
    readonly kind: ImportErrorKind,
    readonly reason: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(messageFor(reason));
    this.name = 'ImportError';
  }
}

export interface ServiceDeps {
  readonly repo: BatchRepositoryPort;
  readonly ports: EvaluatorPorts;
  readonly writer: ClinicalRecordWriterPort;
  readonly audit: ImportAuditPort;
  readonly scheduler: ImportJobSchedulerPort;
  readonly guard: OperationGuard;
  readonly now?: () => Date;
  readonly newId?: () => string;
  readonly log?: (
    event: string,
    data: Readonly<Record<string, string | number>>,
  ) => void;
}

export interface CreateInput {
  readonly kind: string;
  readonly fileName: string;
  readonly bytes: Buffer;
  readonly declaration: Partial<Record<keyof ImportDeclaration, unknown>>;
}

export interface Actor {
  readonly userId: string;
}

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]+$/;

export class ClinicalImportService {
  private readonly now: () => Date;
  private readonly newId: () => string;
  private readonly log: NonNullable<ServiceDeps['log']>;

  constructor(private readonly deps: ServiceDeps) {
    this.now = deps.now ?? (() => new Date());
    this.newId = deps.newId ?? randomUUID;
    this.log = deps.log ?? (() => undefined);
  }

  /* -- Catálogo y plantillas ------------------------------------------------- */

  catalog() {
    const { repo, ports, writer, audit } = this.deps;
    const status = (c: { describe(): CollaboratorStatus }) => c.describe();
    return {
      kinds: KIND_SPECS.map((k) => ({
        kind: k.kind,
        version: k.version,
        group: 'CLINICAL' as const,
        title: k.title,
        description: k.description,
        target: k.target,
        columnCount: k.columns.length,
        formats: ['csv', 'json'] as ImportFormat[],
      })),
      limits: {
        maxBytes: LIMITS.maxBytes,
        maxRows: LIMITS.maxRows,
        maxPreviewIssues: LIMITS.maxPreviewIssues,
        maxIdempotencyKeyLength: LIMITS.maxIdempotencyKeyLength,
      },
      formats: ['csv', 'json'] as ImportFormat[],
      engine: {
        persistence: status(repo),
        writer: status(writer),
        audit: status(audit),
        resolvers: {
          patients: status(ports.patients),
          codes: status(ports.codes),
          practitioners: status(ports.practitioners),
        },
      },
    };
  }

  template(kind: string, format: string): TemplateFile {
    if (format !== 'csv' && format !== 'json')
      throw new ImportError('BAD_REQUEST', 'FORMAT_UNSUPPORTED');
    const file = buildTemplate(kind, format);
    if (file === null) throw new ImportError('NOT_FOUND', 'KIND_UNKNOWN');
    return file;
  }

  /* -- Crear (validar y previsualizar; no escribe nada clínico) ---------------- */

  async create(
    actor: Actor,
    tenantId: string,
    input: CreateInput,
  ): Promise<BatchView> {
    const spec = kindSpec(input.kind);
    if (spec === undefined) throw new ImportError('NOT_FOUND', 'KIND_UNKNOWN');
    const now = this.now();
    const field = invalidDeclarationField(input.declaration, now);
    if (field !== null)
      throw new ImportError('BAD_REQUEST', 'DECLARATION_INVALID', { field });
    if (input.bytes.length > LIMITS.maxBytes)
      throw new ImportError('PAYLOAD_TOO_LARGE', 'FILE_TOO_LARGE');

    const declaration: ImportDeclaration = {
      sourceOrganization: String(input.declaration.sourceOrganization).trim(),
      legalBasis: String(input.declaration.legalBasis).trim(),
      loadedAt: String(input.declaration.loadedAt),
    };
    const text = input.bytes.toString('utf8');
    const parsed = parseFile(spec, detectFormat(input.fileName, text), text);
    if (parsed.rows.length > LIMITS.maxRows)
      throw new ImportError('PAYLOAD_TOO_LARGE', 'ROW_LIMIT_EXCEEDED');

    const id = this.newId();
    const total = parsed.rows.length;
    const base = {
      id,
      kind: spec.kind,
      kindVersion: spec.version,
      group: 'CLINICAL' as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      declaration,
      source: { format: parsed.format, byteSize: input.bytes.length },
    };

    if (parsed.fileIssues.length > 0) {
      const view: BatchView = {
        ...base,
        status: 'RECHAZADO',
        counts: { total, valid: 0, rejected: total },
        fileIssues: parsed.fileIssues,
        issues: {
          total: parsed.fileIssues.length,
          truncated: false,
          items: [],
        },
        progress: { processed: 0, total: 0 },
      };
      await this.deps.repo.create(this.stored(view, tenantId, actor, [], []));
      return view;
    }

    const schema = validateRows(spec, parsed.rows, now);
    const allIssues: RowIssue[] = [...schema.issues];
    const pending: ParsedRow[] = [];
    const rejectedByResolution = new Set<number>();
    const context = {
      tenantId,
      batchId: id,
      importedByUserId: actor.userId,
      declaration,
    };

    for (let i = 0; i < schema.valid.length; i += LIMITS.previewConcurrency) {
      const chunk = schema.valid.slice(i, i + LIMITS.previewConcurrency);
      const results = await Promise.all(
        chunk.map(async (row) => {
          try {
            const evaluation = await this.deps.guard.run(
              `clinical-import-preview:${id}:${row.row}`,
              () => evaluateRow(spec, row, this.deps.ports, context),
            );
            return { row, evaluation };
          } catch {
            // El colaborador falló: no es un rechazo de la fila, pero tampoco se puede dar por buena.
            return { row, evaluation: null };
          }
        }),
      );
      for (const { row, evaluation } of results) {
        if (evaluation?.ok === true) {
          pending.push(row);
          continue;
        }
        rejectedByResolution.add(row.row);
        const found: readonly FieldIssue[] =
          evaluation === null
            ? [
                {
                  field: '*',
                  code: 'RESOLUTION_UNAVAILABLE',
                  message: messageFor('RESOLUTION_UNAVAILABLE'),
                },
              ]
            : evaluation.issues;
        for (const f of found) allIssues.push({ row: row.row, ...f });
      }
    }

    allIssues.sort((a, b) => a.row - b.row);
    pending.sort((a, b) => a.row - b.row);
    const firstIssueByRow = new Map<number, RowIssue>();
    for (const issue of allIssues)
      if (!firstIssueByRow.has(issue.row))
        firstIssueByRow.set(issue.row, issue);
    const previewRejections: ReportRow[] = [...firstIssueByRow.values()].map(
      (i) => ({
        row: i.row,
        outcome: 'RECHAZADA',
        reason: i.code,
        field: i.field,
        message: i.message,
      }),
    );

    const view: BatchView = {
      ...base,
      status: pending.length > 0 ? 'VALIDADO' : 'RECHAZADO',
      counts: {
        total,
        valid: pending.length,
        rejected: total - pending.length,
      },
      fileIssues: [],
      issues: {
        total: allIssues.length,
        truncated: allIssues.length > LIMITS.maxPreviewIssues,
        items: allIssues.slice(0, LIMITS.maxPreviewIssues),
      },
      progress: { processed: 0, total: pending.length },
    };
    await this.deps.repo.create(
      this.stored(view, tenantId, actor, pending, previewRejections),
    );
    this.log('clinical_import.batch_created', {
      batchId: id,
      status: view.status,
      total,
      valid: pending.length,
    });
    return view;
  }

  private stored(
    view: BatchView,
    tenantId: string,
    actor: Actor,
    pending: readonly ParsedRow[],
    previewRejections: readonly ReportRow[],
  ): StoredBatch {
    return {
      view,
      tenantId,
      createdByUserId: actor.userId,
      pending,
      outcomes: [],
      previewRejections,
      loaded: [],
    };
  }

  /* -- Confirmar: idempotente por clave, con la declaración exigida ------------- */

  async confirm(
    actor: Actor,
    tenantId: string,
    id: string,
    key: string | undefined,
  ): Promise<BatchView> {
    if (
      key === undefined ||
      key === '' ||
      key.length > LIMITS.maxIdempotencyKeyLength ||
      !IDEMPOTENCY_KEY.test(key)
    ) {
      throw new ImportError('BAD_REQUEST', 'IDEMPOTENCY_KEY_REQUIRED');
    }
    const batch = await this.require(tenantId, id);
    if (batch.confirmationKey !== undefined) {
      if (batch.confirmationKey === key) return batch.view;
      throw new ImportError('CONFLICT', 'BATCH_ALREADY_CONFIRMED');
    }
    const others = await this.deps.repo.list(tenantId, 100);
    if (others.some((o) => o.confirmationKey === key))
      throw new ImportError('CONFLICT', 'IDEMPOTENCY_KEY_REUSED');
    // Sin declaración completa no se confirma, aunque el lote haya llegado hasta acá.
    const field = invalidDeclarationField(batch.view.declaration, this.now());
    if (field !== null)
      throw new ImportError('CONFLICT', 'DECLARATION_INVALID', { field });
    if (batch.view.status !== 'VALIDADO')
      throw new ImportError('CONFLICT', 'BATCH_NOT_CONFIRMABLE');

    const at = this.now().toISOString();
    const moved = await this.deps.repo.transition(
      tenantId,
      id,
      'VALIDADO',
      'EN_COLA',
      {
        confirmationKey: key,
        view: { confirmedAt: at, updatedAt: at },
      },
    );
    if (!moved) {
      // Alguien se adelantó entre la lectura y la escritura: se decide con lo que quedó.
      const now = await this.require(tenantId, id);
      if (now.confirmationKey === key) return now.view;
      throw new ImportError('CONFLICT', 'BATCH_NOT_CONFIRMABLE');
    }
    this.deps.scheduler.enqueue({
      tenantId,
      batchId: id,
      actorUserId: actor.userId,
    });
    return (await this.require(tenantId, id)).view;
  }

  /** El trabajo asíncrono: lo invoca el planificador con el lote confirmado. */
  async process(job: {
    tenantId: string;
    batchId: string;
    actorUserId: string;
  }): Promise<void> {
    await runBatch(
      {
        repo: this.deps.repo,
        ports: this.deps.ports,
        writer: this.deps.writer,
        audit: this.deps.audit,
        guard: this.deps.guard,
        now: () => this.now().getTime(),
        log: this.log,
        batchTimeoutMs: LIMITS.batchTimeoutMs,
      },
      job,
    );
  }

  /* -- Lecturas ------------------------------------------------------------------- */

  async list(tenantId: string, limit: number): Promise<readonly BatchView[]> {
    return (await this.deps.repo.list(tenantId, limit)).map((b) => b.view);
  }

  async get(tenantId: string, id: string): Promise<BatchView> {
    return (await this.require(tenantId, id)).view;
  }

  async report(tenantId: string, id: string): Promise<BatchReport> {
    const batch = await this.require(tenantId, id);
    if (!isFinished(batch.view.status))
      throw new ImportError('CONFLICT', 'REPORT_NOT_READY');
    const rows = [...batch.previewRejections, ...batch.outcomes].sort(
      (a, b) => a.row - b.row,
    );
    const count = (outcome: ReportRow['outcome']) =>
      rows.filter((r) => r.outcome === outcome).length;
    return {
      batchId: batch.view.id,
      kind: batch.view.kind,
      status: batch.view.status,
      generatedAt: this.now().toISOString(),
      totals: {
        total: rows.length,
        CREADA: count('CREADA'),
        OMITIDA: count('OMITIDA'),
        CONFLICTO: count('CONFLICTO'),
        RECHAZADA: count('RECHAZADA'),
        FALLIDA: count('FALLIDA'),
        NO_PROCESADA: count('NO_PROCESADA'),
      },
      fileIssues: batch.view.fileIssues,
      rows,
    };
  }

  /** Lo que el lote agregó: SÓLO identificadores (qué entidad y cuál fila), nunca el contenido. */
  async loaded(
    tenantId: string,
    id: string,
  ): Promise<{ batchId: string; records: readonly LoadedRecordRef[] }> {
    const batch = await this.require(tenantId, id);
    if (!isFinished(batch.view.status))
      throw new ImportError('CONFLICT', 'REPORT_NOT_READY');
    return { batchId: id, records: batch.loaded };
  }

  private async require(tenantId: string, id: string): Promise<StoredBatch> {
    const batch = await this.deps.repo.find(tenantId, id);
    // Otro tenant y «no existe» dan la MISMA respuesta: no se confirma la existencia de lotes ajenos.
    if (batch === null)
      throw new ImportError('NOT_FOUND', 'BATCH_NOT_AVAILABLE');
    return batch;
  }
}

/** El informe como CSV: sólo número, resultado y motivo. Los textos son estáticos. */
export function reportToCsv(report: BatchReport): string {
  const cell = (value: string | number | undefined): string => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = ['row,outcome,reason,field,message'];
  for (const issue of report.fileIssues)
    lines.push(
      ['', '', issue.code, issue.field, issue.message].map(cell).join(','),
    );
  for (const r of report.rows)
    lines.push(
      [r.row, r.outcome, r.reason, r.field, r.message].map(cell).join(','),
    );
  return `${lines.join('\n')}\n`;
}
