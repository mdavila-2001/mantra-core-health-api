import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReimbursementsService } from './reimbursements.service';
import { BILL } from '../billing.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

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
  const reimbursementsRepo = { findByClaim: mockFn(), create: mockFn() };
  const invoicesRepo = { findById: mockFn() };
  const linksRepo = { create: mockFn() };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new ReimbursementsService(
    em as any,
    reimbursementsRepo,
    invoicesRepo as any,
    linksRepo,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    reimbursementsRepo,
    invoicesRepo,
    linksRepo,
  };
}

describe('ReimbursementsService (UC-17-08)', () => {
  it('links the reimbursement and credits the invoice', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    const invoice = {
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
      paidTotal: '0.00',
      statusConceptId: BILL.INVOICE_ISSUED,
      updatedAt: new Date(),
    };
    d.invoicesRepo.findById.mockResolvedValue(invoice);
    d.reimbursementsRepo.create.mockReturnValue({
      id: 'r1',
      claimId: 'c1',
      amount: '30.00',
      statusConceptId: BILL.REIMBURSEMENT_POSTED,
    });

    const res = await d.service.link(
      {
        claimId: 'c1',
        invoiceId: 'inv1',
        amount: '30.00',
        tenantId: 't1',
      },
      actor,
    );

    expect(res.id).toBe('r1');
    expect(invoice.paidTotal).toBe('30.00');
    expect(invoice.balance).toBe('70.00');
    expect(invoice.statusConceptId).toBe(BILL.INVOICE_PARTIALLY_PAID);
    expect(d.linksRepo.create).toHaveBeenCalled();
  });

  it('rejects a claim that already has a reimbursement (conflict / idempotency)', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue({ id: 'existing' });
    d.invoicesRepo.findById.mockResolvedValue({
      id: 'inv1',
      practiceId: 'pr1',
      balance: '100.00',
    });
    await expect(
      d.service.link(
        { claimId: 'c1', invoiceId: 'inv1', amount: '30.00' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the invoice does not exist', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    d.invoicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.link(
        { claimId: 'c1', invoiceId: 'missing', amount: '30.00' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('ReimbursementsService · alcance de tenant e importes (BILL-01/02)', () => {
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

  const invoiceOf = (practiceId: string) => ({
    id: 'inv1',
    practiceId,
    balance: '100.00',
    paidTotal: '0.00',
    statusConceptId: BILL.INVOICE_ISSUED,
    updatedAt: new Date(),
  });
  const dto = { claimId: 'c1', invoiceId: 'inv1', amount: '30.00' } as any;

  it('la factura de B vinculada desde A responde como inexistente y no cambia su saldo', async () => {
    const foreign = build();
    const foreignInvoice = invoiceOf('pr-b');
    foreign.invoicesRepo.findById.mockResolvedValue(foreignInvoice);
    const absent = build();
    absent.invoicesRepo.findById.mockResolvedValue(null);

    const a = await rejection(foreign.service.link(dto, actor));
    const b = await rejection(absent.service.link(dto, actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(BillingErrorReason.REIMBURSEMENT_INVOICE_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreignInvoice.balance).toBe('100.00');
    expect(foreign.reimbursementsRepo.create).not.toHaveBeenCalled();
  });

  it('el reclamo ya vinculado no se delata con una factura ajena (404 antes que 409)', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue({ id: 'existing' });
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr-b'));

    await expect(d.service.link(dto, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('la factura de A es ajena desde B', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr1'));

    await expect(d.asTenantB.link(dto, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('el vínculo lleva el tenant del contexto, no el del cuerpo', async () => {
    const d = build();
    d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
    d.invoicesRepo.findById.mockResolvedValue(invoiceOf('pr1'));
    d.reimbursementsRepo.create.mockReturnValue({ id: 'r1', claimId: 'c1' });

    await d.service.link({ ...dto, tenantId: TENANT_B }, actor);

    expect(d.linksRepo.create.mock.calls[0][1].tenantId).toBe(TENANT_A);
  });

  it.each(['-30.00', '0.00'])(
    'un reembolso de %s no aumenta el saldo y se rechaza',
    async (amount) => {
      const d = build();
      const invoice = invoiceOf('pr1');
      d.reimbursementsRepo.findByClaim.mockResolvedValue(null);
      d.invoicesRepo.findById.mockResolvedValue(invoice);

      await expect(
        d.service.link({ ...dto, amount }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(invoice.balance).toBe('100.00');
      expect(d.reimbursementsRepo.create).not.toHaveBeenCalled();
    },
  );

  it('sin tenant en el contexto no vincula nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.link(dto, actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.invoicesRepo.findById).not.toHaveBeenCalled();
  });
});
