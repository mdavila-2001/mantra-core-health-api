import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyProcurementService } from './pharmacy-procurement.service';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
} from '../../../common';
import { PINV } from '../pharmacy_inventory.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const suppliersRepo = { findById: mockFn(), create: mockFn() };
  const ordersRepo = {
    findById: mockFn(),
    findByIdempotencyKey: mockFn(),
    findLinesByOrder: mockFn(),
    create: mockFn(),
    createLine: mockFn(),
    findLineById: mockFn(),
  };
  const receiptsRepo = {
    create: mockFn(),
    createLine: mockFn(),
    findByIdempotencyKey: mockFn(),
    findLines: mockFn(),
  };
  const locationsRepo = { findById: mockFn() };
  const lotsRepo = { findByProductAndNumber: mockFn(), create: mockFn() };
  const ledgerRepo = {
    nextSequence: mockFn(async () => '1'),
    append: mockFn(() => ({ id: 'led1' })),
    findEntryIdsBySource: mockFn(async () => []),
  };
  const stockRepo = {
    findByKey: mockFn(),
    findByKeyForUpdate: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmacyProcurementService(
    em as any,
    suppliersRepo,
    ordersRepo as any,
    receiptsRepo as any,
    locationsRepo as any,
    lotsRepo as any,
    ledgerRepo,
    stockRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    suppliersRepo,
    ordersRepo,
    receiptsRepo,
    locationsRepo,
    lotsRepo,
    stockRepo,
    ledgerRepo,
  };
}

