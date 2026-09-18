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
 * MCH-019 · el secreto del webhook sale de la conexión configurada, contra
 * PostgreSQL.
 *
 * Las pruebas unitarias del servicio simulan el `EntityManager`, así que no
 * ejercen lo que aquí importa: que la intención guarde realmente su
 * `gateway_connection_id`, que la fila de `gateway_connections` exista y que su
 * `webhook_secret_ref` llegue al verificador. Un mock que devuelve la conexión
 * correcta no prueba nada de eso.
 *
 * Se observa el estado en la base, no sólo el código HTTP: un callback
 * rechazado no debe dejar la transacción en CAPTURED.
 *
 * Referencias: la columna guarda `env:WEBHOOK_SECRET_*`, nunca la clave. Las
 * variables se definen antes de arrancar la app porque el resolvedor lee el
 * entorno del proceso (en despliegue, alimentado por el gestor de secretos).
 */
const SECRETO_A = 'secreto-de-la-conexion-A-para-mch019-int';
const SECRETO_B = 'secreto-de-la-conexion-B-para-mch019-int';
const SECRETO_A_V2 = 'secreto-rotado-de-la-conexion-A-mch019-int';
process.env.WEBHOOK_SECRET_MCH019_A = SECRETO_A;
process.env.WEBHOOK_SECRET_MCH019_A_V2 = SECRETO_A_V2;
process.env.WEBHOOK_SECRET_MCH019_B = SECRETO_B;

