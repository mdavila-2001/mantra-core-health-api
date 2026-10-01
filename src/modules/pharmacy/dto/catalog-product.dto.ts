import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CATALOG_SEARCH_DEFAULT_LIMIT,
  CATALOG_SEARCH_MAX_LIMIT,
  CATALOG_SEARCH_MIN_LENGTH,
  MEDICINE_SOURCES,
  type MedicineSource,
} from '../pharmacy-catalog.properties';

/** Filtros de `GET /pharmacy/catalog-products`. */
@ApiSchema({ name: 'PharmacyCatalogProductQueryDto' })
export class CatalogProductQueryDto {
  /**
   * Texto a buscar en nombre, principio activo, ATC, titular o nº de registro.
   */
  @ApiPropertyOptional({
    description:
      'Nombre, principio activo, ATC, titular o nº de registro (mínimo 2 letras)',
    minLength: CATALOG_SEARCH_MIN_LENGTH,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(CATALOG_SEARCH_MIN_LENGTH)
  @MaxLength(100)
  search?: string;

  /**
   * Registro oficial del que viene el producto.
   */
  @ApiPropertyOptional({ enum: MEDICINE_SOURCES })
  @IsOptional()
  @IsIn(MEDICINE_SOURCES)
  source?: MedicineSource;

  /**
   * Código ATC de nivel 5 exacto (p. ej. `N02BE01`).
   */
  @ApiPropertyOptional({
    description: 'ATC nivel 5 exacto',
    example: 'N02BE01',
  })
  @IsOptional()
  @Matches(/^[A-Z]\d{2}[A-Z]{2}\d{2}$/, {
    message: 'atc debe ser un código ATC de nivel 5 (p. ej. N02BE01)',
  })
  atc?: string;

  /**
   * Cuántos resultados como máximo.
   */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: CATALOG_SEARCH_MAX_LIMIT,
    default: CATALOG_SEARCH_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CATALOG_SEARCH_MAX_LIMIT)
  limit?: number;
}

/** Un principio activo tal como la fuente lo declara. */
export class CatalogIngredientDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  amount!: string | null;

  @ApiPropertyOptional({ nullable: true })
  unit!: string | null;
}

/** Una presentación comercial del producto. */
export class CatalogPresentationDto {
  /**
   * Código de la fuente (CN, CUM…). **No** es un GTIN.
   */
  @ApiPropertyOptional({ nullable: true })
  code!: string | null;

  @ApiProperty()
  name!: string;

  /**
   * Sólo si la fuente publica el código de barras; nunca se deduce.
   */
  @ApiPropertyOptional({ nullable: true })
  gtin!: string | null;

  @ApiPropertyOptional({ nullable: true })
  active!: boolean | null;
}

/** Foto oficial del envase, con la atribución que exige la fuente. */
export class CatalogPhotoDto {
  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  thumbUrl!: string | null;

  @ApiProperty()
  attribution!: string;
}

/** Un producto del catálogo universal de medicamentos. */
@ApiSchema({ name: 'PharmacyCatalogProductDto' })
export class CatalogProductDto {
  /**
   * Id del concepto en la terminología; es lo que viaja como `catalogProductId` en el alta.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: MEDICINE_SOURCES })
  source!: MedicineSource;

  @ApiProperty()
  sourceName!: string;

  /**
   * Id de origen en la fuente (nº de registro sanitario).
   */
  @ApiProperty()
  code!: string;

  @ApiProperty()
  display!: string;

  @ApiPropertyOptional({ nullable: true })
  holder!: string | null;

  @ApiPropertyOptional({ nullable: true })
  strengthText!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dosageForm!: string | null;

  /**
   * `null` = la fuente no lo declara.
   */
  @ApiPropertyOptional({ nullable: true })
  requiresPrescription!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  generic!: boolean | null;

  @ApiProperty({ type: [CatalogIngredientDto] })
  activeIngredients!: CatalogIngredientDto[];

  @ApiProperty({ type: [String] })
  atc!: string[];

  @ApiProperty({ type: [CatalogPresentationDto] })
  presentations!: CatalogPresentationDto[];

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED'] })
  regulatoryStatus!: string;

  /**
   * Sólo un registro vigente se puede elegir.
   */
  @ApiProperty()
  selectable!: boolean;

  @ApiPropertyOptional({ type: CatalogPhotoDto, nullable: true })
  photo!: CatalogPhotoDto | null;

  @ApiPropertyOptional({ nullable: true })
  sourceUrl!: string | null;
}

/** La página de la búsqueda en el catálogo. */
@ApiSchema({ name: 'PharmacyCatalogProductPageDto' })
export class CatalogProductPageDto {
  @ApiProperty({ type: [CatalogProductDto] })
  items!: CatalogProductDto[];

  @ApiProperty()
  limit!: number;

  /**
   * `true` si quedaron productos afuera del tope.
   */
  @ApiProperty()
  truncated!: boolean;
}
