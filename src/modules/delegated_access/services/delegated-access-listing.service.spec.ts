import { jest } from '@jest/globals';
import { encodeKeysetCursor } from '../../../common';
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
