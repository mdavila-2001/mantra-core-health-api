import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { InvoicesService } from './invoices.service';
import { BILL } from '../billing.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const invoicesRepo = {
    findByNumber: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    createLine: mockFn(),
  };
  const linksRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new InvoicesService(
    em as any,
    invoicesRepo as any,
    linksRepo,
    logger as any,
  );
  return { service, tx, em, invoicesRepo, linksRepo };
}

describe('InvoicesService', () => {
  describe('issueFromEncounter (UC-17-01)', () => {
    it('creates the invoice, flushes before lines and records the encounter link', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue(null);
      const invoice = {
        id: 'inv1',
        invoiceNumber: 'INV-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_ISSUED,
        total: '200.00',
        balance: '200.00',
      };
      d.invoicesRepo.create.mockReturnValue(invoice);

      const res = await d.service.issueFromEncounter(
        {
          practiceId: 'pr1',
          patientProfileId: 'p1',
          encounterId: 'e1',
          tenantId: 't1',
          lines: [
            { quantity: '1', unitPrice: '100.00' },
            { quantity: '1', unitPrice: '100.00' },
          ],
        },
        actor,
      );

      expect(res.id).toBe('inv1');
      expect(res.lineCount).toBe(2);
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.invoicesRepo.createLine).toHaveBeenCalledTimes(2);
      expect(d.linksRepo.create).toHaveBeenCalled();
    });

    it('rejects a duplicate invoice number (conflict)', async () => {
      const d = build();
      d.invoicesRepo.findByNumber.mockResolvedValue({ id: 'other' });
      await expect(
        d.service.issueFromEncounter(
          {
            practiceId: 'pr1',
            patientProfileId: 'p1',
            invoiceNumber: 'DUP',
            lines: [{ quantity: '1', unitPrice: '1' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.invoicesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('creditNote (UC-17-03)', () => {
    it('throws when the original invoice does not exist', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.creditNote(
          'missing',
          { reason: 'x', lines: [{ quantity: '1', unitPrice: '1' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the credit exceeds the balance and is not a write-off', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        balance: '10.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
      });
      await expect(
        d.service.creditNote(
          'inv1',
          {
            reason: 'x',
            lines: [{ quantity: '1', unitPrice: '100.00' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('issues the credit note and adjusts the original balance', async () => {
      const d = build();
      const original = {
        id: 'inv1',
        balance: '100.00',
        statusConceptId: BILL.INVOICE_ISSUED,
        practiceId: 'pr1',
        patientProfileId: 'p1',
        updatedAt: new Date(),
      };
      d.invoicesRepo.findById.mockResolvedValue(original);
      d.invoicesRepo.create.mockReturnValue({
        id: 'nc1',
        invoiceNumber: 'NC-1',
        patientProfileId: 'p1',
        statusConceptId: BILL.INVOICE_CREDIT_NOTE,
      });

      const res = await d.service.creditNote(
        'inv1',
        {
          reason: 'x',
          tenantId: 't1',
          lines: [{ quantity: '1', unitPrice: '40.00' }],
        },
        actor,
      );

      expect(res.id).toBe('nc1');
      expect(original.balance).toBe('60.00');
      expect(original.statusConceptId).toBe(BILL.INVOICE_ADJUSTED);
      expect(d.linksRepo.create).toHaveBeenCalled();
    });
  });

  describe('createPaymentPlan (UC-17-11)', () => {
    it('rejects when installments do not sum the balance', async () => {
      const d = build();
      d.invoicesRepo.findById.mockResolvedValue({
        id: 'inv1',
        balance: '100.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
        invoiceNumber: 'INV-1',
      });
      await expect(
        d.service.createPaymentPlan(
          {
            sourceInvoiceId: 'inv1',
            installments: [{ dueDate: '2026-01-01', amount: '40.00' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates one child invoice per installment and flips the source to payment plan', async () => {
      const d = build();
      const source = {
        id: 'inv1',
        balance: '100.00',
        practiceId: 'pr1',
        patientProfileId: 'p1',
        invoiceNumber: 'INV-1',
        statusConceptId: BILL.INVOICE_ISSUED,
        updatedAt: new Date(),
      };
      d.invoicesRepo.findById.mockResolvedValue(source);
      d.invoicesRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `c-${data.invoiceNumber}`,
        invoiceNumber: data.invoiceNumber,
        total: data.total,
        dueDate: data.dueDate,
      }));

      const res = await d.service.createPaymentPlan(
        {
          sourceInvoiceId: 'inv1',
          tenantId: 't1',
          installments: [
            { dueDate: '2026-01-01', amount: '50.00' },
            { dueDate: '2026-02-01', amount: '50.00' },
          ],
        },
        actor,
      );

      expect(res.installmentCount).toBe(2);
      expect(source.statusConceptId).toBe(BILL.INVOICE_PAYMENT_PLAN);
      expect(d.linksRepo.create).toHaveBeenCalledTimes(2);
    });
  });
});
