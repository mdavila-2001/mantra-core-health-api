import { bootstrapTestApp, type TestContext } from '../harness';
import { CONCEPTS } from '../../../src/common';
import { fixturePagos } from './payments-fixture';

/**
 * MCH-011 · callbacks auténticos entregados fuera de orden.
 *
 * La unitaria cubre la máquina de estados con un repositorio simulado; acá se
 * prueba por HTTP con la firma real del proveedor y se lee la base, porque lo
 * que importa no es el código de respuesta sino qué quedó escrito: un 200 que
 * igual hizo retroceder la transacción sería el defecto original.
 */
describe('MCH-011 · callbacks fuera de orden no hacen retroceder estados (integración)', () => {
  let ctx: TestContext;
  const f = fixturePagos(() => ctx, 'mch011');

  async function eventos(intentId: string) {
    return f.sql<{ event_type: string; processed: boolean }>(
      `select event_type, processed
         from payments.payment_webhook_events
        where related_intent_id = ? order by recorded_at`,
      [intentId],
    );
  }

  /** Intención cobrada y confirmada por el proveedor. */
  async function intencionCapturada() {
    const intentId = await f.intencion('150.00');
    const ref = f.ref();
    await f.operar(intentId, 'SALE', ref).expect(201);
    await f.callback(ref, 'CAPTURED').expect(200);
    expect(await f.estadoTransaccion(ref)).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);
    return { intentId, ref };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await f.crearGateway();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · un AUTHORIZED atrasado no revierte el cobro ni la intención', async () => {
    const { intentId, ref } = await intencionCapturada();

    const res = await f.callback(ref, 'AUTHORIZED').expect(200);
    expect(res.body.applied).toBe(false);
    expect(res.body.decision).toBe('obsoleto');

    expect(await f.estadoTransaccion(ref)).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);
  });

  it('AC01/AC03 · un FAILED tardío no marca fallido el cobro y queda para conciliar', async () => {
    const { intentId, ref } = await intencionCapturada();

    const res = await f.callback(ref, 'FAILED').expect(200);
    expect(res.body.applied).toBe(false);
    expect(res.body.decision).toBe('contradiccion');
    expect(res.body.reconciliationRequired).toBe(true);

    expect(await f.estadoTransaccion(ref)).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);

    // La contradicción queda archivada sin procesar: es la cola de conciliación,
    // no un evento perdido.
    const archivados = await eventos(intentId);
    expect(archivados).toEqual([
      { event_type: 'payments.callback.CAPTURED', processed: true },
      { event_type: 'payments.callback.FAILED', processed: false },
    ]);
  });

  it('AC02 · las permutaciones de los mismos eventos dejan el mismo estado final', async () => {
    const enOrden = await f.intencion('150.00');
    const refA = f.ref();
    await f.operar(enOrden, 'AUTHORIZE', refA).expect(201);
    await f.callback(refA, 'AUTHORIZED').expect(200);
    await f.callback(refA, 'CAPTURED').expect(200);

    const permutado = await f.intencion('150.00');
    const refB = f.ref();
    await f.operar(permutado, 'AUTHORIZE', refB).expect(201);
    await f.callback(refB, 'CAPTURED').expect(200);
    await f.callback(refB, 'AUTHORIZED').expect(200);

    expect(await f.estadoTransaccion(refB)).toBe(
      await f.estadoTransaccion(refA),
    );
    expect(await f.estadoTransaccion(refB)).toBe(CONCEPTS.TXN_CAPTURED);
    expect(await f.estadoIntencion(permutado)).toBe(
      await f.estadoIntencion(enOrden),
    );
  });

  it('la reentrega exacta se acusa como duplicada y no archiva el hecho dos veces', async () => {
    const { intentId, ref } = await intencionCapturada();

    const res = await f.callback(ref, 'CAPTURED').expect(200);
    expect(res.body.duplicate).toBe(true);
    expect(res.body.applied).toBe(false);

    expect(await eventos(intentId)).toHaveLength(1);
  });
});
