import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyProcurementService } from './pharmacy-procurement.service';
import { ResourceNotFoundException, PreconditionFailedException } from '../../../common';
import { PINV } from '../pharmacy_inventory.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const suppliersRepo = { findById: mockFn(), create: mockFn() };
  const ordersRepo = { findById: mockFn(), create: mockFn(), createLine: mockFn(), findLineById: mockFn() };
  const receiptsRepo = { create: mockFn(), createLine: mockFn() };
  const locationsRepo = { findById: mockFn() };
  const lotsRepo = { findByProductAndNumber: mockFn(), create: mockFn() };
  const ledgerRepo = { nextSequence: mockFn(async () => '1'), append: mockFn(() => ({ id: 'led1' })) };
  const stockRepo = { findByKey: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmacyProcurementService(
    em as any,
    suppliersRepo as any,
    ordersRepo as any,
    receiptsRepo as any,
    locationsRepo as any,
    lotsRepo as any,
    ledgerRepo as any,
    stockRepo as any,
    logger as any,
  );
  return { service, tx, suppliersRepo, ordersRepo, receiptsRepo, locationsRepo, lotsRepo, stockRepo };
}

describe('PharmacyProcurementService', () => {
  it('createSupplier: creates an active supplier', async () => {
    const d = build();
    d.suppliersRepo.create.mockReturnValue({ id: 'sup1' });
    await expect(d.service.createSupplier('ph1', { supplierTenantId: 't1' } as any, actor)).resolves.toEqual({
      id: 'sup1',
    });
  });

  it('createPurchaseOrder: happy path creates order + lines', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue({ id: 'sup1', statusConceptId: PINV.SUPPLIER_ACTIVE });
    d.ordersRepo.create.mockReturnValue({ id: 'po1' });
    d.ordersRepo.createLine.mockReturnValue({ id: 'pol1' });
    const dto = { pharmacySiteId: 's1', pharmacySupplierId: 'sup1', lines: [{ pharmacyProductId: 'p1', orderedQuantity: 5 }] };
    const res = await d.service.createPurchaseOrder('ph1', dto as any, actor);
    expect(res.id).toBe('po1');
    expect(res.lineIds).toEqual(['pol1']);
  });

  it('createPurchaseOrder: throws when supplier missing', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.createPurchaseOrder('ph1', { pharmacySupplierId: 'x', pharmacySiteId: 's', lines: [] } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('createPurchaseOrder: rejects an inactive supplier (422)', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue({ id: 'sup1', statusConceptId: 'other' });
    await expect(
      d.service.createPurchaseOrder('ph1', { pharmacySupplierId: 'sup1', pharmacySiteId: 's', lines: [] } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('receiveGoods: happy path posts receipt, lot, ledger and stock', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue({ id: 'po1', statusConceptId: PINV.PO_ORDERED });
    d.locationsRepo.findById.mockResolvedValue({ id: 'loc1' });
    d.receiptsRepo.create.mockReturnValue({ id: 'gr1', receiptNumber: 'GR-1' });
    d.ordersRepo.findLineById.mockResolvedValue({ id: 'pol1', orderedQuantity: '10', receivedQuantity: '0' });
    d.lotsRepo.findByProductAndNumber.mockResolvedValue(null);
    d.lotsRepo.create.mockReturnValue({ id: 'lot1' });
    d.stockRepo.findByKey.mockResolvedValue(null);
    d.stockRepo.create.mockReturnValue({ id: 'sp1' });
    const dto = {
      pharmacyPurchaseOrderId: 'po1',
      pharmacySiteId: 's1',
      inventoryLocationId: 'loc1',
      lines: [{ pharmacyPurchaseOrderLineId: 'pol1', pharmacyProductId: 'p1', lotNumber: 'L1', receivedQuantity: 10 }],
    };
    const res = await d.service.receiveGoods('ph1', dto as any, actor);
    expect(res.id).toBe('gr1');
    expect(res.lotIds).toEqual(['lot1']);
    expect(res.ledgerEntryIds).toEqual(['led1']);
  });

  it('receiveGoods: throws when order missing', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.receiveGoods('ph1', { pharmacyPurchaseOrderId: 'x', pharmacySiteId: 's', inventoryLocationId: 'l', lines: [] } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('receiveGoods: rejects order not in receivable status (422)', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue({ id: 'po1', statusConceptId: PINV.PO_RECEIVED });
    await expect(
      d.service.receiveGoods('ph1', { pharmacyPurchaseOrderId: 'po1', pharmacySiteId: 's', inventoryLocationId: 'l', lines: [] } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
