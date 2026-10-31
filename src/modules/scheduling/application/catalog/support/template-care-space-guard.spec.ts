import { describe, expect, it, jest } from '@jest/globals';
import { TemplateCareSpaceGuard } from './template-care-space-guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const resource = {
  id: 'r1',
  tenantId: 't1',
  practiceId: 'p1',
  timeZone: 'America/La_Paz',
} as any;
const space = (over: Record<string, unknown> = {}) => ({
  tenantId: 't1',
  practiceSiteId: 's1',
  practiceId: 'p1',
  functionCode: 'SPACE_FN_CONSULTING_ROOM',
  allowOverlap: false,
  schedulable: true,
  active: true,
  ...over,
});
const band = { dayOfWeek: 1, startTime: '14:00:00', endTime: '15:00:00' };
function build(desc: unknown, others: unknown[] = []) {
  return new TemplateCareSpaceGuard(
    { describe: mockFn().mockResolvedValue(desc) } as any,
    { findRulesByCareSpace: mockFn().mockResolvedValue(others) } as any,
  );
}
const status = (p: Promise<unknown>) =>
  p.then(
    () => 0,
    (e: any) => [e.getStatus(), e.reason],
  );

describe('consultorio de una plantilla (§F5d)', () => {
  it('consultorio agendable de la práctica y libre → ok', async () => {
    await expect(
      status(
        build(space()).assert({} as any, resource, 'c', [band], undefined),
      ),
    ).resolves.toBe(0);
  });
  it('fail-closed por tenant: de otro tenant o inexistente → 404', async () => {
    expect(
      await status(
        build(space({ tenantId: 't2' })).assert(
          {} as any,
          resource,
          'c',
          [band],
          undefined,
        ),
      ),
    ).toEqual([404, undefined]);
    expect(
      await status(
        build(null).assert({} as any, resource, 'c', [band], undefined),
      ),
    ).toEqual([404, undefined]);
  });
  it('función que no es consultorio/procedimiento/imagen, o retirado → 422 INVALID_FUNCTION', async () => {
    for (const s of [
      space({ functionCode: 'SPACE_FN_OFFICE_ADMIN' }),
      space({ active: false }),
    ])
      expect(
        await status(
          build(s).assert({} as any, resource, 'c', [band], undefined),
        ),
      ).toEqual([422, 'TEMPLATE_CARE_SPACE_INVALID_FUNCTION']);
  });
  it('de otra práctica → 422 SITE_MISMATCH', async () => {
    expect(
      await status(
        build(space({ practiceId: 'p2' })).assert(
          {} as any,
          resource,
          'c',
          [band],
          undefined,
        ),
      ),
    ).toEqual([422, 'TEMPLATE_CARE_SPACE_SITE_MISMATCH']);
  });
  it('otra plantilla del mismo consultorio a la misma hora → 422 OVERLAP_CARE_SPACE; contigua no', async () => {
    const other = (start: string, end: string) => ({
      rule: { dayOfWeek: 1, startTime: start, endTime: end },
      templateName: 'Otra',
      timeZone: 'America/La_Paz',
    });
    expect(
      await status(
        build(space(), [other('14:30:00', '15:30:00')]).assert(
          {} as any,
          resource,
          'c',
          [band],
          undefined,
        ),
      ),
    ).toEqual([422, 'TEMPLATE_RULE_OVERLAP_CARE_SPACE']);
    expect(
      await status(
        build(space(), [other('15:00:00', '16:00:00')]).assert(
          {} as any,
          resource,
          'c',
          [band],
          undefined,
        ),
      ),
    ).toBe(0);
  });
});
