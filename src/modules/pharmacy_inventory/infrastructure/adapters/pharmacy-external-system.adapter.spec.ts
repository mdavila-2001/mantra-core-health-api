import { jest } from '@jest/globals';
import { PharmacyExternalSystemAdapter } from './pharmacy-external-system.adapter';
import { externalSystemConfigJson } from '../../domain/sync/external-system';

/** Un repositorio en memoria con la forma del real. */
function fakeRepo() {
  const connections = new Map<string, any>();
  const credentials: any[] = [];
  let n = 0;
  return {
    connections,
    credentials,
    ensureProvider: jest.fn(async (_em: any, format: string) => ({
      id: `provider-${format}`,
    })),
    createConnection: jest.fn((_em: any, data: any) => {
      const row = {
        id: `conn-${++n}`,
        ...data,
        updatedAt: new Date('2026-11-01T00:00:00Z'),
      };
      connections.set(row.id, row);
      return row;
    }),
    createCredential: jest.fn((_em: any, data: any) => {
      const row = {
        connectionId: data.connectionId,
        secretRef: data.encryptedKeyRef,
        active: true,
      };
      credentials.push(row);
      return row;
    }),
    retireCredential: jest.fn((c: any) => {
      c.active = false;
    }),
    pauseConnection: jest.fn((c: any) => {
      c.paused = true;
    }),
    find: jest.fn(async (_em: any, id: string, tenantId: string) => {
      const connection = connections.get(id);
      if (!connection || connection.tenantId !== tenantId) return null;
      const credential =
        [...credentials]
          .reverse()
          .find((c) => c.connectionId === id && c.active) ?? null;
      return { connection, credential };
    }),
    findMany: jest.fn(async () => new Map()),
  };
}

const em = { flush: jest.fn(async () => undefined) } as any;
const CONFIG = {
  format: 'ALOVIDA_STANDARD' as const,
  baseUrl: 'http://sim:4100/alovida-standard',
  externalPharmacyCode: 'F1',
};

describe('PharmacyExternalSystemAdapter (FAR-C9 · C9-3)', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = 'sim';
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it('without its own system it talks to the server one, if there is one', async () => {
    const server = { isConfigured: () => true } as any;
    const adapter = new PharmacyExternalSystemAdapter(
      fakeRepo() as any,
      server,
    );
    await expect(adapter.resolve(em, 't', null)).resolves.toMatchObject({
      status: 'READY',
      source: 'SERVER',
      client: server,
    });
    const none = new PharmacyExternalSystemAdapter(
      fakeRepo() as any,
      { isConfigured: () => false } as any,
    );
    await expect(none.resolve(em, 't', null)).resolves.toEqual({
      status: 'NOT_CONFIGURED',
    });
  });

  it('stores the key encrypted and gets back the same key to call', async () => {
    const repo = fakeRepo();
    const adapter = new PharmacyExternalSystemAdapter(
      repo as any,
      { isConfigured: () => false } as any,
    );
    const id = await adapter.save(em, {
      tenantId: 't',
      connectionId: null,
      config: CONFIG,
      apiKey: 'plain-key',
      actorUserId: 'u',
    });
    expect(repo.credentials[0].secretRef).not.toContain('plain-key');
    expect(repo.connections.get(id).configJson).toEqual(
      externalSystemConfigJson(CONFIG),
    );
    const clientFor = jest.spyOn(adapter, 'clientFor');
    const resolved = await adapter.resolve(em, 't', id);
    expect(resolved).toMatchObject({ status: 'READY', source: 'PHARMACY' });
    expect(clientFor).toHaveBeenCalledWith(CONFIG, 'plain-key');
  });

  it('saving again retires the old key; another tenant does not see it', async () => {
    const repo = fakeRepo();
    const adapter = new PharmacyExternalSystemAdapter(
      repo as any,
      { isConfigured: () => false } as any,
    );
    const id = await adapter.save(em, {
      tenantId: 't',
      connectionId: null,
      config: CONFIG,
      apiKey: 'old',
      actorUserId: 'u',
    });
    await adapter.save(em, {
      tenantId: 't',
      connectionId: id,
      config: CONFIG,
      apiKey: 'new',
      actorUserId: 'u',
    });
    expect(repo.credentials.filter((c) => c.active)).toHaveLength(1);
    const clientFor = jest.spyOn(adapter, 'clientFor');
    await adapter.resolve(em, 't', id);
    expect(clientFor).toHaveBeenCalledWith(CONFIG, 'new');
    await expect(adapter.resolve(em, 'other-tenant', id)).resolves.toEqual({
      status: 'NOT_CONFIGURED',
    });
  });

  it('changing the format moves the connection to that format provider', async () => {
    const repo = fakeRepo();
    const adapter = new PharmacyExternalSystemAdapter(
      repo as any,
      { isConfigured: () => false } as any,
    );
    const id = await adapter.save(em, {
      tenantId: 't',
      connectionId: null,
      config: CONFIG,
      apiKey: 'k',
      actorUserId: 'u',
    });
    expect(repo.connections.get(id).providerId).toBe(
      'provider-ALOVIDA_STANDARD',
    );
    const chain = {
      format: 'SIMULATED_CHAIN' as const,
      baseUrl: 'http://sim:4100/simulated-chain/api/v2',
      externalPharmacyCode: 'C1',
    };
    await adapter.save(em, {
      tenantId: 't',
      connectionId: id,
      config: chain,
      apiKey: 'k2',
      actorUserId: 'u',
    });
    expect(repo.connections.get(id).providerId).toBe(
      'provider-SIMULATED_CHAIN',
    );
    expect(repo.connections.get(id).configJson).toEqual(
      externalSystemConfigJson(chain),
    );
  });

  it('the host policy applies again at call time', async () => {
    const repo = fakeRepo();
    const adapter = new PharmacyExternalSystemAdapter(
      repo as any,
      { isConfigured: () => false } as any,
    );
    const id = await adapter.save(em, {
      tenantId: 't',
      connectionId: null,
      config: CONFIG,
      apiKey: 'k',
      actorUserId: 'u',
    });
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = 'api.farmacia.bo';
    await expect(adapter.resolve(em, 't', id)).resolves.toEqual({
      status: 'HOST_NOT_ALLOWED',
    });
  });

  it('remove pauses the connection and retires its key', async () => {
    const repo = fakeRepo();
    const adapter = new PharmacyExternalSystemAdapter(
      repo as any,
      { isConfigured: () => false } as any,
    );
    const id = await adapter.save(em, {
      tenantId: 't',
      connectionId: null,
      config: CONFIG,
      apiKey: 'k',
      actorUserId: 'u',
    });
    await adapter.remove(em, {
      tenantId: 't',
      connectionId: id,
      actorUserId: 'u',
    });
    expect(repo.connections.get(id).paused).toBe(true);
    await expect(adapter.resolve(em, 't', id)).resolves.toEqual({
      status: 'NOT_CONFIGURED',
    });
  });
});

