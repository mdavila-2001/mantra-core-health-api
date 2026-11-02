import { jest } from '@jest/globals';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';
import { ConfigureExternalSystemUseCase } from './configure-external-system.use-case';

const REF = { pharmacyId: 'pharmacy-1', connectionId: 'row-1' };
const ACTOR = { id: 'user-1' } as any;
const DTO = {
  format: 'ALOVIDA_STANDARD' as const,
  baseUrl: 'http://sim:4100/alovida-standard/',
  externalPharmacyCode: ' FARM-1 ',
  apiKey: 'k-1',
};

function build(
  options: {
    health?: 'ok' | 'down';
    urlProblem?: any;
    linked?: string | null;
  } = {},
) {
  const connection: any = {
    id: 'row-1',
    pharmacyId: 'pharmacy-1',
    connectionId: options.linked ?? undefined,
  };
  const tx = {
    getTransactionContext: () => undefined,
    flush: jest.fn(async () => undefined),
    execute: jest.fn(async () => []),
  };
  const em = {
    getTransactionContext: () => undefined,
    isInTransaction: () => false,
    transactional: jest.fn(async (fn: any) => fn(tx)),
  };
  const scope = {
    requireManagedPharmacy: jest.fn(async () => ({
      tenantId: 'tenant-1',
      pharmacyId: 'pharmacy-1',
    })),
    notAvailable: jest.fn(() => new Error('404')),
  };
  const reads = { findConnection: jest.fn(async () => connection) };
  const client = {
    checkHealth: jest.fn(async () => {
      if (options.health === 'down')
        throw new ExternalCatalogUnavailableError('GET /health → 401');
    }),
  };
  const systems = {
    urlProblem: jest.fn(() => options.urlProblem ?? null),
    clientFor: jest.fn(() => client),
    save: jest.fn(async () => 'provider-conn-1'),
    describe: jest.fn(
      async () =>
        new Map([
          [
            'provider-conn-1',
            {
              format: 'ALOVIDA_STANDARD',
              baseUrl: 'http://sim:4100/alovida-standard',
              externalPharmacyCode: 'FARM-1',
              apiKeyConfigured: true,
              configuredAt: 'now',
            },
          ],
        ]),
    ),
    resolve: jest.fn(async () => ({
      status: 'READY',
      source: 'PHARMACY',
      client,
    })),
    recordCheck: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined),
  };
  const useCase = new ConfigureExternalSystemUseCase(
    em as any,
    scope as any,
    reads as any,
    systems as any,
  );
  return { useCase, systems, connection, client, em };
}

describe('ConfigureExternalSystemUseCase (FAR-C9 · C9-3)', () => {
  it('probes with the given key first, then saves and links the connection', async () => {
    const d = build();
    const result = await d.useCase.save(REF, DTO, ACTOR);
    expect(d.systems.clientFor).toHaveBeenCalledWith(
      {
        format: 'ALOVIDA_STANDARD',
        baseUrl: 'http://sim:4100/alovida-standard',
        externalPharmacyCode: 'FARM-1',
      },
      'k-1',
    );
    expect(d.client.checkHealth).toHaveBeenCalled();
    expect(d.systems.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        connectionId: null,
        apiKey: 'k-1',
      }),
    );
    expect(d.connection.connectionId).toBe('provider-conn-1');
    expect(result.probe).toBe('OK');
    expect(JSON.stringify(result)).not.toContain('k-1');
  });

  it('updates the integration connection it already has', async () => {
    const d = build({ linked: 'provider-conn-1' });
    await d.useCase.save(REF, DTO, ACTOR);
    expect(d.systems.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ connectionId: 'provider-conn-1' }),
    );
  });

  it('a system that does not answer with that key writes nothing: 502', async () => {
    const d = build({ health: 'down' });
    await expect(d.useCase.save(REF, DTO, ACTOR)).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_UNAVAILABLE,
      }),
    });
    expect(d.systems.save).not.toHaveBeenCalled();
    // Una sola transacción: la lectura del ámbito, antes de llamar afuera.
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.connection.connectionId).toBeUndefined();
  });

  it('a connection outside the actor scope is refused before calling anyone', async () => {
    const d = build();
    const denied = new ConfigureExternalSystemUseCase(
      d.em as any,
      {
        requireManagedPharmacy: jest.fn(async () => {
          throw new Error('404');
        }),
        notAvailable: jest.fn(),
      } as any,
      { findConnection: jest.fn() } as any,
      d.systems as any,
    );
    await expect(denied.save(REF, DTO, ACTOR)).rejects.toThrow('404');
    expect(d.systems.clientFor).not.toHaveBeenCalled();
    expect(d.client.checkHealth).not.toHaveBeenCalled();
  });

  it('a bad or forbidden address is refused before calling anyone', async () => {
    for (const [problem, reason] of [
      [
        'URL_INVALID',
        PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_URL_INVALID,
      ],
      [
        'HOST_NOT_ALLOWED',
        PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_HOST_NOT_ALLOWED,
      ],
    ] as const) {
      const d = build({ urlProblem: problem });
      await expect(d.useCase.save(REF, DTO, ACTOR)).rejects.toMatchObject({
        response: expect.objectContaining({ reason }),
      });
      expect(d.systems.clientFor).not.toHaveBeenCalled();
    }
  });

  it('remove pauses the integration connection and unlinks it', async () => {
    const d = build({ linked: 'provider-conn-1' });
    await d.useCase.remove(REF, ACTOR);
    expect(d.systems.remove).toHaveBeenCalledWith(expect.anything(), {
      tenantId: 'tenant-1',
      connectionId: 'provider-conn-1',
      actorUserId: 'user-1',
    });
    expect(d.connection.connectionId).toBeNull();
  });

  it('probe says whose system answered', async () => {
    const d = build({ linked: 'provider-conn-1' });
    await expect(d.useCase.probe(REF, ACTOR)).resolves.toEqual({
      status: 'OK',
      source: 'PHARMACY',
    });
  });
});

