import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Cada cuánto vence una cuota (FT-24, v4.2.18). Es sólo el punto de partida
 * del cronograma: cada cuota trae su propia fecha y puede moverse.
 */
export const PAYMENT_FREQUENCIES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

/** Tope de cuotas de un plan. El mismo que tenía el simulador retirado. */
export const MAX_INSTALLMENTS = 360;

/**
 * Importe con hasta dos decimales y sin signo.
 *
 * Mismo criterio que `billing/dto/service-catalog.dto.ts`: `@IsNumberString()`
 * a secas acepta negativos y más de dos decimales, ninguno válido en un
 * endpoint que fija el precio ofrecido de una cotización.
 */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';

/**
 * Acepta un importe como texto **o como número JSON** y lo entrega siempre como
 * texto, sin redondear (AG-35 · M4 H3.S1.M1).
 *
 * El front de cotizaciones arma los importes como `number`. Hasta ahora eso
 * pasaba sólo porque el `ValidationPipe` global de `main.ts` activa
 * `enableImplicitConversion`, una opción que ningún DTO declara: el contrato
 * funcionaba por accidente. Con esta transformación el DTO lo dice solo.
 *
 * `String(n)` y no `toFixed(2)`: `toFixed` redondea en silencio (`1.005` →
 * `"1.00"`), y un precio de salud cambiado sin aviso es peor que un 400. Lo
 * que no cierra en dos decimales sigue cayendo en {@link PRICE_PATTERN}. Un
 * número no finito (`NaN`, `Infinity`) se deja como está y lo rechaza
 * `@IsNumberString()`.
 */
function amountAsText({ value }: TransformFnParams): unknown {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : value;
}

/**
 * Una cuota del plan de pagos tal como la armó quien atiende: fecha y monto,
 * **sin interés**. Los montos no tienen por qué ser iguales.
 */
export class QuotationInstallmentInputDto {
  /**
   * Número de orden de la cuota dentro del plan (1-based, consecutivo).
   */
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  installmentNumber!: number;

  /**
   * Fecha de vencimiento de la cuota (ISO `YYYY-MM-DD`).
   */
  @ApiProperty({ example: '2026-10-10' })
  @IsDateString()
  dueDate!: string;

  /**
   * Monto de la cuota, con hasta dos decimales.
   */
  @ApiProperty({ example: '233.34' })
  @Transform(amountAsText)
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  amount!: string;
}

/** Cuerpo de `POST /quotations` (FT-24 — Creación de cotizaciones). */
export class CreateQuotationDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica (practice.practices)', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente cotizado (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Fecha de atención sobre la que se cotiza.
   */
  @ApiProperty({ description: 'Fecha de atención (ISO)' })
  @IsDateString()
  attentionDate!: string;

  /**
   * Cita asociada, opcional.
   */
  @ApiPropertyOptional({
    description: 'Cita asociada, opcional (scheduling)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * Servicio del catálogo (`billing.service_catalog`) a cotizar.
   */
  @ApiProperty({
    description: 'Servicio del catálogo (billing.service_catalog)',
    format: 'uuid',
  })
  @IsUUID()
  serviceCatalogId!: string;

  /**
   * Precio ofrecido al paciente; editable respecto del precio de catálogo.
   */
  @ApiProperty({
    description: 'Precio ofrecido al paciente (editable respecto del catálogo)',
    example: '1500.00',
  })
  @Transform(amountAsText)
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  offeredPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ description: 'Moneda (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Cantidad de cuotas del plan de pagos ofrecido. Tiene que coincidir con
   * `installments.length`; cero si el anticipo cubre el precio entero.
   */
  @ApiProperty({ description: 'Cantidad de cuotas del plan de pagos' })
  @IsInt()
  @Min(0)
  @Max(MAX_INSTALLMENTS)
  paymentPlanInstallmentCount!: number;

  /**
   * Anticipo: lo que se paga el día de la atención, antes de la primera cuota.
   */
  @ApiProperty({
    description: 'Anticipo, entre 0 y el precio ofrecido. Sin interés.',
    example: '190.00',
  })
  @Transform(amountAsText)
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  downPaymentAmount!: string;

  /**
   * Frecuencia con que se armó el cronograma.
   */
  @ApiProperty({
    description: 'Frecuencia de partida del cronograma',
    enum: PAYMENT_FREQUENCIES,
  })
  @IsIn(PAYMENT_FREQUENCIES)
  paymentFrequency!: PaymentFrequency;

  /**
   * El cronograma completo, con las fechas y montos que quedaron en pantalla.
   * Anticipo + Σ `amount` tiene que dar exactamente `offeredPrice`.
   */
  @ApiProperty({ type: [QuotationInstallmentInputDto] })
  @IsArray()
  @ArrayMaxSize(MAX_INSTALLMENTS)
  @ValidateNested({ each: true })
  @Type(() => QuotationInstallmentInputDto)
  installments!: QuotationInstallmentInputDto[];

  /**
   * Fecha hasta la que la oferta es válida.
   */
  @ApiProperty({ description: 'Fecha de validez de la oferta (ISO)' })
  @IsDateString()
  validUntil!: string;
}
