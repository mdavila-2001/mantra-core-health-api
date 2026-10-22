import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED } from '../../../src/common';
import { ACCT } from '../../../src/modules/accounting/accounting.concepts';

/**
 * MCH-018 · la clasificación contable deja de ser un cambio de estado.
 *
 * La unitaria cubre el motor de reglas; acá se comprueba lo que queda escrito en
 * `accounting.journal_transactions`, porque el problema era justamente la
 * semántica visible de una fila: un asiento marcado AUTO_CLASSIFIED sin que
 * ninguna regla se hubiera evaluado.
 *
 * No trunca ni borra: la práctica y las cuentas llevan un sufijo propio, así que
 * cada corrida es independiente.
 */
describe('MCH-018 · sin reglas no hay auto-clasificación (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);
  const sufijo = randomUUID().slice(0, 8);
  const anio = new Date().getFullYear();

  let practiceId = '';
  let cuentaDebito = '';
  let cuentaCredito = '';
  let numero = 0;

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  async function borrador(sourceDocumentType?: string): Promise<string> {
    const res = await http()
      .post('/accounting/journal-transactions/drafts')
      .set(auth())
      .send({
        practiceId,
        transactionDate: `${anio}-01-15`,
        description: `MCH-018 ${sufijo}-${numero++}`,
        sourceDocumentType,
        lines: [
          { accountId: cuentaDebito, direction: 'DEBIT', amount: '100.00' },
          { accountId: cuentaCredito, direction: 'CREDIT', amount: '100.00' },
        ],
      })
      .expect(201);
    return res.body.id as string;
  }

  async function fila(id: string) {
    const [row] = await sql<{
      status_concept_id: string;
      transaction_type_concept_id: string;
    }>(
      `select status_concept_id, transaction_type_concept_id
         from accounting.journal_transactions where id = ?`,
      [id],
    );
    return row;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const practica = await http()
      .post('/practices')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        code: `MCH018-${sufijo}`,
        name: `Práctica MCH-018 ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practiceId = practica.body.id;

    const crearCuenta = async (code: string, name: string) => {
      const res = await http()
        .post('/accounting/accounts')
        .set(auth())
        .send({
          practiceId,
          code,
          name,
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
        })
        .expect(201);
      return res.body.id as string;
    };
    cuentaDebito = await crearCuenta('1.1.01', 'Caja MCH-018');
    cuentaCredito = await crearCuenta('1.1.02', 'Clientes MCH-018');
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · un asiento sin regla aplicable no queda marcado auto-clasificado', async () => {
    const id = await borrador('ORIGEN_SIN_REGLA');

    const res = await http()
      .post(`/accounting/journal-transactions/${id}/classify`)
      .set(auth())
      .send({})
      .expect(200);

    expect(res.body.status).toBe(ACCT.TXN_PENDING_REVIEW);
    expect(res.body.classification.decision).toBe('SIN_REGLA');
    expect((await fila(id)).status_concept_id).toBe(ACCT.TXN_PENDING_REVIEW);
  });

  it('AC02 · sin documento origen va a revisión y no inventa el tipo de asiento', async () => {
    const id = await borrador();
    const antes = await fila(id);

    const res = await http()
      .post(`/accounting/journal-transactions/${id}/classify`)
      .set(auth())
      .send({})
      .expect(200);

    expect(res.body.classification.decision).toBe('SIN_REGLA');
    const despues = await fila(id);
    expect(despues.status_concept_id).toBe(ACCT.TXN_PENDING_REVIEW);
    expect(despues.transaction_type_concept_id).toBe(
      antes.transaction_type_concept_id,
    );
  });

  it('con regla aplicable clasifica, imputa el tipo y registra la evidencia', async () => {
    const id = await borrador('GATEWAY_SETTLEMENT');

    const res = await http()
      .post(`/accounting/journal-transactions/${id}/classify`)
      .set(auth())
      .send({})
      .expect(200);

    expect(res.body.status).toBe(ACCT.TXN_AUTO_CLASSIFIED);
    expect(res.body.classification).toMatchObject({
      decision: 'CLASIFICADA',
      ruleId: 'GATEWAY_SETTLEMENT',
      rulesetVersion: 'acct-classif-v1',
    });

    const fin = await fila(id);
    expect(fin.status_concept_id).toBe(ACCT.TXN_AUTO_CLASSIFIED);
    expect(fin.transaction_type_concept_id).toBe(ACCT.TXN_TYPE_CLEARING);
  });

  it('no se puede saltar la clasificación enviando el borrador a revisión', async () => {
    const id = await borrador('INVOICE');

    await http()
      .post(`/accounting/journal-transactions/${id}/submit-review`)
      .set(auth())
      .send({})
      .expect(422);

    expect((await fila(id)).status_concept_id).toBe(ACCT.TXN_DRAFT);
  });
});
