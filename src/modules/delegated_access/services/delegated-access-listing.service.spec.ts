import { jest } from '@jest/globals';
import { ResourceNotFoundException, encodeKeysetCursor } from '../../../common';
import { DelegatedAccessListingService } from './delegated-access-listing.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(rows: Record<string, unknown>[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  const em: any = {
    fork: mockFn(() => em),
    getConnection: () => ({ execute }),
  };
  return { service: new DelegatedAccessListingService(em), execute };
}

const T = '11111111-1111-1111-1111-111111111111';

describe('DelegatedAccessListingService (CV-13)', () => {
  it.each([
    ['listOrgUserAssignments', 'organization_user_assignments'],
    ['listPractitionerDelegates', 'practitioner_delegate_assignments'],
    ['listAccessRequests', 'delegated_access_approval_requests'],
  ] as const)(
    '%s parte del tenant del actor por directory.tenant_memberships',
    async (method, table) => {
      const d = build();
      await (d.service as any)[method](T, {});
      const [sql, params] = d.execute.mock.calls[0];
      expect(sql).toContain(table);
      expect(sql).toContain('directory.tenant_memberships');
      expect(sql).toContain('m.tenant_id = ?');
      expect(params[0]).toBe(T);
    },
  );

  it('los ítems de un set salen sólo si el set es del tenant del actor', async () => {
    const d = build();
    d.execute.mockResolvedValueOnce([{ id: 'set-1' }]).mockResolvedValueOnce([
      {
        id: 'i-1',
        permission_id: 'perm-1',
        requires_step_up_authentication: true,
        constraint_json: { scope: 'ambulatorio' },
      },
    ]);
    const res = await d.service.listPermissionSetItems(T, 'set-1');
    expect(d.execute.mock.calls[0][1]).toEqual(['set-1', T]);
    expect(res.items).toEqual([
      {
        id: 'i-1',
        permissionId: 'perm-1',
        requiresStepUpAuthentication: true,
        constraint: { scope: 'ambulatorio' },
      },
    ]);
  });

  it('un set ajeno o inexistente es 404 y no se leen sus ítems', async () => {
    const d = build([]);
    await expect(
      d.service.listPermissionSetItems(T, 'set-ajeno'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.execute).toHaveBeenCalledTimes(1);
  });

  it('pide limit + 1 para saber si hay continuación y devuelve nextCursor', async () => {
    const rows = ['a', 'b', 'c'].map((id, i) => ({
      id: `id-${id}`,
      tenant_membership_id: 'm',
      assignment_role_concept_id: 'r',
      access_scope_concept_id: 's',
      status_concept_id: 'st',
      created_at: new Date(2026, 0, i + 1),
    }));
    const d = build(rows);
    const page = await d.service.listOrgUserAssignments(T, { limit: 2 });
    expect(d.execute.mock.calls[0][1]).toEqual([T, null, null, 3]);
    expect(page.count).toBe(2);
    expect(page.nextCursor).toBe(encodeKeysetCursor({ id: 'id-b' }));
  });

  it('la última página no trae cursor y el cursor recibido se traduce a id >', async () => {
    const d = build([]);
    const cursor = encodeKeysetCursor({ id: 'id-b' });
    const page = await d.service.listPractitionerDelegates(T, { cursor });
    expect(d.execute.mock.calls[0][1]).toEqual([T, 'id-b', 'id-b', 51]);
    expect(page.nextCursor).toBeNull();
  });
});
