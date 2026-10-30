import { jest } from '@jest/globals';
import { type INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { json } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import type { TracingService } from '../../../observability';
import { PaymentsGatewayWebhooksController } from './payments-gateway-webhooks.controller';
import { PaymentsGatewayWebhookService } from '../services/payments-gateway-webhook.service';
import {
  GATEWAY_WEBHOOK_PATH,
  captureGatewayWebhookRawBody,
} from '../gateway/payments-gateway-raw-body';
import {
  TEST_API_KEY,
  TEST_WEBHOOK_SECRET,
  signTestWebhook,
} from '../gateway/payments-gateway.double.testing';
import type { PaymentsGatewayConfig } from '../gateway/payments-gateway.env';

/**
 * El receptor por HTTP: Express real con el MISMO gancho `verify` que instala
 * `main.ts`, el controlador real, el servicio real y el filtro global. Prueba que
 * la firma se verifica sobre los bytes tal como llegaron (un JSON con espacios y
 * acentos que ninguna re-serialización reproduce). La base está reemplazada por
 * dobles mínimos: el cobro es desconocido y el evento no terminal, así que lo
 * único que se ejercita es la cadena parser → controlador → firma.
 */

const T0 = 1_790_000_000;
const EVENT = '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11';

const PAYLOAD =
  '{ "id": "' +
  EVENT +
  '",\n  "object": "event",  "type": "payment_intent.processing",\n' +
  '  "created_at": "2026-10-29T15:00:00.000Z", "mode": "test",\n' +
  '  "data": { "object": { "payment_intent_id": "pi_c92215200m49", "status": "processing", "nota": "señal ñandú" } } }';

const cfg = (viaGateway: boolean): PaymentsGatewayConfig => ({
  viaGateway,
  baseUrl: 'https://sandbox.pay.example/v1',
  apiKey: TEST_API_KEY,
  mode: 'test',
  webhookSecrets: [TEST_WEBHOOK_SECRET],
  webhookPublicKeys: [],
  webhookToleranceSeconds: 300,
  timeoutMs: 1000,
  maxAttempts: 3,
  retryBaseMs: 10,
});

async function buildApp(viaGateway: boolean): Promise<INestApplication> {
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const service = new PaymentsGatewayWebhookService(
    cfg(viaGateway),
    {
      transactional: async (cb: (tx: unknown) => Promise<unknown>) => cb({}),
    } as never,
    { findByGatewayIntentRefForUpdate: async () => null } as never,
    {} as never,
    {} as never,
    logger as never,
  );
  const moduleRef = await Test.createTestingModule({
    controllers: [PaymentsGatewayWebhooksController],
    providers: [{ provide: PaymentsGatewayWebhookService, useValue: service }],
  }).compile();
  const app = moduleRef.createNestApplication({
    logger: false,
    bodyParser: false,
  });
  // Idéntico a main.ts: parser JSON con captura del cuerpo crudo.
  app.use(json({ limit: '1mb', verify: captureGatewayWebhookRawBody }));
  app.useGlobalFilters(
    new AllExceptionsFilter(
      {
        setContext: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as PinoLogger,
      {
        setAttribute: jest.fn(),
        recordException: jest.fn(),
        addEvent: jest.fn(),
      } as unknown as TracingService,
    ),
  );
  await app.init();
  return app;
}

describe('POST /payments/gateway-webhooks (HTTP)', () => {
  let nowSpy: ReturnType<typeof jest.spyOn>;
  const apps: INestApplication[] = [];

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0 * 1000);
  });
  afterEach(() => nowSpy.mockRestore());
  afterAll(async () => {
    jest.restoreAllMocks();
    await Promise.all(apps.map((a) => a.close()));
  });

  const post = async (
    viaGateway: boolean,
    headers: Record<string, string>,
    body: string,
  ) => {
    const app = await buildApp(viaGateway);
    apps.push(app);
    return request(app.getHttpServer())
      .post(GATEWAY_WEBHOOK_PATH)
      .set('Content-Type', 'application/json')
      .set(headers)
      .send(body);
  };

  it('correcto: un webhook firmado sobre bytes con espacios y acentos llega intacto y se confirma con 200', async () => {
    const res = await post(
      true,
      signTestWebhook({ id: EVENT, timestamp: T0, payload: PAYLOAD }),
      PAYLOAD,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      received: true,
      eventId: EVENT,
      ignored: true,
    });
  });

  it('inválido: el mismo JSON con un byte distinto es 401 con el motivo del contrato', async () => {
    const res = await post(
      true,
      signTestWebhook({ id: EVENT, timestamp: T0, payload: PAYLOAD }),
      PAYLOAD.replace('señal', 'senal'),
    );

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      code: 'UNAUTHENTICATED',
      reason: 'GATEWAY_WEBHOOK_SIGNATURE_INVALID',
      details: { code: 'no_matching_signature' },
    });
  });

  it('inválido: sin firma es 401', async () => {
    const res = await post(true, {}, PAYLOAD);
    expect(res.status).toBe(401);
  });

  it('inválido: marca de tiempo vieja es 401 con el motivo de la ventana', async () => {
    const res = await post(
      true,
      signTestWebhook({ id: EVENT, timestamp: T0 - 1000, payload: PAYLOAD }),
      PAYLOAD,
    );
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      reason: 'GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW',
      details: { code: 'timestamp_outside_tolerance' },
    });
  });

  it('inválido: con el flag apagado es 503 (no 410) aunque la firma sea válida', async () => {
    const res = await post(
      false,
      signTestWebhook({ id: EVENT, timestamp: T0, payload: PAYLOAD }),
      PAYLOAD,
    );
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ reason: 'GATEWAY_WEBHOOKS_DISABLED' });
  });
});

describe('captureGatewayWebhookRawBody', () => {
  const run = (url: string | undefined) => {
    const req = { url } as { url?: string; rawBody?: Buffer };
    captureGatewayWebhookRawBody(
      req as never,
      undefined,
      Buffer.from('{"a":1}'),
    );
    return req;
  };

  it('conserva los bytes sólo de la ruta del webhook (con o sin query)', () => {
    expect(run(GATEWAY_WEBHOOK_PATH).rawBody?.toString()).toBe('{"a":1}');
    expect(run(`${GATEWAY_WEBHOOK_PATH}?x=1`).rawBody?.toString()).toBe(
      '{"a":1}',
    );
  });

  it('no retiene el cuerpo de ninguna otra ruta', () => {
    expect(run('/payments/intents').rawBody).toBeUndefined();
    expect(run('/payments/gateway-webhooks/otra').rawBody).toBeUndefined();
    expect(run(undefined).rawBody).toBeUndefined();
  });
});
