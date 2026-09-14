import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED, CONCEPTS, createdBy } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { ACCT } from '../../src/modules/accounting/accounting.concepts';
import {
  SubledgerAccounts,
  CostCenters,
} from '../../src/modules/accounting/entities';

/**
 * FX-14 · las seis lecturas del cockpit contable (subtarea 6.3), ejercidas de
 * punta a punta contra la aplicación y la base reales.
 *
 * El módulo tenía veinte escrituras y ninguna proyección agregada: se podía
 * postear un ejercicio, un asiento, un activo o un devengo, y no había forma
 * de verlos juntos. Cada caso siembra con los `POST` reales del módulo y
 * vuelve a leer con las seis rutas nuevas.
 *
 * Dos filas no tienen ruta de alta y se siembran por el `EntityManager` del
 * arnés (precedente `insurance-plan-administration.int-spec.ts`): el
 * subledger de cliente (ninguna ruta crea `accounting.subledger_accounts`) y
 * el centro de coste (ninguna ruta crea `accounting.cost_centers`, hallazgo
 * de esta misma tarjeta). El `ledger_entry_id` de la cuenta de reconciliación
 * se lee con un `select` directo, molde `fx13-encuentro-en-la-reserva`.
 */
describe('FX-14 · el cockpit contable (6.3)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);
  const tenantHeader = () => ({ 'X-Tenant-Id': SEED.tenantId });

  const sufijo = randomUUID().slice(0, 8);
  const anio = new Date().getFullYear();

  let practiceId = '';
  let otraPracticeId = '';
  let cuentaClientesId = '';
  let cuentaCajaId = '';
  let cuentaGastoId = '';
  let cuentaDevengoId = '';
  let cuentaAdquisicionActivoId = '';
  let costCenterId = '';
  let fiscalYearId = '';
  let currentPeriodId = '';
  let periodIds: string[] = [];
  let transactionId = '';
  let reversalId = '';
  let assetId = '';
  let accrualObjectId = '';
  let subledgerAccountId = '';
  let openItemId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const practica = await http()
      .post('/practices')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        code: `FX14-PRACT-${sufijo}`,
        name: `Práctica FX-14 ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practiceId = practica.body.id;

    // Un tenant genuinamente distinto (D-1: el corte 403 compara tenants, no
    // ids de práctica), con su propia práctica.
    const otraOrg = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `FX14_ORG_${sufijo.toUpperCase()}`,
          legalName: `Otra organización FX-14 ${sufijo}`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `fx14-owner-${sufijo}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Otra',
          lastName: 'Organización',
        },
      })
      .expect(201);
    const otroTenantId = otraOrg.body.tenantId as string;

    const otraPractica = await http()
      .post('/practices')
      .set(auth())
      .set('X-Tenant-Id', otroTenantId)
      .send({
        tenantId: otroTenantId,
        code: `FX14-OTRA-${sufijo}`,
        name: `Otra práctica FX-14 ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    otraPracticeId = otraPractica.body.id;

    // Plan de cuentas mínimo: clientes (activo, débito), caja (activo,
    // débito), gasto y devengo (para el objeto de devengo) y adquisición de
    // activo.
    const crearCuenta = async (code: string, name: string, type: string) => {
      const res = await http()
        .post('/accounting/accounts')
        .set(auth())
        .send({
          practiceId,
          code,
          name,
          accountType: type,
          normalBalance: type === 'REVENUE' ? 'CREDIT' : 'DEBIT',
        })
        .expect(201);
      return res.body.id as string;
    };
    cuentaClientesId = await crearCuenta('1.1.01', 'Clientes', 'ASSET');
    cuentaCajaId = await crearCuenta('1.1.02', 'Caja', 'ASSET');
    cuentaGastoId = await crearCuenta('5.1.01', 'Gasto operativo', 'EXPENSE');
    cuentaDevengoId = await crearCuenta(
      '2.1.01',
      'Devengos por pagar',
      'LIABILITY',
    );
    cuentaAdquisicionActivoId = await crearCuenta(
      '1.2.01',
      'Equipo médico',
      'ASSET',
    );

    // Ejercicio fiscal vigente, con dos periodos que cubren el año completo.
    const ejercicio = await http()
      .post('/accounting/fiscal-years')
      .set(auth())
      .send({
        practiceId,
        code: `${anio}`,
        startDate: `${anio}-01-01`,
        endDate: `${anio}-12-31`,
        periods: [
          {
            code: `${anio}-S1`,
            startDate: `${anio}-01-01`,
            endDate: `${anio}-06-30`,
          },
          {
            code: `${anio}-S2`,
            startDate: `${anio}-07-01`,
            endDate: `${anio}-12-31`,
          },
        ],
      })
      .expect(201);
    fiscalYearId = ejercicio.body.id;
    periodIds = ejercicio.body.periodIds;
    const hoyMes = new Date().getUTCMonth();
    currentPeriodId = hoyMes < 6 ? periodIds[0] : periodIds[1];

    // Centro de coste: ninguna ruta lo crea (hallazgo de esta tarjeta).
    const em = ctx.orm.em.fork();
    const cc = em.create(
      CostCenters,
      {
        practiceId,
        code: `CC-${sufijo}`,
        name: 'Consulta externa',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    costCenterId = cc.id;

    // Asiento posteado con imputación al centro de coste, para dimensions.
    const asiento = await http()
      .post('/accounting/journal-transactions')
      .set(auth())
      .send({
        practiceId,
        transactionDate: `${anio}-01-15`,
        fiscalPeriodId: periodIds[0],
        description: 'Cobro de consulta FX-14',
        lines: [
          {
            accountId: cuentaCajaId,
            direction: 'DEBIT',
            amount: '500.00',
            costCenterId,
          },
          {
            accountId: cuentaClientesId,
            direction: 'CREDIT',
            amount: '500.00',
            costCenterId,
          },
        ],
      })
      .expect(201);
    transactionId = asiento.body.id;

    const reversa = await http()
      .post(`/accounting/journal-transactions/${transactionId}/reverse`)
      .set(auth())
      .send({ reason: 'Ajuste FX-14' })
      .expect(201);
    reversalId = reversa.body.id;

    // Activo depreciable.
    const activo = await http()
      .post('/accounting/assets/capitalize')
      .set(auth())
      .send({
        practiceId,
        code: `A-${sufijo}`,
        name: 'Ecógrafo',
        acquisitionAccountId: cuentaAdquisicionActivoId,
        offsetAccountId: cuentaCajaId,
        acquisitionCost: '12000.00',
        acquisitionDate: `${anio}-01-01`,
        usefulLifeMonths: 60,
        salvageValue: '0.00',
      })
      .expect(201);
    assetId = activo.body.id;

    // Devengo con dos cuotas.
    const devengo = await http()
      .post('/accounting/accrual-objects')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        objectNumber: `ACR-${sufijo}`,
        expenseAccountId: cuentaGastoId,
        accrualAccountId: cuentaDevengoId,
        totalAmount: '200.00',
        schedule: [
          { fiscalPeriodId: periodIds[0], plannedAmount: '100.00' },
          { fiscalPeriodId: periodIds[1], plannedAmount: '100.00' },
        ],
      })
      .expect(201);
    accrualObjectId = devengo.body.id;

    // Subledger de cliente + partida abierta: ninguna ruta crea el subledger
    // (D-12), así que nace por `EntityManager`.
    const partner = await http()
      .post('/erp/business-partners')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        partnerNumber: `BP-${sufijo}`,
        category: 'CUSTOMER',
        displayName: 'Paciente particular FX-14',
      })
      .expect(201);
    const businessPartnerId = partner.body.id as string;

    const sl = em.create(
      SubledgerAccounts,
      {
        tenantId: SEED.tenantId,
        businessPartnerId,
        subledgerRoleConceptId: ACCT.SUBLEDGER_CUSTOMER,
        reconciliationAccountId: cuentaClientesId,
        statusConceptId: ACCT.SUBLEDGER_ACTIVE,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    subledgerAccountId = sl.id;

    const ledgerEntry = await em.getConnection().execute<{ id: string }[]>(
      `select id from accounting.ledger_entries
          where transaction_id = ? and account_id = ? limit 1`,
      [transactionId, cuentaClientesId],
    );
    const ledgerEntryId = ledgerEntry[0]?.id ?? '';

    const partida = await http()
      .post('/accounting/open-items')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        subledgerAccountId,
        ledgerEntryId,
        documentType: 'INVOICE',
        documentNumber: `FAC-${sufijo}`,
        dueDate: `${anio}-01-01`,
        originalAmount: '500.00',
      })
      .expect(201);
    openItemId = partida.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('fiscal-years: 200 con los períodos y el vigente', async () => {
    const res = await http()
      .get('/accounting/fiscal-years')
      .query({ practiceId })
      .set(auth())
      .set(tenantHeader())
      .expect(200);

    expect(res.body.fiscalYearId).toBe(fiscalYearId);
    expect(res.body.periods).toHaveLength(2);
    expect(res.body.currentPeriodId).toBe(currentPeriodId);
    expect('closedAt' in res.body.periods[0]).toBe(false);
  });

  it('open-items: 200 con la partida, los cinco tramos y los totales', async () => {
    const res = await http()
      .get('/accounting/open-items')
      .query({ practiceId })
      .set(auth())
      .set(tenantHeader())
      .expect(200);

    expect(res.body.aging).toHaveLength(5);
    const partida = res.body.items.find(
      (i: { id: string }) => i.id === openItemId,
    );
    expect(partida).toBeDefined();
    expect(partida.side).toBe('RECEIVABLE');
    expect(Number(res.body.totalReceivable)).toBeGreaterThanOrEqual(500);
  });

  it('dimensions: 200 con el centro de coste imputado y SEGMENT en 0.00', async () => {
    const res = await http()
      .get('/accounting/dimensions')
      .query({ practiceId })
      .set(auth())
      .set(tenantHeader())
      .expect(200);

    const cc = res.body.items.find(
      (i: { id: string }) => i.id === costCenterId,
    );
    expect(cc).toBeDefined();
    expect(cc.kind).toBe('COST_CENTER');
    expect(Number(cc.debit)).toBeGreaterThan(0);
    const segmentos = res.body.items.filter(
      (i: { kind: string }) => i.kind === 'SEGMENT',
    );
    expect(
      segmentos.every((s: { result: string }) => s.result === '0.00'),
    ).toBe(true);
  });

  it('document-flow: el original trae ACTUAL + REVERSION, la reversa trae ORIGEN + ACTUAL', async () => {
    const original = await http()
      .get(`/accounting/journal-transactions/${transactionId}/document-flow`)
      .set(auth())
      .set(tenantHeader())
      .expect(200);
    expect(original.body.items.map((i: { role: string }) => i.role)).toEqual([
      'ACTUAL',
      'REVERSION',
    ]);

    const reversa = await http()
      .get(`/accounting/journal-transactions/${reversalId}/document-flow`)
      .set(auth())
      .set(tenantHeader())
      .expect(200);
    expect(reversa.body.items.map((i: { role: string }) => i.role)).toEqual([
      'ORIGEN',
      'ACTUAL',
    ]);
  });

  it('assets: 200 con la cuota mensual y la carga total', async () => {
    const res = await http()
      .get('/accounting/assets')
      .query({ practiceId })
      .set(auth())
      .set(tenantHeader())
      .expect(200);

    const activo = res.body.items.find((i: { id: string }) => i.id === assetId);
    expect(activo).toBeDefined();
    expect(activo.monthlyDepreciation).toBe('200.00');
    expect(Number(res.body.monthlyCharge)).toBeGreaterThanOrEqual(200);
  });

  it('accrual-objects: 200 con el avance del cronograma', async () => {
    const res = await http()
      .get('/accounting/accrual-objects')
      .query({ practiceId })
      .set(auth())
      .set(tenantHeader())
      .expect(200);

    const objeto = res.body.items.find(
      (i: { id: string }) => i.id === accrualObjectId,
    );
    expect(objeto).toBeDefined();
    expect(objeto.periods).toBe(2);
    expect(Number(res.body.pendingTotal)).toBeGreaterThanOrEqual(200);
  });

  it('una práctica de otro tenant responde 403, y un id inexistente responde 404', async () => {
    await http()
      .get('/accounting/fiscal-years')
      .query({ practiceId: otraPracticeId })
      .set(auth())
      .set(tenantHeader())
      .expect(403);

    await http()
      .get('/accounting/fiscal-years')
      .query({ practiceId: randomUUID() })
      .set(auth())
      .set(tenantHeader())
      .expect(404);
  });

  it('document-flow de un asiento inexistente responde 404', async () => {
    await http()
      .get(`/accounting/journal-transactions/${randomUUID()}/document-flow`)
      .set(auth())
      .set(tenantHeader())
      .expect(404);
  });
});
