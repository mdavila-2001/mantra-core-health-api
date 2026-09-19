import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { TEST_ADMIN_ID, bearer, type TestContext } from '../harness';
import {
  CONCEPTS,
  SEED,
  canonicalJson,
  deriveWebhookSecret,
  signPayload,
} from '../../../src/common';

/**
 * Fixture compartido por las pruebas de pagos de F05 (MCH-011/017/036).
 *
 * Mismo criterio que `mch-003.int-spec.ts`: no trunca ni borra. El gateway y
 * las intenciones llevan un sufijo propio, así que cada corrida es
 * independiente, y las transacciones quedan como en producción (su historial
 * de auditoría impide borrarlas por FK).
 */
export function fixturePagos(ctx: () => TestContext, etiqueta: string) {
  const http = () => request(ctx().app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const gatewayId = randomUUID();
  let intenciones = 0;
  let referencias = 0;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx().orm.em.fork().getConnection().execute<T[]>(query, params);

  return {
    http,
    sql,
    gatewayId,

    /** Referencia única de gateway para esta corrida. */
    ref(): string {
      return `${etiqueta}-${sufijo}-${referencias++}`;
    },

    /** Alta del gateway del fixture; va en `beforeAll`. */
    async crearGateway(): Promise<void> {
      // No hay concepto de "tipo de gateway" en el catálogo: se usan conceptos
      // existentes sólo para satisfacer las FK.
      await sql(
        `insert into payments.payment_gateways
           (id, code, name, gateway_type_concept_id, state_concept_id,
            created_at, updated_at, created_by_user_id)
         values (?, ?, ?, ?, ?, now(), now(), ?)`,
        [
          gatewayId,
          `${etiqueta.toUpperCase()}-${sufijo}`,
          `Gateway de prueba ${etiqueta} ${sufijo}`,
          CONCEPTS.FEE_TYPE_GATEWAY,
          CONCEPTS.STATE_ACTIVE,
          TEST_ADMIN_ID,
        ],
      );
    },

    /** Intención con riesgo aprobado, lista para cobrar. */
    async intencion(amount: string): Promise<string> {
      const intent = await http()
        .post('/payments/intents')
        .set(bearer(ctx().adminToken))
        .send({
          tenantId: SEED.tenantId,
          gatewayId,
          amount,
          currency: 'BOB',
          purpose: 'OTHER',
          idempotencyKey: `${etiqueta}-${sufijo}-${intenciones++}`,
        })
        .expect(201);
      const id = intent.body.id as string;
      await http()
        .post(`/payments/intents/${id}/risk-assessment`)
        .set(bearer(ctx().adminToken))
        .send({ riskScore: '10', decision: 'APPROVE' })
        .expect(201);
      return id;
    },

    operar(
      intentId: string,
      operation: 'AUTHORIZE' | 'CAPTURE' | 'SALE',
      ref: string,
      amount?: string,
    ) {
      return http()
        .post(`/payments/intents/${intentId}/transactions`)
        .set(bearer(ctx().adminToken))
        .send({ operation, gatewayTransactionRef: ref, amount });
    },

    /** Callback firmado como lo haría el proveedor. */
    callback(ref: string, outcome: 'AUTHORIZED' | 'CAPTURED' | 'FAILED') {
      const body = { gatewayTransactionRef: ref, outcome };
      const signature = signPayload(
        deriveWebhookSecret('payments-gateway', gatewayId),
        canonicalJson({ ...body, authorizationCode: undefined }),
      );
      return http()
        .post(`/payments/callbacks/${etiqueta}`)
        .send({ ...body, signature });
    },

    reembolsar(transactionId: string, amount: string) {
      return http()
        .post(`/payments/transactions/${transactionId}/refunds`)
        .set(bearer(ctx().adminToken))
        .send({ amount });
    },

    async transacciones(intentId: string) {
      return sql<{
        id: string;
        status_concept_id: string;
        amount: string;
        gateway_transaction_ref: string;
      }>(
        `select id, status_concept_id, amount::text as amount, gateway_transaction_ref
           from payments.payment_transactions
          where payment_intent_id = ? order by created_at`,
        [intentId],
      );
    },

    async estadoTransaccion(ref: string): Promise<string> {
      const [row] = await sql<{ status_concept_id: string }>(
        'select status_concept_id from payments.payment_transactions where gateway_transaction_ref = ?',
        [ref],
      );
      return row.status_concept_id;
    },

    async estadoIntencion(intentId: string): Promise<string> {
      const [row] = await sql<{ status_concept_id: string }>(
        'select status_concept_id from payments.payment_intents where id = ?',
        [intentId],
      );
      return row.status_concept_id;
    },
  };
}
