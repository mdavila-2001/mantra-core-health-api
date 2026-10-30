import { randomUUID } from 'node:crypto';
import { PaymentsIntentsService } from './payments-intents.service';
import { PaymentsGatewayChargeService } from './payments-gateway-charge.service';
import { PaymentsTransactionsService } from './payments-transactions.service';
import { PaymentsGatewayClient } from '../gateway/payments-gateway.client';
import { PayGatewayDouble } from '../gateway/payments-gateway.double.testing';
import { deriveGatewayIdempotencyKey } from '../gateway/payments-gateway-idempotency';
import {
  PaymentsGatewayResultAmbiguousException,
  PaymentsGatewayUnavailableException,
} from '../gateway/payments-gateway.errors';
import type { PaymentsGatewayConfig } from '../gateway/payments-gateway.env';
import { PaymentsErrorReason } from '../payments.error-reasons';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import type { CreatePaymentIntentDto } from '../dto';

/**
 * REQ-INT-1 y REQ-INT-3 (INT.H1.M2): el cobro detrás de `payments.via_gateway`.
 *
 * El colaborador externo es un DOBLE HTTP declarado de la pasarela
 * (`payments-gateway.double.testing.ts`); la base es un almacén en memoria con la
 * semántica de transacción que importa acá (lo creado dentro de una transacción
 * que falla no queda). Ninguno de los dos es el colaborador real.
 */

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const GATEWAY_ID = '22222222-2222-2222-2222-222222222222';
const DEBT_ID = '33333333-3333-3333-3333-333333333333';

const dto = (
  over: Partial<CreatePaymentIntentDto> = {},
): CreatePaymentIntentDto => ({
  tenantId: TENANT,
  gatewayId: GATEWAY_ID,
  amount: '150.00',
  currency: 'BOB',
  purpose: 'DEBT',
  idempotencyKey: 'cobro-consulta-001',
  sourceRefType: 'payment_debt',
  sourceRefId: DEBT_ID,
  paymentMethodType: 'qr',
  ...over,
});

type Row = Record<string, any>;

