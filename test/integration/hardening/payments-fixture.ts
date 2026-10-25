import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { TEST_ADMIN_ID, bearer, type TestContext } from '../harness';
import {
  CONCEPTS,
  SEED,
  canonicalJson,
  signPayload,
} from '../../../src/common';

/**
 * Fixture compartido por las pruebas de pagos de F05 (MCH-011/017/036).
 *
 * Desde MCH-019 el callback se verifica con el secreto de la conexión
 * configurada en la intención (`gateway_connections.webhook_secret_ref`), sin
 * retroceso al secreto derivado por gateway: el fixture crea su conexión, la
 * referencia por `env:WEBHOOK_SECRET_*` y firma con ese secreto.
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
  const connectionId = randomUUID();
  // El resolvedor lee el entorno del proceso al verificar, así que basta con
  // definirlo antes del primer callback. Nombre: sólo [A-Z0-9_]; valor: >= 32.
  const secretEnvName = `WEBHOOK_SECRET_PAGOS_${etiqueta.toUpperCase().replace(/[^A-Z0-9]/g, '')}_${sufijo.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  const webhookSecret = `secreto-fixture-pagos-${etiqueta}-${sufijo}-${randomUUID()}`;
  process.env[secretEnvName] = webhookSecret;
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
    connectionId,

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
      await sql(
        `insert into payments.gateway_connections
           (id, gateway_id, tenant_id, environment_concept_id, merchant_ref,
            webhook_secret_ref, state_concept_id, created_at, updated_at,
            created_by_user_id, row_version)
         values (?, ?, ?, ?, ?, ?, ?, now(), now(), ?, 1)`,
        [
          connectionId,
          gatewayId,
          SEED.tenantId,
          CONCEPTS.QA_ENV_DEV,
          `${etiqueta.toUpperCase()}-${sufijo}`,
          `env:${secretEnvName}`,
          CONCEPTS.STATE_ACTIVE,
          TEST_ADMIN_ID,
        ],
      );
    },

    /** Intención con riesgo aprobado, lista para cobrar. */
    async intent(amount: string): Promise<string> {
      const intent = await http()
        .post('/payments/intents')
        .set(bearer(ctx().adminToken))
        .send({
          tenantId: SEED.tenantId,
          gatewayId,
          gatewayConnectionId: connectionId,
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
        webhookSecret,
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

    async intentState(intentId: string): Promise<string> {
      const [row] = await sql<{ status_concept_id: string }>(
        'select status_concept_id from payments.payment_intents where id = ?',
        [intentId],
      );
      return row.status_concept_id;
    },
  };
}
