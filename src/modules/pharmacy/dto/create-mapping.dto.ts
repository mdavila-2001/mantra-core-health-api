import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de
 * `POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings`
 * (UC-24-08).
 */
export class CreateMappingDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ description: 'Producto a mapear', format: 'uuid' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Valor de external product code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de producto en el sistema externo',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalProductCode!: string;

  /**
   * Valor de external unit code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de unidad en el sistema externo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalUnitCode?: string;

  /**
   * Valor de mapping version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión del mapeo', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mappingVersion?: string;
}
