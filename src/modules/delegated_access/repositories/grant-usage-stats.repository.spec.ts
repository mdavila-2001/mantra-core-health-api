import { jest } from '@jest/globals';
import { GrantUsageStats } from '../entities';
import { GrantUsageStatsRepository } from './grant-usage-stats.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = new Date('2026-11-02T12:34:56Z');

function build(rows: unknown[] = []) {
  const em: any = {
    find: mockFn().mockResolvedValue(rows),
    execute: mockFn().mockResolvedValue([]),
    nativeDelete: mockFn().mockResolvedValue(3),
    isInTransaction: mockFn().mockReturnValue(true),
    transactional: mockFn((fn: any) => {
      em.isInTransaction.mockReturnValue(true);
      return fn(em);
    }),
    flush: mockFn().mockResolvedValue(undefined),
  };
  return { repo: new GrantUsageStatsRepository(), em };
}

const DELTA = {
  tenantId: 't1',
  userId: 'u1',
  supportScopeGrantId: 'g1',
  permissionCode: 'agenda.appointment.create',
  bucketStart: new Date('2026-11-02T12:00:00Z'),
  permit: 3,
  deny: 1,
  challenge: 0,
  offHours: 1,
  distinctPatients: 2,
  lastUsedAt: NOW,
};

describe('GrantUsageStatsRepository', () => {
  afterEach(() => {
    delete process.env.RLS_ENFORCE;
  });

  it('el volcado hace UPSERT SUMANDO contadores sobre la llave del contrato', async () => {
    const { repo, em } = build();

    await repo.upsertBuckets(em, [DELTA]);

    expect(em.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = em.execute.mock.calls[0];
    expect(sql).toContain('insert into "delegated_access"."grant_usage_stats"');
    expect(sql).toContain(
      'on conflict (tenant_id, support_scope_grant_id, permission_code, bucket_start)',
    );
    expect(sql).toMatch(
      /permit_count\s*=\s*"?grant_usage_stats"?\.permit_count \+ excluded\.permit_count/,
    );
    expect(sql).toMatch(
      /deny_count\s*=\s*"?grant_usage_stats"?\.deny_count \+ excluded\.deny_count/,
    );
    expect(sql).toMatch(
      /challenge_count\s*=\s*"?grant_usage_stats"?\.challenge_count \+ excluded\.challenge_count/,
    );
    expect(sql).toMatch(
      /off_hours_count\s*=\s*"?grant_usage_stats"?\.off_hours_count \+ excluded\.off_hours_count/,
    );
    // Los pacientes distintos no se suman (sobrecontaría): se toma el mayor.
    expect(sql).toMatch(/distinct_patients_in_bucket\s*=\s*greatest\(/i);
    expect(sql).toMatch(/last_used_at\s*=\s*greatest\(/i);
    expect(params).toEqual(
      expect.arrayContaining([
        't1',
        'u1',
        'g1',
        'agenda.appointment.create',
        3,
        1,
        0,
        1,
        2,
      ]),
    );
  });

  it('no escribe nada con un lote vacío', async () => {
    const { repo, em } = build();
    await repo.upsertBuckets(em, []);
    expect(em.execute).not.toHaveBeenCalled();
  });

  it('agrupa varias filas en una sola sentencia', async () => {
    const { repo, em } = build();
    await repo.upsertBuckets(em, [
      DELTA,
      { ...DELTA, tenantId: 't2', userId: 'u9' },
    ]);
    expect(em.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = em.execute.mock.calls[0];
    expect((sql.match(/\(\?/g) ?? []).length).toBe(2);
    expect(params).toEqual(expect.arrayContaining(['t1', 't2']));
  });

  it('el volcado mezcla organizaciones: con RLS abre el contexto de sistema, solo para esta escritura', async () => {
    process.env.RLS_ENFORCE = 'true';
    const { repo, em } = build();
    em.execute
      .mockResolvedValueOnce([{ sc: 'false', tid: '' }])
      .mockResolvedValue([]);

    await repo.upsertBuckets(em, [DELTA]);

    const sqls = em.execute.mock.calls.map((c: unknown[]) => String(c[0]));
    const abre = sqls.findIndex((s: string) =>
      s.includes("'app.system_context', 'true'"),
    );
    const inserta = sqls.findIndex((s: string) => s.includes('insert into'));
    expect(abre).toBeGreaterThanOrEqual(0);
    expect(inserta).toBeGreaterThan(abre);
    // Y lo devuelve como estaba.
    expect(
      sqls.some(
        (s: string, i: number) => i > inserta && s.includes('set_config'),
      ),
    ).toBe(true);
  });

  it('sin transacción abierta el volcado abre la suya', async () => {
    const { repo, em } = build();
    em.isInTransaction.mockReturnValue(false);
    await repo.upsertBuckets(em, [DELTA]);
    expect(em.transactional).toHaveBeenCalledTimes(1);
  });

  it('lee el uso de una organización desde una fecha, en orden estable', async () => {
    const { repo, em } = build([{ id: 'x' }]);
    await repo.findSince(em, 't1', new Date('2026-10-01T00:00:00Z'), {
      userId: 'u1',
    });
    const [entity, where, opts] = em.find.mock.calls[0];
    expect(entity).toBe(GrantUsageStats);
    expect(where).toEqual({
      tenantId: 't1',
      userId: 'u1',
      bucketStart: { $gte: new Date('2026-10-01T00:00:00Z') },
    });
    expect(opts.orderBy).toEqual({ bucketStart: 'asc', id: 'asc' });
  });

  it('el último uso por permiso sale de una sola consulta agregada acotada a la organización', async () => {
    const { repo, em } = build();
    em.execute.mockResolvedValueOnce([
      { support_scope_grant_id: 'g1', last_used_at: NOW },
    ]);

    const map = await repo.lastUsedByGrant(em, 't1', ['g1', 'g2']);

    expect(map.get('g1')).toEqual(NOW);
    expect(map.has('g2')).toBe(false);
    const [sql, params] = em.execute.mock.calls[0];
    expect(sql).toContain('max(last_used_at)');
    expect(sql).toContain('group by support_scope_grant_id');
    expect(params[0]).toBe('t1');
  });

  it('hallazgo del humo real: `execute` entrega el instante como TEXTO ISO y el mapa lo devuelve como Date (si no, `isGrantUnused` truena con ref.getTime)', async () => {
    const { repo, em } = build();
    em.execute.mockResolvedValue([
      { support_scope_grant_id: 'g1', last_used_at: '2026-11-03 09:00:00+00' },
    ]);
    const map = await repo.lastUsedByGrant(em, 't1', ['g1']);
    expect(map.get('g1')).toBeInstanceOf(Date);
    expect(map.get('g1')?.toISOString()).toBe('2026-11-03T09:00:00.000Z');
  });

  it('la retención (400 días) purga por fecha de bloque', async () => {
    const { repo, em } = build();
    const n = await repo.purgeBefore(em, new Date('2025-09-28T00:00:00Z'));
    expect(n).toBe(3);
    expect(em.nativeDelete.mock.calls[0]).toEqual([
      GrantUsageStats,
      { bucketStart: { $lt: new Date('2025-09-28T00:00:00Z') } },
    ]);
  });
});
