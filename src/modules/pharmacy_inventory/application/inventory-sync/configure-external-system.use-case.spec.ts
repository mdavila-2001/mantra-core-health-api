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
  const tx = { flush: jest.fn(async () => undefined) };
  const em = { transactional: jest.fn(async (fn: any) => fn(tx)) };
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
