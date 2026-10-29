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
import { ErpErrorReason } from '../erp.error-reasons';
import { ErpScopeService } from './erp-scope.service';
import { T1, T2, expectNotFound, inTenant } from './erp.testing';

const actor = { id: 'user-1', roles: ['ERP_ADMIN'] } as any;
const TENANT = T1;
const PRACTICE = '33333333-3333-3333-3333-333333333333';
const UUID = '22222222-2222-2222-2222-222222222222';
const EMPLOYEE = '44444444-4444-4444-4444-444444444444';

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
    findPracticeById: mockFn().mockResolvedValue({
      id: PRACTICE,
      tenantId: T1,
    }),
    findBillById: mockFn().mockResolvedValue({
      id: 'bill-1',
      practiceId: PRACTICE,
    }),
    // Por defecto cada línea pedida existe y es hija de la orden.
    findItemsInPurchaseOrder: mockFn(
      (_tx: unknown, po: string, ids: string[]) =>
        Promise.resolve(ids.map((id) => ({ id, purchaseOrderId: po }))),
    ),
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
  const contractsRepo = {
    findPartnerById: mockFn(),
    findContractById: mockFn().mockResolvedValue({ id: 'ct-1', tenantId: T1 }),
    findLeaseContractById: mockFn().mockResolvedValue({
      id: 'lease-1',
      contractId: 'ct-1',
    }),
    findRequisitionById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new ErpScopeService(
    contractsRepo as any,
    operationsRepo as any,
  );
  const raw = new ErpOperationsService(
    em as any,
    operationsRepo,
    scope,
    logger as any,
  );
  return { raw, service: inTenant(raw), tx, operationsRepo, contractsRepo };
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
      d.operationsRepo.findEmployeeById.mockResolvedValue({
        id: 'emp-1',
        practiceId: PRACTICE,
      });
      d.operationsRepo.findOverlappingTimeOff.mockResolvedValue([]);
      d.operationsRepo.createTimeOffRequest.mockReturnValue({ id: 'to-1' });

      const res = await d.service.requestTimeOff(UUID, dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_REQUESTED);
    });

    it('rejects a request that overlaps an existing one', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue({
        id: 'emp-1',
        practiceId: PRACTICE,
      });
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
      d.operationsRepo.findEmployeeById.mockResolvedValue({
        id: EMPLOYEE,
        practiceId: PRACTICE,
      });
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue(request);

      const res = await d.service.approveTimeOff(
        EMPLOYEE,
        UUID,
        { approved: true },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_APPROVED);
    });

    it('rejects resolving a request twice', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue({
        id: EMPLOYEE,
        practiceId: PRACTICE,
      });
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue({
        id: 'to-1',
        statusConceptId: CONCEPTS.TIMEOFF_APPROVED,
      });

      await expect(
        d.service.approveTimeOff(
          EMPLOYEE,
          UUID,
          { approved: false },
          actor as any,
        ),
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
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
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
      const order: any = {
        id: 'po-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.PO_OPEN,
      };
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
        tenantId: TENANT,
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
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: 'bp-1',
        tenantId: TENANT,
      });
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
        tenantId: TENANT,
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

  describe('alcance de tenant (ERP-01)', () => {
    const foreignPo = () => ({
      id: 'po-b',
      tenantId: T2,
      statusConceptId: CONCEPTS.PO_OPEN,
      supplierBusinessPartnerId: 'bp-b',
    });
    const receiptDto = {
      receiptNumber: 'GR-001',
      items: [{ purchaseOrderItemId: UUID, receivedQuantity: '10' }],
    };

    it('correcto: BUYER de A registra la recepción de una orden A y queda en el tenant de A', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        tenantId: TENANT,
        statusConceptId: CONCEPTS.PO_OPEN,
      });
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });
      await d.service.createGoodsReceipt(UUID, receiptDto, actor);
      expect(d.operationsRepo.findPurchaseOrderForUpdate).toHaveBeenCalledWith(
        d.tx,
        UUID,
        TENANT,
      );
      expect(d.operationsRepo.createGoodsReceipt).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('falla catalogada: un tenantId del cuerpo ajeno a la sesión responde 404 y no escribe', async () => {
      const d = build();
      await expectNotFound(
        d.service.createGoodsReceipt(
          UUID,
          { ...receiptDto, tenantId: T2 },
          actor,
        ),
      );
      expect(
        d.operationsRepo.findPurchaseOrderForUpdate,
      ).not.toHaveBeenCalled();
      expect(d.operationsRepo.createGoodsReceipt).not.toHaveBeenCalled();
    });

    it('error: la recepción de la orden de B responde 404, sin recepción ni cambio de estado', async () => {
      const d = build();
      const order: any = foreignPo();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(order);
      await expectNotFound(
        d.service.createGoodsReceipt(UUID, receiptDto, actor),
      );
      expect(order.statusConceptId).toBe(CONCEPTS.PO_OPEN);
      expect(d.operationsRepo.createGoodsReceipt).not.toHaveBeenCalled();
      expect(d.operationsRepo.createGoodsReceiptItem).not.toHaveBeenCalled();
    });

    it('una orden ajena responde igual que una inexistente', async () => {
      const ajena = build();
      ajena.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        foreignPo(),
      );
      const inexistente = build();
      inexistente.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        null,
      );
      const a = await expectNotFound(
        ajena.service.createGoodsReceipt(UUID, receiptDto, actor),
      );
      const b = await expectNotFound(
        inexistente.service.createGoodsReceipt(UUID, receiptDto, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('la hoja de servicios sobre una orden de B no se crea', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        foreignPo(),
      );
      await expectNotFound(
        d.service.createServiceEntrySheet(
          UUID,
          { sheetNumber: 'SES-1' },
          actor,
        ),
      );
      expect(d.operationsRepo.createServiceEntrySheet).not.toHaveBeenCalled();
    });

    it('la conciliación contra una orden de B no se registra', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        foreignPo(),
      );
      await expectNotFound(
        d.service.runInvoiceMatch(
          'bill-1',
          { purchaseOrderId: UUID, invoicedAmount: '10.00' },
          actor,
        ),
      );
      expect(d.operationsRepo.createInvoiceMatchRun).not.toHaveBeenCalled();
    });

    it('la conciliación de una factura de B no se registra aunque la orden sea propia', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue({
        id: 'po-1',
        tenantId: TENANT,
      });
      d.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      await expectNotFound(
        d.service.runInvoiceMatch(
          'bill-1',
          { purchaseOrderId: UUID, invoicedAmount: '10.00' },
          actor,
        ),
      );
      expect(d.operationsRepo.createInvoiceMatchRun).not.toHaveBeenCalled();
    });

    it('la orden de compra con un proveedor de B no se crea', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: T2,
      });
      await expectNotFound(
        d.service.createPurchaseOrder(
          {
            purchaseOrderNumber: 'PO-9',
            supplierBusinessPartnerId: UUID,
            items: [{ itemType: 'MATERIAL', quantity: '1', unitPrice: '1' }],
          },
          actor,
        ),
      );
      expect(d.operationsRepo.createPurchaseOrder).not.toHaveBeenCalled();
    });

    it('la orden de compra con un contrato o una requisición de B no se crea', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: TENANT,
      });
      d.contractsRepo.findContractById.mockResolvedValue({
        id: 'ct-b',
        tenantId: T2,
      });
      const dto = {
        purchaseOrderNumber: 'PO-9',
        supplierBusinessPartnerId: UUID,
        contractId: 'ct-b',
        items: [
          { itemType: 'MATERIAL' as const, quantity: '1', unitPrice: '1' },
        ],
      };
      await expectNotFound(d.service.createPurchaseOrder(dto, actor));

      d.contractsRepo.findContractById.mockResolvedValue({
        id: 'ct-1',
        tenantId: TENANT,
      });
      d.contractsRepo.findRequisitionById.mockResolvedValue({
        id: 'req-b',
        tenantId: T2,
      });
      await expectNotFound(
        d.service.createPurchaseOrder(
          { ...dto, contractId: 'ct-1', purchaseRequisitionId: 'req-b' },
          actor,
        ),
      );
      expect(d.operationsRepo.createPurchaseOrder).not.toHaveBeenCalled();
    });

    it('la orden de compra toma el tenant del contexto', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: TENANT,
      });
      d.operationsRepo.createPurchaseOrder.mockReturnValue({ id: 'po-1' });
      await d.service.createPurchaseOrder(
        {
          purchaseOrderNumber: 'PO-1',
          supplierBusinessPartnerId: UUID,
          items: [{ itemType: 'MATERIAL', quantity: '1', unitPrice: '1' }],
        },
        actor,
      );
      expect(d.operationsRepo.createPurchaseOrder).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('la orden de venta con un cliente de B no se crea', async () => {
      const d = build();
      d.contractsRepo.findPartnerById.mockResolvedValue({
        id: UUID,
        tenantId: T2,
      });
      await expectNotFound(
        d.service.createSalesOrder(
          { salesOrderNumber: 'SO-9', customerBusinessPartnerId: UUID },
          actor,
        ),
      );
      expect(d.operationsRepo.createSalesOrder).not.toHaveBeenCalled();
    });

    it('la valoración de un arrendamiento cuyo contrato es de B no se registra', async () => {
      const d = build();
      d.contractsRepo.findContractById.mockResolvedValue(null);
      await expectNotFound(
        d.service.createLeaseValuation(
          UUID,
          {
            valuationDate: '2026-12-31T00:00:00Z',
            rightOfUseAssetValue: '1.00',
            leaseLiabilityValue: '1.00',
          },
          actor,
        ),
      );
      expect(d.operationsRepo.createLeaseValuation).not.toHaveBeenCalled();
    });

    it('la valoración de un arrendamiento inexistente tampoco se registra', async () => {
      const d = build();
      d.contractsRepo.findLeaseContractById.mockResolvedValue(null);
      await expectNotFound(
        d.service.createLeaseValuation(
          UUID,
          {
            valuationDate: '2026-12-31T00:00:00Z',
            rightOfUseAssetValue: '1.00',
            leaseLiabilityValue: '1.00',
          },
          actor,
        ),
      );
    });

    it('el alta de empleado en una práctica de B no se registra', async () => {
      const d = build();
      d.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      await expectNotFound(
        d.service.onboardEmployee(
          { practiceId: PRACTICE, fullName: 'Ana' },
          actor,
        ),
      );
      expect(d.operationsRepo.createEmployee).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no se lee ni se escribe nada', async () => {
      const d = build();
      await expect(
        d.raw.createGoodsReceipt(UUID, receiptDto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.operationsRepo.findPurchaseOrderForUpdate,
      ).not.toHaveBeenCalled();
    });
  });

  describe('ausencias: empleado propio y empleado de la ruta (ERP-02)', () => {
    const dto = {
      leaveType: 'VACATION' as const,
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-10T00:00:00Z',
    };
    const employeeActor = { id: 'user-a', roles: ['EMPLOYEE'] } as any;
    const hrActor = { id: 'user-hr', roles: ['HR_ADMIN'] } as any;

    /** Empleado de la práctica de la prueba, vinculado al usuario dado. */
    const employee = (personUserId?: string) => ({
      id: EMPLOYEE,
      practiceId: PRACTICE,
      personUserId,
    });

    it('correcto: el empleado vinculado solicita su propia ausencia', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-a'));
      d.operationsRepo.findOverlappingTimeOff.mockResolvedValue([]);
      d.operationsRepo.createTimeOffRequest.mockReturnValue({ id: 'to-1' });
      const res = await d.service.requestTimeOff(EMPLOYEE, dto, employeeActor);
      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_REQUESTED);
      expect(d.operationsRepo.createTimeOffRequest).toHaveBeenCalledTimes(1);
    });

    it('error: EMPLOYEE A solicita una ausencia con el UUID de B → 403 y sin solicitud', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      const error: any = await d.service
        .requestTimeOff(EMPLOYEE, dto, employeeActor)
        .catch((e: unknown) => e);
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(ErpErrorReason.ERP_EMPLOYEE_SELF_ONLY);
      expect(d.operationsRepo.createTimeOffRequest).not.toHaveBeenCalled();
    });

    it('un empleado sin usuario vinculado no puede ser operado por un EMPLOYEE', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee(undefined));
      await expect(
        d.service.requestTimeOff(EMPLOYEE, dto, employeeActor),
      ).rejects.toMatchObject({
        status: 403,
        reason: ErpErrorReason.ERP_EMPLOYEE_SELF_ONLY,
      });
    });

    it('RR. HH. solicita la ausencia de cualquier empleado de su organización', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      d.operationsRepo.findOverlappingTimeOff.mockResolvedValue([]);
      d.operationsRepo.createTimeOffRequest.mockReturnValue({ id: 'to-1' });
      await d.service.requestTimeOff(EMPLOYEE, dto, hrActor);
      expect(d.operationsRepo.createTimeOffRequest).toHaveBeenCalledTimes(1);
    });

    it('el empleado de otra organización responde 404 incluso para RR. HH.', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      d.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      await expectNotFound(d.service.requestTimeOff(EMPLOYEE, dto, hrActor));
      expect(d.operationsRepo.createTimeOffRequest).not.toHaveBeenCalled();
    });

    it('un empleado ajeno responde igual que uno inexistente (también para un EMPLOYEE)', async () => {
      const ajeno = build();
      ajeno.operationsRepo.findEmployeeById.mockResolvedValue(
        employee('user-a'),
      );
      ajeno.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      const inexistente = build();
      inexistente.operationsRepo.findEmployeeById.mockResolvedValue(null);
      const a = await expectNotFound(
        ajeno.service.requestTimeOff(EMPLOYEE, dto, employeeActor),
      );
      const b = await expectNotFound(
        inexistente.service.requestTimeOff(EMPLOYEE, dto, employeeActor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un rol HR_ADMIN acotado a otro tenant no da la vía de RR. HH. aquí', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      const hrElsewhere = {
        id: 'user-hr',
        roles: ['HR_ADMIN', 'EMPLOYEE'],
        scopedRoles: { [T2]: ['HR_ADMIN'] },
      } as any;
      await expect(
        d.service.requestTimeOff(EMPLOYEE, dto, hrElsewhere),
      ).rejects.toMatchObject({
        status: 403,
        reason: ErpErrorReason.ERP_EMPLOYEE_SELF_ONLY,
      });
    });

    it('límite: HR_ADMIN de la misma práctica aprueba la solicitud de ese empleado', async () => {
      const d = build();
      const request: any = {
        id: 'to-1',
        employeeId: EMPLOYEE,
        statusConceptId: CONCEPTS.TIMEOFF_REQUESTED,
      };
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue(request);
      const res = await d.service.approveTimeOff(
        EMPLOYEE,
        UUID,
        { approved: true },
        hrActor,
      );
      expect(res.statusConceptId).toBe(CONCEPTS.TIMEOFF_APPROVED);
      expect(d.operationsRepo.findTimeOffForUpdate).toHaveBeenCalledWith(
        d.tx,
        UUID,
        EMPLOYEE,
      );
    });

    it('falla catalogada: la solicitud no es del empleado de la ruta → 404 ERP_TIME_OFF_NOT_FOUND', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue(null);
      await expectNotFound(
        d.service.approveTimeOff(EMPLOYEE, UUID, { approved: true }, hrActor),
        ErpErrorReason.ERP_TIME_OFF_NOT_FOUND,
      );
    });

    it('falla catalogada: el empleado de la ruta es de otra práctica → mismo 404, sin tocar la solicitud', async () => {
      const d = build();
      d.operationsRepo.findEmployeeById.mockResolvedValue(employee('user-b'));
      d.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      const request: any = {
        id: 'to-1',
        employeeId: EMPLOYEE,
        statusConceptId: CONCEPTS.TIMEOFF_REQUESTED,
      };
      d.operationsRepo.findTimeOffForUpdate.mockResolvedValue(request);
      await expectNotFound(
        d.service.approveTimeOff(EMPLOYEE, UUID, { approved: true }, hrActor),
        ErpErrorReason.ERP_TIME_OFF_NOT_FOUND,
      );
      expect(request.statusConceptId).toBe(CONCEPTS.TIMEOFF_REQUESTED);
      expect(d.operationsRepo.findTimeOffForUpdate).not.toHaveBeenCalled();
    });

    it('las dos discrepancias de la aprobación tienen el mismo cuerpo', async () => {
      const otraPractica = build();
      otraPractica.operationsRepo.findEmployeeById.mockResolvedValue(
        employee('user-b'),
      );
      otraPractica.operationsRepo.findPracticeById.mockResolvedValue({
        id: PRACTICE,
        tenantId: T2,
      });
      const otroEmpleado = build();
      otroEmpleado.operationsRepo.findEmployeeById.mockResolvedValue(
        employee('user-b'),
      );
      otroEmpleado.operationsRepo.findTimeOffForUpdate.mockResolvedValue(null);
      const a = await expectNotFound(
        otraPractica.service.approveTimeOff(
          EMPLOYEE,
          UUID,
          { approved: true },
          hrActor,
        ),
        ErpErrorReason.ERP_TIME_OFF_NOT_FOUND,
      );
      const b = await expectNotFound(
        otroEmpleado.service.approveTimeOff(
          EMPLOYEE,
          UUID,
          { approved: true },
          hrActor,
        ),
        ErpErrorReason.ERP_TIME_OFF_NOT_FOUND,
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });
  });

  describe('recepción: las líneas deben ser de la orden (ERP-03)', () => {
    const LINE_A = 'aaaaaaaa-0000-0000-0000-00000000000a';
    const LINE_B = 'bbbbbbbb-0000-0000-0000-00000000000b';
    const openOrder = () => ({
      id: 'po-1',
      tenantId: TENANT,
      statusConceptId: CONCEPTS.PO_OPEN,
    });
    const dtoOf = (...ids: string[]) => ({
      receiptNumber: 'GR-001',
      items: ids.map((purchaseOrderItemId) => ({
        purchaseOrderItemId,
        receivedQuantity: '10',
      })),
    });

    it('correcto: todas las líneas pertenecen a la orden abierta', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });
      const res = await d.service.createGoodsReceipt(
        UUID,
        dtoOf(LINE_A, LINE_B),
        actor,
      );
      expect(res.itemCount).toBe(2);
      expect(d.operationsRepo.findItemsInPurchaseOrder).toHaveBeenCalledWith(
        d.tx,
        UUID,
        [LINE_A, LINE_B],
      );
    });

    it('límite: varias líneas válidas, una con rechazo parcial, calculan bien el rechazo', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      d.operationsRepo.createGoodsReceipt.mockReturnValue({ id: 'gr-1' });
      const res = await d.service.createGoodsReceipt(
        UUID,
        {
          receiptNumber: 'GR-001',
          items: [
            { purchaseOrderItemId: LINE_A, receivedQuantity: '10' },
            {
              purchaseOrderItemId: LINE_B,
              receivedQuantity: '10',
              acceptedQuantity: '7',
            },
          ],
        },
        actor,
      );
      expect(res.rejectedUnits).toBe('3');
      expect(d.operationsRepo.createGoodsReceiptItem).toHaveBeenCalledTimes(2);
    });

    it('error: una línea de otra orden del mismo tenant → 422 sin recepción ni cambio de estado', async () => {
      const d = build();
      const order: any = openOrder();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(order);
      d.operationsRepo.findItemsInPurchaseOrder.mockResolvedValue([
        { id: LINE_A, purchaseOrderId: 'po-1' },
      ]);
      const error: any = await d.service
        .createGoodsReceipt(UUID, dtoOf(LINE_A, LINE_B), actor)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(error.reason).toBe(ErpErrorReason.ERP_PO_ITEM_NOT_IN_ORDER);
      expect(order.statusConceptId).toBe(CONCEPTS.PO_OPEN);
      expect(d.operationsRepo.createGoodsReceipt).not.toHaveBeenCalled();
      expect(d.operationsRepo.createGoodsReceiptItem).not.toHaveBeenCalled();
    });

    it('falla catalogada: una línea inexistente → 422 ERP_PO_ITEM_NOT_IN_ORDER', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      d.operationsRepo.findItemsInPurchaseOrder.mockResolvedValue([]);
      await expect(
        d.service.createGoodsReceipt(UUID, dtoOf(LINE_A), actor),
      ).rejects.toMatchObject({
        status: 422,
        reason: ErpErrorReason.ERP_PO_ITEM_NOT_IN_ORDER,
      });
      expect(d.operationsRepo.createGoodsReceipt).not.toHaveBeenCalled();
    });

    it('falla catalogada: una línea repetida → 422 aunque exista', async () => {
      const d = build();
      d.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      await expect(
        d.service.createGoodsReceipt(UUID, dtoOf(LINE_A, LINE_A), actor),
      ).rejects.toMatchObject({
        status: 422,
        reason: ErpErrorReason.ERP_PO_ITEM_NOT_IN_ORDER,
      });
      expect(d.operationsRepo.createGoodsReceipt).not.toHaveBeenCalled();
    });

    it('la línea de otro tenant falta del resultado y se informa igual que una inexistente', async () => {
      const ajena = build();
      ajena.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      ajena.operationsRepo.findItemsInPurchaseOrder.mockResolvedValue([]);
      const inexistente = build();
      inexistente.operationsRepo.findPurchaseOrderForUpdate.mockResolvedValue(
        openOrder(),
      );
      inexistente.operationsRepo.findItemsInPurchaseOrder.mockResolvedValue([]);
      const errA: any = await ajena.service
        .createGoodsReceipt(UUID, dtoOf(LINE_A), actor)
        .catch((e: unknown) => e);
      const errB: any = await inexistente.service
        .createGoodsReceipt(UUID, dtoOf(LINE_B), actor)
        .catch((e: unknown) => e);
      expect(errA.getResponse()).toEqual(errB.getResponse());
      expect(errA.details).toBeUndefined();
    });
  });
});
