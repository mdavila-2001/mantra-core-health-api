import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { HttpExternalPharmacyCatalogAdapter } from './http-external-pharmacy-catalog.adapter';

type Handler = (req: IncomingMessage) => {
  status?: number;
  body?: string;
  delayMs?: number;
};

const ENV_KEYS = [
  'PHARMACY_ERP_BASE_URL',
  'PHARMACY_ERP_API_KEY',
  'PHARMACY_ERP_TIMEOUT_MS',
] as const;

describe('HttpExternalPharmacyCatalogAdapter', () => {
  const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  let server: Server | undefined;
  let requests: IncomingMessage[] = [];

  afterEach(async () => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    if (server) await new Promise((resolve) => server!.close(resolve));
    server = undefined;
    requests = [];
  });

  async function serve(handler: Handler): Promise<string> {
    server = createServer((req, res) => {
      requests.push(req);
      const reply = handler(req);
      setTimeout(() => {
        res.writeHead(reply.status ?? 200, {
          'Content-Type': 'application/json',
        });
        res.end(reply.body ?? '{}');
      }, reply.delayMs ?? 0);
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, '127.0.0.1', resolve),
    );
    const { port } = server.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  it('an empty URL is "not configured" and calls nobody', async () => {
    process.env.PHARMACY_ERP_BASE_URL = '';
    const adapter = new HttpExternalPharmacyCatalogAdapter();
    expect(adapter.isConfigured()).toBe(false);
    await expect(adapter.listProducts()).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
  });

  it('reads the catalog and sends the API key', async () => {
    process.env.PHARMACY_ERP_BASE_URL = await serve(() => ({
      body: JSON.stringify({
        items: [
          {
            code: 'ERP-0001',
            name: 'Paracetamol',
            presentation: 'Caja',
            unitCode: 'BOX',
          },
        ],
      }),
    }));
    process.env.PHARMACY_ERP_API_KEY = 'clave-local';
    const adapter = new HttpExternalPharmacyCatalogAdapter();
    expect(adapter.isConfigured()).toBe(true);
    await expect(adapter.listProducts()).resolves.toEqual([
      {
        code: 'ERP-0001',
        name: 'Paracetamol',
        presentation: 'Caja',
        unitCode: 'BOX',
      },
    ]);
    expect(requests[0].url).toBe('/pharmacy-erp/products');
    expect(requests[0].headers['x-api-key']).toBe('clave-local');
  });

  it('asks the stock of a site by its code', async () => {
    process.env.PHARMACY_ERP_BASE_URL = await serve(() => ({
      body: JSON.stringify({ items: [{ code: 'ERP-0001', quantity: 4 }] }),
    }));
    const adapter = new HttpExternalPharmacyCatalogAdapter();
    await expect(adapter.stockForSite('SEDE CENTRAL')).resolves.toEqual([
      { code: 'ERP-0001', quantity: 4 },
    ]);
    expect(requests[0].url).toBe('/pharmacy-erp/stock?siteCode=SEDE+CENTRAL');
  });

  it.each([
    ['a 500', { status: 500, body: '{"message":"boom"}' }],
    ['invalid JSON', { body: 'not json' }],
    ['a body without items', { body: '{"data":[]}' }],
    ['a negative quantity', { body: '{"items":[{"code":"X","quantity":-1}]}' }],
  ])('%s becomes a domain error', async (_label, reply) => {
    process.env.PHARMACY_ERP_BASE_URL = await serve(() => reply);
    const adapter = new HttpExternalPharmacyCatalogAdapter();
    await expect(adapter.stockForSite('S1')).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
  });

  it('a timeout becomes a domain error', async () => {
    process.env.PHARMACY_ERP_BASE_URL = await serve(() => ({
      delayMs: 600,
      body: '{"items":[]}',
    }));
    process.env.PHARMACY_ERP_TIMEOUT_MS = '200';
    const adapter = new HttpExternalPharmacyCatalogAdapter();
    await expect(adapter.listProducts()).rejects.toBeInstanceOf(
      ExternalCatalogUnavailableError,
    );
  });
});
