import { bootstrapTestApp, type TestContext } from '../harness';
import { CONCEPTS } from '../../../src/common';
import { fixturePagos } from './payments-fixture';

/**
 * MCH-036 · un importe parcial no cierra la intención completa.
 *
 * El saldo se deriva de las filas de `payments.payment_transactions`, así que la
 * unitaria con repositorio simulado no lo ejerce: acá se cobra por HTTP y se lee
 * la base, porque lo que importa es qué estado quedó escrito en la intención.
 */
describe('MCH-036 · el estado de la intención deriva de lo capturado (integración)', () => {
  let ctx: TestContext;
  const f = fixturePagos(() => ctx, 'mch036');

  /** Cobra `amount` y lo confirma con el callback firmado del proveedor. */
  async function cobrar(intentId: string, amount: string) {
    const ref = f.ref();
    await f.operar(intentId, 'SALE', ref, amount).expect(201);
    await f.callback(ref, 'CAPTURED').expect(200);
    return ref;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await f.crearGateway();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01/AC02 · 40 sobre 100 no satisface; +60 sí; el excedente se rechaza', async () => {
    const intentId = await f.intencion('100.00');

    await cobrar(intentId, '40.00');
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_PROCESSING);

    // Excede el saldo de 60: ni siquiera se registra la solicitud.
    await f.operar(intentId, 'SALE', f.ref(), '60.01').expect(409);
    expect(await f.transacciones(intentId)).toHaveLength(1);

    await cobrar(intentId, '60.00');
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);

    // Una captura más sobre una intención ya satisfecha no procede.
    await f.operar(intentId, 'SALE', f.ref(), '1.00').expect(409);
    expect(await f.transacciones(intentId)).toHaveLength(2);
  });

  it('AC03 · la reentrega del mismo callback no acumula dos veces', async () => {
    const intentId = await f.intencion('100.00');
    const ref = await cobrar(intentId, '40.00');

    const res = await f.callback(ref, 'CAPTURED').expect(200);
    expect(res.body.duplicate).toBe(true);

    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_PROCESSING);
    await f.operar(intentId, 'SALE', f.ref(), '60.01').expect(409);
  });

  it('sin importe explícito se cobra el saldo pendiente, no el total', async () => {
    const intentId = await f.intencion('100.00');
    await cobrar(intentId, '40.00');

    const ref = f.ref();
    const res = await f.operar(intentId, 'SALE', ref).expect(201);
    expect(res.body.amount).toBe('60.00');

    await f.callback(ref, 'CAPTURED').expect(200);
    expect(await f.estadoIntencion(intentId)).toBe(CONCEPTS.PI_SUCCEEDED);
  });

  it('una captura no puede exceder el importe autorizado', async () => {
    const intentId = await f.intencion('100.00');
    const ref = f.ref();
    await f.operar(intentId, 'AUTHORIZE', ref, '40.00').expect(201);
    await f.callback(ref, 'AUTHORIZED').expect(200);

    await f.operar(intentId, 'CAPTURE', f.ref(), '40.01').expect(409);
    expect(await f.transacciones(intentId)).toHaveLength(1);

    await f.operar(intentId, 'CAPTURE', f.ref(), '40.00').expect(201);
  });
});
