import type { EntityManager } from '@mikro-orm/postgresql';
import { AuditOversightReadRepository } from './audit-oversight-read.repository';

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
const INYECCION = "'; drop table audit.dsar_requests; --";

describe('AuditOversightReadRepository (SQL generado, sin base real)', () => {
  const repo = new AuditOversightReadRepository();
  const from = new Date('2026-10-01T00:00:00Z');
  const to = new Date('2026-10-31T00:00:00Z');

  it('los agregados no seleccionan ids de paciente ni de recurso', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.accessTotals(em, from, to);
    for (const dim of ['purpose', 'resource_type', 'operation'] as const)
      await repo.accessBuckets(em, dim, from, to);
    await repo.accessDaily(em, from, to);
    for (const { sql, params } of llamadas) {
      expect(placeholders(sql)).toBe(params.length);
      expect(sql.trim().toLowerCase()).toMatch(/^select /);
      // patient_profile_id sólo aparece dentro de `count(*) filter (where … is not null)`
      expect(sql).not.toMatch(
        /select[^()]*\bd\.(patient_profile_id|resource_id)\b/,
      );
    }
  });

  it('DSAR: filtros parametrizados, orden total y limit+1; no selecciona result_file_id', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.dsarList(em, {
      status: INYECCION,
      type: 'X',
      from,
      to,
      cursor: { t: '2026-10-01T00:00:00.000000Z', i: ID },
      limit: 20,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(params).toContain(INYECCION);
    expect(params.at(-1)).toBe(21);
    expect(sql).toContain('order by r.requested_at desc, r.id desc');
    expect(sql).toContain('(r.result_file_id is not null) as has_result_file');
    expect(sql).not.toMatch(/r\.result_file_id\s+as\s/);
  });

  it('DSAR por id: parametrizado', async () => {
    const { em, llamadas } = emQueRegistra();
    expect(await repo.dsarById(em, ID)).toBeNull();
    expect(llamadas[0].params).toEqual([ID]);
  });
});
