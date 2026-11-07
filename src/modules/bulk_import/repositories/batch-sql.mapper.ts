import {
  BulkImportStatus,
  type BulkImportFormat,
  type BulkImportGroup,
} from '../bulk-import.constants';
import type { BulkImportReason } from '../bulk-import.error-reasons';
import type { FieldIssue } from '../schema/field-schema';
import type {
  BatchRecord,
  BatchReport,
  ReportRow,
  RowIssue,
  StoredRow,
} from '../ports/bulk-import.ports';

/** Column list shared by every batch read; dates come back as ISO text. */
export const BATCH_COLUMNS = `id, tenant_id, kind, kind_version, kind_group, status,
  source_format, source_byte_size, declared_reason, declared_source_organization,
  declared_legal_basis, to_char(declared_loaded_on, 'YYYY-MM-DD') AS declared_loaded_on,
  rows_total, rows_valid, rows_rejected, issues_total, processed_rows,
  file_issues_json, preview_issues_json, confirm_key, confirmed_by_user_id,
  to_char(confirmed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS confirmed_at,
  to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS started_at,
  to_char(finished_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS finished_at,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
  to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
  failure_reason, report_json, created_by_user_id`;

export interface BatchSqlRow {
  id: string;
  tenant_id: string;
  kind: string;
  kind_version: string;
  kind_group: string;
  status: string;
  source_format: string;
  source_byte_size: number;
  declared_reason: string | null;
  declared_source_organization: string | null;
  declared_legal_basis: string | null;
  declared_loaded_on: string | null;
  rows_total: number;
  rows_valid: number;
  rows_rejected: number;
  issues_total: number;
  processed_rows: number;
  file_issues_json: FieldIssue[] | null;
  preview_issues_json: RowIssue[] | null;
  confirm_key: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  failure_reason: string | null;
  report_json: BatchReport | null;
  created_by_user_id: string | null;
}

export interface RowSqlRow {
  row_no: number;
  outcome: string | null;
  reason_code: string | null;
  field_name: string | null;
  row_key: string | null;
  row_data_json: StoredRow['data'] | null;
}

/** Batch statuses after which no personal data is kept for the rows. */
export const CLOSED_STATUSES: readonly BulkImportStatus[] = [
  BulkImportStatus.COMPLETED,
  BulkImportStatus.FAILED,
];

const orUndefined = <T>(v: T | null): T | undefined => v ?? undefined;

/** Rebuilds the port-level record from the batch row and its row set. */
export function toBatchRecord(
  b: BatchSqlRow,
  rows: readonly RowSqlRow[],
): BatchRecord {
  const stored: StoredRow[] = [];
  const rejected: ReportRow[] = [];
  for (const r of rows) {
    if (r.outcome === null && r.row_data_json !== null && r.row_key !== null) {
      stored.push({ row: r.row_no, data: r.row_data_json, rowKey: r.row_key });
    } else if (r.outcome === 'RECHAZADA' && r.row_key === null) {
      rejected.push({
        row: r.row_no,
        outcome: r.outcome as ReportRow['outcome'],
        reason: orUndefined(r.reason_code) as BulkImportReason | undefined,
        field: orUndefined(r.field_name),
      });
    }
  }
  return {
    id: b.id,
    tenantId: b.tenant_id,
    kind: b.kind,
    kindVersion: b.kind_version,
    group: b.kind_group as BulkImportGroup,
    status: b.status as BulkImportStatus,
    createdByUserId: b.created_by_user_id ?? '',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    declaration: {
      reason: orUndefined(b.declared_reason),
      sourceOrganization: orUndefined(b.declared_source_organization),
      legalBasis: orUndefined(b.declared_legal_basis),
      loadedAt: orUndefined(b.declared_loaded_on),
    },
    source: {
      format: b.source_format as BulkImportFormat,
      byteSize: b.source_byte_size,
    },
    counts: {
      total: b.rows_total,
      valid: b.rows_valid,
      rejected: b.rows_rejected,
    },
    fileIssues: b.file_issues_json ?? [],
    previewIssues: b.preview_issues_json ?? [],
    issuesTotal: b.issues_total,
    rejectedRows: rejected,
    rows: stored,
    confirmKey: orUndefined(b.confirm_key),
    confirmedAt: orUndefined(b.confirmed_at),
    confirmedByUserId: orUndefined(b.confirmed_by_user_id),
    startedAt: orUndefined(b.started_at),
    finishedAt: orUndefined(b.finished_at),
    processedRows: b.processed_rows,
    failureReason: orUndefined(b.failure_reason) as
      BulkImportReason | undefined,
    report: orUndefined(b.report_json),
  };
}

/** `[column, value]` pairs of a fresh batch, in insert order. */
export function insertPairs(r: BatchRecord): Array<[string, unknown]> {
  const json = (v: unknown) => (v === undefined ? null : JSON.stringify(v));
  return [
    ['id', r.id],
    ['tenant_id', r.tenantId],
    ['kind', r.kind],
    ['kind_version', r.kindVersion],
    ['kind_group', r.group],
    ['status', r.status],
    ['source_format', r.source.format],
    ['source_byte_size', r.source.byteSize],
    ['declared_reason', r.declaration.reason ?? null],
    ['declared_source_organization', r.declaration.sourceOrganization ?? null],
    ['declared_legal_basis', r.declaration.legalBasis ?? null],
    ['declared_loaded_on', r.declaration.loadedAt ?? null],
    ['rows_total', r.counts.total],
    ['rows_valid', r.counts.valid],
    ['rows_rejected', r.counts.rejected],
    ['issues_total', r.issuesTotal],
    ['processed_rows', r.processedRows],
    ['file_issues_json', json(r.fileIssues)],
    ['preview_issues_json', json(r.previewIssues)],
    ['created_by_user_id', r.createdByUserId],
    ['created_at', r.createdAt],
    ['updated_at', r.updatedAt],
  ];
}

/** Patch keys `transition` may write, mapped to column and SQL cast. */
export const PATCH_COLUMNS: Readonly<
  Record<string, { column: string; cast: string; json?: boolean }>
> = {
  confirmKey: { column: 'confirm_key', cast: '' },
  confirmedAt: { column: 'confirmed_at', cast: '::timestamptz' },
  confirmedByUserId: { column: 'confirmed_by_user_id', cast: '::uuid' },
  startedAt: { column: 'started_at', cast: '::timestamptz' },
  finishedAt: { column: 'finished_at', cast: '::timestamptz' },
  processedRows: { column: 'processed_rows', cast: '' },
  failureReason: { column: 'failure_reason', cast: '' },
  report: { column: 'report_json', cast: '::jsonb', json: true },
};