describe('PharmacyProcurementService', () => {
  it('createSupplier: creates an active supplier', async () => {
    const d = build();
    d.suppliersRepo.create.mockReturnValue({ id: 'sup1' });
    await expect(
      d.service.createSupplier('ph1', { supplierTenantId: 't1' } as any, actor),
    ).resolves.toEqual({
      id: 'sup1',
    });
  });

  it('createPurchaseOrder: happy path creates order + lines', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue({
      id: 'sup1',
      statusConceptId: PINV.SUPPLIER_ACTIVE,
    });
    d.ordersRepo.create.mockReturnValue({ id: 'po1' });
    d.ordersRepo.createLine.mockReturnValue({ id: 'pol1' });
    const dto = {
      pharmacySiteId: 's1',
      pharmacySupplierId: 'sup1',
      lines: [{ pharmacyProductId: 'p1', orderedQuantity: 5 }],
    };
    const res = await d.service.createPurchaseOrder('ph1', dto, actor);
    expect(res.id).toBe('po1');
    expect(res.lineIds).toEqual(['pol1']);
  });

  it('createPurchaseOrder: throws when supplier missing', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.createPurchaseOrder(
        'ph1',
        { pharmacySupplierId: 'x', pharmacySiteId: 's', lines: [] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('createPurchaseOrder: rejects an inactive supplier (422)', async () => {
    const d = build();
    d.suppliersRepo.findById.mockResolvedValue({
      id: 'sup1',
      statusConceptId: 'other',
    });
    await expect(
      d.service.createPurchaseOrder(
        'ph1',
        { pharmacySupplierId: 'sup1', pharmacySiteId: 's', lines: [] } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('receiveGoods: happy path posts receipt, lot, ledger and stock', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue({
      id: 'po1',
      statusConceptId: PINV.PO_ORDERED,
    });
    d.locationsRepo.findById.mockResolvedValue({ id: 'loc1' });
    d.receiptsRepo.create.mockReturnValue({ id: 'gr1', receiptNumber: 'GR-1' });
    d.ordersRepo.findLineById.mockResolvedValue({
      id: 'pol1',
      orderedQuantity: '10',
      receivedQuantity: '0',
    });
    d.lotsRepo.findByProductAndNumber.mockResolvedValue(null);
    d.lotsRepo.create.mockReturnValue({ id: 'lot1' });
    d.stockRepo.findByKeyForUpdate.mockResolvedValue(null);
    d.stockRepo.create.mockReturnValue({ id: 'sp1' });
    const dto = {
      pharmacyPurchaseOrderId: 'po1',
      pharmacySiteId: 's1',
      inventoryLocationId: 'loc1',
      lines: [
        {
          pharmacyPurchaseOrderLineId: 'pol1',
          pharmacyProductId: 'p1',
          lotNumber: 'L1',
          receivedQuantity: 10,
        },
      ],
    };
    const res = await d.service.receiveGoods('ph1', dto, actor);
    expect(res.id).toBe('gr1');
    expect(res.lotIds).toEqual(['lot1']);
    expect(res.ledgerEntryIds).toEqual(['led1']);
    // El upsert de la posición de stock toma el lock (FOR UPDATE), no un read suelto.
    expect(d.stockRepo.findByKeyForUpdate).toHaveBeenCalled();
    expect(d.stockRepo.findByKey).not.toHaveBeenCalled();
  });

  it('createPurchaseOrder: idempotent retry returns the existing order without re-creating', async () => {
    const d = build();
    d.ordersRepo.findByIdempotencyKey.mockResolvedValue({
      id: 'po-existing',
      purchaseOrderNumber: 'PO-existing',
    });
    d.ordersRepo.findLinesByOrder.mockResolvedValue([{ id: 'pol-existing' }]);
    const dto = {
      pharmacySiteId: 's1',
      pharmacySupplierId: 'sup1',
      idempotencyKey: 'idem-po',
      lines: [{ pharmacyProductId: 'p1', orderedQuantity: 5 }],
    };
    const res = await d.service.createPurchaseOrder('ph1', dto as any, actor);
    expect(res).toEqual({
      id: 'po-existing',
      purchaseOrderNumber: 'PO-existing',
      lineIds: ['pol-existing'],
    });
    expect(d.ordersRepo.findByIdempotencyKey).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'idem-po',
    );
    // No repite el efecto: no vuelve a crear la orden.
    expect(d.ordersRepo.create).not.toHaveBeenCalled();
  });

  it('receiveGoods: idempotent retry returns the existing receipt without re-posting stock', async () => {
    const d = build();
    d.receiptsRepo.findByIdempotencyKey.mockResolvedValue({
      id: 'gr-existing',
      receiptNumber: 'GR-existing',
    });
    d.receiptsRepo.findLines.mockResolvedValue([
      { id: 'grl1', inventoryLotId: 'lot-existing' },
    ]);
    d.ledgerRepo.findEntryIdsBySource.mockResolvedValue(['led-existing']);
    const dto = {
      pharmacyPurchaseOrderId: 'po1',
      pharmacySiteId: 's1',
      inventoryLocationId: 'loc1',
      idempotencyKey: 'idem-gr',
      lines: [],
    };
    const res = await d.service.receiveGoods('ph1', dto as any, actor);
    expect(res).toEqual({
      id: 'gr-existing',
      receiptNumber: 'GR-existing',
      lotIds: ['lot-existing'],
      ledgerEntryIds: ['led-existing'],
    });
    // No repite el efecto: ni ledger nuevo ni mutación de stock.
    expect(d.receiptsRepo.create).not.toHaveBeenCalled();
    expect(d.stockRepo.findByKeyForUpdate).not.toHaveBeenCalled();
  });

  it('receiveGoods: throws when order missing', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.receiveGoods(
        'ph1',
        {
          pharmacyPurchaseOrderId: 'x',
          pharmacySiteId: 's',
          inventoryLocationId: 'l',
          lines: [],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('receiveGoods: rejects order not in receivable status (422)', async () => {
    const d = build();
    d.ordersRepo.findById.mockResolvedValue({
      id: 'po1',
      statusConceptId: PINV.PO_RECEIVED,
    });
    await expect(
      d.service.receiveGoods(
        'ph1',
        {
          pharmacyPurchaseOrderId: 'po1',
          pharmacySiteId: 's',
          inventoryLocationId: 'l',
          lines: [],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
