import { Inject, Injectable } from '@nestjs/common';
import { BulkImportStatus } from '../bulk-import.constants';
import type {
  BatchRecord,
  BulkImportBatchRepository,
  ReportRow,
} from '../ports/bulk-import.ports';
import {
  BULK_IMPORT_SQL_RUNNER,
  type BulkImportSql,
  type BulkImportSqlRunner,
} from './bulk-import-sql.port';
import {
  BATCH_COLUMNS,
  CLOSED_STATUSES,
  PATCH_COLUMNS,
  insertPairs,
  toBatchRecord,
  type BatchSqlRow,
  type RowSqlRow,
} from './batch-sql.mapper';

const T = 'system_ops.bulk_import_batches';
const R = 'system_ops.bulk_import_batch_rows';
const CONFIRM_KEY_INDEX = 'ux_bulk_import_batches_confirm_key';

/** Postgres error 23505 on the per-organization confirmation key. */
function isConfirmKeyConflict(error: unknown): boolean {
  const e = error as { code?: string; constraint?: string; message?: string };
  return (
    e?.code === '23505' &&
    (e.constraint === CONFIRM_KEY_INDEX ||
      (e.message ?? '').includes(CONFIRM_KEY_INDEX))
  );
}

/**
 * Durable batch repository over `system_ops.bulk_import_batches` and
 * `bulk_import_batch_rows` (model patch v4.2.81).
 *
 * - **Isolation:** every statement filters by `tenant_id` and runs in a
 *   transaction that sets `app.current_tenant_id` (RLS `tenant_isolation`).
 * - **Atomic transition:** the precondition travels in the `UPDATE ... WHERE
 *   status IN (...)`; losing the race (or the unique confirmation key) yields `null`.
 * - **No personal data after close:** `row_data_json` and `row_key` live only on
 *   rows still to process; the closing transition nulls them in the same
 *   transaction that writes the report (`ck_bulk_import_batch_rows_closed_no_data`).
 * - `list` returns batch headers only (`rows` and `rejectedRows` empty).
 */
@Injectable()
export class PostgresBatchRepository implements BulkImportBatchRepository {
  constructor(
    @Inject(BULK_IMPORT_SQL_RUNNER)
    private readonly runner: BulkImportSqlRunner,
  ) {}

  create(record: BatchRecord): Promise<void> {
    return this.runner.inTenant(record.tenantId, async (sql) => {
      const pairs = insertPairs(record);
      const casts: Record<string, string> = {
        declared_loaded_on: '::date',
        file_issues_json: '::jsonb',
        preview_issues_json: '::jsonb',
        created_at: '::timestamptz',
        updated_at: '::timestamptz',
        id: '::uuid',
        tenant_id: '::uuid',
        created_by_user_id: '::uuid',
      };
      await sql.query(
        `INSERT INTO ${T} (${pairs.map(([c]) => c).join(', ')})
         VALUES (${pairs.map(([c]) => `?${casts[c] ?? ''}`).join(', ')})`,
        pairs.map(([, v]) => v),
      );
      await this.insertRows(sql, record);
    });
  }

  findById(tenantId: string, id: string): Promise<BatchRecord | null> {
    return this.runner.inTenant(tenantId, (sql) =>
      this.load(sql, tenantId, id),
    );
  }

  findByConfirmKey(tenantId: string, key: string): Promise<BatchRecord | null> {
    return this.runner.inTenant(tenantId, async (sql) => {
      const found = await sql.query<{ id: string }>(
        `SELECT id FROM ${T} WHERE tenant_id = ?::uuid AND confirm_key = ?`,
        [tenantId, key],
      );
      return found[0] ? this.load(sql, tenantId, found[0].id) : null;
    });
  }

  list(tenantId: string, limit: number): Promise<readonly BatchRecord[]> {
    return this.runner.inTenant(tenantId, async (sql) => {
      const batches = await sql.query<BatchSqlRow>(
        `SELECT ${BATCH_COLUMNS} FROM ${T} WHERE tenant_id = ?::uuid
         ORDER BY created_at DESC, id DESC LIMIT ?`,
        [tenantId, limit],
      );
      return batches.map((b) => toBatchRecord(b, []));
    });
  }

  async transition(
    tenantId: string,
    id: string,
    from: readonly BulkImportStatus[],
    to: BulkImportStatus,
    patch: Partial<BatchRecord> = {},
  ): Promise<BatchRecord | null> {
    try {
      return await this.runner.inTenant(tenantId, (sql) =>
        this.applyTransition(sql, tenantId, id, from, to, patch),
      );
    } catch (error) {
      if (isConfirmKeyConflict(error)) return null;
      throw error;
    }
  }

  async recordProgress(
    tenantId: string,
    id: string,
    processedRows: number,
  ): Promise<void> {
    await this.runner.inTenant(tenantId, (sql) =>
      sql.query(
        `UPDATE ${T} SET processed_rows = ?, updated_at = now()
         WHERE tenant_id = ?::uuid AND id = ?::uuid AND status = ?`,
        [processedRows, tenantId, id, BulkImportStatus.PROCESSING],
      ),
    );
  }

