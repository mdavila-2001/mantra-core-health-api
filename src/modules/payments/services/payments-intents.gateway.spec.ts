import { jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { PaymentsIntentsService } from './payments-intents.service';
import { PaymentsGatewayChargeService } from './payments-gateway-charge.service';
import { PaymentsTransactionsService } from './payments-transactions.service';
import { PaymentsGatewayClient } from '../gateway/payments-gateway.client';
import {
  PayGatewayDouble,
  TEST_API_KEY,
} from '../gateway/payments-gateway.double.testing';
import { deriveGatewayIdempotencyKey } from '../gateway/payments-gateway-idempotency';
import {
  PaymentsGatewayResultAmbiguousException,
  PaymentsGatewayUnavailableException,
} from '../gateway/payments-gateway.errors';
import type { PaymentsGatewayConfig } from '../gateway/payments-gateway.env';
import { PaymentsErrorReason } from '../payments.error-reasons';
import {
  dispatchMarkStamp,
  isDispatchMark,
  newDispatchMark,
} from '../gateway/payments-gateway-dispatch-mark';
import { gatewayMetrics } from '../gateway/payments-gateway-metrics';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  runWithTenant,
} from '../../../common';
import type { CreatePaymentIntentDto, ProcessTransactionDto } from '../dto';

/**
 * REQ-INT-1 y REQ-INT-3 (INT.H1.M2): el cobro detrás de `payments.via_gateway`.
 *
 * El cobro en la pasarela se despacha en `processTransaction`, DESPUÉS de la misma
 * compuerta de estado y de riesgo que aplica el camino de siempre (hallazgo de la
 * revisión de seguridad: despachar al crear la intención se saltaba la
 * evaluación de riesgo, que por construcción no puede existir todavía).
 *
 * El colaborador externo es un DOBLE HTTP declarado de la pasarela
 * (`payments-gateway.double.testing.ts`); la base es un almacén en memoria con la
 * semántica de transacción que importa acá. Ninguno de los dos es el colaborador real.
 */

const actor = { id: 'user-1', roles: ['PAYMENTS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const GATEWAY_ID = '22222222-2222-2222-2222-222222222222';
const DEBT_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';

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
  ...over,
});

const sale = (
  over: Partial<ProcessTransactionDto> = {},
): ProcessTransactionDto => ({
  operation: 'SALE',
  paymentMethodType: 'qr',
  ...over,
});

