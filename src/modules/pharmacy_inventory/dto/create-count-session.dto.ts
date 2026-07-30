import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Un producto/lote a incluir en el snapshot de conteo. */
export class CountSessionItemDto {
  /**
   * Identificador asociado a pharmacy product.
   */
  @ApiProperty({ format: 'uuid', description: 'Producto de farmacia' })
  @IsUUID()
  pharmacyProductId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Lote específico' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;
}

/** Cuerpo de `POST /pharmacy/:siteId/count-sessions` (UC-25-06). */
export class CreateCountSessionDto {
  /**
   * Identificador asociado a inventory location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación a contar' })
  @IsUUID()
  inventoryLocationId!: string;

  /**
   * Valor de freeze mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Congelar movimientos durante el conteo',
  })
  @IsOptional()
  @IsBoolean()
  freeze?: boolean;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [CountSessionItemDto],
    description: 'Productos/lotes a contar',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountSessionItemDto)
  items!: CountSessionItemDto[];
}
