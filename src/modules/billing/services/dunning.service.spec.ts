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
import { CONCEPTS, ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

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
  const practicesLookupRepo = { findActive: mockFn(() => Promise.resolve([])) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new DunningService(
    em as any,
    dunningRepo,
    invoicesRepo as any,
    practicesLookupRepo as any,
    logger as any,
  );
  return { service, tx, dunningRepo, invoicesRepo, practicesLookupRepo };
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

    const res = await d.service.runDueDunning({}, actor);

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

    const res = await d.service.runDueDunning({}, actor);

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

    const res = await d.service.runDueDunning({}, actor);

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

    const res = await d.service.runDueDunning({}, actor);

    // t1 falló y no aparece en los resultados; t2 se procesó igual, en su
    // propia transacción, sin que el fallo de t1 la revirtiera.
    expect(res.tenantsProcessed).toBe(1);
    expect(res.results[0]).toMatchObject({ tenantId: 't2', skipped: false });
  });
});
