import { jest } from '@jest/globals';
import { BILL } from '../../../billing/billing.concepts';
import { InvoiceLines } from '../../../billing/entities';
import { BillingPatientInvoiceAdapter } from './billing-patient-invoice.adapter';

/**
 * Factura al paciente sobre el repositorio de `billing` (carril 16,
 * REQ-16-028): una cabecera y una línea que coinciden con la parte calculada y
 * quedan vinculadas a la línea del reclamo.
 */

const fn = () => jest.fn<(...args: any[]) => any>();

function build() {
  const order: string[] = [];
  const tx = {
    flush: fn().mockImplementation(async () => {
      order.push('flush');
    }),
    findOne: fn().mockResolvedValue(null),
  };
  const invoices = {
    create: fn().mockImplementation((_tx: unknown, data: any) => {
      order.push('create-header');
      return { id: 'invoice-1', ...data };
    }),
    createLine: fn().mockImplementation((_tx: unknown, data: any) => {
      order.push('create-line');
      return { id: 'invoice-line-1', ...data };
    }),
  };
  return {
    adapter: new BillingPatientInvoiceAdapter(invoices as never),
    tx,
    invoices,
    order,
  };
}

const input = {
  practiceId: 'practice-1',
  patientProfileId: 'patient-1',
  currencyConceptId: 'BOB',
  insuranceClaimLineId: 'claim-line-1',
  description: 'Parte del paciente de un servicio con seguro',
  amount: '140.00',
  actorUserId: 'user-billing',
};

describe('BillingPatientInvoiceAdapter', () => {
  describe('issuePatientInvoice', () => {
    it('crea una cabecera emitida cuyos totales son la parte del paciente', async () => {
      const { adapter, tx, invoices } = build();
      await adapter.issuePatientInvoice(tx as never, input);
      expect(invoices.create.mock.calls[0][1]).toMatchObject({
        practiceId: 'practice-1',
        patientProfileId: 'patient-1',
        statusConceptId: BILL.INVOICE_ISSUED,
        subtotal: '140.00',
        taxTotal: '0.00',
        discountTotal: '0.00',
        total: '140.00',
        paidTotal: '0.00',
        balance: '140.00',
        currencyConceptId: 'BOB',
        actorUserId: 'user-billing',
      });
      expect(invoices.create.mock.calls[0][1].invoiceNumber).toMatch(
        /^INV-\d+-[0-9a-f]{8}$/,
      );
    });

    it('persiste la cabecera antes de crear la línea (las FK son uuid planas)', async () => {
      const { adapter, tx, order } = build();
      await adapter.issuePatientInvoice(tx as never, input);
      expect(order).toEqual(['create-header', 'flush', 'create-line']);
    });

    it('la línea vincula el reclamo y repite el importe, sin descuento ni impuesto', async () => {
      const { adapter, tx, invoices } = build();
      await adapter.issuePatientInvoice(tx as never, input);
      expect(invoices.createLine.mock.calls[0][1]).toEqual({
        invoiceId: 'invoice-1',
        insuranceClaimLineId: 'claim-line-1',
        description: input.description,
        quantity: '1',
        unitPrice: '140.00',
        lineTotal: '140.00',
        actorUserId: 'user-billing',
      });
    });

    it('devuelve los ids y el número, y no hace el flush final (lo hace el caso de uso)', async () => {
      const { adapter, tx } = build();
      const issued = await adapter.issuePatientInvoice(tx as never, input);
      expect(issued).toEqual({
        invoiceId: 'invoice-1',
        invoiceLineId: 'invoice-line-1',
        invoiceNumber: expect.stringMatching(/^INV-/),
      });
      expect(tx.flush).toHaveBeenCalledTimes(1);
    });

    it('sin moneda declarada la factura no inventa una', async () => {
      const { adapter, tx, invoices } = build();
      await adapter.issuePatientInvoice(tx as never, {
        ...input,
        currencyConceptId: null,
      });
      expect(
        invoices.create.mock.calls[0][1].currencyConceptId,
      ).toBeUndefined();
    });
  });

  describe('findInvoiceLineByClaimLine', () => {
    it('devuelve la línea de factura que ya respalda la línea del reclamo', async () => {
      const { adapter, tx } = build();
      tx.findOne.mockResolvedValue({ id: 'il-1', invoiceId: 'inv-1' });
      await expect(
        adapter.findInvoiceLineByClaimLine(tx as never, 'claim-line-1'),
      ).resolves.toEqual({ invoiceId: 'inv-1', invoiceLineId: 'il-1' });
      expect(tx.findOne).toHaveBeenCalledWith(InvoiceLines, {
        insuranceClaimLineId: 'claim-line-1',
      });
    });

    it('si no hay ninguna devuelve null', async () => {
      const { adapter, tx } = build();
      await expect(
        adapter.findInvoiceLineByClaimLine(tx as never, 'claim-line-1'),
      ).resolves.toBeNull();
    });
  });
});
