import { randomUUID } from 'node:crypto';
import {
  BulkImportStatus,
  RowOutcome,
} from '../../src/modules/bulk_import/bulk-import.constants';
import type { BatchRecord } from '../../src/modules/bulk_import/ports/bulk-import.ports';

export const TENANT_A = randomUUID();
export const TENANT_B = randomUUID();
export const USER = randomUUID();

export function batch(
  tenantId: string,
  over: Partial<BatchRecord> = {},
): BatchRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    tenantId,
    kind: 'usuario-personal-organizacion',
    kindVersion: '1',
    group: 'USERS',
    status: BulkImportStatus.VALIDATED,
    createdByUserId: USER,
    createdAt: now,
    updatedAt: now,
    declaration: { reason: 'prueba' },
    source: { format: 'csv', byteSize: 120 },
    counts: { total: 3, valid: 2, rejected: 1 },
    fileIssues: [],
    previewIssues: [{ row: 3, field: 'email', code: 'INVALID' } as never],
    issuesTotal: 1,
    rejectedRows: [
      {
        row: 3,
        outcome: RowOutcome.REJECTED,
        reason: 'X' as never,
        field: 'email',
      },
    ],
    rows: [
      {
        row: 1,
        data: { email: 'a@example.test' } as never,
        rowKey: 'a'.repeat(64),
      },
      {
        row: 2,
        data: { email: 'b@example.test' } as never,
        rowKey: 'b'.repeat(64),
      },
    ],
    processedRows: 0,
    ...over,
  };
}
