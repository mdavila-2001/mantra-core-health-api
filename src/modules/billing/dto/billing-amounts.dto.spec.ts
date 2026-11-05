import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ApplyPaymentReceivedDto,
  CreditNoteDto,
  ExecutePaymentMadeDto,
  IssueInvoiceFromEncounterDto,
  LinkReimbursementDto,
  RegisterBillDto,
} from './index';

const UUID = '00000000-0000-4000-8000-000000000001';

/**
 * Valida un cuerpo contra su DTO igual que el `ValidationPipe` global.
 *
 * @param cls - Clase del DTO.
 * @param body - Cuerpo crudo de la petición.
 * @returns Los nombres de propiedad (anidados con `.`) que fallaron.
 */
async function failures(
  cls: new () => object,
  body: object,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, body) as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const paths: string[] = [];
  const walk = (list: typeof errors, prefix: string) => {
    for (const e of list) {
      const path = prefix ? `${prefix}.${e.property}` : e.property;
      if (e.constraints) paths.push(path);
      if (e.children?.length) walk(e.children, path);
    }
  };
  walk(errors, '');
  return paths;
}

describe('DTO de importes: signo, escala y notación (BILL-02 / BILL-03)', () => {
  const payment = (allocation: Record<string, string>, amount = '10.00') => ({
    practiceId: UUID,
    amount,
    allocations: [{ invoiceId: UUID, allocatedAmount: '1.00', ...allocation }],
  });

  it('el cobro correcto no tiene fallos', async () => {
    expect(
      await failures(
        ApplyPaymentReceivedDto,
        payment({ discountAmount: '0.50' }),
      ),
    ).toEqual([]);
  });

  it.each([
    ['allocatedAmount', '-5.00'],
    ['discountAmount', '-1.00'],
    ['allocatedAmount', '1e2'],
    ['allocatedAmount', '1.005'],
  ])('el cobro rechaza %s=%s', async (field, value) => {
    expect(
      await failures(ApplyPaymentReceivedDto, payment({ [field]: value })),
    ).toEqual([`allocations.0.${field}`]);
  });

  it('el cobro rechaza un monto negativo', async () => {
    expect(
      await failures(ApplyPaymentReceivedDto, payment({}, '-10.00')),
    ).toEqual(['amount']);
  });

  it('el pago a proveedor rechaza retención y descuento negativos', async () => {
    const body = (extra: Record<string, string>) => ({
      practiceId: UUID,
      amount: '10.00',
      allocations: [{ billId: UUID, allocatedAmount: '1.00', ...extra }],
    });

    expect(
      await failures(ExecutePaymentMadeDto, body({ withholdingAmount: '-2' })),
    ).toEqual(['allocations.0.withholdingAmount']);
    expect(
      await failures(ExecutePaymentMadeDto, body({ discountAmount: '-2' })),
    ).toEqual(['allocations.0.discountAmount']);
  });

  it.each([
    ['quantity', '-1'],
    ['unitPrice', '-10.00'],
    ['discount', '-1.00'],
    ['taxAmount', '-1.00'],
  ])('la línea de factura rechaza %s=%s', async (field, value) => {
    expect(
      await failures(IssueInvoiceFromEncounterDto, {
        practiceId: UUID,
        patientProfileId: UUID,
        lines: [{ quantity: '1', unitPrice: '10.00', [field]: value }],
      }),
    ).toEqual([`lines.0.${field}`]);
  });

  it('la nota de crédito rechaza cantidad negativa aunque anuncie "positiva"', async () => {
    expect(
      await failures(CreditNoteDto, {
        reason: 'x',
        lines: [{ quantity: '-1', unitPrice: '10.00' }],
      }),
    ).toEqual(['lines.0.quantity']);
  });

  it('la línea de bill rechaza precio e impuesto negativos', async () => {
    expect(
      await failures(RegisterBillDto, {
        practiceId: UUID,
        vendorId: UUID,
        billNumber: 'B-1',
        lines: [{ quantity: '1', unitPrice: '-1.00', taxAmount: '-1.00' }],
      }),
    ).toEqual(['lines.0.unitPrice', 'lines.0.taxAmount']);
  });

  it('el reembolso rechaza un monto negativo', async () => {
    expect(
      await failures(LinkReimbursementDto, {
        claimId: UUID,
        invoiceId: UUID,
        amount: '-30.00',
      }),
    ).toEqual(['amount']);
  });
});
