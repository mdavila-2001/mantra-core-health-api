import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumberString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  INTEREST_CALCULATION_METHODS,
  type InterestCalculationMethod,
} from './create-quotation.dto';

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';
const RATE_PATTERN = /^\d+(\.\d{1,4})?$/;
const RATE_PATTERN_MESSAGE =
  'La tasa de interés debe ser un número positivo con hasta cuatro decimales';

/**
 * Cuerpo de `POST /quotations/simulate`: corre el simulador de financiamiento
 * sin persistir nada, para que la interfaz muestre la tabla de cuotas antes de
 * confirmar la cotización.
 */
export class SimulatePaymentPlanDto {
  /**
   * Precio ofrecido sobre el que se calcula el plan de pagos.
   */
  @ApiProperty({ description: 'Precio ofrecido', example: '1500.00' })
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  offeredPrice!: string;

  /**
   * Cantidad de cuotas a simular.
   */
  @ApiProperty({ description: 'Cantidad de cuotas' })
  @IsInt()
  @Min(1)
  @Max(360)
  installmentCount!: number;

  /**
   * Tasa de interés mensual, en porcentaje.
   */
  @ApiProperty({
    description: 'Tasa de interés mensual, en porcentaje (p. ej. "2.5")',
    example: '2.5',
  })
  @IsNumberString()
  @Matches(RATE_PATTERN, { message: RATE_PATTERN_MESSAGE })
  interestRatePercent!: string;

  /**
   * Método de cálculo del interés.
   */
  @ApiProperty({
    description: 'Método de cálculo del interés',
    enum: INTEREST_CALCULATION_METHODS,
  })
  @IsIn(INTEREST_CALCULATION_METHODS)
  interestCalculationMethod!: InterestCalculationMethod;

  /**
   * Fecha de atención, usada como base para calcular los vencimientos de las
   * cuotas (cuotas mensuales a partir de esta fecha).
   */
  @ApiProperty({ description: 'Fecha de atención (ISO), base de los vencimientos' })
  @IsDateString()
  attentionDate!: string;
}
