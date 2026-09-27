import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
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

/** Tope de renglones de receta por consulta de disponibilidad. */
export const PUBLIC_BRANCH_AVAILABILITY_MAX_TERMS = 20;
/** Tope de largo de un renglón, en caracteres. */
export const PUBLIC_BRANCH_AVAILABILITY_MAX_TERM_LENGTH = 100;

/** Un punto en grados decimales, como lo sirve la superficie pública. */
export class PublicGeoPointDto {
  @ApiProperty({ example: -17.7833 })
  lat!: number;

  @ApiProperty({ example: -63.1821 })
  lng!: number;
}

/**
 * Una sucursal de la cadena, como se lee desde afuera (P37).
 *
 * Mismo contrato que `PublicPharmacyBranch` del front, más `id` (la sede),
 * que es lo único que distingue dos sedes del mismo tenant: comparten ficha y
 * por eso comparten `slug`.
 */
export class PublicPharmacyBranchDto {
  /** La sede (`pharmacy.pharmacy_sites`). */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El slug de la ficha pública del tenant dueño de la sede. */
  @ApiProperty()
  slug!: string;

  /** «Farmacorp · San Miguel»: la farmacia y la sede. */
  @ApiProperty()
  name!: string;

  /** Sólo la sede («San Miguel»). */
  @ApiProperty()
  siteName!: string;

  @ApiProperty({ type: String, nullable: true })
  city!: string | null;

  @ApiProperty({ type: String, nullable: true })
  addressText!: string | null;

  /** Siempre `null` por ahora: el teléfono público de una sede no se modela. */
  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;

  /** Siempre `null` por ahora: el horario publicado no se modela como texto. */
  @ApiProperty({ type: String, nullable: true })
  openingHours!: string | null;

  /** Sin punto no hay pin ni distancia; la sucursal se lista igual. */
  @ApiProperty({ type: PublicGeoPointDto, nullable: true })
  location!: PublicGeoPointDto | null;

  /** `null`: el modelo no declara la precisión del punto. */
  @ApiProperty({ type: String, nullable: true })
  locationAccuracy!: string | null;

  /** Si la sede es del tenant cuya ficha se está mirando. */
  @ApiProperty()
  isCurrent!: boolean;
}

/** Envoltura pública de las sucursales. Sin paginar: son pocas y van todas. */
export class PublicPharmacyBranchPageDto {
  @ApiProperty({ type: [PublicPharmacyBranchDto] })
  items!: PublicPharmacyBranchDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  totalHint!: number | null;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}

/**
 * Query de `GET /public/profiles/f/:slug/branch-availability`.
 *
 * `items` son los renglones de la receta separados por `|`, tal como los
 * escribe una persona. El origen es opcional y va de a pares.
 */
export class PublicBranchAvailabilityQueryDto {
  @ApiPropertyOptional({
    description:
      'Renglones de la receta separados por «|» (hasta 20, de hasta 100 caracteres cada uno)',
    example: 'amoxicilina 500|paracetamol',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  items?: string;

  @ApiPropertyOptional({ description: 'Latitud del origen (va con lng)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitud del origen (va con lat)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

/** Un renglón de la receta que la sucursal sí tiene. */
export class PublicBranchMatchDto {
  /** Lo que la persona escribió. */
  @ApiProperty()
  term!: string;

  @ApiProperty()
  genericName!: string;

  @ApiProperty({ type: String, nullable: true })
  brandName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  presentation!: string | null;

  /** Texto exacto; `null` si no hay precio publicado. */
  @ApiProperty({ type: String, nullable: true })
  price!: string | null;

  @ApiProperty({ type: String, nullable: true })
  currency!: string | null;
}

/** Qué tiene una sucursal de una receta concreta. */
export class PublicBranchAvailabilityDto {
  @ApiProperty({ type: PublicPharmacyBranchDto })
  branch!: PublicPharmacyBranchDto;

  @ApiProperty({ type: [PublicBranchMatchDto] })
  matches!: PublicBranchMatchDto[];

  /** Los renglones que no tiene, o tiene agotados. */
  @ApiProperty({ type: [String] })
  missing!: string[];

  /** Lo dice el servidor: hubo renglones y no falta ninguno. */
  @ApiProperty()
  complete!: boolean;

  /** Suma de lo que tiene con precio, texto exacto; `null` sin precios. */
  @ApiProperty({ type: String, nullable: true })
  totalAmount!: string | null;

  @ApiProperty({ type: String, nullable: true })
  currency!: string | null;

  /** Distancia en línea recta, con un decimal; `null` sin origen o sin punto. */
  @ApiProperty({ type: Number, nullable: true })
  distanceKm!: number | null;
}

/** Respuesta de la disponibilidad: ya ordenada por el servidor. */
export class PublicBranchAvailabilityResponseDto {
  @ApiProperty({ type: [PublicBranchAvailabilityDto] })
  items!: PublicBranchAvailabilityDto[];

  @ApiProperty()
  count!: number;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}
