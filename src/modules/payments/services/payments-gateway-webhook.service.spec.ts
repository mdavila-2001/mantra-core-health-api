import { jest } from '@jest/globals';
import { PaymentsGatewayWebhookService } from './payments-gateway-webhook.service';
import {
  TEST_WEBHOOK_SECRET,
  signTestWebhook,
} from '../gateway/payments-gateway.double.testing';
import type { PaymentsGatewayConfig } from '../gateway/payments-gateway.env';
import { PaymentsErrorReason } from '../payments.error-reasons';
import { CONCEPTS } from '../../../common';

/**
 * REQ-INT-2 (INT.H1.M3): el receptor de webhooks de la pasarela.
 *
 * La base es un almacén en memoria que reproduce lo que el servicio necesita de
 * ella: la UNIQUE sobre `gateway_event_ref`, el bloqueo por intención (los
 * métodos son secuenciales) y el rollback ante una excepción. La firma, en
 * cambio, es la REAL (`verifyStandardWebhook`): los cuerpos se firman con el
 * mismo algoritmo de la pasarela. No es la pasarela ni una base real.
 */

const T0 = 1_790_000_000; // segundos
const TENANT = '11111111-1111-1111-1111-111111111111';
const PI = 'pi_c92215200m49';
const EVENT_A = '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c11';
const EVENT_B = '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c22';
const EVENT_C = '0b5d1c5e-9f0a-4a52-8f3b-6a1d2f0f6c33';

type Row = Record<string, any>;

const config = (
  over: Partial<PaymentsGatewayConfig> = {},
): PaymentsGatewayConfig => ({
  viaGateway: true,
  baseUrl: 'https://sandbox.pay.example/v1',
  apiKey: 'sk_test_unaClaveSinteticaDeCuarentaChars',
  mode: 'test',
  webhookSecrets: [TEST_WEBHOOK_SECRET],
  webhookPublicKeys: [],
  webhookToleranceSeconds: 300,
  timeoutMs: 1000,
  maxAttempts: 3,
  retryBaseMs: 10,
  ...over,
});

/** Cuerpo `WebhookEvent`, con espacios de más a propósito: lo firmado son los bytes, no el JSON. */
function body(over: {
  id?: string;
  type?: string;
  status?: string;
  piId?: string;
  amountMinor?: number;
  mode?: string;
  extra?: Record<string, unknown>;
}): string {
  const type = over.type ?? 'payment_intent.succeeded';
  const status = over.status ?? type.replace('payment_intent.', '');
  return JSON.stringify(
    {
      id: over.id ?? EVENT_A,
      object: 'event',
      type,
      created_at: '2026-10-29T15:00:00.000Z',
      mode: over.mode ?? 'test',
      data: {
        object: {
          payment_intent_id: over.piId ?? PI,
          status,
          amount_minor: over.amountMinor ?? 15000,
          currency: 'BOB',
          ...over.extra,
        },
      },
    },
    null,
    2,
  );
}

function signed(payload: string, id = EVENT_A, timestamp = T0) {
  return {
    headers: signTestWebhook({ id, timestamp, payload }),
    rawBody: Buffer.from(payload),
  };
}

