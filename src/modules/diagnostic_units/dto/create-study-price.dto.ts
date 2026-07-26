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
  @ApiProperty({ description: 'Oferta de estudio a tarificar', format: 'uuid' })
  @IsUUID()
  diagnosticStudyOfferingId!: string;

  @ApiProperty({ description: 'Importe base', example: '120.00' })
  @IsNumberString()
  baseAmount!: string;

  @ApiPropertyOptional({ description: 'Importe a paciente', example: '120.00' })
  @IsOptional()
  @IsNumberString()
  patientAmount?: string;

  @ApiPropertyOptional({ description: 'Importe a aseguradora', example: '80.00' })
  @IsOptional()
  @IsNumberString()
  insurerAmount?: string;

  @ApiPropertyOptional({ description: 'Impuesto', example: '18.00' })
  @IsOptional()
  @IsNumberString()
  taxAmount?: string;

  @ApiPropertyOptional({ description: 'Factor de descuento', example: '0.10' })
  @IsOptional()
  @IsNumberString()
  discountFactor?: string;

  @ApiPropertyOptional({ description: 'Reglas de precio (JSON)' })
  @IsOptional()
  @IsObject()
  pricingRuleJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Vigente desde', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;
}
