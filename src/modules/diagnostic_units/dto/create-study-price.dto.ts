import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumberString,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /price-schedules/{scheduleId}/study-prices` (UC-23-07). */
export class CreateStudyPriceDto {
  /**
   * Identificador asociado a diagnostic study offering.
   */
  @ApiProperty({ description: 'Oferta de estudio a tarificar', format: 'uuid' })
  @IsUUID()
  diagnosticStudyOfferingId!: string;

  /**
   * Valor de base amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe base', example: '120.00' })
  @IsNumberString()
  baseAmount!: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Importe a paciente', example: '120.00' })
  @IsOptional()
  @IsNumberString()
  patientAmount?: string;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe a aseguradora',
    example: '80.00',
  })
  @IsOptional()
  @IsNumberString()
  insurerAmount?: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Impuesto', example: '18.00' })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;

  /**
   * Valor de discount factor mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Factor de descuento', example: '0.10' })
  @IsOptional()
  @IsNumberString()
  discountFactor?: string;

  /**
   * Valor de pricing rule json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Reglas de precio (JSON)' })
  @IsOptional()
  @IsObject()
  pricingRuleJson?: Record<string, unknown>;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;
}
