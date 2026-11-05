import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';
import {
  CATEGORY_NAME_MAX,
  STOCK_MAX,
} from '../services/pharmacy-catalog-rules';

/** Tope de líneas de un guardado de inventario en lote. */
export const INVENTORY_LINES_MAX = 500;

/** Cuerpo de `POST|PATCH /pharmacies/{pharmacyId}/categories[/{categoryId}]`. */
@ApiSchema({ name: 'PharmacyCategoryNameDto' })
export class CategoryNameDto {
  /** Nombre de la categoría (único en la farmacia sin mayúsculas ni tildes). */
  @ApiProperty({ minLength: 1, maxLength: CATEGORY_NAME_MAX })
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX)
  name!: string;
}

/**
 * Una línea del inventario: **o bien** cantidades (`stock` y/o `minStock`),
 * **o bien** sólo `inStock`. Las dos juntas, o ninguna, es 422.
 */
@ApiSchema({ name: 'PharmacyInventoryLineDto' })
export class InventoryLineDto {
  /** Producto del catálogo de la farmacia. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId!: string;

  /** Existencias declaradas. */
  @ApiPropertyOptional({ minimum: 0, maximum: STOCK_MAX })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(STOCK_MAX)
  stock?: number;

  /** Umbral de alerta. */
  @ApiPropertyOptional({ minimum: 0, maximum: STOCK_MAX })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(STOCK_MAX)
  minStock?: number;

  /** «Hay / no hay», sin conteo. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsStrictBoolean()
  inStock?: boolean;
}

/** Cuerpo de `PATCH /pharmacies/{pharmacyId}/inventory`: todo o nada. */
@ApiSchema({ name: 'PharmacyUpdateInventoryDto' })
export class UpdateInventoryDto {
  /** Las líneas a guardar juntas. */
  @ApiProperty({
    type: [InventoryLineDto],
    minItems: 1,
    maxItems: INVENTORY_LINES_MAX,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(INVENTORY_LINES_MAX)
  @ValidateNested({ each: true })
  @Type(() => InventoryLineDto)
  lines!: InventoryLineDto[];
}

/** Respuesta del guardado de inventario. */
export class InventoryUpdatedDto {
  /** Cuántos productos se guardaron. */
  @ApiProperty()
  updated!: number;
}
