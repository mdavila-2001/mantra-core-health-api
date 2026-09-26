import { jest } from '@jest/globals';
import { IdentityCatalogListingService } from './identity-catalog-listing.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(rows: Record<string, unknown>[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  const em: any = {
    fork: mockFn(() => em),
    getConnection: () => ({ execute }),
  };
  return { service: new IdentityCatalogListingService(em), execute };
}

const T = '11111111-1111-1111-1111-111111111111';

describe('IdentityCatalogListingService (CV-13)', () => {
  it('las autoridades se acotan al tenant del actor', async () => {
    const d = build([
      {
        id: 'a1',
        authority_code: 'SEGIP',
        name: 'SEGIP',
        authority_type_concept_id: 't',
        verification_status_concept_id: 'v',
        status_concept_id: 's',
        created_at: new Date(),
      },
    ]);
    const page = await d.service.listAuthorities(T, {});
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('where tenant_id = ?');
    expect(params[0]).toBe(T);
    expect(page.items[0].authorityCode).toBe('SEGIP');
  });

  it('las políticas son catálogo de plataforma: sin filtro de tenant', async () => {
    const d = build([]);
    const page = await d.service.listPolicies({ limit: 10 });
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).not.toContain('tenant_id');
    expect(params).toEqual([null, null, 11]);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
