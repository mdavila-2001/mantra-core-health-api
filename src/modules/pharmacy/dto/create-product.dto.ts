import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsCatalogMoney } from './catalog-fields.dto';
import {
  CATEGORY_NAME_MAX,
  DEFAULT_MIN_STOCK,
  DESCRIPTION_MAX,
  MAX_PRODUCT_IMAGES,
  STOCK_MAX,
} from '../services/pharmacy-catalog-rules';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Tipos de identificador soportados. */
export type IdentifierTypeCode = 'GTIN' | 'NDC';

/** Identificador de producto (GTIN/NDC) que acompaña la publicación (UC-24-04). */
export class ProductIdentifierDto {
  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de identificador', enum: ['GTIN', 'NDC'] })
  @IsIn(['GTIN', 'NDC'])
  identifierType!: IdentifierTypeCode;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del identificador', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  identifierValue!: string;

  /**
   * Identificador asociado a assigning authority tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant de la autoridad que asigna el identificador',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assigningAuthorityTenantId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /pharmacies/{pharmacyId}/products` (UC-24-04). */
@ApiSchema({ name: 'PharmacyCreateProductDto' })
export class CreateProductDto {
  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de producto por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  productCode!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiPropertyOptional({
    description:
      'Producto del catálogo universal de medicamentos (id de `GET /pharmacy/catalog-products`). ' +
      'Con él, marca, genérico, concentración, forma, presentación, receta y el medicamento ' +
      'del vademécum los deriva el servidor y mandarlos es un 400.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  catalogProductId?: string;

  @ApiPropertyOptional({
    description:
      'Presentación elegida del producto del catálogo (su `code`: CN, CUM…). Sólo con `catalogProductId`.',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  catalogPresentationCode?: string;

  @ApiPropertyOptional({
    description: 'Concept id del medicamento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  /**
   * Identificador asociado a manufacturer tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant fabricante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  manufacturerTenantId?: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  brandName?: string;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre genérico', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  genericName?: string;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Concentración (texto libre)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  strengthText?: string;

  /**
   * Identificador asociado a dosage form concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la forma farmacéutica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dosageFormConceptId?: string;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tamaño de empaque (texto libre)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageSizeText?: string;

  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere receta' })
  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  /**
   * Valor de cold chain required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere cadena de frío' })
  @IsOptional()
  @IsBoolean()
  coldChainRequired?: boolean;

  /**
   * Valor de identifiers mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificadores (GTIN/NDC)',
    type: [ProductIdentifierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIdentifierDto)
  identifiers?: ProductIdentifierDto[];

  /*
   * P47 §3-5 · lo que administra la propia farmacia. Con `catalogProductId`
   * también se aceptan: no son datos del registro sanitario.
   */

  /** Precio de venta en bolivianos (número o texto decimal, ≤ 2 decimales). */
  @ApiPropertyOptional({
    description:
      'Precio de venta en bolivianos (número o texto decimal, hasta 2 decimales). Se versiona en la lista pública `CATALOGO` de la farmacia.',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 12.5,
  })
  @IsOptional()
  @IsCatalogMoney()
  unitPrice?: number | string;

  /** Categoría de la vitrina, por nombre: una de las de la farmacia. */
  @ApiPropertyOptional({
    description:
      'Categoría de la vitrina, por nombre (sin distinguir mayúsculas ni tildes). Tiene que ser una de `GET /pharmacies/{pharmacyId}/categories`: otra es 422.',
    maxLength: CATEGORY_NAME_MAX,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX)
  category?: string;

  /** Descripción para el paciente. */
  @ApiPropertyOptional({
    description: 'Descripción para el paciente',
    maxLength: DESCRIPTION_MAX,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(DESCRIPTION_MAX)
  description?: string;

  /**
   * `false` = la farmacia lo carga pero hoy no lo tiene. No se manda junto con
   * `stock` (422).
   */
  @ApiPropertyOptional({
    description:
      '`false` = «no lo tengo» (sin conteo). Junto con `stock` es 422: dirían dos cosas a la vez.',
  })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  /** Publicado (por defecto) o borrador. */
  @ApiPropertyOptional({
    description:
      'Estado: `PUBLISHED` (por defecto) o `DRAFT` (sólo lo ve la farmacia). `WITHDRAWN` no vale en el alta.',
    enum: ['PUBLISHED', 'DRAFT'],
  })
  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT'])
  status?: 'PUBLISHED' | 'DRAFT';

  /** Existencias declaradas; sin ellas, «sin conteo». */
  @ApiPropertyOptional({
    description:
      'Existencias declaradas (sin ellas el producto queda «sin conteo»)',
    minimum: 0,
    maximum: STOCK_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(STOCK_MAX)
  stock?: number;

  /** Umbral de alerta de existencias. */
  @ApiPropertyOptional({
    description: `Umbral de alerta (sin él, ${DEFAULT_MIN_STOCK})`,
    minimum: 0,
    maximum: STOCK_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(STOCK_MAX)
  minStock?: number;

  /** Imágenes propias, archivos de `common.files` subidos por el actor. */
  @ApiPropertyOptional({
    description: `Hasta ${MAX_PRODUCT_IMAGES} imágenes (ids de \`POST /common/files/upload\`, categoría IMAGE, subidas por quien publica)`,
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
