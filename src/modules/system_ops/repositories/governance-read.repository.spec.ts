import type { EntityManager } from '@mikro-orm/postgresql';
import { GovernanceReadRepository } from './governance-read.repository';

/** Un EntityManager que sólo registra el SQL y los parámetros (DOBLE: sin base real). */
function emQueRegistra(respuesta: unknown[] = []) {
  const llamadas: { sql: string; params: unknown[] }[] = [];
  const em = {
    getConnection: () => ({
      execute: (sql: string, params: unknown[]) => {
        llamadas.push({ sql, params });
        return Promise.resolve(respuesta);
      },
    }),
    getTransactionContext: () => undefined,
  } as unknown as EntityManager;
  return { em, llamadas };
}

const placeholders = (sql: string): number => (sql.match(/\?/g) ?? []).length;
const INYECCION = "'; drop table system_ops.write_policies; --";
const ID = '00000000-0000-4000-8000-0000000000a1';

describe('GovernanceReadRepository (SQL generado, sin base real)', () => {
  it('políticas: parámetros alineados, entrada del cliente fuera del SQL, limit+1', async () => {
    const { em, llamadas } = emQueRegistra();
    await new GovernanceReadRepository().policies(em, {
      type: 'WRITE',
      state: INYECCION,
      q: INYECCION,
      sort: 'code',
      order: 'asc',
      cursor: { k: 'a', t: 'WRITE', i: ID },
      limit: 20,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(params).toContain(INYECCION);
    expect(params.at(-1)).toBe(21);
  });

  it.each([
    ['code', 'asc', '>', 'order by code asc, policy_type asc, id asc'],
    ['code', 'desc', '<', 'order by code desc, policy_type desc, id desc'],
    [
      'updatedAt',
      'asc',
      '>',
      'order by updated_at asc, policy_type asc, id asc',
    ],
    [
      'updatedAt',
      'desc',
      '<',
      'order by updated_at desc, policy_type desc, id desc',
    ],
  ] as const)(
    'políticas: orden %s %s es total y la continuación usa el mismo sentido',
    async (sort, order, cmp, esperado) => {
      const { em, llamadas } = emQueRegistra();
      await new GovernanceReadRepository().policies(em, {
        sort,
        order,
        cursor: { k: 'x', t: 'WRITE', i: ID },
        limit: 5,
      });
      expect(llamadas[0].sql).toContain(esperado);
      expect(llamadas[0].sql).toMatch(
        new RegExp(`\\((code|updated_at), policy_type, id\\) \\${cmp} \\(`),
      );
    },
  );

  it('políticas: los cuatro tipos están en la unión', async () => {
    const { em, llamadas } = emQueRegistra();
    await new GovernanceReadRepository().policies(em, {
      sort: 'code',
      order: 'asc',
      limit: 1,
    });
    for (const tipo of ['WRITE', 'RETENTION', 'ANONYMIZATION', 'RESIDENCY'])
      expect(llamadas[0].sql).toContain(`'${tipo}'`);
  });

  it.each(['WRITE', 'RETENTION', 'ANONYMIZATION', 'RESIDENCY'] as const)(
    'detalle %s: un solo parámetro (el id) y ningún snapshot ni valor de parámetro',
    async (tipo) => {
      const { em, llamadas } = emQueRegistra([]);
      expect(
        await new GovernanceReadRepository().policyDetail(em, tipo, ID),
      ).toBeNull();
      const { sql, params } = llamadas[0];
      expect(params).toEqual([ID]);
      expect(placeholders(sql)).toBe(1);
      expect(sql).not.toMatch(/snapshot_json/);
      // el detalle de una anonimización lista nombres de parámetros, nunca `parameters_json` entero
      expect(sql).not.toMatch(/'parameters',\s*a\.parameters_json/);
    },
  );

  it('«aplicada a» está acotada y las residencias no la tienen', async () => {
    const { em, llamadas } = emQueRegistra();
    const repo = new GovernanceReadRepository();
    expect(await repo.appliedTo(em, 'RESIDENCY', ID)).toEqual([]);
    expect(llamadas).toHaveLength(0);
    await repo.appliedTo(em, 'ANONYMIZATION', ID);
    expect(llamadas[0].params).toEqual([ID, 50]);
  });

  it('bitácora: ventana obligatoria, filtros y cursor como parámetros', async () => {
    const { em, llamadas } = emQueRegistra();
    const from = new Date('2026-10-01T00:00:00Z');
    await new GovernanceReadRepository().changeLog(em, {
      from,
      to: new Date('2026-10-02T00:00:00Z'),
      targetType: INYECCION,
      targetId: ID,
      changedBy: ID,
      cursor: { t: '2026-10-01T10:00:00.000000Z', i: ID },
      limit: 10,
    });
    const { sql, params } = llamadas[0];
    expect(sql).toContain('g.recorded_at >= ?::timestamptz');
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(sql).toMatch(/order by g\.recorded_at desc, g\.id desc/);
    expect(params[0]).toBe(from);
    expect(params.at(-1)).toBe(11);
  });

  it('registro: orden total y filtros booleanos como parámetros', async () => {
    const { em, llamadas } = emQueRegistra();
    await new GovernanceReadRepository().entityRegistry(em, {
      schema: 'iam',
      q: INYECCION,
      containsPii: false,
      containsPhi: true,
      cursor: { s: 'iam', t: 'users', i: ID },
      limit: 3,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).toContain('order by er.schema_name, er.table_name, er.id');
    expect(params).toEqual(
      expect.arrayContaining(['iam', false, true, 'iam', 'users', ID, 4]),
    );
  });

  it('campos: no leen las notas libres', async () => {
    const { em, llamadas } = emQueRegistra();
    await new GovernanceReadRepository().fieldRegistry(em, ID, {
      cursor: { c: 'email', i: ID },
      limit: 5,
    });
    expect(llamadas[0].sql).not.toMatch(/\bnotes\b/);
    expect(llamadas[0].sql).toContain('order by fr.column_name, fr.id');
    expect(placeholders(llamadas[0].sql)).toBe(llamadas[0].params.length);
  });
});
