import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CATEGORY_NAME_MAX } from '../services/pharmacy-catalog-rules';
import { IsCatalogMoney } from './catalog-fields.dto';
import { UpdateProductDto } from './update-product.dto';

/** Cómo trata la carga una clave que ya existe o que falta. */
export const BULK_MODES = ['CREATE', 'UPDATE', 'UPSERT'] as const;
export type BulkMode = (typeof BULK_MODES)[number];

/** Qué pasó con cada fila. */
export const BULK_OUTCOMES = [
  'CREATED',
  'UPDATED',
  'REJECTED',
  'UNCHANGED',
] as const;
export type BulkOutcome = (typeof BULK_OUTCOMES)[number];

/** Tope de filas por pedido: el cuerpo JSON no pasa de 1 MB. */
export const BULK_MAX_ROWS = 1000;

/**
 * Cuerpo de `POST /pharmacies/:pharmacyId/{categories|products|prices|sites}/bulk`.
 *
 * Las filas viajan como objetos sueltos a propósito: el pipe global no las
 * valida, porque una fila mala no puede tumbar el pedido. Cada una se valida
 * después, con el DTO de su tabla, y el error vuelve en su resultado.
 */
export class BulkRequestDto {
  /**
   * `CREATE` rechaza una clave existente; `UPDATE`, una ausente; `UPSERT` acepta las dos.
   */
  @ApiProperty({ enum: BULK_MODES })
  @IsIn(BULK_MODES)
  mode!: BulkMode;

  /**
   * Con `true` no escribe nada y responde lo que habría pasado con cada fila.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  /**
   * Las filas, en el orden del archivo (entre 1 y 1000).
   */
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    minItems: 1,
    maxItems: BULK_MAX_ROWS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_MAX_ROWS)
  @IsObject({ each: true })
  // Sin esto, la conversión implícita del pipe global convierte cada fila en
  // un arreglo; con `Object` la fila llega tal cual y la valida su tabla.
  @Type(() => Object)
  rows!: Record<string, unknown>[];
}

/** Por qué se rechazó una fila. */
export class BulkRowErrorDto {
  /**
   * Campo de la fila, o `row` si el problema es la fila entera.
   */
  @ApiProperty()
  field!: string;

  /**
   * Código estable del motivo.
   */
  @ApiProperty()
  reason!: string;

  /**
   * El motivo en castellano, para mostrarlo tal cual.
   */
  @ApiPropertyOptional()
  message?: string;
}

/** Lo que pasó con una fila. */
export class BulkRowResultDto {
  /**
   * Número de fila, desde 1, en el orden del pedido.
   */
  @ApiProperty()
  row!: number;

  /**
   * Resultado de la fila.
   */
  @ApiProperty({ enum: BULK_OUTCOMES })
  outcome!: BulkOutcome;

  /**
   * Registro creado o cambiado; solo sin `dryRun` y si no se rechazó.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  /**
   * Motivos del rechazo; solo con `REJECTED`.
   */
  @ApiPropertyOptional({ type: [BulkRowErrorDto] })
  errors?: BulkRowErrorDto[];
}

/** Respuesta de una carga masiva: una entrada por fila, en orden. */
export class BulkResponseDto {
  /**
   * Si fue una vista previa sin escritura.
   */
  @ApiProperty()
  dryRun!: boolean;

  /**
   * Resultado por fila.
   */
  @ApiProperty({ type: [BulkRowResultDto] })
  results!: BulkRowResultDto[];
}

/** Fila de `categories/bulk`: la clave es el nombre sin mayúsculas ni tildes. */
export class BulkCategoryRowDto {
  /**
   * Nombre de la categoría.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_NAME_MAX)
  name!: string;
}

/** Fila de `prices/bulk`: precio de venta vigente de un producto por su código. */
export class BulkPriceRowDto {
  /**
   * Código del producto en el catálogo de la farmacia.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productCode!: string;

  /**
   * Importe positivo con hasta dos decimales.
   */
  @IsCatalogMoney()
  unitPrice!: number | string;
}

/** Fila de `products/bulk` para cambiar un producto existente. */
export class BulkProductUpdateRowDto extends UpdateProductDto {
  /**
   * Código del producto: la clave de la fila, no se cambia.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productCode!: string;
}

/** Fila de `sites/bulk`: una sede de venta por su código. */
export class BulkSiteRowDto {
  /**
   * Código de la sede, único en la farmacia.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  /**
   * Nombre de la sede.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name!: string;

  /**
   * Dirección en texto libre (solo al crear).
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLines?: string;

  /**
   * Latitud WGS84 (solo al crear, junto con la longitud).
   */
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  /**
   * Longitud WGS84 (solo al crear, junto con la latitud).
   */
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  /**
   * Si la sede acepta retiro en mostrador.
   */
  @IsOptional()
  @IsBoolean()
  pickupAvailable?: boolean;

  /**
   * Si la sede hace envíos a domicilio.
   */
  @IsOptional()
  @IsBoolean()
  homeDeliveryAvailable?: boolean;
}
