import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * Cuerpo de
 * `PATCH /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings/{mappingId}`:
 * corrige un vínculo. Lo que no viene no cambia; al menos un campo.
 */
export class UpdateMappingDto {
  /**
   * Producto al que pasa el vínculo.
   */
  @ApiPropertyOptional({
    description: 'Producto al que pasa el vínculo (activo, de la farmacia)',
    format: 'uuid',
  })
  @ValidateIf((dto: UpdateMappingDto) => dto.pharmacyProductId !== undefined)
  @IsUUID()
  pharmacyProductId?: string;

  /**
   * Código correcto del producto en el sistema externo.
   */
  @ApiPropertyOptional({
    description: 'Código de producto en el sistema externo',
    maxLength: 200,
  })
  @ValidateIf((dto: UpdateMappingDto) => dto.externalProductCode !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalProductCode?: string;

  /**
   * Unidad del sistema externo que equivale a una del producto; `null` la
   * borra (entonces la sincronización no la comprueba).
   */
  @ApiPropertyOptional({
    description:
      'Unidad del sistema externo que equivale a una del producto; null la borra',
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalUnitCode?: string | null;
}
