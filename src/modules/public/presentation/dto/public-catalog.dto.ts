import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de página de las lecturas públicas (`CONTRATO-PUBLICO.md`: [1, 50]). */
export const PUBLIC_CATALOG_MAX_LIMIT = 50;
/** Página por omisión (`CONTRATO-PUBLICO.md`: 20). */
export const PUBLIC_CATALOG_DEFAULT_LIMIT = 20;

/**
 * Query de las dos lecturas de ficha. Se valida (400) en vez de ignorar basura
 * en silencio: con `forbidNonWhitelisted`, un parámetro de más también es 400.
 */
export class PublicCatalogPageQueryDto {
  /** Cursor opaco devuelto por la página anterior en `nextCursor`. */
  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  /** Tamaño de página, entre 1 y 50. */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: PUBLIC_CATALOG_MAX_LIMIT,
    default: PUBLIC_CATALOG_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_CATALOG_MAX_LIMIT)
  limit?: number;
}

/**
 * Un servicio que una organización ofrece, como se lee desde afuera.
 *
 * Mismo contrato que `PublicOfferedService` del front
 * (`core/data-access/public-catalog/public-catalog.types.ts`).
 */
export class PublicOfferedServiceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El código del catálogo. */
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  /** Qué incluye, cuando la organización lo escribió. */
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  /**
   * Precio de referencia como texto exacto, o `null` si no hay uno definido
   * (un `default_price` en cero es «Definí el precio», no «gratis»).
   */
  @ApiProperty({ type: String, nullable: true, example: '150.00' })
  price!: string | null;

  /** Código de la moneda (`BOB`), o `null` cuando no hay precio. */
  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currency!: string | null;

  /** Un servicio dado de baja se sigue listando, rotulado. */
  @ApiProperty()
  isActive!: boolean;
}

/** Un producto que una farmacia ofrece, como se lee desde afuera. */
export class PublicPharmacyProductDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El genérico: es por lo que busca quien lleva una receta. */
  @ApiProperty()
  genericName!: string;

  /** La marca concreta, o `null` si vende el genérico. */
  @ApiProperty({ type: String, nullable: true })
  brandName!: string | null;

  /** Concentración y presentación publicadas, o `null`. */
  @ApiProperty({ type: String, nullable: true, example: '500 mg · caja x 10' })
  presentation!: string | null;

  /**
   * Siempre `null` por ahora: el grupo terapéutico no es columna del modelo y
   * derivarlo del ATC no está decidido. No se inventa.
   */
  @ApiProperty({ type: String, nullable: true })
  therapeuticGroup!: string | null;

  /** Precio de esta farmacia, texto exacto. `null` = sin precio publicado. */
  @ApiProperty({ type: String, nullable: true, example: '12.50' })
  price!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currency!: string | null;

  /** Si lo tiene ahora. Un agotado se lista rotulado, no se esconde. */
  @ApiProperty()
  inStock!: boolean;

  @ApiProperty()
  requiresPrescription!: boolean;
}

/** Envoltura de página pública (`CONTRATO-PUBLICO.md` §envoltura). */
export class PublicOfferedServicePageDto {
  @ApiProperty({ type: [PublicOfferedServiceDto] })
  items!: PublicOfferedServiceDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;

  /** Sin conteo: contar todo el catálogo por pedido no se justifica. */
  @ApiProperty({ type: Number, nullable: true })
  totalHint!: number | null;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}

/** Envoltura de página pública de productos de farmacia. */
export class PublicPharmacyProductPageDto {
  @ApiProperty({ type: [PublicPharmacyProductDto] })
  items!: PublicPharmacyProductDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  totalHint!: number | null;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}
