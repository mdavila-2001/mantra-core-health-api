import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PharmacySystemAccess } from '../../application/ports/external-pharmacy-catalog.port';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { PharmacyCatalogFactory } from './pharmacy-catalog.factory';

type Reply = { status?: number; body?: unknown; delayMs?: number };

describe('adaptadores del sistema de cada farmacia (FAR-C9)', () => {
  const allowedHosts = process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS;
  beforeEach(() => {
    process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = '127.0.0.1';
  });

  it.each([
    'http://user:synthetic@farmacia.test/std',
    'http://farmacia.test/std?apiKey=synthetic',
    'http://farmacia.test/std#synthetic',
  ])(
    'refuses an unsafe configured base before creating the HTTP transport: %s',
    (baseUrl) => {
      const factory = new PharmacyCatalogFactory();
      expect(() =>
        factory.forAccess({
          systemCode: 'ALOVIDA_STANDARD',
          baseUrl,
          pharmacyCode: 'FARM-1',
          apiKey: 'synthetic-key',
          timeoutMs: 50,
        }),
      ).toThrow(
        expect.objectContaining({
          kind: 'UNREACHABLE',
          detail: 'INVALID_BASE_URL',
        }),
      );
    },
  );
  let server: Server | undefined;
  let seen: IncomingMessage[] = [];

  afterEach(async () => {
    if (server) await new Promise((resolve) => server!.close(resolve));
    server = undefined;
    seen = [];
    if (allowedHosts === undefined)
      delete process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS;
    else process.env.PHARMACY_EXTERNAL_ALLOWED_HOSTS = allowedHosts;
  });

  async function serve(
    handler: (req: IncomingMessage) => Reply,
  ): Promise<string> {
    server = createServer((req, res) => {
      seen.push(req);
      const reply = handler(req);
      setTimeout(() => {
        res.writeHead(reply.status ?? 200, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(reply.body ?? {}));
      }, reply.delayMs ?? 0);
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, '127.0.0.1', resolve),
    );
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  function catalog(
    access: Partial<PharmacySystemAccess> & { baseUrl: string },
  ) {
    return new PharmacyCatalogFactory().forAccess({
      systemCode: 'ALOVIDA_STANDARD',
      apiKey: 'clave-1234',
      pharmacyCode: 'FARM-1',
      timeoutMs: 500,
      ...access,
    });
  }

  async function failureKind(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(ExternalCatalogUnavailableError);
      // El detalle es para el log: nunca lleva la clave.
      expect((error as ExternalCatalogUnavailableError).detail).not.toContain(
        'clave-1234',
      );
      return (error as ExternalCatalogUnavailableError).kind;
    }
    throw new Error('se esperaba un rechazo');
  }

  describe('Estándar ALOVIDA', () => {
    it('manda la clave en X-Api-Key y lee el stock de la sucursal', async () => {
      const url = await serve((req) =>
        req.url === '/std/v1/pharmacies/FARM-1/sites/SUC-1/stock'
          ? { body: { items: [{ code: 'E-1', quantity: 3 }] } }
          : { status: 404 },
      );
      const lines = await catalog({ baseUrl: `${url}/std` }).stockForSite(
        'SUC-1',
      );

      expect(lines).toEqual([{ code: 'E-1', quantity: 3 }]);
      expect(seen[0].headers['x-api-key']).toBe('clave-1234');
      expect(seen[0].headers.authorization).toBeUndefined();
    });

    it('salud OK', async () => {
      const url = await serve(() => ({ body: { status: 'OK' } }));
      await expect(
        catalog({ baseUrl: url }).checkHealth(),
      ).resolves.toBeUndefined();
    });

    it.each([401, 403])('%i es «clave rechazada»', async (status) => {
      const url = await serve(() => ({ status }));
      expect(await failureKind(catalog({ baseUrl: url }).checkHealth())).toBe(
        'AUTH_REJECTED',
      );
    });

    it.each([404, 500, 503])('%i es «no responde»', async (status) => {
      const url = await serve(() => ({ status }));
      expect(
        await failureKind(catalog({ baseUrl: url }).stockForSite('S')),
      ).toBe('UNREACHABLE');
    });

    it('tiempo agotado es «no responde», sin reintentos', async () => {
      const url = await serve(() => ({ delayMs: 400, body: { status: 'OK' } }));
      expect(
        await failureKind(
          catalog({ baseUrl: url, timeoutMs: 100 }).checkHealth(),
        ),
      ).toBe('UNREACHABLE');
      expect(seen).toHaveLength(1);
    });

    it('una dirección donde no hay nadie es «no responde»', async () => {
      const url = await serve(() => ({}));
      await new Promise((resolve) => server!.close(resolve));
      server = undefined;
      expect(await failureKind(catalog({ baseUrl: url }).checkHealth())).toBe(
        'UNREACHABLE',
      );
    });

    it('una respuesta que no se entiende no se convierte en stock', async () => {
      const url = await serve(() => ({
        body: { items: [{ code: 'E-1', quantity: -1 }] },
      }));
      expect(
        await failureKind(catalog({ baseUrl: url }).stockForSite('S')),
      ).toBe('UNREACHABLE');
    });
  });

  describe('cadena simulada', () => {
    it('acota el tiempo total de las páginas, sin reiniciar el presupuesto por página', async () => {
      const url = await serve(() => ({
        delayMs: 80,
        body: {
          data: [{ sku: 'E-1', on_hand: { units: 3 } }],
          meta: { total_pages: 50 },
        },
      }));
      expect(
        await failureKind(
          catalog({
            baseUrl: url,
            systemCode: 'SIMULATED_CHAIN',
            timeoutMs: 200,
          }).stockForSite('SUC-1'),
        ),
      ).toBe('UNREACHABLE');
      expect(seen.length).toBeLessThan(10);
    });

    const chain = (baseUrl: string) =>
      catalog({ baseUrl, systemCode: 'SIMULATED_CHAIN', pharmacyCode: 'CAD' });

    it('manda Bearer, recorre las páginas y traduce on_hand.units', async () => {
      const url = await serve((req) => {
        const page = new URL(req.url!, 'http://x').searchParams.get('page');
        const data =
          page === '1'
            ? [{ sku: 'A', on_hand: { units: 2 } }]
            : [{ sku: 'B', on_hand: { units: 0 } }];
        return { body: { data, meta: { page: Number(page), total_pages: 2 } } };
      });
      const lines = await chain(url).stockForSite('SUC-1');

      expect(lines).toEqual([
        { code: 'A', quantity: 2 },
        { code: 'B', quantity: 0 },
      ]);
      expect(seen[0].url).toContain('/chains/CAD/branches/SUC-1/inventory');
      expect(seen[0].headers.authorization).toBe('Bearer clave-1234');
      expect(seen[0].headers['x-api-key']).toBeUndefined();
    });

    it('traduce el catálogo y los precios en centavos', async () => {
      const url = await serve((req) =>
        req.url!.includes('/catalog/prices')
          ? {
              body: {
                data: [
                  { sku: 'A', price: { amount_cents: 1250, currency: 'BOB' } },
                ],
                meta: { total_pages: 1 },
              },
            }
          : {
              body: {
                data: [
                  {
                    sku: 'A',
                    description: 'Amoxicilina',
                    pack: { label: 'Caja', unit: 'BOX' },
                  },
                ],
                meta: { total_pages: 1 },
              },
            },
      );
      expect(await chain(url).listProducts()).toEqual([
        {
          code: 'A',
          name: 'Amoxicilina',
          presentation: 'Caja',
          unitCode: 'BOX',
        },
      ]);
      expect(await chain(url).listPrices()).toEqual([
        { code: 'A', unitPrice: 12.5, currency: 'BOB' },
      ]);
    });

    it('401 en el ping es «clave rechazada»', async () => {
      const url = await serve(() => ({ status: 401 }));
      expect(await failureKind(chain(url).checkHealth())).toBe('AUTH_REJECTED');
    });
  });
});
