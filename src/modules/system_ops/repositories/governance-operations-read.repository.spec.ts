import type { EntityManager } from '@mikro-orm/postgresql';
import { GovernanceOperationsReadRepository } from './governance-operations-read.repository';

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
const INYECCION = "'; drop table system_ops.legal_holds; --";
const ID = '00000000-0000-4000-8000-0000000000a1';

describe('GovernanceOperationsReadRepository (SQL generado, sin base real)', () => {
  const repo = new GovernanceOperationsReadRepository();

  it('dominios: parámetros alineados, entrada fuera del SQL, orden total y limit+1', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.domains(em, {
      q: INYECCION,
      cursor: { c: 'a', i: ID },
      limit: 10,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(sql).toContain('order by d.code, d.id');
    expect(sql).toContain('(d.code, d.id) > (?, ?::uuid)');
    // los comodines de LIKE del cliente se escapan
    expect(params[0]).toBe(`%${INYECCION.toLowerCase().replace(/_/g, '\\_')}%`);
    expect(params.at(-1)).toBe(11);
  });

  it('dominios: un `%` del cliente se escapa y no es comodín', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.domains(em, { q: '100%_x', limit: 5 });
    expect(llamadas[0].params[0]).toBe('%100\\%\\_x%');
  });

  it('retenciones legales: sin filtros no hay where; con filtros, uno por parámetro', async () => {
    const a = emQueRegistra();
    await repo.legalHolds(a.em, { limit: 3 });
    expect(a.llamadas[0].sql).not.toContain(' where ');
    expect(placeholders(a.llamadas[0].sql)).toBe(a.llamadas[0].params.length);

    const b = emQueRegistra();
    await repo.legalHolds(b.em, {
      status: INYECCION,
      targetType: 'X',
      tenantId: ID,
      targetId: ID,
      cursor: { t: '2026-10-01T00:00:00.000000Z', i: ID },
      limit: 3,
    });
    const { sql, params } = b.llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(params).toContain(INYECCION);
    expect(sql).toContain('order by h.updated_at desc, h.id desc');
    expect(sql).toContain('(h.updated_at, h.id) < (?::timestamptz, ?::uuid)');
  });

  it('retenciones legales: nunca selecciona el texto de la autoridad', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.legalHolds(em, { limit: 1 });
    // sólo aparece dentro de la expresión booleana `<> ''`
    expect(llamadas[0].sql).not.toMatch(/h\.authority_reference\s+as\s/);
    expect(llamadas[0].sql).toContain(
      "(coalesce(h.authority_reference, '') <> '') as has_authority_reference",
    );
  });

  it('ejecuciones: ventana, filtros y cursor alinean parámetros; no selecciona error_text', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.retentionExecutions(em, {
      policyId: ID,
      entityRegistryId: ID,
      status: INYECCION,
      from: new Date('2026-10-01T00:00:00Z'),
      to: new Date('2026-10-02T00:00:00Z'),
      cursor: { t: '2026-10-01T00:00:00.000000Z', i: ID },
      limit: 25,
    });
    const { sql, params } = llamadas[0];
    expect(placeholders(sql)).toBe(params.length);
    expect(sql).not.toContain('drop table');
    expect(params).toContain(INYECCION);
    expect(params.at(-1)).toBe(26);
    expect(sql).toContain('order by e.recorded_at desc, e.id desc');
    expect(sql).toContain('(e.error_text is not null) as has_error');
    expect(sql).not.toMatch(/e\.error_text\s+as\s/);
  });

  it('sólo emite select', async () => {
    const { em, llamadas } = emQueRegistra();
    await repo.domains(em, { limit: 1 });
    await repo.legalHolds(em, { limit: 1 });
    await repo.retentionExecutions(em, { limit: 1 });
    for (const { sql } of llamadas)
      expect(sql.trim().toLowerCase()).toMatch(/^select /);
  });
});