describe('external-system saved checks (regression A2)', () => {
  it('persists AUTH_REJECTED without returning transport details', async () => {
    const d = build({ linked: 'provider-conn-1' });
    const check = {
      connectionId: 'provider-conn-1',
      credentialId: 'cred-1',
      configJson: {},
    };
    d.systems.resolve.mockResolvedValueOnce({
      status: 'READY',
      source: 'PHARMACY',
      client: d.client,
      check,
    } as any);
    d.client.checkHealth.mockRejectedValueOnce(
      new ExternalCatalogUnavailableError(
        'private endpoint/key',
        'AUTH_REJECTED',
      ),
    );
    await expect(d.useCase.probe(REF, ACTOR)).rejects.toMatchObject({
      details: { errorReason: 'AUTH_REJECTED' },
    });
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        check,
        result: 'AUTH_REJECTED',
      }),
    );
  });
  it('records adapter preparation failure too (M2)', async () => {
    const d = build({ linked: 'provider-conn-1' });
    const check = {
      connectionId: 'provider-conn-1',
      credentialId: 'cred-1',
      configJson: {},
    };
    d.systems.resolve.mockResolvedValueOnce({
      status: 'UNAVAILABLE',
      errorReason: 'UNREACHABLE',
      check,
    } as any);
    await expect(d.useCase.probe(REF, ACTOR)).rejects.toMatchObject({
      details: { errorReason: 'UNREACHABLE' },
    });
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ result: 'UNREACHABLE', check }),
    );
  });
  it('records a successful saved probe, not a SERVER probe', async () => {
    const d = build({ linked: 'provider-conn-1' });
    const check = {
      connectionId: 'provider-conn-1',
      credentialId: 'cred-1',
      configJson: {},
    };
    d.systems.resolve.mockResolvedValueOnce({
      status: 'READY',
      source: 'PHARMACY',
      client: d.client,
      check,
    } as any);
    await d.useCase.probe(REF, ACTOR);
    expect(d.systems.recordCheck).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ result: 'OK', check }),
    );
    d.systems.recordCheck.mockClear();
    d.systems.resolve.mockResolvedValueOnce({
      status: 'READY',
      source: 'SERVER',
      client: d.client,
    } as any);
    await d.useCase.probe(REF, ACTOR);
    expect(d.systems.recordCheck).not.toHaveBeenCalled();
  });
  it('a rejected proposed destination preserves the previous saved status', async () => {
    const d = build({ health: 'down', linked: 'provider-conn-1' });
    await expect(d.useCase.save(REF, DTO, ACTOR)).rejects.toBeDefined();
    expect(d.systems.save).not.toHaveBeenCalled();
    expect(d.systems.recordCheck).not.toHaveBeenCalled();
    expect(d.connection.connectionId).toBe('provider-conn-1');
  });
});