describe('MCH-019 · el callback se verifica con el secreto de la conexión (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const gatewayId = randomUUID();
  /** Conexión con secreto propio. */
  const connA = randomUUID();
  /** Otra conexión del mismo gateway, con otro secreto. */
  const connB = randomUUID();
  /** Conexión sin `webhook_secret_ref`: no puede validar nada. */
  const connSinRef = randomUUID();
  let intentes = 0;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  /** Crea una intención aprobada apuntando a la conexión indicada. */
  async function intencionAprobada(
    gatewayConnectionId: string | undefined,
  ): Promise<string> {
    const intent = await http()
      .post('/payments/intents')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: SEED.tenantId,
        gatewayId,
        ...(gatewayConnectionId ? { gatewayConnectionId } : {}),
        amount: '120.00',
        currency: 'BOB',
        purpose: 'OTHER',
        idempotencyKey: `mch019-${sufijo}-${intentes++}`,
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

  /** Deja una transacción PROCESSING esperando el callback del proveedor. */
  async function transaccionEnEspera(
    gatewayConnectionId: string | undefined,
  ): Promise<{ intentId: string; ref: string }> {
    const intentId = await intencionAprobada(gatewayConnectionId);
    const ref = `mch019-${sufijo}-${intentes}-${randomUUID().slice(0, 8)}`;
    await http()
      .post(`/payments/intents/${intentId}/transactions`)
      .set(bearer(ctx.adminToken))
      .send({ operation: 'SALE', gatewayTransactionRef: ref })
      .expect(201);
    return { intentId, ref };
  }

  /** Envía el callback firmado con el secreto dado. */
  function callback(ref: string, secret: string) {
    const body = { gatewayTransactionRef: ref, outcome: 'CAPTURED' as const };
    return http()
      .post('/payments/callbacks/mch019')
      .send({
        ...body,
        signature: signPayload(
          secret,
          canonicalJson({ ...body, authorizationCode: undefined }),
        ),
      });
  }

  async function estadoTransaccion(intentId: string): Promise<string> {
    const [row] = await sql<{ status_concept_id: string }>(
      `select status_concept_id from payments.payment_transactions
        where payment_intent_id = ? order by created_at limit 1`,
      [intentId],
    );
    return row.status_concept_id;
  }

  async function estadoIntencion(intentId: string): Promise<string> {
    const [row] = await sql<{ status_concept_id: string }>(
      'select status_concept_id from payments.payment_intents where id = ?',
      [intentId],
    );
    return row.status_concept_id;
  }

  async function crearConexion(
    id: string,
    webhookSecretRef: string | null,
  ): Promise<void> {
    await sql(
      `insert into payments.gateway_connections
         (id, gateway_id, tenant_id, environment_concept_id, merchant_ref,
          webhook_secret_ref, state_concept_id, created_at, updated_at,
          created_by_user_id, row_version)
       values (?, ?, ?, ?, ?, ?, ?, now(), now(), ?, 1)`,
      [
        id,
        gatewayId,
        SEED.tenantId,
        CONCEPTS.QA_ENV_DEV,
        `MCH019-${sufijo}-${id.slice(0, 4)}`,
        webhookSecretRef,
        CONCEPTS.STATE_ACTIVE,
        TEST_ADMIN_ID,
      ],
    );
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
        `MCH019-${sufijo}`,
        `Gateway de prueba MCH-019 ${sufijo}`,
        CONCEPTS.FEE_TYPE_GATEWAY,
        CONCEPTS.STATE_ACTIVE,
        TEST_ADMIN_ID,
      ],
    );
    await crearConexion(connA, 'env:WEBHOOK_SECRET_MCH019_A');
    await crearConexion(connB, 'env:WEBHOOK_SECRET_MCH019_B');
    await crearConexion(connSinRef, null);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · la firma hecha con el secreto de la conexión aplica el resultado', async () => {
    const { intentId, ref } = await transaccionEnEspera(connA);

    const res = await callback(ref, SECRETO_A).expect(200);

    expect(res.body.duplicate).toBe(false);
    expect(await estadoTransaccion(intentId)).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);
  });

  it('AC03 · la firma de otra conexión del mismo gateway no autoriza la transacción', async () => {
    const { intentId, ref } = await transaccionEnEspera(connA);

    await callback(ref, SECRETO_B).expect(401);

    expect(await estadoTransaccion(intentId)).toBe(CONCEPTS.TXN_PROCESSING);
    expect(await estadoIntencion(intentId)).toBe(CONCEPTS.PI_PROCESSING);
  });

  it('el esquema derivado por gateway ya no autoriza nada (MCH-019)', async () => {
    const { intentId, ref } = await transaccionEnEspera(connA);

    await callback(
      ref,
      deriveWebhookSecret('payments-gateway', gatewayId),
    ).expect(401);

    expect(await estadoTransaccion(intentId)).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('fail-closed · una conexión sin webhook_secret_ref rechaza el callback', async () => {
    const { intentId, ref } = await transaccionEnEspera(connSinRef);

    await callback(ref, SECRETO_A).expect(401);
    await callback(
      ref,
      deriveWebhookSecret('payments-gateway', gatewayId),
    ).expect(401);

    expect(await estadoTransaccion(intentId)).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('fail-closed · una intención sin conexión rechaza el callback', async () => {
    const { intentId, ref } = await transaccionEnEspera(undefined);

    await callback(ref, SECRETO_A).expect(401);

    expect(await estadoTransaccion(intentId)).toBe(CONCEPTS.TXN_PROCESSING);
  });

  it('AC02 · rotar el secreto de una conexión no afecta a las demás', async () => {
    // conn-A entra en ventana de rotación: valen la nueva y la vieja.
    await sql(
      `update payments.gateway_connections set webhook_secret_ref = ?
        where id = ?`,
      ['env:WEBHOOK_SECRET_MCH019_A_V2,env:WEBHOOK_SECRET_MCH019_A', connA],
    );
    const enVentana = await transaccionEnEspera(connA);
    await callback(enVentana.ref, SECRETO_A_V2).expect(200);
    expect(await estadoTransaccion(enVentana.intentId)).toBe(
      CONCEPTS.TXN_CAPTURED,
    );

    // Cerrada la ventana, la versión anterior deja de valer.
    await sql(
      `update payments.gateway_connections set webhook_secret_ref = ?
        where id = ?`,
      ['env:WEBHOOK_SECRET_MCH019_A_V2', connA],
    );
    const rotada = await transaccionEnEspera(connA);
    await callback(rotada.ref, SECRETO_A).expect(401);
    expect(await estadoTransaccion(rotada.intentId)).toBe(
      CONCEPTS.TXN_PROCESSING,
    );

    // conn-B nunca se tocó: sigue aceptando su propio secreto.
    const otra = await transaccionEnEspera(connB);
    await callback(otra.ref, SECRETO_B).expect(200);
    expect(await estadoTransaccion(otra.intentId)).toBe(CONCEPTS.TXN_CAPTURED);
  });
});
