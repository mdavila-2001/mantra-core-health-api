import { describe, expect, it, jest } from '@jest/globals';
import { PRAC } from '../../modules/practice/practice.concepts';
import {
  FacilityTypologyRules,
  SpaceFormParentRules,
} from '../../modules/practice/entities';
import {
  PARENT_RULE_SEED,
  TYPOLOGY_RULE_SEED,
} from '../../modules/practice/domain/structure/structure-catalog';
import { PracticeInfrastructureSeedService } from './practice-infrastructure-seed.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Base en memoria: lo que se crea en una corrida existe en la siguiente. */
function build() {
  const rows = new Map<unknown, any[]>([
    [SpaceFormParentRules, []],
    [FacilityTypologyRules, []],
  ]);
  let pendingBackfill = 3;
  const tx: any = {
    execute: mockFn(async (sql: string) => {
      if (sql.startsWith('UPDATE')) {
        const out = Array.from({ length: pendingBackfill }, (_, i) => ({ id: `c${i}` }));
        pendingBackfill = 0;
        return out;
      }
      return [];
    }),
    find: mockFn(async (entity: unknown) => [...(rows.get(entity) ?? [])]),
    create: mockFn((entity: unknown, data: any) => rows.get(entity)!.push(data)),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const orm: any = { em: { fork: () => ({ transactional: (cb: any) => cb(tx) }) } };
  const logger = { setContext: mockFn(), info: mockFn() };
  return { service: new PracticeInfrastructureSeedService(orm, logger as any), tx, rows };
}

describe('PracticeInfrastructureSeedService', () => {
  it('siembra reglas, completa la forma y es idempotente', async () => {
    const d = build();
    const first = await d.service.run();
    expect(first).toEqual({
      parentRules: PARENT_RULE_SEED.length,
      typologyRules: TYPOLOGY_RULE_SEED.length,
      formBackfill: 3,
    });
    expect(d.tx.execute).toHaveBeenCalledWith(
      "select set_config('app.system_context', 'true', true)",
    );
    expect(d.tx.execute).toHaveBeenCalledWith(
      expect.stringContaining('SET form_concept_id'),
      [PRAC.LOC_FORM_ROOM],
      'all',
    );
    const second = await d.service.run();
    expect(second).toEqual({ parentRules: 0, typologyRules: 0, formBackfill: 0 });
  });

  it('no pisa una regla de tipología ajustada a mano', async () => {
    const d = build();
    const first = TYPOLOGY_RULE_SEED[0];
    d.rows.get(FacilityTypologyRules)!.push({
      typologyConceptId: PRAC[first.typology as keyof typeof PRAC],
      spaceFunctionConceptId: PRAC[first.function as keyof typeof PRAC],
      ruleConceptId: PRAC.TYPO_ALLOWED,
    });
    const res = await d.service.run();
    expect(res.typologyRules).toBe(TYPOLOGY_RULE_SEED.length - 1);
    expect(d.rows.get(FacilityTypologyRules)![0].ruleConceptId).toBe(PRAC.TYPO_ALLOWED);
  });
});
