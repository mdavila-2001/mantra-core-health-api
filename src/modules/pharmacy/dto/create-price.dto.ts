import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` (UC-24-06). */
export class CreatePriceDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({
    description: 'Producto al que se fija el precio',
    format: 'uuid',
  })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Valor de unit amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe unitario', example: 12.5 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  unitAmount!: number;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Impuesto', example: 1.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  taxAmount?: number;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe a cargo del paciente',
    example: 5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  patientAmount?: number;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe a cargo de la aseguradora',
    example: 7.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  insurerAmount?: number;

  /**
   * Valor de minimum quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad mínima', example: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  minimumQuantity?: number;
}
