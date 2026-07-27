import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingReceivablesController } from './billing-receivables.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const invoicesService = {
    issueFromEncounter: mockFn(),
    creditNote: mockFn(),
    createPaymentPlan: mockFn(),
  };
  const paymentsReceivedService = { apply: mockFn() };
  const reimbursementsService = { link: mockFn() };
  const statementsService = { generate: mockFn() };
  const controller = new BillingReceivablesController(
    invoicesService as any,
    paymentsReceivedService as any,
    reimbursementsService as any,
    statementsService as any,
  );
  return {
    controller,
    invoicesService,
    paymentsReceivedService,
    reimbursementsService,
    statementsService,
  };
}

describe('BillingReceivablesController', () => {
  it('delegates issueFromEncounter (UC-17-01)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1' };
    d.invoicesService.issueFromEncounter.mockResolvedValue({ id: 'inv1' });
    await expect(
      d.controller.issueFromEncounter(dto as any, actor),
    ).resolves.toEqual({ id: 'inv1' });
    expect(d.invoicesService.issueFromEncounter).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates applyPayment (UC-17-02)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1', amount: '10.00' };
    await d.controller.applyPayment(dto as any, actor);
    expect(d.paymentsReceivedService.apply).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates creditNote (UC-17-03)', async () => {
    const d = build();
    const dto = { reason: 'x' };
    await d.controller.creditNote('inv1', dto as any, actor);
    expect(d.invoicesService.creditNote).toHaveBeenCalledWith(
      'inv1',
      dto,
      actor,
    );
  });

  it('delegates linkReimbursement (UC-17-08)', async () => {
    const d = build();
    const dto = { claimId: 'c1', invoiceId: 'inv1', amount: '1.00' };
    await d.controller.linkReimbursement(dto, actor);
    expect(d.reimbursementsService.link).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates generateStatement (UC-17-09)', async () => {
    const d = build();
    const dto = { practiceId: 'pr1', patientProfileId: 'p1' };
    await d.controller.generateStatement(dto as any, actor);
    expect(d.statementsService.generate).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createPaymentPlan (UC-17-11)', async () => {
    const d = build();
    const dto = { sourceInvoiceId: 'inv1' };
    await d.controller.createPaymentPlan(dto as any, actor);
    expect(d.invoicesService.createPaymentPlan).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});
