import { bootstrapTestApp, type TestContext } from '../harness';
import { CONCEPTS } from '../../../src/common';
import { fixturePagos } from './payments-fixture';

/**
 * MCH-017 · el tope de reembolsos con importes que vuelven de PostgreSQL.
 *
 * La unitaria cubre la aritmética; acá se prueba con los `numeric` tal como los
 * devuelve la base, y se lee la tabla para confirmar qué filas quedaron: un
 * 409 que igual dejó la fila sería peor que el defecto original.
 */
describe('MCH-017 · reembolsos con importes decimales exactos (integración)', () => {
  let ctx: TestContext;
  const f = fixturePagos(() => ctx, 'mch017');

  async function reembolsos(transactionId: string) {
    return f.sql<{ amount: string }>(
      'select amount::text as amount from payments.refunds where payment_transaction_id = ? order by created_at',
      [transactionId],
    );
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await f.crearGateway();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01/AC02 · capturado 0.30: acepta 0.10 + 0.20 y rechaza un centavo más', async () => {
    const intentId = await f.intencion('0.30');
    const ref = f.ref();
    await f.operar(intentId, 'SALE', ref).expect(201);
    await f.callback(ref, 'CAPTURED').expect(200);
    const [txn] = await f.transacciones(intentId);
    expect(txn.status_concept_id).toBe(CONCEPTS.TXN_CAPTURED);

    await f.reembolsar(txn.id, '0.10').expect(201);
    await f.reembolsar(txn.id, '0.20').expect(201);
    await f.reembolsar(txn.id, '0.01').expect(409);

    const filas = await reembolsos(txn.id);
    expect(filas.map((r) => Number(r.amount).toFixed(2))).toEqual([
      '0.10',
      '0.20',
    ]);
  });

  it('AC03 · muchas devoluciones chicas cierran justo en el capturado', async () => {
    const intentId = await f.intencion('2.00');
    const ref = f.ref();
    await f.operar(intentId, 'SALE', ref).expect(201);
    await f.callback(ref, 'CAPTURED').expect(200);
    const [txn] = await f.transacciones(intentId);

    // Con `Number`, la vigésima devolución de 0.10 daba 2.0000000000000004.
    for (let i = 0; i < 20; i++) {
      await f.reembolsar(txn.id, '0.10').expect(201);
    }
    await f.reembolsar(txn.id, '0.01').expect(409);
    expect(await reembolsos(txn.id)).toHaveLength(20);
  });
});
