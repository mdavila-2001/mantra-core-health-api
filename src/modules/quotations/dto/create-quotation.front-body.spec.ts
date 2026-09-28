import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { CreateQuotationDto } from './create-quotation.dto';

/**
 * AG-35 / M4 · H3.S1.M1 — el body **tal como lo arma el front**
 * (`quotation-form.ts#guardar`): los tres importes viajan como `number` JSON
 * (`offeredPrice: Number(...)`, `downPaymentAmount: anticipo ?? 0` y cada
 * `amount` = `centavos / 100`).
 *
 * Se valida con un `ValidationPipe` y no con `validate()` suelto, porque la
 * pregunta es qué hace la API real con ese body. Dos configuraciones:
 *
 * - `GLOBAL`: idéntica a la de `main.ts`. Así se midió que el 400 del informe
 *   del 24/09 **no** ocurre: la conversión implícita pasa `1500` a `"1500"`.
 * - `SIN_CONVERSION`: la misma sin `enableImplicitConversion`. Es la que
 *   demuestra que el contrato ya no depende de esa opción global — que es lo
 *   que hacía que funcionara por accidente.
 */
const GLOBAL = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
const SIN_CONVERSION = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const META: ArgumentMetadata = {
  type: 'body',
  metatype: CreateQuotationDto,
  data: '',
};

/** 1500.00 = 300.00 de anticipo + 3 cuotas de 400.00, como en el Gherkin de BR-25. */
const FRONT_BODY = {
  practiceId: '11111111-1111-4111-8111-111111111111',
  patientProfileId: '22222222-2222-4222-8222-222222222222',
  attentionDate: '2026-09-20',
  serviceCatalogId: '33333333-3333-4333-8333-333333333333',
  offeredPrice: 1500,
  paymentPlanInstallmentCount: 3,
  downPaymentAmount: 300,
  paymentFrequency: 'MONTHLY',
  installments: [
    { installmentNumber: 1, dueDate: '2026-10-20', amount: 400 },
    { installmentNumber: 2, dueDate: '2026-11-20', amount: 400 },
    { installmentNumber: 3, dueDate: '2026-12-20', amount: 400 },
  ],
  validUntil: '2026-10-20',
};

/** El mismo body con otros importes, para los casos límite e inválidos. */
function conImportes(
  offeredPrice: unknown,
  downPaymentAmount: unknown,
  amounts: unknown[],
) {
  return {
    ...FRONT_BODY,
    offeredPrice,
    downPaymentAmount,
    paymentPlanInstallmentCount: amounts.length,
    installments: amounts.map((amount, i) => ({
      installmentNumber: i + 1,
      dueDate: `2026-1${i}-20`,
      amount,
    })),
  };
}

async function run(
  pipe: ValidationPipe,
  body: unknown,
): Promise<CreateQuotationDto> {
  return (await pipe.transform(body, META)) as CreateQuotationDto;
}

async function rejection(
  pipe: ValidationPipe,
  body: unknown,
): Promise<unknown> {
  try {
    await run(pipe, body);
  } catch (error) {
    return error instanceof BadRequestException ? error.getResponse() : error;
  }
  return null;
}

describe('CreateQuotationDto con el body del front (AG-35 · M4 H3.S1.M1)', () => {
  describe.each([
    ['con el pipe global de main.ts', GLOBAL],
    ['sin conversión implícita', SIN_CONVERSION],
  ])('%s', (_nombre, pipe) => {
    it('correcto: acepta los importes numéricos del front y los entrega como texto exacto', async () => {
      const dto = await run(pipe, FRONT_BODY);

      expect(dto.offeredPrice).toBe('1500');
      expect(dto.downPaymentAmount).toBe('300');
      expect(dto.installments.map((c) => c.amount)).toEqual([
        '400',
        '400',
        '400',
      ]);
    });

    it('correcto: sigue aceptando los importes como texto, sin tocarlos', async () => {
      const dto = await run(
        pipe,
        conImportes('890.00', '190.00', ['500.00', '200.00']),
      );

      expect(dto.offeredPrice).toBe('890.00');
      expect(dto.installments.map((c) => c.amount)).toEqual([
        '500.00',
        '200.00',
      ]);
    });

    it('límite: cuotas con centavos que salen de centavos / 100, y anticipo cero', async () => {
      // 700.01 = 0 + 233.34 + 233.34 + 233.33 — lo que arma `fromCents` del front.
      const dto = await run(
        pipe,
        conImportes(700.01, 0, [233.34, 233.34, 233.33]),
      );

      expect(dto.offeredPrice).toBe('700.01');
      expect(dto.downPaymentAmount).toBe('0');
      expect(dto.installments.map((c) => c.amount)).toEqual([
        '233.34',
        '233.34',
        '233.33',
      ]);
    });

    it('inválido: un número con más de dos decimales no se redondea en silencio: 400', async () => {
      expect(
        await rejection(pipe, conImportes(1.005, 0, [1.005])),
      ).not.toBeNull();
      // El error de coma flotante clásico tampoco pasa disfrazado de precio.
      expect(
        await rejection(pipe, conImportes(0.1 + 0.2, 0, [0.1 + 0.2])),
      ).not.toBeNull();
    });

    it('inválido: negativo, NaN o infinito dan 400', async () => {
      expect(
        await rejection(pipe, conImportes(-1500, 0, [-1500])),
      ).not.toBeNull();
      expect(
        await rejection(pipe, conImportes(Number.NaN, 0, [400])),
      ).not.toBeNull();
      expect(
        await rejection(pipe, conImportes(Number.POSITIVE_INFINITY, 0, [400])),
      ).not.toBeNull();
    });

    it('inválido: un importe que no es número ni texto numérico da 400', async () => {
      expect(await rejection(pipe, conImportes(true, 0, [400]))).not.toBeNull();
      expect(
        await rejection(pipe, conImportes('mil', 0, [400])),
      ).not.toBeNull();
      expect(
        await rejection(pipe, conImportes(1500, null, [1500])),
      ).not.toBeNull();
    });
  });
});
