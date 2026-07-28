import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/inventory-items` (UC-14-10). */
export class CreateInventoryItemDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del insumo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a product concept.
   */
  @ApiPropertyOptional({ description: 'Concepto de producto', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productConceptId?: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de lote', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  /**
   * Valor de expiry date mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de caducidad (ISO date)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de unidad de medida',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de reorder level mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nivel de reorden (numérico)' })
  @IsOptional()
  @IsNumberString()
  reorderLevel?: string;
}
