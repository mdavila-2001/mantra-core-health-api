import { jest } from '@jest/globals';
import { HealthContextListingService } from './health-context-listing.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(rows: Record<string, unknown>[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  const em: any = {
    fork: mockFn(() => em),
    getConnection: () => ({ execute }),
  };
  return { service: new HealthContextListingService(em), execute };
}

const T = '11111111-1111-1111-1111-111111111111';

describe('HealthContextListingService (CV-13)', () => {
  it('los agentes son los de plataforma y los del tenant del actor', async () => {
    const d = build();
    await d.service.listAgents(T, {});
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain(
      'owner_tenant_id is null or owner_tenant_id = ?::uuid',
    );
    expect(params[0]).toBe(T);
  });

  it('sin tenant en la sesión sólo se listan los agentes de plataforma', async () => {
    const d = build();
    await d.service.listAgents(undefined, {});
    expect(d.execute.mock.calls[0][1][0]).toBeNull();
  });

  it('las versiones de un contexto no llevan el payload', async () => {
    const d = build([
      {
        id: 'v1',
        version_number: 1,
        observed_at: new Date(),
        effective_from: new Date(),
        content_hash: 'h',
        status_concept_id: 's',
        context_payload_json: { secreto: true },
      },
    ]);
    const page = await d.service.listContextVersions('ctx', {});
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).not.toContain('context_payload_json');
    expect(params[0]).toBe('ctx');
    expect(JSON.stringify(page)).not.toContain('secreto');
  });

  it.each([
    ['listSources', 'health_context_sources'],
    ['listSchedules', 'country_context_schedules'],
    ['listContexts', 'country_health_contexts'],
    ['listCollectionRuns', 'context_collection_runs'],
  ] as const)('%s lee %s con paginación keyset', async (method, table) => {
    const d = build();
    const page = await (d.service as any)[method]({ limit: 5 });
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain(table);
    expect(params).toEqual([null, null, 6]);
    expect(page.nextCursor).toBeNull();
  });
});
