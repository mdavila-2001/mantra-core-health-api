import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ErpOperationsService } from './erp-operations.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['ERP_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const UUID = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const operationsRepo = {
    createEmployee: mockFn(),
    findEmployeeById: mockFn(),
    createTimeOffRequest: mockFn(),
    findTimeOffForUpdate: mockFn(),
    findOverlappingTimeOff: mockFn(),
    createPurchaseOrder: mockFn(),
    findPurchaseOrderForUpdate: mockFn(),
    createPurchaseOrderItem: mockFn(),
    findItemsByPurchaseOrder: mockFn(),
    createGoodsReceipt: mockFn(),
    createGoodsReceiptItem: mockFn(),
    createServiceEntrySheet: mockFn(),
    createInvoiceMatchRun: mockFn(),
    createSalesOrder: mockFn(),
    createLeaseValuation: mockFn(),
  };
  const contractsRepo = { findPartnerById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ErpOperationsService(
    em as any,
    operationsRepo,
    contractsRepo as any,
    logger as any,
  );
  return { service, tx, operationsRepo, contractsRepo };
}

describe('ErpOperationsService', () => {
  describe('requestTimeOff (UC-38-09)', () => {
    const dto = {
      leaveType: 'VACATION' as const,
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-10T00:00:00Z',
    };

    it('registers the request when there is no overlap', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue({ id: 'emp-1' });
      d.operationsRepo.findOverlappingTimeOff.mockResolvedValue([]);
      d.operationsRepo.createTimeOffRequest.mockReturnValue({ id: 'to-1' });

      const res = await d.service.requestTimeOff(UUID, dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_REQUESTED);
    });

    it('rejects a request that overlaps an existing one', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue({ id: 'emp-1' });
      d.operationsRepo.findOverlappingTimeOff.mockResolvedValue([
        { id: 'to-existing' },
      ]);

      await expect(
        d.service.requestTimeOff(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an inverted date range before hitting the database', async () => {
      const d = build();

      await expect(
        d.service.requestTimeOff(
          UUID,
          {
            ...dto,
            startDate: '2026-07-10T00:00:00Z',
            endDate: '2026-07-01T00:00:00Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the employee does not exist', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(null);

      await expect(
        d.service.requestTimeOff(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('approveTimeOff (UC-38-09)', () => {
    it('approves a pending request', async () => {
      const d = build();
      const request: any = {
        id: 'to-1',
        statusConceptId: CONCEPTS.TIMEOFF_REQUESTED,
      };
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue(request);

      const res = await d.service.approveTimeOff(
        UUID,
        { approved: true },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_APPROVED);
    });

    it('rejects resolving a request twice', async () => {
      const d = build();
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue({
        id: 'to-1',
        statusConceptId: CONCEPTS.TIMEOFF_APPROVED,
      });

      await expect(
        d.service.approveTimeOff(UUID, { approved: false }, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createPurchaseOrder (UC-38-10)', () => {
    const dto = {
      tenantId: TENANT,
      purchaseOrderNumber: 'PO-001',
      supplierBusinessPartnerId: UUID,
      items: [
        { itemType: 'MATERIAL' as const, quantity: '10', unitPrice: '250.00' },
        { itemType: 'SERVICE' as const, quantity: '2', unitPrice: '500.00' },
      ],
    };

    it('derives the total from the lines instead of trusting the caller', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({ id: 'bp-1' });
      d.operationsRepo.createPurchaseOrder.mockReturnValue({ id: 'po-1' });

      const res = await d.service.createPurchaseOrder(dto, actor);

      expect(res.totalAmount).toBe('3500.00');
      expect(res.itemCount).toBe(2);
      expect(d.operationsRepo.createPurchaseOrderItem).toHaveBeenCalledTimes(2);
    });

    it('throws when the supplier does not exist', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue(null);

      await expect(
        d.service.createPurchaseOrder(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createGoodsReceipt (UC-38-11)', () => {
    const dto = {
      tenantId: TENANT,
      receiptNumber: 'GR-001',
      items: [
        {
          purchaseOrderItemId: UUID,
          receivedQuantity: '10',
          acceptedQuantity: '9',
        },
      ],
    };

    it('computes rejected units and flags the quality status', async () => {
      const d = build();
      const order: any = { id: 'po-1', statusConceptId: CONCEPTS.PO_OPEN };
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(order);
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });

      const res = await d.service.createGoodsReceipt(UUID, dto, actor);

      expect(res.rejectedUnits).toBe('1');
      expect(order.statusConceptId).toBe(CONCEPTS.PO_RECEIVED);
      expect(d.operationsRepo.createGoodsReceiptItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          qualityStatusConceptId: CONCEPTS.QUALITY_REJECTED,
        }),
      );
    });

    it('accepts everything received when no accepted quantity is given', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        statusConceptId: CONCEPTS.PO_OPEN,
      });
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });

      const res = await d.service.createGoodsReceipt(
        UUID,
        {
          ...dto,
          items: [{ purchaseOrderItemId: UUID, receivedQuantity: '10' }],
        },
        actor,
      );

      expect(res.rejectedUnits).toBe('0');
    });

    it('rejects accepting more than what was received', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        statusConceptId: CONCEPTS.PO_OPEN,
      });
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });

      await expect(
        d.service.createGoodsReceipt(
          UUID,
          {
            ...dto,
            items: [
              {
                purchaseOrderItemId: UUID,
                receivedQuantity: '5',
                acceptedQuantity: '8',
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects receiving against a closed purchase order', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        statusConceptId: CONCEPTS.PO_CLOSED,
      });

      await expect(
        d.service.createGoodsReceipt(UUID, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('runInvoiceMatch (UC-38-13)', () => {
    const dto = {
      tenantId: TENANT,
      purchaseOrderId: UUID,
      invoicedAmount: '2500.00',
    };

    it('matches when the invoice equals the ordered amount', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
      });
      d.operationsRepo.findItemsByPurchaseOrder.mockResolvedValue([
        { quantity: '10', unitPrice: '250.00' },
      ]);
      d.operationsRepo.createInvoiceMatchRun.mockReturnValue({ id: 'match-1' });

      const res = await d.service.runInvoiceMatch(UUID, dto, actor);

      expect(res.matched).toBe(true);
      expect(res.varianceAmount).toBe('0.00');
    });

    it('flags a variance beyond the tolerance', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
      });
      d.operationsRepo.findItemsByPurchaseOrder.mockResolvedValue([
        { quantity: '10', unitPrice: '200.00' },
      ]);
      d.operationsRepo.createInvoiceMatchRun.mockReturnValue({ id: 'match-1' });

      const res = await d.service.runInvoiceMatch(UUID, dto, actor);

      expect(res.matched).toBe(false);
      expect(res.varianceAmount).toBe('500.00');
      expect(d.operationsRepo.createInvoiceMatchRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resultConceptId: CONCEPTS.MATCH_RESULT_VARIANCE,
        }),
      );
    });

    it('accepts a difference within the declared tolerance', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
      });
      d.operationsRepo.findItemsByPurchaseOrder.mockResolvedValue([
        { quantity: '10', unitPrice: '249.00' },
      ]);
      d.operationsRepo.createInvoiceMatchRun.mockReturnValue({ id: 'match-1' });

      const res = await d.service.runInvoiceMatch(
        UUID,
        { ...dto, toleranceAmount: '20.00' },
        actor,
      );

      expect(res.matched).toBe(true);
    });
  });

  describe('onboardEmployee, sales orders and lease valuations', () => {
    it('onboards an employee as active (UC-38-08)', async () => {
      const d = build();
      d.operationsRepo.createEmployee.mockReturnValue({ id: 'emp-1' });

      const res = await d.service.onboardEmployee(
        { practiceId: UUID, fullName: 'Ana Flores' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.EMPLOYEE_ACTIVE);
    });

    it('creates a sales order for an existing customer (UC-38-14)', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({ id: 'bp-1' });
      d.operationsRepo.createSalesOrder.mockReturnValue({ id: 'so-1' });

      const res = await d.service.createSalesOrder(
        {
          tenantId: TENANT,
          salesOrderNumber: 'SO-001',
          customerBusinessPartnerId: UUID,
        },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.SALES_ORDER_OPEN);
    });

    it('records the lease valuation under IFRS 16 (UC-38-15)', async () => {
      const d = build();
      d.operationsRepo.createLeaseValuation.mockReturnValue({ id: 'lv-1' });

      const res = await d.service.createLeaseValuation(
        UUID,
        {
          valuationDate: '2026-12-31T00:00:00Z',
          rightOfUseAssetValue: '95000.00',
          leaseLiabilityValue: '92000.00',
        },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.VALUATION_POSTED);
      expect(d.operationsRepo.createLeaseValuation).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          accountingPrincipleConceptId: CONCEPTS.ACCOUNTING_IFRS16,
        }),
      );
    });

    it('submits a service entry sheet pending approval (UC-38-12)', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        supplierBusinessPartnerId: 'bp-1',
      });
      d.operationsRepo.createServiceEntrySheet.mockReturnValue({ id: 'ses-1' });

      const res = await d.service.createServiceEntrySheet(
        UUID,
        { tenantId: TENANT, sheetNumber: 'SES-001' },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.SHEET_SUBMITTED);
    });
  });
});
