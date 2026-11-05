import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DunningService } from './dunning.service';
import { BILL } from '../billing.concepts';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const systemActor = { id: 'worker-1', roles: ['SYSTEM'] } as any;

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant dado, como lo
 * hace `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Puerto de `practice` de prueba: la práctica `pr1` es del tenant A y `pr-b`
 * del tenant B; cualquier otra no existe.
 *
 * @returns Doble de `PracticeTenantLookupService`.
 */
function buildLookup() {
  return {
    findTenantOfPractice: mockFn(async (practiceId: string) =>
      practiceId === 'pr1' ? TENANT_A : practiceId === 'pr-b' ? TENANT_B : null,
    ),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dunningRepo = {
    findRunByNumber: mockFn(),
    createRun: mockFn(),
    createItem: mockFn(),
  };
  const invoicesRepo = {
    findById: mockFn(),
    findOverdueByPractices: mockFn(() => Promise.resolve([])),
  };
  const practicesLookupRepo = {
    findActive: mockFn(() => Promise.resolve([])),
    ...buildLookup(),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const raw = new DunningService(
    em as any,
    dunningRepo,
    invoicesRepo as any,
    practicesLookupRepo as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    tx,
    dunningRepo,
    invoicesRepo,
    practicesLookupRepo,
  };
}

describe('DunningService (UC-17-10)', () => {
  it('creates the run and one item per overdue invoice, then completes the run', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue(null);
    const run = {
      id: 'run1',
      runNumber: 'R-1',
      statusConceptId: BILL.DUNNING_RUN_RUNNING,
    };
    d.dunningRepo.createRun.mockReturnValue(run);
    const invoice = {
      id: 'inv1',
      practiceId: 'pr1',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);

    const res = await d.service.execute(
      {
        tenantId: 't1',
        runNumber: 'R-1',
        items: [
          { invoiceId: 'inv1', outstandingAmount: '50.00', daysOverdue: 30 },
        ],
      },
      actor,
    );

    expect(res.itemCount).toBe(1);
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.dunningRepo.createItem).toHaveBeenCalledTimes(1);
    expect(run.statusConceptId).toBe(BILL.DUNNING_RUN_COMPLETED);
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_IN_COLLECTION);
  });

  it('rejects a duplicate run number for the tenant (conflict)', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue({ id: 'existing' });
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
    });
    await expect(
      d.service.execute(
        {
          tenantId: 't1',
          runNumber: 'R-1',
          items: [{ invoiceId: 'inv1' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DunningService.runDueDunning (tick de morosidad automática)', () => {
  it('groups practices by tenant and opens one run per tenant with overdue invoices', async () => {
    const d = build();
    d.practicesLookupRepo.findActive.mockResolvedValue([
      { id: 'p1', tenantId: 't1', statusConceptId: CONCEPTS.STATE_ACTIVE },
      { id: 'p2', tenantId: 't1', statusConceptId: CONCEPTS.STATE_ACTIVE },
      { id: 'p3', tenantId: 't2', statusConceptId: CONCEPTS.STATE_ACTIVE },
    ]);
    d.invoicesRepo.findOverdueByPractices.mockImplementation(
      (_em: any, practiceIds: string[]) =>
        Promise.resolve(
          practiceIds.includes('p1')
            ? [
                {
                  id: 'inv1',
                  balance: '120.00',
                  currencyConceptId: 'usd',
                  // +2s de margen: `now` lo captura el servicio ANTES de este
                  // mock, así que sin margen un hop async de más podría cruzar
                  // el borde de milisegundo y hacer floor() caer a 4 en vez de 5.
                  dueDate: new Date(Date.now() - 5 * 86_400_000 - 2000),
                  statusConceptId: BILL.INVOICE_ISSUED,
                },
              ]
            : [],
        ),
    );
    d.dunningRepo.findRunByNumber.mockResolvedValue(null);
    d.dunningRepo.createRun.mockImplementation((_em: any, data: any) => ({
      id: 'run-t1',
      ...data,
    }));

    const res = await d.raw.runDueDunning({}, systemActor);

    expect(res.tenantsProcessed).toBe(1);
    expect(d.practicesLookupRepo.findActive).toHaveBeenCalledWith(
      CONCEPTS.STATE_ACTIVE,
    );
    expect(res.results[0]).toMatchObject({
      tenantId: 't1',
      itemCount: 1,
      skipped: false,
    });
    expect(d.invoicesRepo.findOverdueByPractices).toHaveBeenCalledWith(
      d.tx,
      expect.arrayContaining(['p1', 'p2']),
      expect.any(Array),
      expect.any(Date),
      500,
    );
    expect(d.dunningRepo.createItem).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        invoiceId: 'inv1',
        outstandingAmount: '120.00',
        daysOverdue: 5,
      }),
    );
  });

  it('skips a tenant that already has an automatic run today (idempotent)', async () => {
    const d = build();
    d.practicesLookupRepo.findActive.mockResolvedValue([
      { id: 'p1', tenantId: 't1', statusConceptId: CONCEPTS.STATE_ACTIVE },
    ]);
    d.invoicesRepo.findOverdueByPractices.mockResolvedValue([
      { id: 'inv1', balance: '10.00', statusConceptId: BILL.INVOICE_ISSUED },
    ]);
    d.dunningRepo.findRunByNumber.mockResolvedValue({ id: 'already-run' });

    const res = await d.raw.runDueDunning({}, systemActor);

    expect(res.results[0]).toMatchObject({
      tenantId: 't1',
      runId: 'already-run',
      skipped: true,
    });
    expect(d.dunningRepo.createRun).not.toHaveBeenCalled();
  });

  it('does nothing when no tenant has overdue invoices', async () => {
    const d = build();
    d.practicesLookupRepo.findActive.mockResolvedValue([
      { id: 'p1', tenantId: 't1', statusConceptId: CONCEPTS.STATE_ACTIVE },
    ]);

    const res = await d.raw.runDueDunning({}, systemActor);

    expect(res).toEqual({ tenantsProcessed: 0, results: [] });
  });

  it('isolates a failing tenant in its own transaction so the rest still get processed', async () => {
    const d = build();
    d.practicesLookupRepo.findActive.mockResolvedValue([
      { id: 'p1', tenantId: 't1', statusConceptId: CONCEPTS.STATE_ACTIVE },
      { id: 'p2', tenantId: 't2', statusConceptId: CONCEPTS.STATE_ACTIVE },
    ]);
    d.invoicesRepo.findOverdueByPractices.mockResolvedValue([
      {
        id: 'inv1',
        balance: '10.00',
        currencyConceptId: 'usd',
        statusConceptId: BILL.INVOICE_ISSUED,
      },
    ]);
    d.dunningRepo.findRunByNumber
      .mockImplementationOnce(() => {
        throw new Error('boom: t1 blows up');
      })
      .mockImplementationOnce(() => Promise.resolve(null));
    d.dunningRepo.createRun.mockImplementation((_em: any, data: any) => ({
      id: 'run-t2',
      ...data,
    }));

    const res = await d.raw.runDueDunning({}, systemActor);

    // t1 falló y no aparece en los resultados; t2 se procesó igual, en su
    // propia transacción, sin que el fallo de t1 la revirtiera.
    expect(res.tenantsProcessed).toBe(1);
    expect(res.results[0]).toMatchObject({ tenantId: 't2', skipped: false });
  });
});

describe('DunningService · alcance de tenant (BILL-01)', () => {
  /**
   * Captura el rechazo para inspeccionar status, reason y details.
   *
   * @param promise - Operación que debe fallar.
   * @returns La excepción lanzada.
   */
  async function rejection(promise: Promise<unknown>): Promise<any> {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error('Se esperaba un rechazo');
  }

  const dto = (invoiceId = 'inv1') =>
    ({
      tenantId: TENANT_B,
      runNumber: 'R-1',
      items: [{ invoiceId, outstandingAmount: '50.00' }],
    }) as any;

  it('la corrida es del tenant del contexto, no del cuerpo', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue(null);
    d.dunningRepo.createRun.mockReturnValue({ id: 'run1', runNumber: 'R-1' });
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
      updatedAt: new Date(),
    });

    await d.service.execute(dto(), actor);

    expect(d.dunningRepo.findRunByNumber).toHaveBeenCalledWith(
      d.tx,
      TENANT_A,
      'R-1',
    );
    expect(d.dunningRepo.createRun.mock.calls[0][1].tenantId).toBe(TENANT_A);
  });

  it('la factura de B incluida desde A responde como inexistente; no hay corrida, ítem ni cambio de estado', async () => {
    const foreign = build();
    foreign.dunningRepo.findRunByNumber.mockResolvedValue(null);
    const foreignInvoice = {
      id: 'inv1',
      practiceId: 'pr-b',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    foreign.invoicesRepo.findById.mockResolvedValue(foreignInvoice);
    const absent = build();
    absent.dunningRepo.findRunByNumber.mockResolvedValue(null);
    absent.invoicesRepo.findById.mockResolvedValue(null);

    const a = await rejection(foreign.service.execute(dto(), actor));
    const b = await rejection(absent.service.execute(dto(), actor));

    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect(a.reason).toBe(BillingErrorReason.DUNNING_INVOICE_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.dunningRepo.createRun).not.toHaveBeenCalled();
    expect(foreign.dunningRepo.createItem).not.toHaveBeenCalled();
    expect(foreignInvoice.statusConceptId).toBe(BILL.INVOICE_ISSUED);
  });

  it('la factura de A es ajena desde B', async () => {
    const d = build();
    d.dunningRepo.findRunByNumber.mockResolvedValue(null);
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
    });

    await expect(d.asTenantB.execute(dto(), actor)).rejects.toMatchObject({
      reason: BillingErrorReason.DUNNING_INVOICE_NOT_FOUND,
    });
  });

  it('sin tenant en el contexto no abre ninguna corrida (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.execute(dto(), actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.dunningRepo.createRun).not.toHaveBeenCalled();
  });

  describe('runDueDunning', () => {
    const practices = [
      { id: 'p1', tenantId: TENANT_A, statusConceptId: CONCEPTS.STATE_ACTIVE },
      { id: 'p3', tenantId: TENANT_B, statusConceptId: CONCEPTS.STATE_ACTIVE },
    ];
    const overdue = [
      { id: 'inv1', balance: '10.00', statusConceptId: BILL.INVOICE_ISSUED },
    ];

    it('el administrador de A sólo recorre el tenant A, nunca el de B', async () => {
      const d = build();
      d.practicesLookupRepo.findActive.mockResolvedValue(practices);
      d.invoicesRepo.findOverdueByPractices.mockResolvedValue(overdue);
      d.dunningRepo.findRunByNumber.mockResolvedValue(null);
      d.dunningRepo.createRun.mockImplementation((_em: any, data: any) => ({
        id: 'run',
        ...data,
      }));

      const res = await d.service.runDueDunning({}, actor);

      expect(res.results.map((r) => r.tenantId)).toEqual([TENANT_A]);
      expect(d.invoicesRepo.findOverdueByPractices).toHaveBeenCalledTimes(1);
      expect(d.invoicesRepo.findOverdueByPractices.mock.calls[0][1]).toEqual([
        'p1',
      ]);
    });

    it('un administrador sin tenant en el contexto no dispara el barrido', async () => {
      const d = build();
      d.practicesLookupRepo.findActive.mockResolvedValue(practices);

      const error = await rejection(d.raw.runDueDunning({}, actor));

      expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
      expect(d.invoicesRepo.findOverdueByPractices).not.toHaveBeenCalled();
    });

    it('SYSTEM sin tenant sí barre todos los tenants', async () => {
      const d = build();
      d.practicesLookupRepo.findActive.mockResolvedValue(practices);
      d.invoicesRepo.findOverdueByPractices.mockResolvedValue(overdue);
      d.dunningRepo.findRunByNumber.mockResolvedValue(null);
      d.dunningRepo.createRun.mockImplementation((_em: any, data: any) => ({
        id: 'run',
        ...data,
      }));

      const res = await d.raw.runDueDunning({}, systemActor);

      expect(res.tenantsProcessed).toBe(2);
    });
  });
});
