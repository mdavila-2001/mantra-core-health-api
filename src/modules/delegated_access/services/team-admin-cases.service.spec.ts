import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';
import { TeamAdminCasesService } from './team-admin-cases.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'org-1';
const sofia = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;
const gonzalo = { id: 'gonzalo', roles: ['SECURITY_ADMIN'] } as any;

const summary = (
  id: string,
  engagementId: string,
  openedByUserId?: string,
): any => ({
  id,
  kind: 'LEAVER',
  status: 'OPEN',
  engagementId,
  subjectUserId: 'u',
  openedByUserId,
  openedAt: new Date(),
  checklist: [],
  handover: [],
});

function build() {
  const policy = {
    actorOf: mockFn(async (_e: any, actor: any) =>
      actor.id === 'gonzalo'
        ? { full: true, userId: 'gonzalo' }
        : { full: false, userId: 'sofia', ctx: {} },
    ),
    population: mockFn().mockResolvedValue([
      { record: { assignment: { id: 'e-marcos' } } },
    ]),
  };
  const cases = [
    summary('c1', 'e-marcos'),
    summary('c2', 'e-ana'),
    summary('c3', 'e-pablo', 'sofia'),
  ];
  const lifecycle = {
    listCases: mockFn().mockResolvedValue({ items: cases, count: 3 }),
    getCase: mockFn(async (id: string) => cases.find((c) => c.id === id)),
    completeItem: mockFn().mockResolvedValue({}),
  };
  const handover = { assign: mockFn().mockResolvedValue({ caseId: 'c3' }) };
  const em = { fork: mockFn().mockReturnValue({}) };
  const service = new TeamAdminCasesService(
    em as any,
    policy as any,
    lifecycle as any,
    handover as any,
    new DelegationScopeService({} as any, {} as any, {} as any, {} as any),
  );
  return {
    service,
    lifecycle,
    handover,
    inTenant: <T>(fn: () => T): T => runWithTenant(TENANT, fn),
  };
}

describe('TeamAdminCasesService', () => {
  it('un delegado ve los casos de su población y los que él abrió; SECURITY_ADMIN, todos', async () => {
    const t = build();
    const mine = await t.inTenant(() => t.service.cases(sofia, {} as any));
    expect(mine.items.map((c) => c.id)).toEqual(['c1', 'c3']);
    const all = await t.inTenant(() => t.service.cases(gonzalo, {} as any));
    expect(all.count).toBe(3);
  });

  it('un caso fuera de su alcance responde como inexistente', async () => {
    const t = build();
    await expect(
      t.inTenant(() => t.service.caseOf('c2', sofia)),
    ).rejects.toMatchObject({
      reason: Reason.LIFECYCLE_CASE_NOT_FOUND,
    });
    await expect(
      t.inTenant(() => t.service.caseOf('c3', sofia)),
    ).resolves.toMatchObject({ id: 'c3' });
  });

  it('reasignar el traspaso de una baja que ella hizo funciona; el de otra persona no', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.assignHandover('c3', { defaultToUserId: 'ana' } as any, sofia),
    );
    expect(t.handover.assign).toHaveBeenCalledWith(
      'c3',
      { defaultToUserId: 'ana' },
      sofia,
    );
    await expect(
      t.inTenant(() => t.service.assignHandover('c2', {} as any, sofia)),
    ).rejects.toMatchObject({ reason: Reason.LIFECYCLE_CASE_NOT_FOUND });
  });

  it('completar a mano el ítem del traspaso exige además team.handover.execute', async () => {
    const t = build();
    await t.inTenant(() =>
      t.service.completeItem('c3', 'HANDOVER_ASSIGNED', sofia),
    );
    expect(t.lifecycle.completeItem).toHaveBeenCalled();
  });
});