describe('PaymentsGatewayWebhookService', () => {
  let nowSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(T0 * 1000);
  });
  afterEach(() => nowSpy.mockRestore());

  function build(
    cfg: PaymentsGatewayConfig = config(),
    seed: { intent?: Row | null } = {},
  ) {
    const intent: Row | null =
      seed.intent === null
        ? null
        : {
            id: 'intent-1',
            tenantId: TENANT,
            gatewayId: 'gw-1',
            amount: '150.00',
            statusConceptId: CONCEPTS.PI_PENDING,
            gatewayIntentRef: PI,
            updatedAt: new Date(0),
            ...seed.intent,
          };
    const state = {
      intent,
      debt: {
        id: 'debt-1',
        tenantId: TENANT,
        currencyCode: 'BOB',
        totalAmount: '150.000000',
        outstandingAmount: '150.000000',
        statusConceptId: CONCEPTS.DEBT_IN_CHECKOUT,
        settledAt: undefined as Date | undefined,
        updatedAt: new Date(0),
      } as Row,
      sessions: [
        {
          id: 'session-1',
          paymentDebtId: 'debt-1',
          paymentIntentId: 'intent-1',
          statusConceptId: CONCEPTS.CHECKOUT_OPEN,
          completedAt: undefined as Date | undefined,
          updatedAt: new Date(0),
        },
      ] as Row[],
    };
    const events = new Map<string, Row>();
    let staged: Row[] = [];
    const calls = { lookups: 0 };

    const intentsRepo = {
      findByGatewayIntentRefForUpdate: async (_tx: unknown, ref: string) => {
        calls.lookups += 1;
        return state.intent && state.intent.gatewayIntentRef === ref
          ? state.intent
          : null;
      },
    };
    const flowRepo = {
      findCheckoutSessionsByIntentForUpdate: async (
        _tx: unknown,
        intentId: string,
      ) => state.sessions.filter((s) => s.paymentIntentId === intentId),
      findDebtByIdForUpdate: async (_tx: unknown, id: string) =>
        state.debt && state.debt.id === id ? state.debt : null,
    };
    const transactionsRepo = {
      findWebhookEventByRef: async (_tx: unknown, ref: string) =>
        events.get(ref) ?? null,
      recordWebhookEvent: (_tx: unknown, data: Row) => {
        if (
          events.has(data.gatewayEventRef) ||
          staged.some((r) => r.gatewayEventRef === data.gatewayEventRef)
        ) {
          throw new Error('UNIQUE uq_payment_webhook_events_gateway_event_ref');
        }
        staged.push(data);
        return data;
      },
    };
    const em = {
      transactional: async (cb: (tx: unknown) => Promise<unknown>) => {
        const snapshot = structuredClone({
          i: state.intent,
          d: state.debt,
          s: state.sessions,
        });
        staged = [];
        try {
          const result = await cb({});
          for (const row of staged) events.set(row.gatewayEventRef, row);
          return result;
        } catch (error) {
          state.intent = snapshot.i;
          state.debt = snapshot.d;
          state.sessions = snapshot.s;
          throw error;
        } finally {
          staged = [];
        }
      },
    };
    const logs: Row[] = [];
    const logger = {
      setContext: () => undefined,
      info: (o: Row) => logs.push(o),
      warn: (o: Row) => logs.push(o),
      error: (o: Row) => logs.push(o),
    };
    const service = new PaymentsGatewayWebhookService(
      cfg,
      em as never,
      intentsRepo as never,
      flowRepo as never,
      transactionsRepo as never,
      logger as never,
    );
    return { service, state, events, calls, logs };
  }

  describe('correcto', () => {
    it('payment_intent.succeeded firmado: marca la intención cobrada, salda la deuda, cierra el checkout y archiva el evento', async () => {
      const d = build();

      const res = await d.service.receive(signed(body({})));

      expect(res).toEqual({
        received: true,
        eventId: EVENT_A,
        applied: true,
        duplicate: false,
        ignored: false,
        reconciliationRequired: false,
        decision: 'aplicar',
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(d.state.debt).toMatchObject({
        outstandingAmount: '0.000000',
        statusConceptId: CONCEPTS.DEBT_SETTLED,
      });
      expect(d.state.debt.settledAt).toBeInstanceOf(Date);
      expect(d.state.sessions[0].statusConceptId).toBe(
        CONCEPTS.CHECKOUT_COMPLETED,
      );
      const archived = d.events.get(`pay-gateway:${EVENT_A}`);
      expect(archived).toMatchObject({
        eventType: 'payment_intent.succeeded',
        isVerified: true,
        processed: true,
        relatedIntentId: 'intent-1',
        gatewayId: 'gw-1',
      });
    });

    it('un cobro parcial descuenta del saldo y deja la deuda pendiente, no saldada', async () => {
      const d = build(config(), { intent: { amount: '100.00' } });

      await d.service.receive(signed(body({ amountMinor: 10000 })));

      expect(d.state.debt).toMatchObject({
        outstandingAmount: '50.000000',
        statusConceptId: CONCEPTS.DEBT_PENDING,
      });
      expect(d.state.debt.settledAt).toBeUndefined();
    });

    it.each([
      ['payment_intent.failed', CONCEPTS.PI_FAILED],
      ['payment_intent.canceled', CONCEPTS.PI_CANCELED],
      ['payment_intent.expired', CONCEPTS.PI_FAILED],
    ])(
      '%s deja la intención sin cobrar y LIBERA el checkout y la deuda',
      async (type, local) => {
        const d = build();

        const res = await d.service.receive(signed(body({ type })));

        expect(res.applied).toBe(true);
        expect(d.state.intent?.statusConceptId).toBe(local);
        expect(d.state.debt).toMatchObject({
          outstandingAmount: '150.000000',
          statusConceptId: CONCEPTS.DEBT_PENDING,
        });
        expect(d.state.sessions[0].statusConceptId).toBe(
          CONCEPTS.CHECKOUT_EXPIRED,
        );
      },
    );

    it('payment_intent.processing adelanta la intención sin tocar la deuda', async () => {
      const d = build();
      const res = await d.service.receive(
        signed(body({ type: 'payment_intent.processing' })),
      );
      expect(res.applied).toBe(true);
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
      expect(d.state.debt.statusConceptId).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
    });

    it('payment_intent.created toma el estado inicial de data.object.status', async () => {
      const d = build();
      const res = await d.service.receive(
        signed(
          body({ type: 'payment_intent.created', status: 'requires_action' }),
        ),
      );
      // La intención ya está pendiente: no hay nada que avanzar, y queda archivado.
      expect(res).toMatchObject({
        applied: false,
        duplicate: false,
        decision: 'duplicado',
      });
      expect(d.events.has(`pay-gateway:${EVENT_A}`)).toBe(true);
    });

    it('sin sesión de checkout (cobro sin deuda) sólo asienta la intención', async () => {
      const d = build();
      d.state.sessions = [];
      const res = await d.service.receive(signed(body({})));
      expect(res.applied).toBe(true);
      expect(res.reconciliationRequired).toBe(false);
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
    });
  });

  describe('límite', () => {
    it('DUPLICADO: la reentrega del mismo webhook-id no repite el efecto (la deuda se descuenta una sola vez)', async () => {
      const d = build(config(), { intent: { amount: '100.00' } });
      const request = signed(body({ amountMinor: 10000 }));

      const first = await d.service.receive(request);
      const second = await d.service.receive(request);
      const third = await d.service.receive(request);

      expect(first.applied).toBe(true);
      expect(second).toMatchObject({
        duplicate: true,
        applied: false,
        decision: 'duplicado',
      });
      expect(third.duplicate).toBe(true);
      expect(d.state.debt.outstandingAmount).toBe('50.000000');
      expect(d.events.size).toBe(1);
    });

    it('DUPLICADO bajo firma nueva: otra entrega del mismo evento (otro timestamp) tampoco repite el efecto', async () => {
      const d = build(config(), { intent: { amount: '100.00' } });
      const payload = body({ amountMinor: 10000 });

      await d.service.receive(signed(payload, EVENT_A, T0));
      const again = await d.service.receive(signed(payload, EVENT_A, T0 + 60));

      expect(again.duplicate).toBe(true);
      expect(d.state.debt.outstandingAmount).toBe('50.000000');
    });

    it('ORDEN INVERTIDO: processing llega DESPUÉS de succeeded -> obsoleto, no retrocede', async () => {
      const d = build();
      await d.service.receive(signed(body({ id: EVENT_A })));

      const late = await d.service.receive(
        signed(
          body({ id: EVENT_B, type: 'payment_intent.processing' }),
          EVENT_B,
        ),
      );

      expect(late).toMatchObject({
        applied: false,
        decision: 'obsoleto',
        reconciliationRequired: false,
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(d.state.debt.statusConceptId).toBe(CONCEPTS.DEBT_SETTLED);
      expect(d.events.get(`pay-gateway:${EVENT_B}`)?.processed).toBe(true);
    });

    it('ORDEN INVERTIDO: processing, luego requires_action tardío -> obsoleto', async () => {
      const d = build();
      await d.service.receive(
        signed(body({ id: EVENT_A, type: 'payment_intent.processing' })),
      );
      const late = await d.service.receive(
        signed(
          body({ id: EVENT_B, type: 'payment_intent.requires_action' }),
          EVENT_B,
        ),
      );
      expect(late.decision).toBe('obsoleto');
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
    });

    it('CONTRADICCIÓN: failed después de succeeded NO se sobrescribe: queda archivado sin procesar para conciliar', async () => {
      const d = build();
      await d.service.receive(signed(body({ id: EVENT_A })));

      const res = await d.service.receive(
        signed(body({ id: EVENT_B, type: 'payment_intent.failed' }), EVENT_B),
      );

      expect(res).toMatchObject({
        applied: false,
        decision: 'contradiccion',
        reconciliationRequired: true,
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(d.state.debt.statusConceptId).toBe(CONCEPTS.DEBT_SETTLED);
      expect(d.events.get(`pay-gateway:${EVENT_B}`)?.processed).toBe(false);
    });

    it('la reentrega de una contradicción sigue marcada para conciliar', async () => {
      const d = build();
      await d.service.receive(signed(body({ id: EVENT_A })));
      const bad = signed(
        body({ id: EVENT_B, type: 'payment_intent.failed' }),
        EVENT_B,
      );
      await d.service.receive(bad);
      expect(await d.service.receive(bad)).toMatchObject({
        duplicate: true,
        reconciliationRequired: true,
      });
    });

    it('MARCA DE TIEMPO en el borde: exactamente la tolerancia (300 s) se acepta, 301 s se rechaza', async () => {
      const payload = body({});
      const atEdge = build();
      await expect(
        atEdge.service.receive(signed(payload, EVENT_A, T0 - 300)),
      ).resolves.toMatchObject({ applied: true });

      const beyond = build();
      await expect(
        beyond.service.receive(signed(payload, EVENT_A, T0 - 301)),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
        details: { code: 'timestamp_outside_tolerance' },
        status: 401,
      });
      expect(beyond.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      expect(beyond.events.size).toBe(0);
    });

    it('MARCA DE TIEMPO en el futuro: el borde (+300 s) se acepta y +301 s se rechaza', async () => {
      const payload = body({});
      await expect(
        build().service.receive(signed(payload, EVENT_A, T0 + 300)),
      ).resolves.toMatchObject({ applied: true });
      await expect(
        build().service.receive(signed(payload, EVENT_A, T0 + 301)),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
      });
    });

    it('la ventana configurable se respeta (60 s)', async () => {
      const d = build(config({ webhookToleranceSeconds: 60 }));
      await expect(
        d.service.receive(signed(body({}), EVENT_A, T0 - 61)),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW,
      });
    });

    it('cobro desconocido NO terminal (el webhook se adelantó al alta): se confirma sin efecto', async () => {
      const d = build(config(), { intent: null });
      const res = await d.service.receive(
        signed(body({ type: 'payment_intent.processing' })),
      );
      expect(res).toMatchObject({ ignored: true, applied: false });
      expect(d.events.size).toBe(0);
    });

    it('cobro desconocido TERMINAL: 404 para que la pasarela reintente (no se confirma lo que no se asentó)', async () => {
      const d = build(config(), { intent: null });
      await expect(d.service.receive(signed(body({})))).rejects.toMatchObject({
        status: 404,
        reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
      });
      expect(d.events.size).toBe(0);
    });

    it('rotación de secretos: vale cualquiera de los configurados', async () => {
      const other =
        'whsec_' +
        Buffer.from(Array.from({ length: 24 }, (_, i) => 200 - i)).toString(
          'base64',
        );
      const d = build(config({ webhookSecrets: [other, TEST_WEBHOOK_SECRET] }));
      await expect(d.service.receive(signed(body({})))).resolves.toMatchObject({
        applied: true,
      });
    });

    it('el importe cobrado se compara en centavos exactos (150.50 -> 15050)', async () => {
      const d = build(config(), { intent: { amount: '150.500000' } });
      d.state.debt.outstandingAmount = '150.500000';
      const res = await d.service.receive(signed(body({ amountMinor: 15050 })));
      expect(res.applied).toBe(true);
      expect(d.state.debt.outstandingAmount).toBe('0.000000');
    });
  });

  describe('inválido', () => {
    it('FIRMA MALA (otro secreto): 401 GATEWAY_WEBHOOK_SIGNATURE_INVALID, sin tocar la base', async () => {
      const d = build();
      const payload = body({});
      const wrong = signTestWebhook({
        id: EVENT_A,
        timestamp: T0,
        payload,
        secret:
          'whsec_' +
          Buffer.from(Array.from({ length: 32 }, (_, i) => 99 - i)).toString(
            'base64',
          ),
      });

      await expect(
        d.service.receive({ headers: wrong, rawBody: Buffer.from(payload) }),
      ).rejects.toMatchObject({
        status: 401,
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_SIGNATURE_INVALID,
        details: { code: 'no_matching_signature' },
      });
      expect(d.calls.lookups).toBe(0);
      expect(d.events.size).toBe(0);
    });

    it('CUERPO ALTERADO tras firmar (otro importe): 401 y la intención no cambia', async () => {
      const d = build();
      const original = body({ amountMinor: 15000 });
      const request = signed(original);
      const tampered = Buffer.from(original.replace('15000', '1'));

      await expect(
        d.service.receive({ headers: request.headers, rawBody: tampered }),
      ).rejects.toMatchObject({ status: 401 });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      expect(d.calls.lookups).toBe(0);
    });

    it('un cuerpo re-serializado (mismo JSON, otros bytes) no pasa: la firma cubre bytes, no el objeto', async () => {
      const d = build();
      const request = signed(body({}));
      const reserialized = Buffer.from(
        JSON.stringify(JSON.parse(request.rawBody.toString())),
      );
      await expect(
        d.service.receive({ headers: request.headers, rawBody: reserialized }),
      ).rejects.toMatchObject({ status: 401 });
    });

    it.each([
      ['webhook-id', 'missing_headers'],
      ['webhook-timestamp', 'missing_headers'],
      ['webhook-signature', 'missing_headers'],
    ])('sin la cabecera %s: 401 (%s)', async (name, code) => {
      const d = build();
      const request = signed(body({}));
      const headers = { ...request.headers };
      delete headers[name];
      await expect(
        d.service.receive({ headers, rawBody: request.rawBody }),
      ).rejects.toMatchObject({
        status: 401,
        details: { code },
      });
    });

    it('marca de tiempo no numérica: 401 invalid_timestamp', async () => {
      const d = build();
      const request = signed(body({}));
      await expect(
        d.service.receive({
          headers: { ...request.headers, 'webhook-timestamp': 'ayer' },
          rawBody: request.rawBody,
        }),
      ).rejects.toMatchObject({
        status: 401,
        details: { code: 'invalid_timestamp' },
      });
    });

    it('FLAG APAGADO con webhook entrante: 503 sin efecto (no 410, que deshabilitaría el endpoint en la pasarela)', async () => {
      const d = build(
        config({ viaGateway: false, mode: null, webhookSecrets: [] }),
      );

      const error = await d.service
        .receive(signed(body({})))
        .catch((e: unknown) => e);

      expect(error).toMatchObject({
        status: 503,
        reason: PaymentsErrorReason.GATEWAY_WEBHOOKS_DISABLED,
      });
      expect((error as { status: number }).status).not.toBe(410);
      expect(d.calls.lookups).toBe(0);
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      expect(d.events.size).toBe(0);
    });

    it('EVENTO DESCONOCIDO (lo que la pasarela agregue mañana): se confirma sin efecto y sin tocar la base', async () => {
      const d = build();
      const res = await d.service.receive(
        signed(
          body({ type: 'payment_intent.teleported', status: 'teleported' }),
        ),
      );
      expect(res).toMatchObject({
        received: true,
        ignored: true,
        applied: false,
      });
      expect(d.calls.lookups).toBe(0);
      expect(d.events.size).toBe(0);
    });

    it.each([
      'refund.succeeded',
      'dispute.opened',
      'payout.paid',
      'mandate.created',
      'scheduled_payment.failed',
    ])(
      'evento público de otro dominio (%s): se confirma sin efecto',
      async (type) => {
        const d = build();
        const res = await d.service.receive(
          signed(body({ type, status: 'x' })),
        );
        expect(res.ignored).toBe(true);
        expect(d.calls.lookups).toBe(0);
      },
    );

    it('evento de otro modo (live) con una clave sandbox: 422 y sin efecto', async () => {
      const d = build();
      await expect(
        d.service.receive(signed(body({ mode: 'live' }))),
      ).rejects.toMatchObject({
        status: 422,
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MODE_MISMATCH,
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PENDING);
    });

    it('importe distinto del cobrado: NO asienta nada, queda archivado sin procesar', async () => {
      const d = build();
      const res = await d.service.receive(signed(body({ amountMinor: 15001 })));
      expect(res).toMatchObject({
        applied: false,
        reconciliationRequired: true,
        decision: 'contradiccion',
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_PENDING);
      expect(d.state.debt.statusConceptId).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
      expect(d.events.get(`pay-gateway:${EVENT_A}`)?.processed).toBe(false);
    });

    it('succeeded sobre una intención ya fallada localmente: contradicción, no se salda la deuda', async () => {
      const d = build(config(), {
        intent: { statusConceptId: CONCEPTS.PI_FAILED },
      });
      const res = await d.service.receive(signed(body({})));
      expect(res).toMatchObject({
        decision: 'contradiccion',
        reconciliationRequired: true,
      });
      expect(d.state.debt.statusConceptId).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
    });

    it('cobro que excede el saldo de la deuda: la intención queda cobrada pero la deuda no se toca y se concilia', async () => {
      const d = build();
      d.state.debt.outstandingAmount = '100.000000';

      const res = await d.service.receive(signed(body({})));

      expect(res).toMatchObject({
        applied: true,
        reconciliationRequired: true,
      });
      expect(d.state.intent?.statusConceptId).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(d.state.debt).toMatchObject({
        outstandingAmount: '100.000000',
        statusConceptId: CONCEPTS.DEBT_IN_CHECKOUT,
      });
      expect(d.events.get(`pay-gateway:${EVENT_A}`)?.processed).toBe(false);
    });

    it('deuda de otro tenant o ya saldada: no se toca, se concilia', async () => {
      const foreign = build();
      foreign.state.debt.tenantId = '99999999-9999-9999-9999-999999999999';
      expect(
        (await foreign.service.receive(signed(body({}))))
          .reconciliationRequired,
      ).toBe(true);
      expect(foreign.state.debt.outstandingAmount).toBe('150.000000');

      const settled = build();
      settled.state.debt.statusConceptId = CONCEPTS.DEBT_SETTLED;
      expect(
        (await settled.service.receive(signed(body({}))))
          .reconciliationRequired,
      ).toBe(true);
    });

    it('cuerpo firmado pero que no cumple el contrato: 422 y sin efecto', async () => {
      const d = build();
      const notEvent = JSON.stringify({ hola: 'mundo' });
      await expect(d.service.receive(signed(notEvent))).rejects.toMatchObject({
        status: 422,
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
      });
      const notJson = 'esto no es json';
      await expect(d.service.receive(signed(notJson))).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
      });
    });

    it('payment_intent_id con forma inválida: 422', async () => {
      const d = build();
      await expect(
        d.service.receive(signed(body({ piId: '../../etc/passwd' }))),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
      });
    });

    it('el estado de data no coincide con el tipo del evento: 422', async () => {
      const d = build();
      await expect(
        d.service.receive(
          signed(body({ type: 'payment_intent.succeeded', status: 'failed' })),
        ),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
      });
    });

    it('webhook-id de la cabecera distinto del id del cuerpo: 422', async () => {
      const d = build();
      const payload = body({ id: EVENT_A });
      await expect(
        d.service.receive({
          headers: signTestWebhook({ id: EVENT_C, timestamp: T0, payload }),
          rawBody: Buffer.from(payload),
        }),
      ).rejects.toMatchObject({
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
      });
    });

    it('sin cuerpo crudo (parser mal cableado): 500 y sin efecto — nunca se verifica contra un cuerpo reconstruido', async () => {
      const d = build();
      await expect(
        d.service.receive({
          headers: signed(body({})).headers,
          rawBody: undefined,
        }),
      ).rejects.toMatchObject({
        status: 500,
        reason: PaymentsErrorReason.GATEWAY_WEBHOOK_RAW_BODY_MISSING,
      });
    });

    it('no registra el cuerpo, las cabeceras de firma ni el secreto', async () => {
      const d = build();
      await d.service.receive(signed(body({})));
      await d.service
        .receive(
          signed(body({ id: EVENT_B, type: 'payment_intent.failed' }), EVENT_B),
        )
        .catch(() => undefined);
      const text = JSON.stringify(d.logs);
      expect(text).not.toContain('whsec_');
      expect(text).not.toContain('v1,');
      expect(text).not.toContain('payment_intent_id');
    });
  });
});
