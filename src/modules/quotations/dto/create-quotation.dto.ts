import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Métodos de cálculo de interés soportados por el simulador (FT-24). */
export const INTEREST_CALCULATION_METHODS = ['FLAT', 'FRENCH'] as const;
export type InterestCalculationMethod =
  (typeof INTEREST_CALCULATION_METHODS)[number];

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
 * Tasa de interés con hasta cuatro decimales y sin signo (p. ej. `2.5`, `1.75`).
 */
const RATE_PATTERN = /^\d+(\.\d{1,4})?$/;
const RATE_PATTERN_MESSAGE =
  'La tasa de interés debe ser un número positivo con hasta cuatro decimales';

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
   * Cantidad de cuotas del plan de pagos ofrecido.
   */
  @ApiProperty({ description: 'Cantidad de cuotas del plan de pagos' })
  @IsInt()
  @Min(1)
  @Max(360)
  paymentPlanInstallmentCount!: number;

  /**
   * Tasa de interés mensual, en porcentaje (p. ej. `2.5` = 2.5% mensual).
   */
  @ApiProperty({
    description: 'Tasa de interés mensual, en porcentaje (p. ej. "2.5")',
    example: '2.5',
  })
  @IsNumberString()
  @Matches(RATE_PATTERN, { message: RATE_PATTERN_MESSAGE })
  interestRatePercent!: string;

  /**
   * Método de cálculo del interés del plan de pagos.
   */
  @ApiProperty({
    description: 'Método de cálculo del interés',
    enum: INTEREST_CALCULATION_METHODS,
  })
  @IsIn(INTEREST_CALCULATION_METHODS)
  interestCalculationMethod!: InterestCalculationMethod;

  /**
   * Fecha hasta la que la oferta es válida.
   */
  @ApiProperty({ description: 'Fecha de validez de la oferta (ISO)' })
  @IsDateString()
  validUntil!: string;
}
