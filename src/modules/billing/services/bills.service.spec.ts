import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillsService } from './bills.service';
import { BILL } from '../billing.concepts';
import {
  CONCEPTS,
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
  const billsRepo = {
    findVendor: mockFn(),
    findByNumber: mockFn(),
    create: mockFn(),
    createLine: mockFn(),
  };
  const linksRepo = { create: mockFn() };
  // Por defecto la orden de compra y el contrato son del tenant A.
  const linkTargets = {
    findPurchaseOrder: mockFn(async (_tx: unknown, id: string) => ({
      id,
      tenantId: TENANT_A,
    })),
    findContract: mockFn(async (_tx: unknown, id: string) => ({
      id,
      tenantId: TENANT_A,
    })),
  };
  const lookup = buildLookup();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new BillsService(
    em as any,
    billsRepo as any,
    linksRepo,
    linkTargets as any,
    lookup as any,
    logger as any,
  );
  return {
    service: inTenant(raw, TENANT_A),
    raw,
    asTenantB: inTenant(raw, TENANT_B),
    tx,
    billsRepo,
    linksRepo,
    linkTargets,
    lookup,
  };
}

const activeVendor = {
  id: 'v1',
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  practiceId: 'pr1',
};

describe('BillsService (UC-17-04)', () => {
  it('registers the bill with its lines when the vendor is active', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue(null);
    d.billsRepo.create.mockReturnValue({
      id: 'b1',
      billNumber: 'B-1',
      vendorId: 'v1',
      statusConceptId: BILL.BILL_RECEIVED,
      total: '100.00',
      balance: '100.00',
    });

    const res = await d.service.register(
      {
        practiceId: 'pr1',
        vendorId: 'v1',
        billNumber: 'B-1',
        lines: [{ quantity: '1', unitPrice: '100.00' }],
      },
      actor,
    );

    expect(res.id).toBe('b1');
    expect(res.lineCount).toBe(1);
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.billsRepo.createLine).toHaveBeenCalledTimes(1);
  });

  it('throws when the vendor does not exist', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(null);
    await expect(
      d.service.register(
        {
          practiceId: 'pr1',
          vendorId: 'v1',
          billNumber: 'B-1',
          lines: [{ quantity: '1', unitPrice: '1' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects an inactive vendor', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue({
      id: 'v1',
      statusConceptId: 'some-inactive',
      practiceId: 'pr1',
    });
    await expect(
      d.service.register(
        {
          practiceId: 'pr1',
          vendorId: 'v1',
          billNumber: 'B-1',
          lines: [{ quantity: '1', unitPrice: '1' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rejects a duplicate bill number (conflict)', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.register(
        {
          practiceId: 'pr1',
          vendorId: 'v1',
          billNumber: 'B-1',
          lines: [{ quantity: '1', unitPrice: '1' }],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a line with a purchase order but no goods receipt (three-way match)', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue(null);
    await expect(
      d.service.register(
        {
          practiceId: 'pr1',
          vendorId: 'v1',
          billNumber: 'B-1',
          lines: [
            { quantity: '1', unitPrice: '1', purchaseOrderItemId: 'po1' },
          ],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});

describe('BillsService · alcance de tenant (BILL-01)', () => {
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

  const dtoFor = (practiceId: string) =>
    ({
      practiceId,
      vendorId: 'v1',
      billNumber: 'B-1',
      purchaseOrderId: '00000000-0000-4000-8000-000000000001',
      lines: [{ quantity: '1', unitPrice: '100.00' }],
    }) as any;

  it('correcto: el bill se registra en la práctica de A y su vínculo lleva el tenant del contexto', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue(null);
    d.billsRepo.create.mockReturnValue({ id: 'b1', total: '100.00' });

    await d.service.register({ ...dtoFor('pr1'), tenantId: TENANT_B }, actor);

    expect(d.linksRepo.create.mock.calls[0][1].tenantId).toBe(TENANT_A);
  });

  it('la orden de compra de otra organización responde como inexistente y no crea factura ni vínculo', async () => {
    const foreign = build();
    foreign.billsRepo.findVendor.mockResolvedValue(activeVendor);
    foreign.linkTargets.findPurchaseOrder.mockResolvedValue({
      id: 'po-b',
      tenantId: TENANT_B,
    });
    const absent = build();
    absent.billsRepo.findVendor.mockResolvedValue(activeVendor);
    absent.linkTargets.findPurchaseOrder.mockResolvedValue(null);

    const a = await rejection(foreign.service.register(dtoFor('pr1'), actor));
    const b = await rejection(absent.service.register(dtoFor('pr1'), actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(BillingErrorReason.BILL_PURCHASE_ORDER_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.billsRepo.create).not.toHaveBeenCalled();
    expect(foreign.linksRepo.create).not.toHaveBeenCalled();
  });

  it('el contrato de otra organización responde como inexistente y no crea factura ni vínculo', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.linkTargets.findContract.mockResolvedValue({
      id: 'c-b',
      tenantId: TENANT_B,
    });

    const error = await rejection(
      d.service.register(
        {
          ...dtoFor('pr1'),
          purchaseOrderId: undefined,
          contractId: '00000000-0000-4000-8000-000000000002',
        },
        actor,
      ),
    );

    expect(error.getStatus()).toBe(404);
    expect(error.reason).toBe(BillingErrorReason.BILL_CONTRACT_NOT_FOUND);
    expect(d.billsRepo.create).not.toHaveBeenCalled();
    expect(d.linksRepo.create).not.toHaveBeenCalled();
  });

  it('una práctica de otro tenant responde como práctica inexistente y no crea nada', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue({
      ...activeVendor,
      practiceId: 'pr-b',
    });

    const foreign = await rejection(d.service.register(dtoFor('pr-b'), actor));
    const missing = await rejection(d.service.register(dtoFor('pr-x'), actor));

    expect(foreign.getStatus()).toBe(404);
    expect(foreign.reason).toBe(BillingErrorReason.BILLING_PRACTICE_NOT_FOUND);
    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.billsRepo.create).not.toHaveBeenCalled();
    expect(d.linksRepo.create).not.toHaveBeenCalled();
  });

  it('el proveedor de otra práctica responde como proveedor inexistente', async () => {
    const foreign = build();
    foreign.billsRepo.findVendor.mockResolvedValue({
      ...activeVendor,
      practiceId: 'pr-b',
    });
    const absent = build();
    absent.billsRepo.findVendor.mockResolvedValue(null);

    const a = await rejection(foreign.service.register(dtoFor('pr1'), actor));
    const b = await rejection(absent.service.register(dtoFor('pr1'), actor));

    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(BillingErrorReason.BILL_VENDOR_NOT_FOUND);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.billsRepo.create).not.toHaveBeenCalled();
  });

  it('sin tenant en el contexto no registra nada (denegar por defecto)', async () => {
    const d = build();

    const error = await rejection(d.raw.register(dtoFor('pr1'), actor));

    expect(error.details).toEqual({ reason: 'TENANT_REQUIRED' });
    expect(d.billsRepo.create).not.toHaveBeenCalled();
  });
});

describe('BillsService · importes de las líneas (BILL-03)', () => {
  const register = (line: Record<string, string>) =>
    ({
      practiceId: 'pr1',
      vendorId: 'v1',
      billNumber: 'B-1',
      lines: [{ quantity: '1', unitPrice: '100.00', ...line }],
    }) as any;

  it.each([
    ['cantidad negativa', { quantity: '-2' }],
    ['cantidad cero', { quantity: '0' }],
    ['precio negativo', { unitPrice: '-100.00' }],
    ['impuesto negativo', { taxAmount: '-10.00' }],
    ['precio con más de dos decimales', { unitPrice: '1.005' }],
  ])('rechaza %s y no crea el bill', async (_name, line) => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue(null);

    await expect(
      d.service.register(register(line), actor),
    ).rejects.toMatchObject({
      reason: BillingErrorReason.BILL_LINE_AMOUNT_INVALID,
    });
    expect(d.billsRepo.create).not.toHaveBeenCalled();
  });

  it('calcula el total con decimal exacto', async () => {
    const d = build();
    d.billsRepo.findVendor.mockResolvedValue(activeVendor);
    d.billsRepo.findByNumber.mockResolvedValue(null);
    d.billsRepo.create.mockImplementation((_tx: any, data: any) => ({
      id: 'b1',
      ...data,
    }));

    await d.service.register(
      register({ quantity: '3', unitPrice: '0.10', taxAmount: '0.03' }),
      actor,
    );

    const created = d.billsRepo.create.mock.calls[0][1];
    expect(created.subtotal).toBe('0.30');
    expect(created.total).toBe('0.33');
    expect(created.balance).toBe('0.33');
  });
});
