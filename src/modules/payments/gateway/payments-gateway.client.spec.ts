import { PaymentsGatewayClient } from './payments-gateway.client';
import { PaymentsGatewayError } from './payments-gateway.errors';
import { PayGatewayDouble } from './payments-gateway.double.testing';
import type { PaymentsGatewayConfig } from './payments-gateway.env';
import type { GatewayPaymentIntentCreate } from './payments-gateway.types';

/**
 * El cliente contra un DOBLE HTTP declarado de la pasarela
 * (`payments-gateway.double.testing.ts`): servidor real, sockets reales, con las
 * reglas de idempotencia del contrato. No es la pasarela real.
 */

const BODY: GatewayPaymentIntentCreate = {
  amount_minor: 15000,
  currency: 'BOB',
  payment_method: { type: 'qr' },
  metadata: { mantra_intent_id: '9d3c2a64-0000-4000-8000-000000000001' },
};
const KEY = 'mantra-pi-v1-clave-de-prueba-estable-0001';

describe('PaymentsGatewayClient (contra el doble HTTP)', () => {
  const double = new PayGatewayDouble();
  const sleeps: number[] = [];
  const clock = {
    now: () => Date.now(),
    random: () => 0.5,
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
  };
  const config = (
    over: Partial<PaymentsGatewayConfig> = {},
  ): PaymentsGatewayConfig => ({
    viaGateway: true,
    baseUrl: double.baseUrl,
    apiKey: 'sk_test_unaClaveSinteticaDeCuarentaChars',
    mode: 'test',
    webhookSecrets: [],
    webhookPublicKeys: [],
    webhookToleranceSeconds: 300,
    timeoutMs: 400,
    maxAttempts: 3,
    retryBaseMs: 10,
    ...over,
  });
  const client = (over: Partial<PaymentsGatewayConfig> = {}) =>
    new PaymentsGatewayClient(config(over), clock);

  beforeAll(() => double.start());
  afterAll(() => double.stop());
  beforeEach(() => {
    double.calls.length = 0;
    double.created.clear();
    double.script = [];
    sleeps.length = 0;
  });

  describe('correcto', () => {
    it('crea el cobro con Authorization, Idempotency-Key y X-Request-Id, y devuelve el pi_', async () => {
      const result = await client().createPaymentIntent(BODY, KEY, {
        requestId: 'mantra-req-0001',
      });

      expect(result.replayed).toBe(false);
      expect(result.intent).toMatchObject({
        object: 'payment_intent',
        amount_minor: 15000,
        status: 'requires_action',
        next_action: { type: 'display_qr' },
      });
      expect(result.intent.id).toMatch(/^pi_[a-z0-9]{10,40}$/u);
      expect(double.postCalls).toHaveLength(1);
      expect(double.postCalls[0]).toMatchObject({
        path: '/v1/payment_intents',
        idempotencyKey: KEY,
        authorization: 'Bearer sk_test_***',
        requestId: 'mantra-req-0001',
        body: BODY,
      });
    });

    it('repetir la misma petición devuelve el mismo cobro marcado como repetición', async () => {
      const first = await client().createPaymentIntent(BODY, KEY);
      const second = await client().createPaymentIntent(BODY, KEY);

      expect(second.replayed).toBe(true);
      expect(second.intent.id).toBe(first.intent.id);
      expect(double.createdCount).toBe(1);
    });

    it('consulta un cobro por su id', async () => {
      const created = await client().createPaymentIntent(BODY, KEY);
      const fetched = await client().getPaymentIntent(created.intent.id);
      expect(fetched.id).toBe(created.intent.id);
    });
  });

  describe('límite: un resultado ambiguo NO es un fallo (regla 11)', () => {
    it.each([
      [
        'conexión cortada DESPUÉS de ejecutar',
        { kind: 'execute_then_drop' } as const,
      ],
      [
        '500 después de ejecutar',
        { kind: 'execute_then_status', status: 500 } as const,
      ],
      [
        '502 después de ejecutar',
        { kind: 'execute_then_status', status: 502 } as const,
      ],
      [
        '503 después de ejecutar',
        { kind: 'execute_then_status', status: 503 } as const,
      ],
      [
        '504 después de ejecutar',
        { kind: 'execute_then_status', status: 504 } as const,
      ],
    ])(
      '%s: reintenta con la MISMA clave y NO crea un segundo cobro',
      async (_name, fault) => {
        double.script = [fault];

        const result = await client().createPaymentIntent(BODY, KEY);

        expect(double.postCalls).toHaveLength(2);
        expect(double.postCalls.map((c) => c.idempotencyKey)).toEqual([
          KEY,
          KEY,
        ]);
        expect(double.createdCount).toBe(1);
        expect(result.replayed).toBe(true);
      },
    );

    it('timeout (la pasarela ejecutó pero tardó): reintenta con la misma clave y recupera el cobro original', async () => {
      double.script = [{ kind: 'execute_then_hang', ms: 1200 }];

      const result = await client({ timeoutMs: 150 }).createPaymentIntent(
        BODY,
        KEY,
      );

      expect(double.createdCount).toBe(1);
      expect(result.replayed).toBe(true);
      expect(double.postCalls.map((c) => c.idempotencyKey)).toEqual([KEY, KEY]);
    });

    it('conexión cortada ANTES de ejecutar: el reintento con la misma clave sí lo crea, una sola vez', async () => {
      double.script = [{ kind: 'drop_before' }];

      const result = await client().createPaymentIntent(BODY, KEY);

      expect(double.createdCount).toBe(1);
      expect(result.replayed).toBe(false);
    });

    it('409 idempotency_request_in_progress: espera y reintenta con la misma clave', async () => {
      double.script = [
        {
          kind: 'status',
          status: 409,
          code: 'idempotency_request_in_progress',
        },
      ];

      const result = await client().createPaymentIntent(BODY, KEY);

      expect(result.intent.id).toMatch(/^pi_/u);
      expect(double.postCalls).toHaveLength(2);
      expect(double.createdCount).toBe(1);
    });

    it('respeta Retry-After del servidor en vez de su backoff', async () => {
      double.script = [
        {
          kind: 'status',
          status: 503,
          code: 'upstream_unavailable',
          retryAfter: 2,
        },
      ];

      await client().createPaymentIntent(BODY, KEY);

      expect(sleeps).toEqual([2000]);
    });

    it('el último intento de maxAttempts es el que resuelve', async () => {
      double.script = [
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 504 },
      ];

      const result = await client({ maxAttempts: 3 }).createPaymentIntent(
        BODY,
        KEY,
      );

      expect(double.postCalls).toHaveLength(3);
      expect(result.intent.id).toMatch(/^pi_/u);
      expect(double.createdCount).toBe(1);
    });
  });

  describe('inválido', () => {
    it('agota los intentos con 5xx: error AMBIGUO (no definitivo), siempre con la misma clave', async () => {
      double.script = [
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
      ];

      const error = await client({ maxAttempts: 3 })
        .createPaymentIntent(BODY, KEY)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PaymentsGatewayError);
      expect((error as PaymentsGatewayError).isAmbiguous).toBe(true);
      expect(double.postCalls.map((c) => c.idempotencyKey)).toEqual([
        KEY,
        KEY,
        KEY,
      ]);
      // El cobro se creó una vez en el primer intento y NO se creó otro por ambigüedad.
      expect(double.createdCount).toBe(1);
    });

    it('sin servidor (conexión rechazada): ambiguo tras agotar intentos', async () => {
      const dead = new PaymentsGatewayClient(
        config({ baseUrl: 'http://127.0.0.1:1/v1', maxAttempts: 2 }),
        clock,
      );
      const error = await dead
        .createPaymentIntent(BODY, KEY)
        .catch((e: unknown) => e);
      expect((error as PaymentsGatewayError).isAmbiguous).toBe(true);
    });

    it('422 es definitivo: NO se reintenta', async () => {
      const error = await client()
        .createPaymentIntent({ ...BODY, currency: 'USD' as 'BOB' }, KEY)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PaymentsGatewayError);
      expect(error).toMatchObject({
        ambiguity: 'rejected',
        retryable: false,
        status: 422,
        code: 'validation_failed',
      });
      expect(double.postCalls).toHaveLength(1);
    });

    it('422 idempotency_key_reused (otro cuerpo con la misma clave) es definitivo', async () => {
      await client().createPaymentIntent(BODY, KEY);
      const error = await client()
        .createPaymentIntent({ ...BODY, amount_minor: 16000 }, KEY)
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        retryable: false,
        status: 422,
        code: 'idempotency_key_reused',
      });
      expect(double.createdCount).toBe(1);
    });

    it('401 es definitivo y el mensaje no contiene la clave de API', async () => {
      const error = (await client({
        apiKey: 'pk_live_loQueSeaDeCuarentaCaracteres0',
      })
        .createPaymentIntent(BODY, KEY)
        .catch((e: unknown) => e)) as PaymentsGatewayError;

      expect(error).toMatchObject({ status: 401, retryable: false });
      expect(error.message).not.toContain('pk_live_');
      expect(double.postCalls).toHaveLength(1);
    });

    it('429 se reintenta y, agotado, es un rechazo reintentable (no ambiguo)', async () => {
      double.script = [
        { kind: 'status', status: 429, code: 'rate_limited' },
        { kind: 'status', status: 429, code: 'rate_limited' },
      ];

      const error = (await client({ maxAttempts: 2 })
        .createPaymentIntent(BODY, KEY)
        .catch((e: unknown) => e)) as PaymentsGatewayError;

      expect(error).toMatchObject({
        ambiguity: 'rejected',
        retryable: true,
        status: 429,
      });
      expect(double.createdCount).toBe(0);
    });

    it('2xx con un cuerpo que no cumple el contrato es ambiguo y no se asocia', async () => {
      double.script = [{ kind: 'execute_then_garbage' }];

      const error = (await client()
        .createPaymentIntent(BODY, KEY)
        .catch((e: unknown) => e)) as PaymentsGatewayError;

      expect(error).toBeInstanceOf(PaymentsGatewayError);
      expect(error.isAmbiguous).toBe(true);
    });

    it('consultar un id con forma inválida ni siquiera sale a la red', async () => {
      await expect(
        client().getPaymentIntent('../merchants/me'),
      ).rejects.toBeInstanceOf(PaymentsGatewayError);
      expect(double.calls).toHaveLength(0);
    });

    it('consultar un cobro inexistente es un 404 definitivo', async () => {
      await expect(
        client().getPaymentIntent('pi_noexiste0000'),
      ).rejects.toMatchObject({ status: 404, retryable: false });
    });
  });
});