type Row = Record<string, any>;
type Decision = 'APPROVE' | 'REVIEW' | 'DECLINE';
const DECISION: Record<Decision, string> = {
  APPROVE: CONCEPTS.RISK_APPROVE,
  REVIEW: CONCEPTS.RISK_REVIEW,
  DECLINE: CONCEPTS.RISK_DECLINE,
};

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
    double.latencyMs = 0;
    double.onCreate = undefined;
  });

  const config = (viaGateway: boolean): PaymentsGatewayConfig => ({
    viaGateway,
    baseUrl: viaGateway ? double.baseUrl : '',
    apiKey: viaGateway ? TEST_API_KEY : '',
    mode: viaGateway ? 'test' : null,
    webhookSecrets: [],
    webhookPublicKeys: [],
    webhookToleranceSeconds: 300,
    timeoutMs: 500,
    maxAttempts: 3,
    retryBaseMs: 5,
  });

  function build(
    viaGateway: boolean,
    withCharge = true,
    inRequestTransaction = false,
  ) {
    const store = new Map<string, Row>();
    const risks = new Map<string, Row>();
    const legacyTransactions: Row[] = [];
    const open: { op: Row | null } = { op: null };
    let staged: Row[] = [];
    const em = {
      // Sin transacción de petición (`RLS_ENFORCE` apagado): `runCommitted` usa el
      // `transactional` de siempre. Con ella (`inRequestTransaction`) abre una
      // transacción aparte en un `fork()`, que acá es el mismo almacén.
      isInTransaction: () => inRequestTransaction,
      fork: () => em,
      execute: async () => [],
      transactional: async (cb: (tx: unknown) => Promise<unknown>) => {
        staged = [];
        try {
          const result = await cb({ execute: async () => [] });
          for (const row of staged)
            store.set(`${row.tenantId}|${row.idempotencyKey}`, row);
          return result;
        } finally {
          staged = [];
        }
      },
    };
    const byId = (id: string) =>
      [...store.values()].find((r) => r.id === id) ?? null;
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
      findByIdForUpdate: async (_tx: unknown, id: string) => byId(id),
      findDispatchMarksByTenant: async (_em: unknown, tenantId: string) =>
        [...store.values()].filter(
          (r) =>
            r.tenantId === tenantId &&
            typeof r.gatewayIntentRef === 'string' &&
            r.gatewayIntentRef.startsWith('dispatching:') &&
            [CONCEPTS.PI_PENDING, CONCEPTS.PI_PROCESSING].includes(
              r.statusConceptId,
            ),
        ),
      // El tenant va en el mismo `WHERE`: la fila ajena no se devuelve (ni se espera).
      findByIdAndTenantForUpdate: async (
        _tx: unknown,
        id: string,
        tenantId: string,
      ) => {
        const row = byId(id);
        return row && row.tenantId === tenantId ? row : null;
      },
    };
    // La deuda que cobra la intención (`sourceRef`): sin ella la compuerta de
    // deuda no tiene contra qué medir. Saldo holgado por defecto; cada prueba de
    // la compuerta fija el suyo.
    const debts = new Map<string, Row>([
      [
        DEBT_ID,
        {
          id: DEBT_ID,
          tenantId: TENANT,
          currencyCode: 'BOB',
          outstandingAmount: '1000.000000',
          statusConceptId: CONCEPTS.DEBT_PENDING,
        },
      ],
    ]);
    const sessions: Row[] = [];
    const flowRepo = {
      findLatestRiskAssessment: async (_tx: unknown, intentId: string) =>
        risks.get(intentId) ?? null,
      createRiskAssessment: (_tx: unknown, data: Row) => ({
        id: randomUUID(),
        ...data,
      }),
      findDebtByIdForUpdate: async (_tx: unknown, id: string) =>
        debts.get(id) ?? null,
      findCheckoutSessionsByIntentForUpdate: async (
        _tx: unknown,
        intentId: string,
      ) => sessions.filter((x) => x.paymentIntentId === intentId),
      findInFlightGatewayIntentsOnDebt: async (
        _tx: unknown,
        scope: {
          tenantId: string;
          paymentDebtId: string;
          excludeIntentId: string;
        },
      ) =>
        [...store.values()].filter(
          (r) =>
            r.tenantId === scope.tenantId &&
            r.id !== scope.excludeIntentId &&
            !!r.gatewayIntentRef &&
            [CONCEPTS.PI_PENDING, CONCEPTS.PI_PROCESSING].includes(
              r.statusConceptId,
            ) &&
            ((r.sourceRefType === 'payment_debt' &&
              r.sourceRefId === scope.paymentDebtId) ||
              sessions.some(
                (x) =>
                  x.paymentDebtId === scope.paymentDebtId &&
                  x.paymentIntentId === r.id,
              )),
        ),
    };
    const transactionsRepo = {
      findPendingByIntent: async () => open.op,
      findByIntent: async () => legacyTransactions,
      create: (_tx: unknown, data: Row) => {
        const row = { id: randomUUID(), ...data };
        legacyTransactions.push(row);
        return row;
      },
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
    const intents = new PaymentsIntentsService(
      em as never,
      intentsRepo as never,
      flowRepo as never,
      logger as never,
      withCharge ? charge : undefined,
    );
    const realTransactions = new PaymentsTransactionsService(
      em as never,
      intentsRepo as never,
      flowRepo as never,
      transactionsRepo as never,
      logger as never,
      withCharge ? charge : undefined,
    );
    // El `TenantContextInterceptor` fija el tenant del actor antes del servicio;
    // aquí se hace lo mismo. `tenant = null` es una petición sin tenant resuelto.
    const transactions = {
      processTransaction: (
        id: string,
        body: ProcessTransactionDto,
        who: typeof actor,
        tenant: string | null = TENANT,
      ) =>
        tenant === null
          ? realTransactions.processTransaction(id, body, who)
          : runWithTenant(tenant, () =>
              realTransactions.processTransaction(id, body, who),
            ),
    };
    const assess = (intentId: string, decision: Decision) =>
      risks.set(intentId, { decisionConceptId: DECISION[decision] });
    return {
      intents,
      transactions,
      realTransactions,
      charge,
      store,
      assess,
      legacyTransactions,
      open,
      debts,
      sessions,
    };
  }

  async function created(d: ReturnType<typeof build>, over = {}) {
    const res = await d.intents.createIntent(dto(over), actor);
    return { res, row: d.store.get(`${TENANT}|cobro-consulta-001`) as Row };
  }

  describe('crear la intención NO cobra: el cobro va después de la compuerta de riesgo', () => {
    it('flag encendido: createIntent no llama a la pasarela y responde con la forma de siempre', async () => {
      const d = build(true);
      const { res, row } = await created(d);

      expect(double.calls).toHaveLength(0);
      expect(res).toStrictEqual({
        id: row.id,
        tenantId: TENANT,
        amount: '150.00',
        statusConceptId: CONCEPTS.PI_PENDING,
        idempotencyKey: 'cobro-consulta-001',
        reused: false,
      });
      expect(row.gatewayIntentRef).toBeUndefined();
    });

    it.each([
      [
        'USD',
        { currency: 'USD' as const },
        PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
      ],
      [
        '150.005',
        { amount: '150.005' },
        PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE,
      ],
      [
        'vencimiento de 10 s',
        { expiresAt: new Date(Date.now() + 10_000).toISOString() },
        PaymentsErrorReason.PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE,
      ],
    ])(
      'flag encendido: una intención que la pasarela no podría cobrar (%s) se rechaza al crearla y no deja fila',
      async (_name, over, reason) => {
        const d = build(true);
        await expect(
          d.intents.createIntent(dto(over), actor),
        ).rejects.toMatchObject({ reason });
        expect(d.store.size).toBe(0);
        expect(double.calls).toHaveLength(0);
      },
    );

    it('flag apagado: acepta exactamente lo de siempre (USD, 3 decimales) sin tocar la pasarela', async () => {
      const d = build(false);
      const res = await d.intents.createIntent(
        dto({ currency: 'USD', amount: '150.005' }),
        actor,
      );
      expect(res.reused).toBe(false);
      expect(double.calls).toHaveLength(0);
      expect(Object.keys(res).sort()).toEqual(
        [
          'amount',
          'id',
          'idempotencyKey',
          'reused',
          'statusConceptId',
          'tenantId',
        ].sort(),
      );
    });
  });

  describe('COMPUERTA DE RIESGO antes de despachar: ambos caminos del flag', () => {
    describe.each([
      ['flag ENCENDIDO', true],
      ['flag APAGADO', false],
    ])('%s', (_label, viaGateway) => {
      /** Cuántas veces salió un cobro: a la pasarela (encendido) o al registro del proveedor (apagado). */
      const dispatches = (d: ReturnType<typeof build>) =>
        viaGateway ? double.postCalls.length : d.legacyTransactions.length;

      it('correcto: riesgo APPROVE despacha una sola vez', async () => {
        const d = build(viaGateway);
        const { row } = await created(d);
        d.assess(row.id, 'APPROVE');

        const res = await d.transactions.processTransaction(
          row.id,
          sale(),
          actor,
        );

        expect(dispatches(d)).toBe(1);
        expect(res.paymentIntentId).toBe(row.id);
        if (viaGateway) {
          expect(res.gateway).toMatchObject({
            paymentIntentId: expect.stringMatching(/^pi_/u),
            status: 'requires_action',
            nextAction: { type: 'display_qr' },
          });
          expect(row.gatewayIntentRef).toBe(res.gateway?.paymentIntentId);
        } else {
          expect(res.gateway).toBeUndefined();
        }
      });

      it('SIN evaluación de riesgo no despacha (422 PAYMENT_INTENT_RISK_ASSESSMENT_MISSING)', async () => {
        const d = build(viaGateway);
        const { row } = await created(d);

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_RISK_ASSESSMENT_MISSING,
        });

        expect(dispatches(d)).toBe(0);
        expect(double.calls).toHaveLength(0);
        expect(row.gatewayIntentRef).toBeUndefined();
      });

      it('riesgo DECLINE no despacha ni llama a la pasarela (422 PAYMENT_INTENT_RISK_DECLINED)', async () => {
        const d = build(viaGateway);
        const { row } = await created(d);
        d.assess(row.id, 'DECLINE');

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_RISK_DECLINED,
        });

        expect(dispatches(d)).toBe(0);
        expect(double.calls).toHaveLength(0);
      });

      it('la evaluación MÁS RECIENTE manda: un DECLINE posterior a un APPROVE bloquea', async () => {
        const d = build(viaGateway);
        const { row } = await created(d);
        d.assess(row.id, 'APPROVE');
        d.assess(row.id, 'DECLINE');

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_RISK_DECLINED,
        });
        expect(dispatches(d)).toBe(0);
      });

      it('una intención ya cobrada o cancelada no despacha', async () => {
        const d = build(viaGateway);
        const { row } = await created(d);
        d.assess(row.id, 'APPROVE');

        row.statusConceptId = CONCEPTS.PI_SUCCEEDED;
        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_ALREADY_SUCCEEDED,
        });
        row.statusConceptId = CONCEPTS.PI_CANCELED;
        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_CANCELED,
        });
        expect(dispatches(d)).toBe(0);
      });

      it('una intención inexistente es 404', async () => {
        const d = build(viaGateway);
        await expect(
          d.transactions.processTransaction(randomUUID(), sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
        });
      });
    });

    it('riesgo REVIEW (pide revisión humana): con la pasarela NO se despacha (supuesto conservador); el camino de siempre queda como estaba', async () => {
      const on = build(true);
      const { row } = await created(on);
      on.assess(row.id, 'REVIEW');
      await expect(
        on.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_INTENT_RISK_REVIEW_PENDING,
      });
      expect(double.calls).toHaveLength(0);

      // Tras resolver la revisión (nueva evaluación APPROVE) sí se despacha.
      on.assess(row.id, 'APPROVE');
      await on.transactions.processTransaction(row.id, sale(), actor);
      expect(double.postCalls).toHaveLength(1);

      // Camino de siempre: REVIEW sigue sin bloquear (comportamiento previo, no se toca).
      const off = build(false);
      const created2 = await created(off);
      off.assess(created2.row.id, 'REVIEW');
      await off.transactions.processTransaction(created2.row.id, sale(), actor);
      expect(off.legacyTransactions).toHaveLength(1);
    });
  });

  describe('flag ENCENDIDO: el despacho a la pasarela (REQ-INT-1)', () => {
    async function approved(d: ReturnType<typeof build>, over = {}) {
      const c = await created(d, over);
      d.assess(c.row.id, 'APPROVE');
      return c.row;
    }

    describe('correcto', () => {
      it('llama a POST /v1/payment_intents con Idempotency-Key derivada, en centavos, y asocia el pi_', async () => {
        const d = build(true);
        const row = await approved(d);

        await d.transactions.processTransaction(row.id, sale(), actor);

        expect(double.calls).toHaveLength(1);
        const [call] = double.postCalls;
        expect(call.path).toBe('/v1/payment_intents');
        expect(call.idempotencyKey).toBe(
          deriveGatewayIdempotencyKey({
            tenantId: TENANT,
            sourceRefType: 'payment_debt',
            sourceRefId: DEBT_ID,
            localIdempotencyKey: 'cobro-consulta-001',
          }),
        );
        expect(call.body).toMatchObject({
          amount_minor: 15000,
          currency: 'BOB',
          payment_method: { type: 'qr' },
        });
      });

      it('el payload sólo lleva importe, moneda, medio y vida: nada de la deuda, el tenant ni el pagador', async () => {
        const d = build(true);
        const row = await approved(d, {
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        });

        await d.transactions.processTransaction(row.id, sale(), actor);

        const body = double.postCalls[0].body as Record<string, unknown>;
        expect(Object.keys(body).sort()).toEqual(
          [
            'amount_minor',
            'currency',
            'expires_in_seconds',
            'payment_method',
          ].sort(),
        );
        expect(JSON.stringify(body)).not.toContain(DEBT_ID);
        expect(JSON.stringify(body)).not.toContain(TENANT);
        expect(body.expires_in_seconds).toBe(3600);
      });

      it('repetir la operación sobre una intención que ya tiene su cobro NO crea otro: lo consulta', async () => {
        const d = build(true);
        const row = await approved(d);
        const first = await d.transactions.processTransaction(
          row.id,
          sale(),
          actor,
        );
        double.calls.length = 0;

        const again = await d.transactions.processTransaction(
          row.id,
          sale(),
          actor,
        );

        expect(double.postCalls).toHaveLength(0);
        expect(double.calls.map((c) => c.method)).toEqual(['GET']);
        expect(again.gateway?.paymentIntentId).toBe(
          first.gateway?.paymentIntentId,
        );
        expect(double.createdCount).toBe(1);
      });
    });

    describe('límite: resultado ambiguo (regla 11)', () => {
      it('si la pasarela queda ambigua, la intención se CONSERVA y el reintento retoma con la MISMA clave sin crear un segundo cobro', async () => {
        const d = build(true);
        const row = await approved(d);
        double.script = [
          { kind: 'execute_then_status', status: 503 },
          { kind: 'execute_then_status', status: 503 },
          { kind: 'execute_then_status', status: 504 },
        ];

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        expect(row.statusConceptId).toBe(CONCEPTS.PI_PENDING);
        // Sin `pi_…` (no se sabe si la pasarela lo creó), pero con la RESERVA de
        // despacho: la deuda no se ofrece a otra intención mientras esto se resuelve.
        expect(isDispatchMark(row.gatewayIntentRef)).toBe(true);

        const res = await d.transactions.processTransaction(
          row.id,
          sale(),
          actor,
        );

        expect(res.gateway?.paymentIntentId).toMatch(/^pi_/u);
        const keys = double.postCalls.map((c) => c.idempotencyKey);
        expect(new Set(keys).size).toBe(1);
        expect(keys).toHaveLength(4);
        expect(double.createdCount).toBe(1);
      });

      it('el vencimiento se manda relativo al alta persistida: el reintento envía el mismo cuerpo', async () => {
        const d = build(true);
        const row = await approved(d, {
          expiresAt: new Date(Date.now() + 1_800_000).toISOString(),
        });
        double.script = [{ kind: 'execute_then_status', status: 502 }];

        await d.transactions.processTransaction(row.id, sale(), actor);

        const [first, second] = double.postCalls;
        expect(second.body).toEqual(first.body);
        expect(double.createdCount).toBe(1);
      });

      it('150.500000 viaja como 15050 centavos', async () => {
        const d = build(true);
        const row = await approved(d, { amount: '150.500000' });
        await d.transactions.processTransaction(row.id, sale(), actor);
        expect((double.postCalls[0].body as Row).amount_minor).toBe(15050);
      });
    });

    describe('inválido', () => {
      it('sin paymentMethodType: 422 y sin llamada', async () => {
        const d = build(true);
        const row = await approved(d);
        await expect(
          d.transactions.processTransaction(
            row.id,
            sale({ paymentMethodType: undefined }),
            actor,
          ),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
        });
        expect(double.calls).toHaveLength(0);
      });

      it.each(['AUTHORIZE', 'CAPTURE'] as const)(
        'la operación %s no existe en la pasarela: 422 y sin llamada',
        async (operation) => {
          const d = build(true);
          const row = await approved(d);
          await expect(
            d.transactions.processTransaction(
              row.id,
              sale({ operation }),
              actor,
            ),
          ).rejects.toMatchObject({
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_OPERATION_NOT_SUPPORTED,
          });
          expect(double.calls).toHaveLength(0);
        },
      );

      it('un importe parcial no se cobra por la pasarela: 422 y sin llamada', async () => {
        const d = build(true);
        const row = await approved(d);
        await expect(
          d.transactions.processTransaction(
            row.id,
            sale({ amount: '50.00' }),
            actor,
          ),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_MUST_MATCH_INTENT,
        });
        expect(double.calls).toHaveLength(0);
      });

      it('el importe completo explícito sí se acepta', async () => {
        const d = build(true);
        const row = await approved(d);
        await d.transactions.processTransaction(
          row.id,
          sale({ amount: '150' }),
          actor,
        );
        expect(double.postCalls).toHaveLength(1);
      });

      it('la pasarela rechaza de forma definitiva (422): se traduce, NO se reintenta y la intención queda pendiente (no fallada)', async () => {
        const d = build(true);
        const row = await approved(d);
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        const error = await d.transactions
          .processTransaction(row.id, sale(), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(error).toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        expect(double.postCalls).toHaveLength(1);
        expect(row.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      });

      it('la pasarela rechaza la credencial (401): 503, sin filtrar el motivo ni la clave', async () => {
        const d = build(true);
        const row = await approved(d);
        double.script = [{ kind: 'status', status: 401, code: 'unauthorized' }];

        const error = await d.transactions
          .processTransaction(row.id, sale(), actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(PaymentsGatewayUnavailableException);
        expect(JSON.stringify(error)).not.toContain(TEST_API_KEY);
      });
    });
  });

  describe('COMPUERTAS DE DOBLE COBRO y SOBRECOBRO: ambos caminos del flag', () => {
    describe.each([
      ['flag ENCENDIDO', true],
      ['flag APAGADO', false],
    ])('%s', (_label, viaGateway) => {
      const dispatches = (d: ReturnType<typeof build>) =>
        viaGateway ? double.postCalls.length : d.legacyTransactions.length;
      const approvedIntent = async (d: ReturnType<typeof build>) => {
        const { row } = await created(d);
        d.assess(row.id, 'APPROVE');
        return row;
      };
      const captured = (d: ReturnType<typeof build>, amount: string) =>
        d.legacyTransactions.push({
          id: randomUUID(),
          amount,
          statusConceptId: CONCEPTS.TXN_CAPTURED,
        });

      it('una operación ABIERTA en el gateway bloquea: 409 y cero cobros nuevos (camino de siempre: findPendingByIntent)', async () => {
        const d = build(viaGateway);
        const row = await approvedIntent(d);
        d.open.op = {
          id: randomUUID(),
          amount: '150.00',
          statusConceptId: CONCEPTS.TXN_PROCESSING,
        };
        const before = d.legacyTransactions.length;

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(double.calls).toHaveLength(0);
        expect(d.legacyTransactions).toHaveLength(before);
        expect(row.gatewayIntentRef).toBeUndefined();
      });

      it('una autorización abierta tampoco deja una VENTA nueva (otra venta duplicaría el cargo)', async () => {
        const d = build(viaGateway);
        const row = await approvedIntent(d);
        d.open.op = {
          id: randomUUID(),
          amount: '150.00',
          statusConceptId: CONCEPTS.TXN_AUTHORIZED,
        };
        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(dispatches(d)).toBe(0);
      });

      it('YA CAPTURADO por completo: no se cobra de nuevo', async () => {
        const d = build(viaGateway);
        const row = await approvedIntent(d);
        captured(d, '150.00');
        const before = d.legacyTransactions.length;

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toBeDefined();

        expect(double.calls).toHaveLength(0);
        expect(d.legacyTransactions).toHaveLength(before);
      });

      it('un importe explícito que excede el saldo (algo ya capturado) se rechaza', async () => {
        const d = build(viaGateway);
        const row = await approvedIntent(d);
        captured(d, '50.00');
        const before = d.legacyTransactions.length;

        await expect(
          d.transactions.processTransaction(
            row.id,
            sale({ amount: '150.00' }),
            actor,
          ),
        ).rejects.toMatchObject({ status: 409 });

        expect(double.calls).toHaveLength(0);
        expect(d.legacyTransactions).toHaveLength(before);
      });
    });

    it('PARCIALMENTE capturado: la pasarela (importe completo) NO cobra; el camino de siempre cobra sólo el saldo, como antes', async () => {
      const on = build(true);
      const { row } = await created(on);
      on.assess(row.id, 'APPROVE');
      on.legacyTransactions.push({
        id: randomUUID(),
        amount: '50.00',
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });
      await expect(
        on.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        status: 409,
        details: expect.objectContaining({
          captured: '50.00',
          balance: '100.00',
        }),
      });
      expect(double.calls).toHaveLength(0);

      const off = build(false);
      const created2 = await created(off);
      off.assess(created2.row.id, 'APPROVE');
      off.legacyTransactions.push({
        id: randomUUID(),
        amount: '50.00',
        statusConceptId: CONCEPTS.TXN_CAPTURED,
      });
      const res = await off.transactions.processTransaction(
        created2.row.id,
        { operation: 'SALE' },
        actor,
      );
      expect(res.amount).toBe('100.00');
    });

    it('PI_PROCESSING sin cobro en la pasarela no se re-despacha: 409 PAYMENT_INTENT_ALREADY_PROCESSING y cero llamadas', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      row.statusConceptId = CONCEPTS.PI_PROCESSING;

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_INTENT_ALREADY_PROCESSING,
      });
      expect(double.calls).toHaveLength(0);
    });

    it('PI_PROCESSING CON cobro en la pasarela es el reintento: consulta (GET), sin segundo POST ni segunda clave', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      const first = await d.transactions.processTransaction(
        row.id,
        sale(),
        actor,
      );
      row.statusConceptId = CONCEPTS.PI_PROCESSING; // lo que dejaría el webhook `processing`
      double.calls.length = 0;

      const again = await d.transactions.processTransaction(
        row.id,
        sale(),
        actor,
      );

      expect(double.postCalls).toHaveLength(0);
      expect(double.calls.map((c) => c.method)).toEqual(['GET']);
      expect(again.gateway?.paymentIntentId).toBe(
        first.gateway?.paymentIntentId,
      );
      expect(double.createdCount).toBe(1);
      expect(again.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
    });

    it('el reintento ambiguo CON la intención aún pendiente sigue usando la MISMA Idempotency-Key (no lo bloquean las compuertas nuevas)', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      double.script = [
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
      ];
      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

      await d.transactions.processTransaction(row.id, sale(), actor);

      expect(new Set(double.postCalls.map((c) => c.idempotencyKey)).size).toBe(
        1,
      );
      expect(double.createdCount).toBe(1);
    });
  });

  describe('M3: un tenant no cobra la intención de otro (BOLA)', () => {
    const approvedIntent = async (d: ReturnType<typeof build>) => {
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      return row;
    };

    it('la intención de OTRO tenant responde EXACTAMENTE igual que una inexistente: 404, sin llamar a la pasarela ni tocar la fila', async () => {
      const d = build(true);
      const row = await approvedIntent(d);

      const foreign = await d.transactions
        .processTransaction(row.id, sale(), actor, OTHER_TENANT)
        .catch((e: unknown) => e as any);
      const missing = await d.transactions
        .processTransaction(randomUUID(), sale(), actor, OTHER_TENANT)
        .catch((e: unknown) => e as any);

      expect(foreign).toMatchObject({
        status: 404,
        reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
      });
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.details).toBeUndefined();
      expect(double.calls).toHaveLength(0);
      expect(row.gatewayIntentRef).toBeUndefined();
      expect(row.statusConceptId).toBe(CONCEPTS.PI_PENDING);
    });

    it('tampoco la CONSULTA: la intención ajena ya despachada no devuelve su nextAction (QR, cuenta) a otro tenant', async () => {
      const d = build(true);
      const row = await approvedIntent(d);
      await d.transactions.processTransaction(row.id, sale(), actor);
      double.calls.length = 0;

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor, OTHER_TENANT),
      ).rejects.toMatchObject({ status: 404 });

      expect(double.calls).toHaveLength(0);
    });

    it('sin tenant resuelto (p. ej. SUPERADMIN sin X-Tenant-Id): 422 TENANT_REQUIRED y cero llamadas — nunca «cualquier tenant»', async () => {
      const d = build(true);
      const row = await approvedIntent(d);

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor, null),
      ).rejects.toMatchObject({
        status: 422,
        details: { reason: 'TENANT_REQUIRED' },
      });

      expect(double.calls).toHaveLength(0);
      expect(row.gatewayIntentRef).toBeUndefined();
    });

    it('el tenant dueño sí cobra (control)', async () => {
      const d = build(true);
      const row = await approvedIntent(d);
      await d.transactions.processTransaction(row.id, sale(), actor, TENANT);
      expect(double.postCalls).toHaveLength(1);
    });
  });

  describe('M2: compuerta previa contra la deuda', () => {
    const second = {
      idempotencyKey: 'cobro-consulta-002',
    };
    async function pair(d: ReturnType<typeof build>) {
      const a = (await created(d)).row;
      d.assess(a.id, 'APPROVE');
      await d.intents.createIntent(dto(second), actor);
      const b = d.store.get(`${TENANT}|cobro-consulta-002`) as Row;
      d.assess(b.id, 'APPROVE');
      return { a, b };
    }

    it('DOS intenciones con claves distintas sobre la MISMA deuda: la segunda no se despacha (409) y no hay segundo QR', async () => {
      const d = build(true);
      const { a, b } = await pair(d);
      await d.transactions.processTransaction(a.id, sale(), actor);
      double.calls.length = 0;

      await expect(
        d.transactions.processTransaction(b.id, sale(), actor),
      ).rejects.toMatchObject({
        status: 409,
        reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
      });

      expect(double.calls).toHaveLength(0);
      expect(double.createdCount).toBe(1);
      expect(b.gatewayIntentRef).toBeUndefined();
    });

    it('el reintento de la intención PROPIA ya despachada no se bloquea (regla 11): consulta, sin segundo cobro', async () => {
      const d = build(true);
      const { a } = await pair(d);
      await d.transactions.processTransaction(a.id, sale(), actor);
      double.calls.length = 0;

      const again = await d.transactions.processTransaction(
        a.id,
        sale(),
        actor,
      );

      expect(double.calls.map((c) => c.method)).toEqual(['GET']);
      expect(again.gateway?.paymentIntentId).toMatch(/^pi_/u);
    });

    it('el reintento tras un resultado AMBIGUO (sin pi_ asociado) tampoco se bloquea', async () => {
      const d = build(true);
      const { a } = await pair(d);
      double.script = [
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
        { kind: 'execute_then_status', status: 503 },
      ];
      await expect(
        d.transactions.processTransaction(a.id, sale(), actor),
      ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

      await d.transactions.processTransaction(a.id, sale(), actor);

      expect(double.createdCount).toBe(1);
    });

    it.each([
      ['PI_FAILED', CONCEPTS.PI_FAILED],
      ['PI_CANCELED', CONCEPTS.PI_CANCELED],
    ])(
      'si el cobro anterior terminó sin pagarse (%s) la deuda vuelve a poder cobrarse',
      async (_name, terminal) => {
        const d = build(true);
        const { a, b } = await pair(d);
        await d.transactions.processTransaction(a.id, sale(), actor);
        a.statusConceptId = terminal;

        await d.transactions.processTransaction(b.id, sale(), actor);

        expect(double.createdCount).toBe(2);
      },
    );

    it('otra intención ligada a la deuda sólo por una SESIÓN de checkout también cuenta', async () => {
      const d = build(true);
      const { a, b } = await pair(d);
      // La intención A apunta a otra deuda por sourceRef y a ésta por su sesión.
      a.sourceRefId = randomUUID();
      d.debts.set(a.sourceRefId, { ...d.debts.get(DEBT_ID) });
      d.debts.get(a.sourceRefId)!.id = a.sourceRefId;
      d.sessions.push({ paymentIntentId: a.id, paymentDebtId: DEBT_ID });
      await d.transactions.processTransaction(a.id, sale(), actor);
      double.calls.length = 0;

      await expect(
        d.transactions.processTransaction(b.id, sale(), actor),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
      });
      expect(double.calls).toHaveLength(0);
    });

    it('una intención de otro tenant sobre la misma deuda no bloquea (el alcance es el tenant)', async () => {
      const d = build(true);
      const { a, b } = await pair(d);
      await d.transactions.processTransaction(a.id, sale(), actor);
      a.tenantId = OTHER_TENANT;

      await d.transactions.processTransaction(b.id, sale(), actor);

      expect(double.createdCount).toBe(2);
    });

    it('importe MAYOR que el saldo de la deuda: 409 y cero llamadas', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      d.debts.get(DEBT_ID)!.outstandingAmount = '100.000000';

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        status: 409,
        reason: PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_EXCEEDS_DEBT,
      });
      expect(double.calls).toHaveLength(0);
    });

    it('el saldo se compara en decimal exacto: 149.999999 no alcanza para 150.00; 150.000000 sí', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      d.debts.get(DEBT_ID)!.outstandingAmount = '149.999999';
      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_EXCEEDS_DEBT,
      });

      d.debts.get(DEBT_ID)!.outstandingAmount = '150.000000';
      await d.transactions.processTransaction(row.id, sale(), actor);
      expect(double.postCalls).toHaveLength(1);
    });

    it.each([
      [
        'saldada',
        { statusConceptId: CONCEPTS.DEBT_SETTLED },
        PaymentsErrorReason.PAYMENT_DEBT_ALREADY_SETTLED,
      ],
      [
        'de otro tenant',
        { tenantId: OTHER_TENANT },
        PaymentsErrorReason.PAYMENT_DEBT_NOT_FOUND,
      ],
      [
        'en otra moneda',
        { currencyCode: 'USD' },
        PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
      ],
    ])('deuda %s: 422 y cero llamadas', async (_name, patch, reason) => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      Object.assign(d.debts.get(DEBT_ID)!, patch);

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({ status: 422, reason });
      expect(double.calls).toHaveLength(0);
    });

    it('la deuda de la intención no existe: 422 PAYMENT_DEBT_NOT_FOUND (no se cobra algo que no se podrá saldar)', async () => {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      d.debts.clear();

      await expect(
        d.transactions.processTransaction(row.id, sale(), actor),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_DEBT_NOT_FOUND,
      });
      expect(double.calls).toHaveLength(0);
    });

    it('una intención que no cobra una deuda (otro propósito) no tiene nada que medir y se despacha', async () => {
      const d = build(true);
      const { row } = await created(d, {
        purpose: 'OTHER',
        sourceRefType: undefined,
        sourceRefId: undefined,
      });
      d.assess(row.id, 'APPROVE');
      d.debts.clear();

      await d.transactions.processTransaction(row.id, sale(), actor);

      expect(double.postCalls).toHaveLength(1);
    });
  });

  describe('N2/N4: la reserva de despacho (marca) cierra la ventana de la llamada HTTP', () => {
    const SECOND = { idempotencyKey: 'cobro-consulta-002' };
    async function pair(d: ReturnType<typeof build>) {
      const a = (await created(d)).row;
      d.assess(a.id, 'APPROVE');
      await d.intents.createIntent(dto(SECOND), actor);
      const b = d.store.get(`${TENANT}|cobro-consulta-002`) as Row;
      d.assess(b.id, 'APPROVE');
      return { a, b };
    }
    const ambiguous = () => [
      { kind: 'execute_then_status' as const, status: 503 as const },
      { kind: 'execute_then_status' as const, status: 503 as const },
      { kind: 'execute_then_status' as const, status: 503 as const },
    ];
    /** Envejece la reserva de la intención: la fecha vive DENTRO de la marca. */
    const ageMark = (row: Row, ms: number) => {
      row.gatewayIntentRef = newDispatchMark(Date.now() - ms);
    };
    const HOUR = 3_600_000;

    describe('correcto', () => {
      it('un despacho exitoso reemplaza la marca por el pi_ real', async () => {
        const d = build(true);
        const { a } = await pair(d);

        await d.transactions.processTransaction(a.id, sale(), actor);

        expect(a.gatewayIntentRef).toMatch(/^pi_/u);
        expect(isDispatchMark(a.gatewayIntentRef)).toBe(false);
      });

      it('la marca se escribe ANTES de llamar a la pasarela (la pasarela ve la intención reservada)', async () => {
        const d = build(true);
        const { a } = await pair(d);
        let seenByGateway: unknown;
        double.onCreate = () => {
          seenByGateway = a.gatewayIntentRef;
        };

        await d.transactions.processTransaction(a.id, sale(), actor);

        expect(isDispatchMark(seenByGateway as string)).toBe(true);
      });

      it('N4: tras un 504 la intención conserva la reserva y OTRA intención de la deuda NO se despacha', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        double.script = ambiguous();
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
        double.calls.length = 0;

        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          status: 409,
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });

        expect(double.calls).toHaveLength(0);
        expect(b.gatewayIntentRef).toBeUndefined();
      });

      it('regla 11: tras el 504 la PROPIA intención reintenta con la MISMA clave, no se bloquea a sí misma y queda con un solo cobro', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        double.script = ambiguous();
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

        const again = await d.transactions.processTransaction(
          a.id,
          sale(),
          actor,
        );

        expect(again.gateway?.paymentIntentId).toMatch(/^pi_/u);
        expect(a.gatewayIntentRef).toBe(again.gateway?.paymentIntentId);
        expect(
          new Set(double.postCalls.map((c) => c.idempotencyKey)).size,
        ).toBe(1);
        expect(double.createdCount).toBe(1);
        // y B sigue bloqueada, ahora por el pi_ real
        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
        expect(double.createdCount).toBe(1);
      });

      it('un rechazo DEFINITIVO de la pasarela (422) libera la reserva: la deuda se puede cobrar con otra intención', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        expect(a.gatewayIntentRef).toBeUndefined();

        await d.transactions.processTransaction(b.id, sale(), actor);

        expect(b.gatewayIntentRef).toMatch(/^pi_/u);
      });

      it('una credencial rechazada (401, definitivo) también libera la reserva', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [{ kind: 'status', status: 401, code: 'unauthorized' }];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayUnavailableException);
        expect(a.gatewayIntentRef).toBeUndefined();
      });
    });

    describe('límite: lo que NO reserva y lo que NO libera', () => {
      it('una solicitud que la pasarela no podría cobrar (sin medio de pago) falla ANTES de reservar', async () => {
        const d = build(true);
        const { a } = await pair(d);

        await expect(
          d.transactions.processTransaction(
            a.id,
            sale({ paymentMethodType: undefined }),
            actor,
          ),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
        });

        expect(a.gatewayIntentRef).toBeUndefined();
        expect(double.calls).toHaveLength(0);
      });

      it.each([
        ['sin riesgo evaluado', null],
        ['riesgo DECLINE', 'DECLINE' as const],
      ])(
        'una compuerta que no pasa (%s) no deja reserva',
        async (_name, decision) => {
          const d = build(true);
          const { row } = await created(d);
          if (decision) d.assess(row.id, decision);

          await expect(
            d.transactions.processTransaction(row.id, sale(), actor),
          ).rejects.toBeInstanceOf(PreconditionFailedException);

          expect(row.gatewayIntentRef).toBeUndefined();
        },
      );

      it('la deuda bloqueada por OTRA intención no deja marca en la que se rechaza', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        await d.transactions.processTransaction(a.id, sale(), actor);

        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(b.gatewayIntentRef).toBeUndefined();
      });

      it('un resultado AMBIGUO no libera nunca la reserva (ante la duda no se desbloquea)', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'execute_then_drop' },
          { kind: 'execute_then_drop' },
          { kind: 'execute_then_drop' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
      });

      it.each([
        ['REVIEW', 'REVIEW' as const],
        ['DECLINE', 'DECLINE' as const],
      ])(
        'P9: un riesgo %s posterior al 504 NO impide recuperar el cobro que pudo crearse (el riesgo se evaluó antes de reservar)',
        async (_name, decision) => {
          const d = build(true);
          const { a } = await pair(d);
          double.script = ambiguous();
          await expect(
            d.transactions.processTransaction(a.id, sale(), actor),
          ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
          expect(double.createdCount).toBe(1);
          d.assess(a.id, decision);

          const again = await d.transactions.processTransaction(
            a.id,
            sale(),
            actor,
          );

          expect(again.gatewayTransactionRef).toBe(
            [...double.created.values()][0].intent.id,
          );
          expect(double.createdCount).toBe(1);
        },
      );

      it('control P9: sin marca ni pi_, un riesgo DECLINE sí frena el primer despacho', async () => {
        const d = build(true);
        const { a } = await pair(d);
        d.assess(a.id, 'DECLINE');

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_RISK_DECLINED,
        });
        expect(double.calls).toHaveLength(0);
      });

      it('una marca de otro tenant sobre el mismo id de deuda no bloquea (el alcance es el tenant)', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        double.script = ambiguous();
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        a.tenantId = OTHER_TENANT;

        await d.transactions.processTransaction(b.id, sale(), actor);

        expect(b.gatewayIntentRef).toMatch(/^pi_/u);
      });
    });

    describe('límite: una reserva vencida NO es permiso para cobrar (regla 11)', () => {
      const ambiguousA = async (d: ReturnType<typeof build>, a: Row) => {
        double.script = ambiguous();
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
      };

      it('una marca VIGENTE (dentro del plazo) bloquea a las demás, sin pedir conciliación', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        await ambiguousA(d, a);
        ageMark(a, d.charge.dispatchLeaseMs - 60_000);
        const required = jest.spyOn(gatewayMetrics, 'reconciliationRequired');

        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
        expect(required).not.toHaveBeenCalled();
        required.mockRestore();
      });

      it.each([
        ['apenas vencida', 60_000],
        ['de hace 5 horas', 5 * HOUR],
        ['de hace 30 horas', 30 * HOUR],
      ])(
        'una marca VENCIDA (%s) SIGUE bloqueando a las OTRAS intenciones (409): no se abre un segundo cobro y queda para conciliar',
        async (_name, extra) => {
          const d = build(true);
          const { a, b } = await pair(d);
          await ambiguousA(d, a);
          ageMark(a, d.charge.dispatchLeaseMs + extra);
          const required = jest.spyOn(gatewayMetrics, 'reconciliationRequired');
          const posts = double.postCalls.length;

          const error = await d.transactions
            .processTransaction(b.id, sale(), actor)
            .catch((e: unknown) => e);

          expect(error).toMatchObject({
            status: 409,
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
          });
          expect((error as { details?: unknown }).details).toMatchObject({
            reconciliationRequired: true,
          });
          expect(required).toHaveBeenCalledWith('stale_blocks_debt');
          expect(double.postCalls).toHaveLength(posts);
          expect(double.createdCount).toBe(1);
          expect(b.gatewayIntentRef).toBeUndefined();
          required.mockRestore();
        },
      );

      it('una marca con la fecha ilegible tampoco desbloquea a nadie', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        await ambiguousA(d, a);
        a.gatewayIntentRef = 'dispatching:formato-viejo';

        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
        expect(double.createdCount).toBe(1);
      });

      it('la marca vencida es consultable: listDispatchesRequiringReconciliation la lista y no lista la vigente', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        await ambiguousA(d, a);
        double.script = ambiguous();
        // B es de otra deuda para poder reservar también.
        b.sourceRefId = randomUUID();
        d.debts.set(b.sourceRefId, {
          ...d.debts.get(DEBT_ID),
          id: b.sourceRefId,
        });
        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        ageMark(a, d.charge.dispatchLeaseMs + 1_000);

        const listed =
          await d.charge.listDispatchesRequiringReconciliation(TENANT);

        expect(listed.map((x) => x.intentId)).toEqual([a.id]);
        expect(listed[0].ageMs).toBeGreaterThan(d.charge.dispatchLeaseMs);
      });

      it('la intención dueña de una marca vencida (menos de 23 h) conserva su salida: repetir con la misma clave, sin segundo cobro', async () => {
        const d = build(true);
        const { a } = await pair(d);
        await ambiguousA(d, a);
        ageMark(a, d.charge.dispatchLeaseMs + 60_000);

        const again = await d.transactions.processTransaction(
          a.id,
          sale(),
          actor,
        );

        expect(again.gateway?.paymentIntentId).toMatch(/^pi_/u);
        expect(double.createdCount).toBe(1);
      });

      it('un reintento que vuelve a terminar ambiguo CONSERVA la fecha original de la marca (no la renueva)', async () => {
        const d = build(true);
        const { a } = await pair(d);
        await ambiguousA(d, a);
        ageMark(a, 2 * HOUR);
        const original = a.gatewayIntentRef;
        double.script = ambiguous();

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

        // Renovar la fecha ocultaría cuánto lleva la clave en la pasarela (24 h);
        // el valor sí es nuevo (cada petición libera sólo la suya, P2).
        expect(dispatchMarkStamp(a.gatewayIntentRef)).toBe(
          dispatchMarkStamp(original),
        );
        expect(a.gatewayIntentRef).not.toBe(original);
      });

      it.each([
        ['más de 23 h', () => newDispatchMark(Date.now() - 25 * HOUR)],
        ['fecha ilegible', () => 'dispatching:formato-viejo'],
      ])(
        'la dueña de una marca de %s NO reenvía: 409 RECONCILIATION_REQUIRED, cero llamadas y la marca queda',
        async (_name, makeMark) => {
          const d = build(true);
          const { a } = await pair(d);
          await ambiguousA(d, a);
          a.gatewayIntentRef = makeMark();
          const mark = a.gatewayIntentRef;
          const required = jest.spyOn(gatewayMetrics, 'reconciliationRequired');
          const posts = double.postCalls.length;

          await expect(
            d.transactions.processTransaction(a.id, sale(), actor),
          ).rejects.toMatchObject({
            status: 409,
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_RECONCILIATION_REQUIRED,
          });

          expect(double.postCalls).toHaveLength(posts);
          expect(a.gatewayIntentRef).toBe(mark);
          expect(required).toHaveBeenCalledWith('too_old_to_resend');
          required.mockRestore();
        },
      );
    });

    describe('conciliación explícita (reconcileGatewayDispatch)', () => {
      const reconcile = (
        d: ReturnType<typeof build>,
        id: string,
        method = 'qr',
      ) =>
        runWithTenant(TENANT, () =>
          d.realTransactions.reconcileGatewayDispatch(id, {
            paymentMethodType: method as 'qr',
          }),
        );
      const ambiguousExecuted = async (d: ReturnType<typeof build>, a: Row) => {
        double.script = [
          { kind: 'execute_then_drop' },
          { kind: 'execute_then_drop' },
          { kind: 'execute_then_drop' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
      };

      it('la pasarela SÍ tenía el cobro: se reenvía la MISMA clave, se asocia el MISMO pi_ y se consulta su estado; no hay segundo cobro', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        await ambiguousExecuted(d, a);
        ageMark(a, d.charge.dispatchLeaseMs + 5 * HOUR);
        const original = [...double.created.values()][0].intent.id;
        double.calls.length = 0;
        const reconciled = jest.spyOn(gatewayMetrics, 'reconciled');

        const res = await reconcile(d, a.id);

        expect(res.gatewayTransactionRef).toBe(original);
        expect(a.gatewayIntentRef).toBe(original);
        expect(double.createdCount).toBe(1);
        expect(double.calls.map((c) => c.method)).toEqual(['POST', 'GET']);
        expect(double.postCalls[0].idempotencyKey).toBe(
          deriveGatewayIdempotencyKey({
            tenantId: TENANT,
            sourceRefType: 'payment_debt',
            sourceRefId: DEBT_ID,
            invoiceId: undefined,
            localIdempotencyKey: 'cobro-consulta-001',
          }),
        );
        expect(reconciled).toHaveBeenCalledWith('replayed');
        // Ahora SÍ hay un cobro real en vuelo: B sigue sin poder cobrar la deuda.
        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
        reconciled.mockRestore();
      });

      it('el primer envío NUNCA llegó: la conciliación crea el cobro de ESA intención, una sola vez', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'drop_before' },
          { kind: 'drop_before' },
          { kind: 'drop_before' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        expect(double.createdCount).toBe(0);
        ageMark(a, d.charge.dispatchLeaseMs + 60_000);
        const reconciled = jest.spyOn(gatewayMetrics, 'reconciled');

        const res = await reconcile(d, a.id);

        expect(double.createdCount).toBe(1);
        expect(a.gatewayIntentRef).toBe(res.gatewayTransactionRef);
        expect(reconciled).toHaveBeenCalledWith('created');
        reconciled.mockRestore();
      });

      it('con la marca de más de 23 h NO reenvía y pide conciliación manual', async () => {
        const d = build(true);
        const { a } = await pair(d);
        await ambiguousExecuted(d, a);
        ageMark(a, 25 * HOUR);
        const posts = double.postCalls.length;

        await expect(reconcile(d, a.id)).rejects.toMatchObject({
          status: 409,
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_RECONCILIATION_REQUIRED,
        });

        expect(double.postCalls).toHaveLength(posts);
        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
      });

      it('sin reserva pendiente no hay nada que conciliar (409)', async () => {
        const d = build(true);
        const { a } = await pair(d);

        await expect(reconcile(d, a.id)).rejects.toMatchObject({
          status: 409,
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_NOTHING_TO_RECONCILE,
        });
        expect(double.calls).toHaveLength(0);
      });

      it('con la pasarela apagada no hay nada que conciliar y no sale ninguna llamada', async () => {
        const d = build(false);
        await expect(reconcile(d, randomUUID())).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_NOTHING_TO_RECONCILE,
        });
        expect(double.calls).toHaveLength(0);
      });

      it('con OTRO medio de pago la pasarela contesta idempotency_key_reused: la reserva se CONSERVA (el cobro existe) y se pide conciliar', async () => {
        const d = build(true);
        const { a } = await pair(d);
        await ambiguousExecuted(d, a);
        ageMark(a, d.charge.dispatchLeaseMs + 60_000);
        const mark = a.gatewayIntentRef;

        await expect(reconcile(d, a.id, 'card')).rejects.toMatchObject({
          status: 409,
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_RECONCILIATION_REQUIRED,
        });

        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
        expect(dispatchMarkStamp(a.gatewayIntentRef)).toBe(
          dispatchMarkStamp(mark),
        );
        expect(double.createdCount).toBe(1);
      });

      it('un resultado ambiguo durante la conciliación conserva la reserva', async () => {
        const d = build(true);
        const { a } = await pair(d);
        await ambiguousExecuted(d, a);
        ageMark(a, d.charge.dispatchLeaseMs + 60_000);
        const mark = a.gatewayIntentRef;
        double.script = ambiguous();

        await expect(reconcile(d, a.id)).rejects.toBeInstanceOf(
          PaymentsGatewayResultAmbiguousException,
        );

        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
        expect(dispatchMarkStamp(a.gatewayIntentRef)).toBe(
          dispatchMarkStamp(mark),
        );
      });
    });

    describe('P2: una petición libera sólo SU reserva', () => {
      it('doble clic: la petición 1 recibe un rechazo definitivo mientras la 2 sigue en vuelo con su propia marca; la marca de la 2 NO se borra y otra intención sigue bloqueada', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        let secondRequestMark: string | undefined;
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];
        // Durante la llamada de la petición 1, la petición 2 (misma intención) pasa su
        // compuerta y reemplaza la marca por la suya.
        double.onCreate = () => {
          secondRequestMark = newDispatchMark(
            dispatchMarkStamp(a.gatewayIntentRef) ?? Date.now(),
          );
          a.gatewayIntentRef = secondRequestMark;
        };

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });

        expect(a.gatewayIntentRef).toBe(secondRequestMark);
        double.onCreate = undefined;
        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
        expect(double.createdCount).toBe(0);
      });

      it('control: sin otra petición, el rechazo definitivo sí libera la reserva propia', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        expect(a.gatewayIntentRef).toBeUndefined();
      });
    });

    describe('P3: sólo un problema del contrato es definitivo', () => {
      it.each([404, 400, 408, 413, 499])(
        'un %i SIN cuerpo del contrato (un proxy) es ambiguo: 504 y la reserva se CONSERVA',
        async (status) => {
          const d = build(true);
          const { a, b } = await pair(d);
          double.script = [{ kind: 'bare_status', status }];

          await expect(
            d.transactions.processTransaction(a.id, sale(), actor),
          ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

          expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
          await expect(
            d.transactions.processTransaction(b.id, sale(), actor),
          ).rejects.toMatchObject({
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
          });
        },
      );

      it('control: un 400 CON problema del contrato sí es definitivo y libera', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'status', status: 400, code: 'invalid_request' },
        ];
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });
        expect(a.gatewayIntentRef).toBeUndefined();
      });
    });

    describe('P1: con transacción de petición (RLS_ENFORCE=true) el cupo de despachos es finito y sin cola', () => {
      const withPool = async (poolMax: string, fn: () => Promise<void>) => {
        const before = process.env.DB_POOL_MAX;
        process.env.DB_POOL_MAX = poolMax;
        try {
          await fn();
        } finally {
          if (before === undefined) delete process.env.DB_POOL_MAX;
          else process.env.DB_POOL_MAX = before;
        }
      };

      it('pool de 4: UN solo despacho a la vez; el excedente falla AL INSTANTE con 503 PAYMENT_GATEWAY_BUSY, sin reservar ni llamar, y reintentar con la misma clave funciona', async () => {
        await withPool('4', async () => {
          const d = build(true, true, true);
          const { a, b } = await pair(d);
          b.sourceRefId = randomUUID();
          d.debts.set(b.sourceRefId, {
            ...d.debts.get(DEBT_ID),
            id: b.sourceRefId,
          });
          let busyAt = -1;
          double.latencyMs = 150;
          const first = d.transactions.processTransaction(a.id, sale(), actor);
          await new Promise((resolve) => setTimeout(resolve, 20));
          const t0 = Date.now();
          const second = await d.transactions
            .processTransaction(b.id, sale(), actor)
            .catch((e: unknown) => e);
          busyAt = Date.now() - t0;

          expect(second).toMatchObject({
            status: 503,
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_BUSY,
          });
          expect(busyAt).toBeLessThan(100);
          expect(b.gatewayIntentRef).toBeUndefined();
          await first;
          double.latencyMs = 0;

          // El cupo se libera: el reintento de la rechazada pasa.
          await d.transactions.processTransaction(b.id, sale(), actor);
          expect(double.createdCount).toBe(2);
        });
      });

      it('el cupo se libera también cuando el despacho falla (no se filtran cupos)', async () => {
        await withPool('4', async () => {
          const d = build(true, true, true);
          const { a } = await pair(d);
          double.script = [
            { kind: 'status', status: 422, code: 'validation_failed' },
          ];
          for (let i = 0; i < 5; i += 1) {
            await expect(
              d.transactions.processTransaction(a.id, sale(), actor),
            ).rejects.toMatchObject({
              reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
            });
            double.script = [
              { kind: 'status', status: 422, code: 'validation_failed' },
            ];
          }
        });
      });

      it('sin transacción de petición (RLS_ENFORCE=false) no hay cupo: 6 despachos simultáneos entran', async () => {
        await withPool('4', async () => {
          const d = build(true);
          double.latencyMs = 50;
          const ids: string[] = [];
          for (let i = 0; i < 6; i += 1) {
            const src = randomUUID();
            d.debts.set(src, { ...d.debts.get(DEBT_ID), id: src });
            const res = await d.intents.createIntent(
              dto({ idempotencyKey: `n-${i}`, sourceRefId: src }),
              actor,
            );
            d.assess(res.id, 'APPROVE');
            ids.push(res.id);
          }
          const results = await Promise.allSettled(
            ids.map((id) =>
              d.transactions.processTransaction(id, sale(), actor),
            ),
          );
          expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
        });
      });
    });

    describe('F1-A: un 4xx final NO libera la reserva si un intento previo de la misma llamada pudo llegar', () => {
      it('503 (ejecutó) y luego 422 definitivo: 504 ambiguo y la marca se CONSERVA; otra intención sigue bloqueada', async () => {
        const d = build(true);
        const { a, b } = await pair(d);
        double.script = [
          { kind: 'execute_then_status', status: 503 },
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
        expect(double.createdCount).toBe(1);
        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        });
      });

      it('corte de conexión y luego 429 agotado: se conserva', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'execute_then_drop' },
          { kind: 'status', status: 429, code: 'rate_limited' },
          { kind: 'status', status: 429, code: 'rate_limited' },
        ];

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);

        expect(isDispatchMark(a.gatewayIntentRef)).toBe(true);
      });

      it('control: un 422 en el ÚNICO intento (todos definitivos) sí libera la reserva', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });

        expect(a.gatewayIntentRef).toBeUndefined();
      });

      it('control: 429 y luego 422 (todos definitivos) libera la reserva', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = [
          { kind: 'status', status: 429, code: 'rate_limited' },
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        });

        expect(a.gatewayIntentRef).toBeUndefined();
      });
    });

    describe('inválido: la marca nunca se confunde con un cobro', () => {
      it('una intención con marca NO se consulta (GET con la marca como si fuera un pi_)', async () => {
        const d = build(true);
        const { a } = await pair(d);
        double.script = ambiguous();
        await expect(
          d.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        double.calls.length = 0;

        await d.transactions.processTransaction(a.id, sale(), actor);

        expect(double.calls.some((c) => c.method === 'GET')).toBe(false);
        expect(double.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
      });

      it('el camino de siempre (flag apagado) trata la marca como intención ya despachada: 409 PAYMENT_INTENT_VIA_GATEWAY', async () => {
        const on = build(true);
        const { a } = await pair(on);
        double.script = ambiguous();
        await expect(
          on.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toBeInstanceOf(PaymentsGatewayResultAmbiguousException);
        // El mismo almacén visto con el flag apagado (rollback del flag).
        const off = build(false);
        for (const [k, row] of on.store) off.store.set(k, row);

        await expect(
          off.transactions.processTransaction(a.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
        });
      });
    });
  });

  describe('N3: la compuerta contra la deuda falla cerrado cuando no puede saber qué deuda es', () => {
    const open = async (over: Partial<CreatePaymentIntentDto>) => {
      const d = build(true);
      const res = await created(d, over);
      d.assess(res.row.id, 'APPROVE');
      return { d, row: res.row };
    };

    describe('inválido', () => {
      it.each([
        ['sourceRefType en mayúsculas', { sourceRefType: 'PAYMENT_DEBT' }],
        ['sourceRefType distinto', { sourceRefType: 'debt' }],
        ['sin sourceRefType (sólo sourceRefId)', { sourceRefType: undefined }],
        ['sourceRefType con espacios', { sourceRefType: ' payment_debt' }],
      ])(
        '%s y sin sesión de checkout: 422 PAYMENT_GATEWAY_DEBT_UNRESOLVED, cero llamadas y sin reserva',
        async (_name, over) => {
          const { d, row } = await open(over);

          await expect(
            d.transactions.processTransaction(row.id, sale(), actor),
          ).rejects.toMatchObject({
            status: 422,
            reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_UNRESOLVED,
          });

          expect(double.calls).toHaveLength(0);
          expect(row.gatewayIntentRef).toBeUndefined();
        },
      );

      it('propósito DEBT sin ninguna referencia ni sesión: 422 (el cobro no se podría saldar)', async () => {
        const { d, row } = await open({
          sourceRefType: undefined,
          sourceRefId: undefined,
        });
        row.purposeConceptId = CONCEPTS.PAY_PURPOSE_DEBT;

        await expect(
          d.transactions.processTransaction(row.id, sale(), actor),
        ).rejects.toMatchObject({
          reason: PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_UNRESOLVED,
        });
        expect(double.calls).toHaveLength(0);
      });

      it('el segundo cobro sobre la misma deuda con un tipo distinto ya no se despacha en silencio', async () => {
        const d = build(true);
        const { row: a } = await created(d);
        d.assess(a.id, 'APPROVE');
        await d.transactions.processTransaction(a.id, sale(), actor);
        await d.intents.createIntent(
          dto({
            ...{ idempotencyKey: 'cobro-consulta-002' },
            sourceRefType: 'PAYMENT_DEBT',
          }),
          actor,
        );
        const b = d.store.get(`${TENANT}|cobro-consulta-002`) as Row;
        d.assess(b.id, 'APPROVE');
        double.calls.length = 0;

        await expect(
          d.transactions.processTransaction(b.id, sale(), actor),
        ).rejects.toMatchObject({ status: 422 });

        expect(double.calls).toHaveLength(0);
        expect(double.createdCount).toBe(1);
      });
    });

    describe('correcto', () => {
      it('con sesión de checkout la deuda se mide por la sesión aunque el tipo de origen no sea payment_debt', async () => {
        const { d, row } = await open({ sourceRefType: 'lo_que_sea' });
        d.sessions.push({ paymentIntentId: row.id, paymentDebtId: DEBT_ID });

        await d.transactions.processTransaction(row.id, sale(), actor);

        expect(double.createdCount).toBe(1);
      });
    });

    describe('límite: lo que NO es una deuda sigue cobrándose', () => {
      it('un pago de curso (tipo conocido ajeno a las deudas) se despacha sin medir deuda', async () => {
        const { d, row } = await open({
          purpose: 'INVOICE',
          sourceRefType: 'EDUCATION_COURSE',
          sourceRefId: randomUUID(),
        });

        await d.transactions.processTransaction(row.id, sale(), actor);

        expect(double.createdCount).toBe(1);
      });

      it('una intención sin propósito DEBT ni referencia de origen se despacha', async () => {
        const { d, row } = await open({
          purpose: 'INVOICE',
          sourceRefType: undefined,
          sourceRefId: undefined,
        });

        await d.transactions.processTransaction(row.id, sale(), actor);

        expect(double.createdCount).toBe(1);
      });
    });
  });

  describe('m5: una intención ya despachada no admite fx-lock, repartos ni un DECLINE', () => {
    async function dispatched() {
      const d = build(true);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      await d.transactions.processTransaction(row.id, sale(), actor);
      return { d, row };
    }

    it('fx-lock: 409 PAYMENT_INTENT_VIA_GATEWAY y el importe/moneda con QR vivo no cambian', async () => {
      const { d, row } = await dispatched();
      const before = { amount: row.amount, currency: row.currencyConceptId };

      await expect(
        d.intents.lockFxRate(
          row.id,
          {
            fromCurrency: 'BOB',
            toCurrency: 'USD',
            lockedRate: '0.1437',
            expiresAt: new Date(Date.now() + 600_000).toISOString(),
          } as never,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
      });

      expect({ amount: row.amount, currency: row.currencyConceptId }).toEqual(
        before,
      );
    });

    it('risk-assessment DECLINE: 409 y la intención NO pasa a PI_FAILED', async () => {
      const { d, row } = await dispatched();
      const status = row.statusConceptId;

      await expect(
        d.intents.assessRisk(
          row.id,
          { riskScore: '99', decision: 'DECLINE' } as never,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
      });

      expect(row.statusConceptId).toBe(status);
      expect(row.statusConceptId).not.toBe(CONCEPTS.PI_FAILED);
    });

    it('risk-assessment APPROVE sobre la intención despachada no cambia su estado (no se rechaza: no muta nada)', async () => {
      const { d, row } = await dispatched();
      const status = row.statusConceptId;

      await expect(
        d.intents.assessRisk(
          row.id,
          { riskScore: '5', decision: 'APPROVE' } as never,
          actor,
        ),
      ).resolves.toMatchObject({ decision: 'APPROVE' });

      expect(row.statusConceptId).toBe(status);
    });

    it('splits: 409 PAYMENT_INTENT_VIA_GATEWAY', async () => {
      const { d, row } = await dispatched();

      await expect(
        d.intents.addSplit(
          row.id,
          {
            splitType: 'AMOUNT',
            amount: '10.00',
            payeeConnectedAccountId: randomUUID(),
          } as never,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
      });
    });
  });

  describe('flag APAGADO: el camino viejo sigue EXACTAMENTE igual (REQ-INT-3, rollback)', () => {
    it('crear y cobrar no tocan la pasarela y registran la transacción PROCESSING de siempre', async () => {
      const d = build(false);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');

      const res = await d.transactions.processTransaction(
        row.id,
        { operation: 'SALE' },
        actor,
      );

      expect(double.calls).toHaveLength(0);
      expect(d.charge.enabled).toBe(false);
      expect(d.legacyTransactions).toHaveLength(1);
      expect(res).toStrictEqual({
        id: d.legacyTransactions[0].id,
        paymentIntentId: row.id,
        amount: '150.00',
        statusConceptId: CONCEPTS.TXN_PROCESSING,
        gatewayTransactionRef: undefined,
      });
      expect(row.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
      expect(row.gatewayIntentRef).toBeUndefined();
    });

    it('sin el colaborador inyectado (como lo construyen los specs previos) también es el camino viejo', async () => {
      const d = build(false, false);
      const { row } = await created(d);
      d.assess(row.id, 'APPROVE');
      await d.transactions.processTransaction(
        row.id,
        { operation: 'SALE' },
        actor,
      );
      expect(double.calls).toHaveLength(0);
      expect(d.legacyTransactions).toHaveLength(1);
    });

    it('el reintento idempotente de siempre devuelve la misma intención con reused=true', async () => {
      const d = build(false);
      const first = await d.intents.createIntent(dto(), actor);
      const second = await d.intents.createIntent(dto(), actor);
      expect(second).toStrictEqual({ ...first, reused: true });
      expect(d.store.size).toBe(1);
    });

    it('una intención ya asociada a la pasarela no abre el camino directo al proveedor: 409 PAYMENT_INTENT_VIA_GATEWAY', async () => {
      const on = build(true);
      const { row } = await created(on);
      on.assess(row.id, 'APPROVE');
      await on.transactions.processTransaction(row.id, sale(), actor);

      const off = build(false);
      off.store.set(`${TENANT}|cobro-consulta-001`, row);
      off.assess(row.id, 'APPROVE');

      const error = await off.transactions
        .processTransaction(row.id, { operation: 'SALE' }, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchObject({
        reason: PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
      });
      expect(off.legacyTransactions).toHaveLength(0);
    });
  });
});
