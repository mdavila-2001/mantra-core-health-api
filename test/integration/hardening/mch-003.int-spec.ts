import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  type TestContext,
} from '../harness';
import {
  CONCEPTS,
  SEED,
  canonicalJson,
  deriveWebhookSecret,
  signPayload,
} from '../../../src/common';

/**
 * MCH-003 · contención de pagos sin gateway, contra PostgreSQL.
 *
 * Las pruebas unitarias del servicio usan un repositorio simulado, y el filtro
 * que evita el doble cargo vive justamente en la consulta del repositorio
 * (`findPendingByIntent`): un mock no lo ejerce. Acá se prueba por HTTP y se lee
 * la base, porque un 201 no dice nada si las filas quedaron en CAPTURED.
 *
 * No trunca ni borra: el gateway y las intenciones llevan un sufijo propio, así
 * que cada corrida es independiente. Las transacciones no se pueden borrar —su
 * historial de auditoría lo impide por FK—, igual que en producción.
 */
describe('MCH-003 · pagos sin gateway no fabrican estados (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const gatewayId = randomUUID();
  let intentes = 0;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  async function nuevaIntencionAprobada(): Promise<string> {
    const intent = await http()
      .post('/payments/intents')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: SEED.tenantId,
        gatewayId,
        amount: '150.00',
        currency: 'BOB',
        purpose: 'OTHER',
        idempotencyKey: `mch003-${sufijo}-${intentes++}`,
      })
      .expect(201);
    const id = intent.body.id as string;

    await http()
      .post(`/payments/intents/${id}/risk-assessment`)
      .set(bearer(ctx.adminToken))
      .send({ riskScore: '10', decision: 'APPROVE' })
      .expect(201);
    return id;
  }

  function operar(intentId: string, operation: string, ref: string) {
    return http()
      .post(`/payments/intents/${intentId}/transactions`)
      .set(bearer(ctx.adminToken))
      .send({ operation, gatewayTransactionRef: ref });
  }

  function callback(
    ref: string,
    outcome: 'AUTHORIZED' | 'CAPTURED' | 'FAILED',
  ) {
    const body = { gatewayTransactionRef: ref, outcome };
    const signature = signPayload(
      deriveWebhookSecret('payments-gateway', gatewayId),
      canonicalJson({ ...body, authorizationCode: undefined }),
    );
    return http()
      .post('/payments/callbacks/mch003')
      .send({ ...body, signature })
      .expect(200);
  }

  async function transacciones(intentId: string) {
    return sql<{ id: string; status_concept_id: string }>(
      'select id, status_concept_id from payments.payment_transactions where payment_intent_id = ? order by created_at',
      [intentId],
    );
  }

  async function estadoIntencion(intentId: string): Promise<string> {
    const [row] = await sql<{ status_concept_id: string }>(
      'select status_concept_id from payments.payment_intents where id = ?',
      [intentId],
    );
    return row.status_concept_id;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    // No hay concepto de "tipo de gateway" en el catálogo: se usan conceptos
    // existentes sólo para satisfacer las FK del fixture.
    await sql(
      `insert into payments.payment_gateways
         (id, code, name, gateway_type_concept_id, state_concept_id,
          created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, ?, now(), now(), ?)`,
      [
        gatewayId,
        `MCH003-${sufijo}`,
        `Gateway de prueba MCH-003 ${sufijo}`,
        CONCEPTS.FEE_TYPE_GATEWAY,
        CONCEPTS.STATE_ACTIVE,
        TEST_ADMIN_ID,
      ],
    );
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · SALE sin proveedor queda PROCESSING y la consulta no lo vuelve CAPTURED', async () => {
    const intentId = await nuevaIntencionAprobada();

    const res = await operar(intentId, 'SALE', `mch003-${sufijo}-a`).expect(
      201,
    );
    expect(res.body.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);

    const [txn] = await transacciones(intentId);
    expect(txn.status_concept_id).toBe(CONCEPTS.TXN_PROCESSING);
    expect(await estadoIntencion(intentId)).toBe(CONCEPTS.PI_PROCESSING);

    const inquiry = await http()
      .post(`/payments/transactions/${txn.id}/status-inquiry`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(inquiry.body.reconciled).toBe(false);

    const [despues] = await transacciones(intentId);
    expect(despues.status_concept_id).toBe(CONCEPTS.TXN_PROCESSING);
    expect(await estadoIntencion(intentId)).toBe(CONCEPTS.PI_PROCESSING);
  });

  it('rechaza una segunda operación mientras la primera espera al gateway, sin filas nuevas', async () => {
    const intentId = await nuevaIntencionAprobada();
    await operar(intentId, 'SALE', `mch003-${sufijo}-b1`).expect(201);

    await operar(intentId, 'SALE', `mch003-${sufijo}-b2`).expect(409);

    expect(await transacciones(intentId)).toHaveLength(1);
  });

  it('sobre una autorización confirmada sólo admite CAPTURE: SALE no duplica el cargo', async () => {
    const intentId = await nuevaIntencionAprobada();
    const ref = `mch003-${sufijo}-c1`;
    await operar(intentId, 'AUTHORIZE', ref).expect(201);
    await callback(ref, 'AUTHORIZED');

    const [autorizada] = await transacciones(intentId);
    expect(autorizada.status_concept_id).toBe(CONCEPTS.TXN_AUTHORIZED);

    await operar(intentId, 'SALE', `mch003-${sufijo}-c2`).expect(409);
    await operar(intentId, 'AUTHORIZE', `mch003-${sufijo}-c3`).expect(409);
    expect(await transacciones(intentId)).toHaveLength(1);

    await operar(intentId, 'CAPTURE', `mch003-${sufijo}-c4`).expect(201);
    const filas = await transacciones(intentId);
    expect(filas).toHaveLength(2);
    expect(filas[1].status_concept_id).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC03 · el reembolso de un cobro confirmado queda PENDING, no DONE', async () => {
    const intentId = await nuevaIntencionAprobada();
    const ref = `mch003-${sufijo}-d1`;
    await operar(intentId, 'SALE', ref).expect(201);
    await callback(ref, 'CAPTURED');

    const [capturada] = await transacciones(intentId);
    expect(capturada.status_concept_id).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);

    const refund = await http()
      .post(`/payments/transactions/${capturada.id}/refunds`)
      .set(bearer(ctx.adminToken))
      .send({ amount: '50.00' })
      .expect(201);
    expect(refund.body.statusConceptId).toBe(CONCEPTS.REFUND_PENDING);

    const [fila] = await sql<{
      status_concept_id: string;
      processed_at: Date | null;
    }>(
      'select status_concept_id, processed_at from payments.refunds where id = ?',
      [refund.body.id],
    );
    expect(fila.status_concept_id).toBe(CONCEPTS.REFUND_PENDING);
    expect(fila.processed_at).toBeNull();

    // El pendiente compromete saldo: no se puede pedir más de lo que queda.
    await http()
      .post(`/payments/transactions/${capturada.id}/refunds`)
      .set(bearer(ctx.adminToken))
      .send({ amount: '100.01' })
      .expect(409);
  });
});
