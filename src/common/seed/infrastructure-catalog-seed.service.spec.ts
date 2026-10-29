import { jest } from '@jest/globals';
import {
  PARENT_RULE_SEEDS,
  TYPOLOGY_RULE_SEEDS,
} from '../../modules/practice/infrastructure-catalog';
import { InfrastructureCatalogSeedService } from './infrastructure-catalog-seed.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(opts: { filled?: number; linked?: number } = {}) {
  const calls: Array<[string, unknown[] | undefined]> = [];
  const tx = {
    execute: mockFn(async (sql: string, params?: unknown[]) => {
      calls.push([sql, params]);
      if (sql.includes('update practice.care_spaces'))
        return Array.from({ length: opts.filled ?? 0 }, () => ({ id: 'x' }));
      if (sql.includes('insert into practice.space_unit_assignments'))
        return Array.from({ length: opts.linked ?? 0 }, () => ({ id: 'x' }));
      return [];
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const orm = { em: { fork: mockFn(() => em) } };
  const rules = {
    seedParentRules: mockFn().mockResolvedValue(0),
    seedTypologyRules: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new InfrastructureCatalogSeedService(
    orm as never,
    rules as never,
    logger as never,
  );
  return { service, rules, logger, calls, tx };
}

describe('InfrastructureCatalogSeedService', () => {
  it('siembra todas las reglas padre→hijo y de tipología que declara el catálogo', async () => {
    const d = build();
    await d.service.run();
    const parentPairs = d.rules.seedParentRules.mock.calls[0][1] as unknown[];
    const expected = PARENT_RULE_SEEDS.reduce(
      (n, rule) => n + rule.children.length,
      0,
    );
    expect(parentPairs).toHaveLength(expected);
    expect(d.rules.seedTypologyRules.mock.calls[0][1]).toHaveLength(
      TYPOLOGY_RULE_SEEDS.length,
    );
  });

  it('abre el contexto SYSTEM solo dentro de la transacción de los backfills (SET LOCAL)', async () => {
    const d = build();
    await d.service.run();
    expect(d.calls[0][0]).toContain(
      "set_config('app.system_context', 'true', true)",
    );
    expect(d.calls.map(([sql]) => sql).join('\n')).not.toMatch(
      /set_config\('app\.system_context', 'true', false\)/,
    );
  });

  it('cuenta lo que escribió cada paso y lo suma en `inserted`', async () => {
    const d = build({ filled: 3, linked: 2 });
    d.rules.seedParentRules.mockResolvedValue(40);
    d.rules.seedTypologyRules.mockResolvedValue(7);
    const res = await d.service.run();
    expect(res).toEqual({
      parentRules: 40,
      typologyRules: 7,
      formBackfilled: 3,
      ownerAssignments: 2,
      inserted: 52,
    });
    expect(d.logger.info).toHaveBeenCalledTimes(1);
  });

  it('es idempotente: con todo sembrado inserta cero y no hace ruido', async () => {
    const d = build();
    const res = await d.service.run();
    expect(res.inserted).toBe(0);
    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('el backfill solo toca espacios sin forma y vínculos que no existen, sin pisar nada', async () => {
    const d = build();
    await d.service.run();
    const update = d.calls.find(([sql]) =>
      sql.includes('update practice.care_spaces'),
    )![0];
    expect(update).toContain('where form_concept_id is null');
    const insert = d.calls.find(([sql]) =>
      sql.includes('insert into practice.space_unit_assignments'),
    )![0];
    expect(insert).toContain('not exists');
    expect(insert).toContain('a.valid_to is null');
  });
});
