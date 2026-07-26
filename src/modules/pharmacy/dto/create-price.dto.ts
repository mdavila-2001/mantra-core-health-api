import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` (UC-24-06). */
export class CreatePriceDto {
  @ApiProperty({ description: 'Producto al que se fija el precio', format: 'uuid' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ description: 'Importe unitario', example: 12.5 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  unitAmount!: number;

  @ApiPropertyOptional({ description: 'Impuesto', example: 1.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Importe a cargo del paciente', example: 5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  patientAmount?: number;

  @ApiPropertyOptional({ description: 'Importe a cargo de la aseguradora', example: 7.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  insurerAmount?: number;

  @ApiPropertyOptional({ description: 'Cantidad mínima', example: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  minimumQuantity?: number;
}
