import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuotationDto } from './create-quotation.dto';

/**
 * El alta de cotización con el plan flexible (v4.2.18), validada igual que la
 * valida el `ValidationPipe` global de `main.ts`: `whitelist` +
 * `forbidNonWhitelisted` + transformación. Lo que importa acá es que las
 * cuotas **anidadas** también se validen, y que el contrato viejo (con tasa)
 * ya no entre.
 */
const VALID_BODY = {
  practiceId: '11111111-1111-4111-8111-111111111111',
  patientProfileId: '22222222-2222-4222-8222-222222222222',
  attentionDate: '2026-09-20',
  serviceCatalogId: '33333333-3333-4333-8333-333333333333',
  offeredPrice: '890.00',
  paymentPlanInstallmentCount: 2,
  downPaymentAmount: '190.00',
  paymentFrequency: 'BIWEEKLY',
  installments: [
    { installmentNumber: 1, dueDate: '2026-10-04', amount: '500.00' },
    { installmentNumber: 2, dueDate: '2026-12-24', amount: '200.00' },
  ],
  validUntil: '2026-10-20',
};

async function validationErrors(
  body: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateQuotationDto, body, {
    enableImplicitConversion: true,
  });
  const result = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const failingPaths = (e: (typeof result)[number], prefix = ''): string[] => [
    ...(e.constraints ? [`${prefix}${e.property}`] : []),
    ...(e.children ?? []).flatMap((child) =>
      failingPaths(child, `${prefix}${e.property}.`),
    ),
  ];
  return result.flatMap((e) => failingPaths(e));
}

describe('CreateQuotationDto (plan flexible, sin interés)', () => {
  it('acepta un plan flexible con cuotas desparejas', async () => {
    expect(await validationErrors(VALID_BODY)).toEqual([]);
  });

  it('rechaza el contrato viejo con tasa y método', async () => {
    const res = await validationErrors({
      ...VALID_BODY,
      interestRatePercent: '2.5',
      interestCalculationMethod: 'FLAT',
    });
    expect(res).toEqual(
      expect.arrayContaining([
        'interestRatePercent',
        'interestCalculationMethod',
      ]),
    );
  });

  it('valida cada cuota anidada: fecha y monto', async () => {
    const res = await validationErrors({
      ...VALID_BODY,
      installments: [
        { installmentNumber: 1, dueDate: 'mañana', amount: '500.00' },
        { installmentNumber: 2, dueDate: '2026-12-24', amount: '-200' },
      ],
    });
    expect(res).toEqual(
      expect.arrayContaining([
        'installments.0.dueDate',
        'installments.1.amount',
      ]),
    );
  });

  it('rechaza una frecuencia fuera de las tres y un anticipo negativo', async () => {
    const res = await validationErrors({
      ...VALID_BODY,
      paymentFrequency: 'DAILY',
      downPaymentAmount: '-1',
    });
    expect(res).toEqual(
      expect.arrayContaining(['paymentFrequency', 'downPaymentAmount']),
    );
  });
});
