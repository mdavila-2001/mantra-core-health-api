import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import { AuthProvidersListingService } from './auth-providers-listing.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T = '11111111-1111-1111-1111-111111111111';
const P = '22222222-2222-2222-2222-222222222222';

const providerRow = {
  id: P,
  tenant_id: null,
  code: 'google',
  name: 'Google',
  protocol_concept_id: 'proto',
  provider_category_concept_id: 'cat',
  state_concept_id: 'st',
  created_at: new Date('2026-01-01T00:00:00Z'),
};

function build(byCall: Record<string, unknown>[][]) {
  const execute = mockFn();
  byCall.forEach((rows) => execute.mockResolvedValueOnce(rows));
  execute.mockResolvedValue([]);
  const em: any = {
    fork: mockFn(() => em),
    getConnection: () => ({ execute }),
  };
  return { service: new AuthProvidersListingService(em), execute };
}

describe('AuthProvidersListingService (CV-13)', () => {
  it('lista los proveedores globales y los del tenant del actor, nunca los de otro', async () => {
    const d = build([[providerRow]]);
    const page = await d.service.listProviders(T, {});
    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain('p.tenant_id = ? or p.tenant_id is null');
    expect(params[0]).toBe(T);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].code).toBe('google');
  });

  it('la ficha 404 si el proveedor no es visible para el tenant', async () => {
    const d = build([[]]);
    await expect(d.service.getProvider(T, P)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    // no se consulta nada más de un proveedor ajeno
    expect(d.execute).toHaveBeenCalledTimes(1);
  });

  it('ninguna consulta selecciona secretos y la respuesta no los lleva', async () => {
    const d = build([
      [providerRow],
      [
        {
          id: 'c1',
          environment_concept_id: 'env',
          client_id: 'public-client',
          state_concept_id: 'st',
          // Aunque una fila trajera el secreto, no se mapea a la respuesta.
          client_secret_ref: 'vault://secret',
          extra_config_json: { password: 'x' },
        },
      ],
      [],
      [],
      [],
      [],
    ]);
    const detail = await d.service.getProvider(T, P);
    const sqls = d.execute.mock.calls
      .map((c: any[]) => c[0] as string)
      .join('\n');
    expect(sqls).not.toContain('client_secret_ref');
    expect(sqls).not.toContain('extra_config_json');
    expect(sqls).not.toContain('certificate');
    expect(JSON.stringify(detail)).not.toContain('vault://secret');
    expect(JSON.stringify(detail)).not.toContain('password');
    expect(detail.protocolConfigs[0].clientId).toBe('public-client');
  });

  it('los vínculos y las reglas se recortan al tenant del actor', async () => {
    const d = build([[providerRow]]);
    await d.service.getProvider(T, P);
    const calls = d.execute.mock.calls as [string, unknown[]][];
    const bindings = calls.find(([sql]) =>
      sql.includes('provider_tenant_bindings'),
    )!;
    const rules = calls.find(([sql]) => sql.includes('provisioning_rules'))!;
    expect(bindings[1]).toEqual([P, T]);
    expect(rules[1]).toEqual([P, T]);
  });
});
