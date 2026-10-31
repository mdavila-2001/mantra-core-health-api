import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';
import { CATEGORY_NAME_MAX } from '../services/pharmacy-catalog-rules';
import { IsCatalogMoney } from './catalog-fields.dto';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

export {
  BULK_MAX_ROWS,
  BULK_MODES,
  BULK_OUTCOMES,
  BulkRequestDto,
  BulkResponseDto,
  BulkRowErrorDto,
  BulkRowResultDto,
  type BulkMode,
  type BulkOutcome,
} from '../../../common/dto/bulk-load.dto';

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

/** Tope del nombre de un medicamento escrito en una fila. */
export const MEDICATION_NAME_MAX = 300;

/**
 * Fila de `products/bulk` para dar de alta: el alta de siempre y, opcional, el
 * medicamento por su nombre.
 */
export class BulkProductCreateRowDto extends CreateProductDto {
  /**
   * Nombre del medicamento tal como figura en el catálogo con que se receta
   * (sin importar mayúsculas ni tildes). El servidor lo resuelve a su concepto;
   * si no está, o nombra a más de uno, la fila se rechaza (también en la vista
   * previa). No va con `catalogProductId` ni con `medicationConceptId`.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MEDICATION_NAME_MAX)
  medicationName?: string;
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

  /**
   * Nombre del medicamento, como en el alta: vincula el producto existente.
   * Ausente deja el vínculo como está.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MEDICATION_NAME_MAX)
  medicationName?: string;
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
  @IsStrictBoolean()
  pickupAvailable?: boolean;

  /**
   * Si la sede hace envíos a domicilio.
   */
  @IsOptional()
  @IsStrictBoolean()
  homeDeliveryAvailable?: boolean;
}
