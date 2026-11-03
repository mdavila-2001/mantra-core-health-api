import type { EntityManager } from '@mikro-orm/postgresql';
import { AuditQueryRepository } from './audit-query.repository';

/** Un EntityManager que sólo registra el SQL y los parámetros (DOBLE: sin base real). */
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
const RECURSO = '00000000-0000-4000-8000-0000000000bb';

describe('AuditQueryRepository.auditLog (SQL generado, sin base real)', () => {
  it('filtra por recurso con un parámetro tipado y siempre acota por fecha', async () => {
    const { em, llamadas } = emQueRegistra();
    const from = new Date('2026-10-01T00:00:00Z');
    await new AuditQueryRepository().auditLog(em, {
      from,
      entityId: RECURSO,
      limit: 10,
    });
    const { sql, params } = llamadas[0];
    expect(sql).toContain('a.entity_id = ?::uuid');
    expect(sql).toContain('a.recorded_at >= ?::timestamptz');
    expect(params).toEqual([from, RECURSO, 11]);
    expect(placeholders(sql)).toBe(params.length);
  });

  it('sin recurso no agrega el filtro', async () => {
    const { em, llamadas } = emQueRegistra();
    await new AuditQueryRepository().auditLog(em, {
      from: new Date(),
      limit: 1,
    });
    expect(llamadas[0].sql).not.toContain('a.entity_id = ');
  });

  it('el orden es fijo y determinista, y la entrada del cliente nunca entra al SQL', async () => {
    const { em, llamadas } = emQueRegistra();
    const inyeccion = "x'; drop table audit.audit_log; --";
    await new AuditQueryRepository().auditLog(em, {
      from: new Date(),
      action: inyeccion,
      entity: inyeccion,
      limit: 5,
    });
    const { sql, params } = llamadas[0];
    expect(sql).toMatch(/order by a\.recorded_at desc, a\.id desc/);
    expect(sql).not.toContain('drop table');
    expect(params).toContain(inyeccion);
  });

  it('no selecciona los hashes de la cadena ni el dispositivo', async () => {
    const { em, llamadas } = emQueRegistra();
    await new AuditQueryRepository().auditLog(em, {
      from: new Date(),
      limit: 1,
    });
    expect(llamadas[0].sql).not.toMatch(/record_hash|previous_hash|device_id/);
  });
});
