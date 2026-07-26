import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Cuerpo de
 * `POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings`
 * (UC-24-08).
 */
export class CreateMappingDto {
  @ApiProperty({ description: 'Producto a mapear', format: 'uuid' })
  @IsUUID()
  pharmacyProductId!: string;

  @ApiProperty({ description: 'Código de producto en el sistema externo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalProductCode!: string;

  @ApiPropertyOptional({ description: 'Código de unidad en el sistema externo', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalUnitCode?: string;

  @ApiPropertyOptional({ description: 'Versión del mapeo', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mappingVersion?: string;
}