describe('Cobro de M42 detrás de payments.via_gateway', () => {
  const double = new PayGatewayDouble();
  const noSleep = {
    now: () => Date.now(),
    random: () => 0,
    sleep: async () => undefined,
  };

  beforeAll(() => double.start());
  afterAll(() => double.stop());
  beforeEach(() => {
    double.calls.length = 0;
    double.created.clear();
    double.script = [];
  });

  const config = (viaGateway: boolean): PaymentsGatewayConfig => ({
    viaGateway,
    baseUrl: viaGateway ? double.baseUrl : '',
    apiKey: viaGateway ? 'sk_test_unaClaveSinteticaDeCuarentaChars' : '',
    mode: viaGateway ? 'test' : null,
    webhookSecrets: [],
    webhookPublicKeys: [],
    webhookToleranceSeconds: 300,
    timeoutMs: 500,
    maxAttempts: 3,
    retryBaseMs: 5,
  });

  function build(viaGateway: boolean, withCharge = true) {
    const store = new Map<string, Row>();
    let staged: Row[] = [];
    const em = {
      transactional: async (cb: (tx: unknown) => Promise<unknown>) => {
        staged = [];
        try {
          const result = await cb({});
          for (const row of staged)
            store.set(`${row.tenantId}|${row.idempotencyKey}`, row);
          return result;
        } finally {
          staged = [];
        }
      },
    };
    const intentsRepo = {
      findByIdempotencyKey: async (
        _em: unknown,
        tenantId: string,
        key: string,
      ) => store.get(`${tenantId}|${key}`) ?? null,
      create: (_tx: unknown, data: Row) => {
        const row: Row = {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        staged.push(row);
        return row;
      },
      findByIdForUpdate: async (_tx: unknown, id: string) =>
        [...store.values()].find((r) => r.id === id) ?? null,
    };
    const logger = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };
    const cfg = config(viaGateway);
    const charge = new PaymentsGatewayChargeService(
      cfg,
      em as never,
      intentsRepo as never,
      logger as never,
      viaGateway ? new PaymentsGatewayClient(cfg, noSleep) : undefined,
    );
    const service = new PaymentsIntentsService(
      em as never,
      intentsRepo as never,
      {} as never,
      logger as never,
      withCharge ? charge : undefined,
    );
    return { service, charge, store, logger };
  }

  describe('flag ENCENDIDO (REQ-INT-1)', () => {
    describe('correcto', () => {
      it('llama a POST /v1/payment_intents con Idempotency-Key derivada, nunca a otro destino, y asocia el pi_', async () => {
        const d = build(true);

        const res = await d.service.createIntent(dto(), actor);

        // Una sola llamada, al endpoint del contrato, con la clave derivada de datos persistidos.
        expect(double.calls).toHaveLength(1);
        const [call] = double.postCalls;
        const stored = [...d.store.values()][0];
        expect(call.path).toBe('/v1/payment_intents');
        expect(call.idempotencyKey).toBe(
          deriveGatewayIdempotencyKey({
            tenantId: TENANT,
            sourceRefType: 'payment_debt',
            sourceRefId: DEBT_ID,
            localIdempotencyKey: 'cobro-consulta-001',
          }),
        );
        // Contrato: unidades menores enteras, BOB, medio de pago.
        expect(call.body).toMatchObject({
          amount_minor: 15000,
          currency: 'BOB',
          payment_method: { type: 'qr' },
        });
        // Respuesta: la del camino previo + el cobro de la pasarela.
        expect(res).toMatchObject({
          id: stored.id,
          tenantId: TENANT,
          amount: '150.00',
          statusConceptId: CONCEPTS.PI_PENDING,
          idempotencyKey: 'cobro-consulta-001',
          reused: false,
          gateway: {
            paymentIntentId: expect.stringMatching(/^pi_/u),
            status: 'requires_action',
            nextAction: { type: 'display_qr' },
          },
        });
        expect(stored.gatewayIntentRef).toBe(res.gateway?.paymentIntentId);
      });

      it('el payload no lleva datos de la deuda, la factura ni el pagador: sólo importe, moneda, medio, vida e id local', async () => {
        const d = build(true);
        await d.service.createIntent(
          dto({ expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
          actor,
        );

        const body = double.postCalls[0].body as Record<string, unknown>;
        expect(Object.keys(body).sort()).toEqual(
          [
            'amount_minor',
            'currency',
            'expires_in_seconds',
            'metadata',
            'payment_method',
          ].sort(),
        );
        expect(Object.keys(body.metadata as object)).toEqual([
          'mantra_intent_id',
        ]);
        expect(JSON.stringify(body)).not.toContain(DEBT_ID);
        expect(JSON.stringify(body)).not.toContain(TENANT);
        expect(body.expires_in_seconds).toBe(3600);
      });

      it('un reintento idempotente local, ya con su cobro asociado, devuelve lo mismo SIN volver a llamar', async () => {
        const d = build(true);
        const first = await d.service.createIntent(dto(), actor);
        double.calls.length = 0;

        const second = await d.service.createIntent(dto(), actor);

        expect(double.calls).toHaveLength(0);
        expect(second).toMatchObject({ id: first.id, reused: true });
      });
    });

    describe('límite: resultado ambiguo (regla 11)', () => {
      it('si la pasarela queda ambigua tras los reintentos, el cobro local se CONSERVA pendiente y el siguiente intento retoma con la MISMA clave sin crear un segundo cobro', async () => {
        const d = build(true);
        double.script = [
          { kind: 'execute_then_status', status: 503 },
          { kind: 'execute_then_status', status: 503 },
          { kind: 'execute_then_status', status: 504 },
        ];

        // 1) Se agotan los 3 intentos con resultado ambiguo (la pasarela SÍ lo creó en el primero).
        await expect(
          d.service.createIntent(dto(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        const [kept] = [...d.store.values()];
        expect(kept).toBeDefined();
        expect(kept.statusConceptId).toBe(CONCEPTS.PI_PENDING);
        expect(kept.gatewayIntentRef).toBeUndefined();

        // 2) El cliente reintenta con la misma idempotencyKey: retoma, no duplica.
        const res = await d.service.createIntent(dto(), actor);

        expect(res.id).toBe(kept.id);
        expect(res.reused).toBe(true);
        expect(res.gateway?.paymentIntentId).toMatch(/^pi_/u);
        expect(d.store.size).toBe(1);
        const keys = double.postCalls.map((c) => c.idempotencyKey);
        expect(new Set(keys).size).toBe(1);
        expect(keys).toHaveLength(4);
        expect(double.createdCount).toBe(1);
      });

      it('el vencimiento se manda relativo al alta persistida: el reintento envía el mismo cuerpo', async () => {
        const d = build(true);
        double.script = [{ kind: 'execute_then_status', status: 502 }];
        await d.service.createIntent(
          dto({ expiresAt: new Date(Date.now() + 1_800_000).toISOString() }),
          actor,
        );

        const [first, second] = double.postCalls;
        expect(second.body).toEqual(first.body);
        expect(double.createdCount).toBe(1);
      });

      it('una intención legada que ya avanzó por otra vía se devuelve tal cual, sin llamar a la pasarela', async () => {
        const d = build(true);
        d.store.set(`${TENANT}|cobro-consulta-001`, {
          id: randomUUID(),
          tenantId: TENANT,
          amount: '150.00',
          statusConceptId: CONCEPTS.PI_PROCESSING,
          idempotencyKey: 'cobro-consulta-001',
        });

        const res = await d.service.createIntent(dto(), actor);

        expect(res.reused).toBe(true);
        expect(res.gateway).toBeUndefined();
        expect(double.calls).toHaveLength(0);
      });

      it('150.50 y 150.500000 viajan como 15050 centavos', async () => {
        const d = build(true);
        await d.service.createIntent(dto({ amount: '150.500000' }), actor);
        expect((double.postCalls[0].body as Row).amount_minor).toBe(15050);
      });
    });

    describe('inválido', () => {
      it('USD: la pasarela sólo cobra BOB; falla ANTES de llamar y no deja nada persistido', async () => {
        const d = build(true);
        await expect(
          d.service.createIntent(dto({ currency: 'USD' }), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
        });
        expect(double.calls).toHaveLength(0);
        expect(d.store.size).toBe(0);
      });

      it('sin paymentMethodType: 422 PAYMENT_GATEWAY_METHOD_REQUIRED, sin llamada y sin fila', async () => {
        const d = build(true);
        await expect(
          d.service.createIntent(dto({ paymentMethodType: undefined }), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
        });
        expect(double.calls).toHaveLength(0);
        expect(d.store.size).toBe(0);
      });

      it('150.005 (más decimales que la moneda): se rechaza, no se redondea', async () => {
        const d = build(true);
        await expect(
          d.service.createIntent(dto({ amount: '150.005' }), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE,
        });
        expect(double.calls).toHaveLength(0);
        expect(d.store.size).toBe(0);
      });

      it('vencimiento fuera de 60 s a 24 h: 422 y sin fila', async () => {
        const d = build(true);
        await expect(
          d.service.createIntent(
            dto({ expiresAt: new Date(Date.now() + 10_000).toISOString() }),
            actor,
          ),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE,
        });
        expect(d.store.size).toBe(0);
      });

      it('la pasarela rechaza de forma definitiva (422): se traduce, NO se reintenta y el cobro local queda pendiente (no fallado)', async () => {
        const d = build(true);
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        const error = await d.service
          .createIntent(dto(), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error).toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        expect(double.postCalls).toHaveLength(1);
        const [kept] = [...d.store.values()];
        expect(kept.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      });

      it('la pasarela rechaza la credencial (401): 503, sin filtrar el motivo ni la clave', async () => {
        const d = build(true);
        double.script = [{ kind: 'status', status: 401, code: 'unauthorized' }];

        const error = await d.service
          .createIntent(dto(), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(PaymentsGatewayUnavailableException);
        expect(JSON.stringify(error)).not.toContain('sk_test_');
      });

      it('una respuesta con otro importe no se asocia a la intención', async () => {
        const d = build(true);
        // La pasarela ya tiene un cobro con esa clave por OTRO importe -> 422 key_reused.
        await new PaymentsGatewayClient(
          config(true),
          noSleep,
        ).createPaymentIntent(
          {
            amount_minor: 1,
            currency: 'BOB',
            payment_method: { type: 'qr' },
            metadata: { mantra_intent_id: 'x' },
          },
          deriveGatewayIdempotencyKey({
            tenantId: TENANT,
            sourceRefType: 'payment_debt',
            sourceRefId: DEBT_ID,
            localIdempotencyKey: 'cobro-consulta-001',
          }),
        );

        await expect(
          d.service.createIntent(dto(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        const [kept] = [...d.store.values()];
        expect(kept.gatewayIntentRef).toBeUndefined();
      });
    });
  });

  describe('flag APAGADO: el camino viejo sigue EXACTAMENTE igual (REQ-INT-3, rollback)', () => {
    const legacyResponse = (id: string) => ({
      id,
      tenantId: TENANT,
      amount: '150.00',
      statusConceptId: CONCEPTS.PI_PENDING,
      idempotencyKey: 'cobro-consulta-001',
      reused: false,
    });

    it('no llama a la pasarela y la respuesta tiene la forma de siempre, sin la clave `gateway`', async () => {
      const d = build(false);

      const res = await d.service.createIntent(dto(), actor);

      expect(double.calls).toHaveLength(0);
      expect(d.charge.enabled).toBe(false);
      expect(res).toStrictEqual(legacyResponse(res.id));
      expect(Object.keys(res).sort()).toEqual(
        Object.keys(legacyResponse(res.id)).sort(),
      );
    });

    it('persiste la misma intención de siempre: pendiente, sin referencia de pasarela', async () => {
      const d = build(false);
      await d.service.createIntent(dto(), actor);

      const [stored] = [...d.store.values()];
      expect(stored).toMatchObject({
        statusConceptId: CONCEPTS.PI_PENDING,
        amount: '150.00',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
      });
      expect(stored.gatewayIntentRef).toBeUndefined();
    });

    it('acepta lo que la pasarela rechazaría: USD, 3 decimales y sin medio de pago', async () => {
      const d = build(false);

      await expect(
        d.service.createIntent(
          dto({
            currency: 'USD',
            amount: '150.005',
            paymentMethodType: undefined,
          }),
          actor,
        ),
      ).resolves.toMatchObject({ reused: false });
      expect(double.calls).toHaveLength(0);
    });

    it('sin el colaborador inyectado (como lo construyen los specs previos) también es el camino viejo', async () => {
      const d = build(false, false);
      const res = await d.service.createIntent(dto(), actor);
      expect(res).toStrictEqual(legacyResponse(res.id));
      expect(double.calls).toHaveLength(0);
    });

    it('el reintento idempotente de siempre devuelve la misma intención con reused=true', async () => {
      const d = build(false);
      const first = await d.service.createIntent(dto(), actor);
      const second = await d.service.createIntent(dto(), actor);
      expect(second).toStrictEqual({
        ...legacyResponse(first.id),
        reused: true,
      });
      expect(d.store.size).toBe(1);
    });

    it('apagar el flag no toca una intención ya asociada a la pasarela: se devuelve igual y no se llama a nadie', async () => {
      const on = build(true);
      const created = await on.service.createIntent(dto(), actor);
      double.calls.length = 0;

      const off = build(false);
      off.store.set(`${TENANT}|cobro-consulta-001`, [...on.store.values()][0]);
      const again = await off.service.createIntent(dto(), actor);

      expect(again).toMatchObject({ id: created.id, reused: true });
      expect(double.calls).toHaveLength(0);
    });
  });

  describe('una intención cobrada por la pasarela no abre el camino directo al proveedor', () => {
    const buildTransactions = (intent: Row) => {
      const transactionsRepo = {
        create: () => {
          throw new Error(
            'no debería crear una transacción contra el proveedor',
          );
        },
        findPendingByIntent: async () => null,
      };
      const em = {
        transactional: async (cb: (tx: unknown) => unknown) => cb({}),
      };
      const logger = {
        setContext: () => undefined,
        info: () => undefined,
        warn: () => undefined,
      };
      return new PaymentsTransactionsService(
        em as never,
        { findByIdForUpdate: async () => intent } as never,
        {} as never,
        transactionsRepo as never,
        logger as never,
      );
    };

    it('processTransaction sobre una intención con gatewayIntentRef responde 409 PAYMENT_INTENT_VIA_GATEWAY', async () => {
      const service = buildTransactions({
        id: 'i-1',
        statusConceptId: CONCEPTS.PI_PENDING,
        gatewayIntentRef: 'pi_dbl0000000001',
      });

      const error = await service
        .processTransaction('i-1', { operation: 'SALE' } as never, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
      });
    });
  });
});
