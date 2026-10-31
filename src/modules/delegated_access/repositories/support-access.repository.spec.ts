import { jest } from '@jest/globals';
import { SupportAccessRepository } from './support-access.repository';
import { SupportGrantActions, SupportScopeGrants } from '../entities';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('SupportAccessRepository.findGrantsWithActions (gobierno de accesos)', () => {
  const grants = [{ id: 'g1' }, { id: 'g2' }];
  const rows = [
    {
      supportScopeGrantId: 'g1',
      permissionId: 'perm-a',
      conditionJson: { schemaVersion: 1 },
      conditionSchemaVersion: 1,
      supersededAt: null,
    },
    { supportScopeGrantId: 'g1', permissionId: 'perm-b', supersededAt: null },
  ];

  function build() {
    const find = mockFn((entity: unknown) =>
      Promise.resolve(entity === SupportScopeGrants ? grants : rows),
    );
    return { repo: new SupportAccessRepository(), em: { find } as any, find };
  }

  it('lee solo las acciones vigentes (superseded_at nulo) en UNA consulta y conserva permissionIds', async () => {
    const { repo, em, find } = build();
    const result = await repo.findGrantsWithActions(em, ['eng-1']);
    const actionQuery = find.mock.calls.find(
      ([entity]: any[]) => entity === SupportGrantActions,
    );
    expect(actionQuery[1]).toMatchObject({ supersededAt: null });
    expect(find).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].permissionIds).toEqual(['perm-a', 'perm-b']);
    expect(result[0].actions).toEqual([
      {
        permissionId: 'perm-a',
        conditionJson: { schemaVersion: 1 },
        conditionSchemaVersion: 1,
        supersededAt: null,
      },
      {
        permissionId: 'perm-b',
        conditionJson: undefined,
        conditionSchemaVersion: undefined,
        supersededAt: null,
      },
    ]);
    expect(result[1]).toMatchObject({ permissionIds: [], actions: [] });
  });

  it('sin vínculos no consulta nada', async () => {
    const { repo, em, find } = build();
    await expect(repo.findGrantsWithActions(em, [])).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
