import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ErpController } from './erp.controller';

const actor = { id: 'user-1', roles: ['ERP_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const ACC = '22222222-2222-2222-2222-222222222222';

function build() {
  const contractsService = {
    createPartner: mockFn(),
    verifyBankAccount: mockFn(),
    createContract: mockFn(),
    requestApproval: mockFn(),
    createAmendment: mockFn(),
    createRenewal: mockFn(),
    createTermination: mockFn(),
    generatePaymentSchedule: mockFn(),
  };
  const operationsService = {
    onboardEmployee: mockFn(),
    requestTimeOff: mockFn(),
    approveTimeOff: mockFn(),
    createPurchaseOrder: mockFn(),
    createGoodsReceipt: mockFn(),
    createServiceEntrySheet: mockFn(),
    runInvoiceMatch: mockFn(),
    createSalesOrder: mockFn(),
    createLeaseValuation: mockFn(),
  };
  return {
    controller: new ErpController(
      contractsService as any,
      operationsService as any,
    ),
    contractsService,
    operationsService,
  };
}

describe('ErpController', () => {
  it('delegates partner creation (UC-38-01)', async () => {
    const d = build();
    const dto = { partnerNumber: 'BP-001' } as any;
    d.contractsService.createPartner.mockResolvedValue({ id: 'bp-1' });

    await d.controller.createPartner(dto, actor);

    expect(d.contractsService.createPartner).toHaveBeenCalledWith(dto, actor);
  });

  it('passes both partner and account ids on verification (UC-38-02)', async () => {
    const d = build();
    d.contractsService.verifyBankAccount.mockResolvedValue({
      bankAccountId: ACC,
    });

    await d.controller.verifyBankAccount(ID, ACC, actor);

    expect(d.contractsService.verifyBankAccount).toHaveBeenCalledWith(
      ID,
      ACC,
      actor,
    );
  });

  it('delegates contract creation and approval (UC-38-03/04)', async () => {
    const d = build();
    d.contractsService.createContract.mockResolvedValue({ id: 'ct-1' });
    d.contractsService.requestApproval.mockResolvedValue({ id: 'appr-1' });

    await d.controller.createContract({ contractNumber: 'CT-1' } as any, actor);
    await d.controller.requestApproval(
      ID,
      { decision: 'APPROVED' } as any,
      actor,
    );

    expect(d.contractsService.createContract).toHaveBeenCalled();
    expect(d.contractsService.requestApproval).toHaveBeenCalledWith(
      ID,
      { decision: 'APPROVED' },
      actor,
    );
  });

  it('delegates amendment, renewal and termination (UC-38-05/06/07)', async () => {
    const d = build();
    d.contractsService.createAmendment.mockResolvedValue({});
    d.contractsService.createRenewal.mockResolvedValue({});
    d.contractsService.createTermination.mockResolvedValue({});

    await d.controller.createAmendment(ID, {} as any, actor);
    await d.controller.createRenewal(ID, {} as any, actor);
    await d.controller.createTermination(ID, {} as any, actor);

    expect(d.contractsService.createAmendment).toHaveBeenCalled();
    expect(d.contractsService.createRenewal).toHaveBeenCalled();
    expect(d.contractsService.createTermination).toHaveBeenCalled();
  });

  it('delegates payment schedule generation (UC-38-16)', async () => {
    const d = build();
    const dto = {
      installments: 4,
      firstDueDate: '2026-01-31T00:00:00Z',
    } as any;
    d.contractsService.generatePaymentSchedule.mockResolvedValue({
      created: 4,
    });

    await d.controller.generatePaymentSchedule(ID, dto, actor);

    expect(d.contractsService.generatePaymentSchedule).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('forwards the request id when approving time off (UC-38-09)', async () => {
    const d = build();
    const dto = { approved: true } as any;
    d.operationsService.approveTimeOff.mockResolvedValue({ id: 'to-1' });

    await d.controller.approveTimeOff(ID, ACC, dto, actor);

    // El servicio resuelve por la solicitud, no por el empleado.
    expect(d.operationsService.approveTimeOff).toHaveBeenCalledWith(
      ACC,
      dto,
      actor,
    );
  });

  it('delegates purchase order and goods receipt (UC-38-10/11)', async () => {
    const d = build();
    d.operationsService.createPurchaseOrder.mockResolvedValue({ id: 'po-1' });
    d.operationsService.createGoodsReceipt.mockResolvedValue({ id: 'gr-1' });

    await d.controller.createPurchaseOrder({ items: [] } as any, actor);
    await d.controller.createGoodsReceipt(ID, { items: [] } as any, actor);

    expect(d.operationsService.createPurchaseOrder).toHaveBeenCalled();
    expect(d.operationsService.createGoodsReceipt).toHaveBeenCalledWith(
      ID,
      { items: [] },
      actor,
    );
  });

  it('delegates the invoice match using the bill id (UC-38-13)', async () => {
    const d = build();
    const dto = { purchaseOrderId: ID, invoicedAmount: '100.00' } as any;
    d.operationsService.runInvoiceMatch.mockResolvedValue({ matched: true });

    await d.controller.runInvoiceMatch(ID, dto, actor);

    expect(d.operationsService.runInvoiceMatch).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('propagates service errors', async () => {
    const d = build();
    d.operationsService.createSalesOrder.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.createSalesOrder({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
