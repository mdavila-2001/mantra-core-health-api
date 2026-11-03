import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsStrictBoolean } from '../../../common/validators/strict-boolean.validator';
import { CATALOG_STATUSES, IsCatalogMoney } from './catalog-fields.dto';
import {
  CATEGORY_NAME_MAX,
  DESCRIPTION_MAX,
  MAX_PRODUCT_IMAGES,
  STOCK_MAX,
} from '../services/pharmacy-catalog-rules';

/**
 * Cuerpo de `PATCH /pharmacies/{pharmacyId}/products/{productId}` (P47 §2).
 *
 * Cada clave es opcional: una clave ausente deja el dato como está y `null`
 * lo borra. Los cinco datos descriptivos no se editan en un producto del
 * catálogo universal (400); precio, categoría, descripción, existencias,
 * estado e imágenes (P47 §3-5) sí.
 */
@ApiSchema({ name: 'PharmacyUpdateProductDto' })
export class UpdateProductDto {
  /**
   * Marca comercial; `null` la borra.
   */
  @ApiPropertyOptional({
    description: 'Marca comercial; `null` la borra',
    minLength: 1,
    maxLength: 300,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  brandName?: string | null;

  /**
   * Nombre genérico; `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Nombre genérico; `null` lo borra',
    minLength: 1,
    maxLength: 300,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  genericName?: string | null;

  /**
   * Concentración (texto libre); `null` la borra.
   */
  @ApiPropertyOptional({
    description: 'Concentración (texto libre); `null` la borra',
    minLength: 1,
    maxLength: 200,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  strengthText?: string | null;

  /**
   * Tamaño de empaque (texto libre); `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Tamaño de empaque (texto libre); `null` lo borra',
    minLength: 1,
    maxLength: 200,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  packageSizeText?: string | null;

  /**
   * Si requiere receta; `null` lo borra.
   */
  @ApiPropertyOptional({
    description: 'Requiere receta; `null` lo borra',
    nullable: true,
    type: Boolean,
  })
  @IsOptional()
  @IsStrictBoolean()
  requiresPrescription?: boolean | null;

  /**
   * Medicamento con que se receta (el concepto elegido del catálogo
   * `medication`, el mismo que usa la receta); `null` lo desvincula. Es lo que
   * cruza el producto con una receta compartida. Un concepto que no está en ese
   * catálogo es 422 `MEDICATION_NOT_IN_CATALOG`. En un producto del catálogo
   * universal sólo completa el que falta: el que trajo el registro oficial no
   * se cambia (400).
   */
  @ApiPropertyOptional({
    description:
      'Medicamento del catálogo `medication` con que se receta; `null` lo desvincula. Fuera de ese catálogo es 422.',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string | null;

  /*
   * P47 §3-5 · lo que administra la propia farmacia. Valen también para un
   * producto del catálogo universal.
   */

  /** Precio de venta en bolivianos; `null` lo quita. */
  @ApiPropertyOptional({
    description:
      'Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales); `null` lo quita. Se versiona en la lista pública `CATALOGO`.',
    oneOf: [{ type: 'number', nullable: true }, { type: 'string' }],
    example: 12.5,
  })
  @IsOptional()
  @IsCatalogMoney()
  unitPrice?: number | string | null;

  /** Categoría por nombre; `null` la quita. */
  @ApiPropertyOptional({
    description:
      'Categoría por nombre (una de la farmacia; otra es 422); `null` la quita',
    maxLength: CATEGORY_NAME_MAX,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX)
  category?: string | null;

  /** Descripción para el paciente; `null` la borra. */
  @ApiPropertyOptional({
    description: 'Descripción para el paciente; `null` la borra',
    maxLength: DESCRIPTION_MAX,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(DESCRIPTION_MAX)
  description?: string | null;

  /** «Hay / no hay». No se manda junto con `stock` (422). */
  @ApiPropertyOptional({
    description:
      '`false` = «no lo tengo»; `true` vuelve a tenerlo (si el conteo estaba en 0 queda «sin conteo»). Junto con `stock` es 422.',
  })
  @IsOptional()
  @IsStrictBoolean()
  inStock?: boolean;

  /** Publicado, borrador o retirado. */
  @ApiPropertyOptional({
    description:
      '`PUBLISHED`, `DRAFT` o `WITHDRAWN` (retira como el DELETE). Un retirado sólo acepta volver a `PUBLISHED`/`DRAFT`.',
    enum: CATALOG_STATUSES,
  })
  @IsOptional()
  @IsIn(CATALOG_STATUSES)
  status?: (typeof CATALOG_STATUSES)[number];

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

  /** Las imágenes del producto, completas y en orden (reemplaza las de antes). */
  @ApiPropertyOptional({
    description: `Las imágenes, completas y en orden: reemplaza las anteriores. Hasta ${MAX_PRODUCT_IMAGES}; una nueva tiene que ser un archivo IMAGE subido por quien edita.`,
    type: [String],
    format: 'uuid',
    maxItems: MAX_PRODUCT_IMAGES,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRODUCT_IMAGES)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  imageFileIds?: string[];
}