  private async applyTransition(
    sql: BulkImportSql,
    tenantId: string,
    id: string,
    from: readonly BulkImportStatus[],
    to: BulkImportStatus,
    patch: Partial<BatchRecord>,
  ): Promise<BatchRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [to];
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'rows') {
        if ((value as unknown[]).length > 0) {
          throw new Error('transition cannot add rows');
        }
        continue;
      }
      const spec = PATCH_COLUMNS[key];
      if (!spec) throw new Error(`transition patch key not persisted: ${key}`);
      sets.push(`${spec.column} = ?${spec.cast}`);
      params.push(spec.json ? JSON.stringify(value) : (value ?? null));
    }
    const updated = await sql.query<{ id: string }>(
      `UPDATE ${T} SET status = ?, updated_at = now(), row_version = row_version + 1
         ${sets.map((s) => `, ${s}`).join('')}
       WHERE tenant_id = ?::uuid AND id = ?::uuid
         AND status IN (SELECT jsonb_array_elements_text(?::jsonb))
       RETURNING id`,
      [...params, tenantId, id, JSON.stringify(from)],
    );
    if (updated.length === 0) return null;
    if (patch.report)
      await this.closeRows(sql, tenantId, id, patch.report.rows);
    else if (patch.rows) await this.purgeRows(sql, tenantId, id);
    return this.load(sql, tenantId, id);
  }

  /** Writes each row's outcome and drops its personal data. */
  private async closeRows(
    sql: BulkImportSql,
    tenantId: string,
    batchId: string,
    rows: readonly ReportRow[],
  ): Promise<void> {
    const payload = rows.map((r) => ({
      row_no: r.row,
      outcome: r.outcome,
      reason_code: r.reason ?? null,
      field_name: r.field ?? null,
    }));
    await sql.query(
      `UPDATE ${R} r SET outcome = x.outcome, reason_code = x.reason_code,
         field_name = x.field_name, processed_at = now(),
         row_key = NULL, row_data_json = NULL
       FROM jsonb_to_recordset(?::jsonb)
         AS x(row_no int, outcome text, reason_code text, field_name text)
       WHERE r.tenant_id = ?::uuid AND r.batch_id = ?::uuid AND r.row_no = x.row_no`,
      [JSON.stringify(payload), tenantId, batchId],
    );
    await this.purgeRows(sql, tenantId, batchId);
  }

  private async purgeRows(
    sql: BulkImportSql,
    tenantId: string,
    batchId: string,
  ): Promise<void> {
    await sql.query(
      `UPDATE ${R} SET row_key = NULL, row_data_json = NULL
       WHERE tenant_id = ?::uuid AND batch_id = ?::uuid
         AND (row_key IS NOT NULL OR row_data_json IS NOT NULL)`,
      [tenantId, batchId],
    );
  }

  private async insertRows(
    sql: BulkImportSql,
    record: BatchRecord,
  ): Promise<void> {
    const payload = [
      ...record.rows.map((r) => ({
        row_no: r.row,
        row_key: r.rowKey,
        row_data: r.data,
      })),
      ...record.rejectedRows.map((r) => ({
        row_no: r.row,
        outcome: r.outcome,
        reason_code: r.reason,
        field_name: r.field,
      })),
    ];
    if (payload.length === 0) return;
    await sql.query(
      `INSERT INTO ${R} (id, batch_id, tenant_id, row_no, outcome, reason_code,
         field_name, processed_at, row_key, row_data_json, created_at)
       SELECT gen_random_uuid(), ?::uuid, ?::uuid, x.row_no, x.outcome,
         x.reason_code, x.field_name,
         CASE WHEN x.outcome IS NULL THEN NULL ELSE now() END,
         x.row_key, x.row_data, now()
       FROM jsonb_to_recordset(?::jsonb) AS x(row_no int, outcome text,
         reason_code text, field_name text, row_key text, row_data jsonb)`,
      [record.id, record.tenantId, JSON.stringify(payload)],
    );
  }

  private async load(
    sql: BulkImportSql,
    tenantId: string,
    id: string,
  ): Promise<BatchRecord | null> {
    const batches = await sql.query<BatchSqlRow>(
      `SELECT ${BATCH_COLUMNS} FROM ${T} WHERE tenant_id = ?::uuid AND id = ?::uuid`,
      [tenantId, id],
    );
    const batch = batches[0];
    if (!batch) return null;
    // Closed batches keep their outcomes in `report_json`, not as loose rows.
    if (CLOSED_STATUSES.includes(batch.status as BulkImportStatus)) {
      return toBatchRecord(batch, []);
    }
    const rows = await sql.query<RowSqlRow>(
      `SELECT row_no, outcome, reason_code, field_name, row_key, row_data_json
       FROM ${R} WHERE tenant_id = ?::uuid AND batch_id = ?::uuid ORDER BY row_no`,
      [tenantId, id],
    );
    return toBatchRecord(batch, rows);
  }
}