describe('does not overwrite or retire ERP-format credentials', () => {
  function fixture() {
    const repo = fakeRepo();
    const row = {
      id: 'erp-owned',
      tenantId: 't',
      providerId: 'old-provider',
      configJson: {
        version: 1,
        baseUrl: 'https://synthetic.invalid',
        pharmacyCode: 'SYNTHETIC',
      },
    };
    repo.connections.set(row.id, row);
    const credential = {
      connectionId: row.id,
      secretRef: 'synthetic-sealed',
      active: true,
    };
    repo.credentials.push(credential);
    const adapter = new PharmacyExternalSystemAdapter(
      repo as never,
      { isConfigured: () => false } as never,
    );
    return { repo, row, credential, adapter };
  }
  it('rejects saving another format before changing provider, config or credential', async () => {
    const d = fixture();
    const before = JSON.stringify(d.row);
    await expect(
      d.adapter.save(em, {
        tenantId: 't',
        connectionId: d.row.id,
        config: CONFIG,
        apiKey: 'synthetic-only',
        actorUserId: 'u',
      }),
    ).rejects.toMatchObject({ reason: 'PHARMACY_INTEGRATION_NOT_CONFIGURED' });
    expect(JSON.stringify(d.row)).toBe(before);
    expect(d.credential.active).toBe(true);
    expect(d.repo.ensureProvider).not.toHaveBeenCalled();
    expect(d.repo.createCredential).not.toHaveBeenCalled();
    expect(d.repo.retireCredential).not.toHaveBeenCalled();
  });
  it('rejects removal through the wrong configurator without pausing or retiring', async () => {
    const d = fixture();
    const before = JSON.stringify(d.row);
    await expect(
      d.adapter.remove(em, {
        tenantId: 't',
        connectionId: d.row.id,
        actorUserId: 'u',
      }),
    ).rejects.toMatchObject({ reason: 'PHARMACY_INTEGRATION_NOT_CONFIGURED' });
    expect(JSON.stringify(d.row)).toBe(before);
    expect(d.credential.active).toBe(true);
    expect(d.repo.pauseConnection).not.toHaveBeenCalled();
    expect(d.repo.retireCredential).not.toHaveBeenCalled();
  });
  it('rejects ambiguous ownership before resolving a client or decrypting', async () => {
    const d = fixture();
    Object.assign(d.row.configJson, {
      kind: 'PHARMACY_EXTERNAL_SYSTEM',
      format: 'ALOVIDA_STANDARD',
      externalPharmacyCode: 'SYN',
    });
    await expect(d.adapter.resolve(em, 't', d.row.id)).resolves.toEqual({
      status: 'NOT_CONFIGURED',
    });
    expect(d.credential.active).toBe(true);
  });
  it('does not describe an ambiguous configuration as an external system', async () => {
    const d = fixture();
    Object.assign(d.row.configJson, {
      kind: 'PHARMACY_EXTERNAL_SYSTEM',
      format: 'ALOVIDA_STANDARD',
      externalPharmacyCode: 'SYN',
    });
    d.repo.findMany.mockResolvedValue(
      new Map([[d.row.id, { connection: d.row, credential: d.credential }]]),
    );
    await expect(d.adapter.describe(em, 't', [d.row.id])).resolves.toEqual(
      new Map(),
    );
  });
});
