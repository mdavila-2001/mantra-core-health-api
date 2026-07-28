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
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

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
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BillsService(
    em as any,
    billsRepo as any,
    linksRepo,
    logger as any,
  );
  return { service, tx, billsRepo, linksRepo };
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
