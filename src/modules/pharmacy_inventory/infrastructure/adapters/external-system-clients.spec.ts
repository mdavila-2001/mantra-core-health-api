import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import {
  createExternalSystemClient,
  isForbiddenAddress,
} from './external-system-clients';

/** Un sistema de farmacia de verdad, por HTTP, con dos formatos. */
function startSystem(): Promise<{
  server: Server;
  base: string;
  seen: IncomingMessage[];
}> {
  const seen: IncomingMessage[] = [];
  const server = createServer((req, res) => {
    seen.push(req);
    const url = new URL(req.url ?? '/', 'http://x');
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname.startsWith('/std/')) {
      if (req.headers['x-api-key'] !== 'k-std') return json(401, {});
      if (url.pathname === '/std/v1/pharmacies/F%201/health')
        return json(200, { status: 'OK' });
      if (url.pathname === '/std/v1/pharmacies/F%201/products') {
        return json(200, {
          items: [{ code: 'A', name: 'Paracetamol', unitCode: 'BOX' }],
        });
      }
      if (url.pathname === '/std/v1/pharmacies/F%201/sites/CENTRAL/stock') {
        return json(200, { items: [{ code: 'A', quantity: 7 }] });
      }
      if (url.pathname === '/std/v1/pharmacies/F%201/sites/BAD/stock') {
        return json(200, { items: [{ code: 'A', quantity: -1 }] });
      }
    }
    if (url.pathname.startsWith('/chain/')) {
      if (req.headers.authorization !== 'Bearer k-chain') return json(401, {});
      const page = Number(url.searchParams.get('page') ?? '1');
      if (url.pathname === '/chain/chains/C1/ping')
        return json(200, { ok: true });
      if (url.pathname === '/chain/chains/C1/catalog') {
        const rows = [
          {
            sku: 'S1',
            description: 'Uno',
            pack: { label: 'Caja', unit: 'BOX' },
          },
          {
            sku: 'S2',
            description: 'Dos',
            pack: { label: 'Frasco', unit: 'BTL' },
          },
        ];
        return json(200, {
          data: [rows[page - 1]],
          meta: { page, total_pages: 2 },
        });
      }
      if (url.pathname === '/chain/chains/C1/branches/CENTRAL/inventory') {
        const rows = [
          { sku: 'S1', on_hand: { units: 3 } },
          { sku: 'S2', on_hand: { units: 0 } },
        ];
        return json(200, {
          data: [rows[page - 1]],
          meta: { page, total_pages: 2 },
        });
      }
    }
    json(404, {});
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, base: `http://127.0.0.1:${port}`, seen });
    }),
  );
}

describe('external system clients (FAR-C9 · C9-3)', () => {
  let system: Awaited<ReturnType<typeof startSystem>>;
  beforeAll(async () => {
    system = await startSystem();
  });
  afterAll(
    () => new Promise<void>((done) => system.server.close(() => done())),
  );

  it('ALOVIDA standard: X-Api-Key, its pharmacy code in the path, its shape', async () => {
    const client = createExternalSystemClient(
      {
        format: 'ALOVIDA_STANDARD',
        baseUrl: `${system.base}/std`,
        externalPharmacyCode: 'F 1',
      },
      'k-std',
      2000,
    );
    await expect(client.checkHealth()).resolves.toBeUndefined();
    await expect(client.listProducts()).resolves.toEqual([
      {
        code: 'A',
        name: 'Paracetamol',
        presentation: undefined,
        unitCode: 'BOX',
      },
    ]);
    // El código de la plataforma no se usa: manda el de la configuración.
    await expect(
      client.stockForSite('CENTRAL', 'PLATFORM-CODE'),
    ).resolves.toEqual([{ code: 'A', quantity: 7 }]);
  });

  it('a wrong key, a 404 or a nonsense quantity is an unavailable system', async () => {
    const wrongKey = createExternalSystemClient(
      {
        format: 'ALOVIDA_STANDARD',
        baseUrl: `${system.base}/std`,
        externalPharmacyCode: 'F 1',
      },
      'other',
      2000,
    );
    await expect(wrongKey.checkHealth()).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
    const ok = createExternalSystemClient(
      {
        format: 'ALOVIDA_STANDARD',
        baseUrl: `${system.base}/std`,
        externalPharmacyCode: 'F 1',
      },
      'k-std',
      2000,
    );
    await expect(ok.stockForSite('NOPE')).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
    await expect(ok.stockForSite('BAD')).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
  });

  it('the error never carries the key', async () => {
    const client = createExternalSystemClient(
      {
        format: 'ALOVIDA_STANDARD',
        baseUrl: `${system.base}/std`,
        externalPharmacyCode: 'F 1',
      },
      'secret-key-123',
      2000,
    );
    const error = await client.checkHealth().catch((e: Error) => e);
    expect(String((error as Error).message)).not.toContain('secret-key-123');
  });

  it('simulated chain: Bearer, walks every page, reads its own names', async () => {
    const client = createExternalSystemClient(
      {
        format: 'SIMULATED_CHAIN',
        baseUrl: `${system.base}/chain`,
        externalPharmacyCode: 'C1',
      },
      'k-chain',
      2000,
    );
    await expect(client.checkHealth()).resolves.toBeUndefined();
    await expect(client.listProducts()).resolves.toEqual([
      { code: 'S1', name: 'Uno', presentation: 'Caja', unitCode: 'BOX' },
      { code: 'S2', name: 'Dos', presentation: 'Frasco', unitCode: 'BTL' },
    ]);
    await expect(client.stockForSite('CENTRAL')).resolves.toEqual([
      { code: 'S1', quantity: 3 },
      { code: 'S2', quantity: 0 },
    ]);
    const xApiKey = createExternalSystemClient(
      {
        format: 'SIMULATED_CHAIN',
        baseUrl: `${system.base}/chain`,
        externalPharmacyCode: 'C1',
      },
      'k-std',
      2000,
    );
    await expect(xApiKey.checkHealth()).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
  });

  it('internal addresses are never called in production, public ones are', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.5',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fe80::1',
      'fd00::1',
      '::ffff:127.0.0.1',
      'not-an-ip',
    ]) {
      expect([ip, isForbiddenAddress(ip)]).toEqual([ip, true]);
    }
    for (const ip of ['8.8.8.8', '190.104.1.1', '2800:cd0::1']) {
      expect([ip, isForbiddenAddress(ip)]).toEqual([ip, false]);
    }
  });

  it('in production the client refuses to connect to an internal address', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const before = system.seen.length;
    try {
      const client = createExternalSystemClient(
        {
          format: 'ALOVIDA_STANDARD',
          // Un nombre que resuelve a 127.0.0.1: la IP se valida al conectar.
          baseUrl: `${system.base.replace('127.0.0.1', 'localhost')}/std`,
          externalPharmacyCode: 'F 1',
        },
        'k-std',
        2000,
      );
      await expect(client.checkHealth()).rejects.toBeInstanceOf(
        ExternalCatalogUnavailableError,
      );
      // La petición no llegó: se cortó en la resolución, no en la respuesta.
      expect(system.seen.length).toBe(before);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
