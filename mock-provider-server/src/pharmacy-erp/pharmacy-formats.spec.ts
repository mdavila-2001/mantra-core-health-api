import { Global, Module, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { PHARMACY_ERP_CLOCK } from './pharmacy-catalog.service';
import { PharmacyErpModule } from './pharmacy-erp.module';
import { STOCK_WINDOW_MS } from './stock-window';

const T0 = Date.UTC(2026, 9, 31, 12, 0, 0);

interface StockBody {
  validUntil: string;
  items: { code: string; quantity: number }[];
}
interface Page<T> {
  data: T[];
  meta: { page: number; per_page: number; total_pages: number; total: number };
}

/** GET con cabeceras, cuerpo tipado por quien llama. */
async function get<T = Record<string, unknown>>(
  server: App,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: T }> {
  let req = request(server).get(path);
  for (const [name, value] of Object.entries(headers))
    req = req.set(name, value);
  const res = await req;
  return { status: res.status, body: res.body as T };
}

function envWith(overrides: Partial<MockProviderEnv> = {}): MockProviderEnv {
  return {
    port: 4100,
    apiKey: undefined,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
    identityVerificationDelayMs: 0,
    identityVerificationRejectionRate: 0,
    pharmacyErpFailureRate: 0,
    pharmacyKeys: {
      'FARM-A': 'clave-a',
      'FARM-B': 'clave-b',
      'CADENA-1': 'token-1',
    },
    ...overrides,
  };
}

async function boot(env: MockProviderEnv, clock: { now: number }) {
  @Global()
  @Module({
    providers: [{ provide: MOCK_ENV, useValue: env }],
    exports: [MOCK_ENV],
  })
  class TestEnvModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [TestEnvModule, PharmacyErpModule],
  })
    .overrideProvider(PHARMACY_ERP_CLOCK)
    .useValue(() => new Date(clock.now))
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('formatos por farmacia del simulador', () => {
  let app: INestApplication;
  let server: App;
  const clock = { now: T0 };

  beforeEach(async () => {
    clock.now = T0;
    app = await boot(envWith(), clock);
    server = app.getHttpServer() as App;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Estándar ALOVIDA (X-Api-Key)', () => {
    const base = '/alovida-standard/v1/pharmacies/FARM-A';
    const key = { 'X-Api-Key': 'clave-a' };

    it('health responde OK con la clave de la farmacia', async () => {
      const res = await get(server, `${base}/health`, key);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'OK', pharmacyCode: 'FARM-A' });
    });

    it('una clave equivocada, la de otra farmacia o ninguna dan 401', async () => {
      const statuses = [
        (await get(server, `${base}/health`, { 'X-Api-Key': 'otra' })).status,
        (await get(server, `${base}/health`, { 'X-Api-Key': 'clave-b' }))
          .status,
        (await get(server, `${base}/health`)).status,
        (
          await get(
            server,
            '/alovida-standard/v1/pharmacies/NO-EXISTE/health',
            key,
          )
        ).status,
      ];

      expect(statuses).toEqual([401, 401, 401, 401]);
    });

    it('la clave por Bearer no sirve en este formato', async () => {
      const res = await get(server, `${base}/health`, {
        Authorization: 'Bearer clave-a',
      });

      expect(res.status).toBe(401);
    });

    it('stock: igual dentro de la ventana, con validUntil al cierre de la ventana', async () => {
      const first = await get<StockBody>(
        server,
        `${base}/sites/SUC-1/stock`,
        key,
      );
      clock.now = T0 + STOCK_WINDOW_MS - 1;
      const second = await get<StockBody>(
        server,
        `${base}/sites/SUC-1/stock`,
        key,
      );

      expect(first.status).toBe(200);
      expect(second.body.items).toEqual(first.body.items);
      expect(first.body.items).toHaveLength(12);
      expect(first.body.validUntil).toBe(
        new Date(T0 + STOCK_WINDOW_MS).toISOString(),
      );
    });

    it('stock: cambia entre ventanas', async () => {
      const seen = new Set<string>();
      for (let i = 0; i < 6; i += 1) {
        clock.now = T0 + i * STOCK_WINDOW_MS;
        const res = await get<StockBody>(
          server,
          `${base}/sites/SUC-1/stock`,
          key,
        );
        seen.add(JSON.stringify(res.body.items));
      }

      expect(seen.size).toBeGreaterThan(1);
    });

    it('stock: filtra por codes', async () => {
      const res = await get<StockBody>(
        server,
        `${base}/sites/SUC-1/stock?codes=ERP-0001,ERP-0003`,
        key,
      );

      expect(res.body.items.map((i) => i.code)).toEqual([
        'ERP-0001',
        'ERP-0003',
      ]);
    });

    it('dos farmacias con el mismo código de sede no comparten stock', async () => {
      const a = await get<StockBody>(
        server,
        '/alovida-standard/v1/pharmacies/FARM-A/sites/SUC-CENTRO/stock',
        key,
      );
      const b = await get<StockBody>(
        server,
        '/alovida-standard/v1/pharmacies/FARM-B/sites/SUC-CENTRO/stock',
        { 'X-Api-Key': 'clave-b' },
      );

      expect(a.body.items).not.toEqual(b.body.items);
    });

    it('productos y precios en bolivianos', async () => {
      const products = await get<{ items: unknown[] }>(
        server,
        `${base}/products`,
        key,
      );
      const prices = await get<{
        currency: string;
        items: { code: string; unitPrice: number }[];
      }>(server, `${base}/prices`, key);

      expect(products.body.items).toHaveLength(12);
      expect(prices.body.currency).toBe('BOB');
      expect(prices.body.items).toHaveLength(12);
      expect(prices.body.items[0].code).toBe('ERP-0001');
      expect(typeof prices.body.items[0].unitPrice).toBe('number');
    });
  });

  describe('cadena simulada (Bearer, otros nombres, paginada)', () => {
    const base = '/simulated-chain/api/v2/chains/CADENA-1';
    const token = { Authorization: 'Bearer token-1' };

    it('ping con el token de la cadena', async () => {
      const res = await get(server, `${base}/ping`, token);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ok: true, chain_id: 'CADENA-1' });
    });

    it('un token equivocado, sin Bearer o en X-Api-Key da 401', async () => {
      const statuses = [
        (await get(server, `${base}/ping`, { Authorization: 'Bearer nope' }))
          .status,
        (await get(server, `${base}/ping`, { 'X-Api-Key': 'token-1' })).status,
        (await get(server, `${base}/ping`, { Authorization: 'token-1' }))
          .status,
      ];

      expect(statuses).toEqual([401, 401, 401]);
    });

    it('el catálogo pagina con meta.total_pages y usa sku/description', async () => {
      type Row = {
        sku: string;
        description: string;
        pack: { label: string; unit: string };
      };
      const page1 = await get<Page<Row>>(server, `${base}/catalog`, token);
      const page3 = await get<Page<Row>>(
        server,
        `${base}/catalog?page=3`,
        token,
      );

      expect(page1.body.meta).toEqual({
        page: 1,
        per_page: 5,
        total_pages: 3,
        total: 12,
      });
      expect(page1.body.data[0].sku).toBe('ERP-0001');
      expect(Object.keys(page1.body.data[0]).sort()).toEqual([
        'description',
        'pack',
        'sku',
      ]);
      expect(Object.keys(page1.body.data[0].pack).sort()).toEqual([
        'label',
        'unit',
      ]);
      expect(page3.body.data).toHaveLength(2);
    });

    it('existencias por sucursal con on_hand.units, recorriendo las páginas', async () => {
      const rows: { sku: string; on_hand: { units: number } }[] = [];
      for (let page = 1; page <= 3; page += 1) {
        const res = await get<
          Page<{ sku: string; on_hand: { units: number } }>
        >(server, `${base}/branches/SUC-1/inventory?page=${page}`, token);
        rows.push(...res.body.data);
      }

      expect(rows).toHaveLength(12);
      expect(rows.every((r) => Number.isInteger(r.on_hand.units))).toBe(true);
    });

    it('precios en centavos, anidados', async () => {
      const res = await get<
        Page<{ sku: string; price: { amount_cents: number; currency: string } }>
      >(server, `${base}/catalog/prices?per_page=50`, token);

      expect(res.body.data).toHaveLength(12);
      expect(res.body.data[0].sku).toBe('ERP-0001');
      expect(res.body.data[0].price.currency).toBe('BOB');
      expect(Number.isInteger(res.body.data[0].price.amount_cents)).toBe(true);
    });
  });

  it('con la tasa de falla en 1 responde 503 en los dos formatos', async () => {
    await app.close();
    app = await boot(envWith({ pharmacyErpFailureRate: 1 }), clock);
    server = app.getHttpServer() as App;

    const standard = await get(
      server,
      '/alovida-standard/v1/pharmacies/FARM-A/sites/SUC-1/stock',
      { 'X-Api-Key': 'clave-a' },
    );
    const chain = await get(
      server,
      '/simulated-chain/api/v2/chains/CADENA-1/catalog',
      {
        Authorization: 'Bearer token-1',
      },
    );

    expect([standard.status, chain.status]).toEqual([503, 503]);
  });

  it('lo de C8 sigue igual: /pharmacy-erp/stock no pide clave por farmacia', async () => {
    const res = await get(
      server,
      '/pharmacy-erp/stock?siteCode=SUC-1&pharmacyCode=FARM-A',
    );

    expect(res.status).toBe(200);
  });
});
