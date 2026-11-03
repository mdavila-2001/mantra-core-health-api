import type { EntityManager } from '@mikro-orm/postgresql';
import { GovernanceQueueRepository } from './governance-queue.repository';

function emQueRegistra() {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  const em = {
    getConnection: () => ({
      execute: (sql: string, params: unknown[]) => {
        llamadas.push({ sql, params });
        return Promise.resolve([]);
      },
    }),
    getTransactionContext: () => undefined,
  } as unknown as EntityManager;
  return { em, llamadas };
}
const placeholders = (sql: string): number => (sql.match(/\?/g) ?? []).length;
const ID = '00000000-0000-4000-8000-0000000000a1';
const INYECCION = "iam'; drop table data_catalog.catalog_annotations; --";

describe('GovernanceQueueRepository (SQL generado, sin base real)', () => {
  const repo = new GovernanceQueueRepository();

  it('cola: sólo NEEDS_REVIEW, parámetros alineados, orden total, sin texto de ficha', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.reviewQueue(em, {
      kind: 'COLUMN',
      schema: INYECCION,
      cursor: { t: '2026-10-01T00:00:00.000000Z', i: ID },
      limit: 10,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).toContain("a.review_status = 'NEEDS_REVIEW'");
    expect(sql).toContain('order by a.updated_at, a.id');
    expect(sql).not.toContain('drop table');
    expect(params).toContain(INYECCION);
    expect(params.at(-1)).toBe(11);
    for (const campo of [
      'definition',
      'purpose',
      'content_json',
      'change_reason',
    ])
      expect(sql).not.toContain(campo);
  });

  it('conteos de la cola respetan el filtro de schema', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.reviewQueueCounts(em, { schema: 'iam' });
    expect(placeholders(llamadas[0].sql)).toBe(llamadas[0].params.length);
    expect(llamadas[0].params).toEqual(['iam']);
  });

  it('trabajos: tres fuentes, parámetros alineados, ventana, orden total; sin mensajes de error', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.jobs(em, {
      type: 'RETENTION',
      status: 'FAILED',
      from: new Date('2026-10-01T00:00:00Z'),
      to: new Date('2026-10-31T00:00:00Z'),
      cursor: { t: '2026-10-05T00:00:00.000000Z', ty: 'CATALOG_SCAN', i: ID },
      limit: 25,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    for (const fuente of [
      'data_catalog.catalog_scan_runs',
      'system_ops.retention_executions',
      'audit.audit_log',
    ])
      expect(sql).toContain(fuente);
    expect(sql).toContain("l.action = 'CATALOG_CLASSIFICATION_RUN'");
    expect(sql).toContain('order by sort_at desc, type desc, id desc');
    expect(sql).not.toMatch(/error_message\s+as\s/);
    expect(sql).not.toMatch(/error_text\s+as\s/);
    expect(params.at(-1)).toBe(26);
    expect(sql.trim().toLowerCase()).toMatch(/^with j as/);
  });
});
