import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBooleanString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de procedimientos (o de órdenes) por búsqueda: una orden no pide más. */
export const MEDICAL_CENTER_MAX_PROCEDURES = 50;

/** Filas por página cuando el cliente no pide otro tope. */
export const MEDICAL_CENTER_DEFAULT_LIMIT = 20;

/** Tope de filas por página. */
export const MEDICAL_CENTER_MAX_LIMIT = 100;

/** Unidades en que el nomenclador expresa el precio de referencia. */
export const MEDICAL_CENTER_REFERENCE_UNITS = ['UMA', 'USD'] as const;

/**
 * Una lista separada por comas como arreglo sin repetidos ni vacíos.
 *
 * Un arreglo que ya llegó partido (`?a=1&a=2`) se respeta; cualquier otra cosa
 * pasa tal cual para que el validador la rechace en vez de adivinarla.
 */
function commaSeparated({ value }: { value: unknown }): unknown {
  const parts =
    typeof value === 'string'
      ? value.split(',')
      : Array.isArray(value)
        ? (value as unknown[])
        : undefined;
  if (parts === undefined) return value;
  return [
    ...new Set(
      parts
        .map((part) => (typeof part === 'string' ? part.trim() : part))
        .filter((part) => part !== ''),
    ),
  ];
}

/** Origen opcional de la distancia: `lat` y `lng` van juntos o no van. */
export class MedicalCenterOriginQueryDto {
  /** Latitud WGS84 desde donde medir la distancia; va con `lng`. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  /** Longitud WGS84 desde donde medir la distancia; va con `lat`. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  /** Si se incluyen también los centros que no ofrecen todo lo pedido. */
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'Por defecto solo los centros que ofrecen todo lo pedido (`complete: true`).',
  })
  @IsOptional()
  @IsBooleanString()
  includePartial?: string;
}

/** Filtros de `GET /medical-centers/search`. */
export class MedicalCenterSearchQueryDto extends MedicalCenterOriginQueryDto {
  /** Procedimientos pedidos, por su concepto del nomenclador. */
  @ApiProperty({
    type: String,
    description: 'Conceptos de procedimiento separados por coma (uuid).',
    example:
      '1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c,2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @Transform(commaSeparated)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MEDICAL_CENTER_MAX_PROCEDURES)
  @IsUUID('all', { each: true })
  procedureConceptIds!: string[];

  /** Solo centros que ofrecen algún procedimiento pedido de esta especialidad. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialty?: string;

  /** Solo centros de esta ciudad. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  /** Filas saltadas. */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  /** Tope de filas de la página. */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MEDICAL_CENTER_MAX_LIMIT,
    default: MEDICAL_CENTER_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MEDICAL_CENTER_MAX_LIMIT)
  limit?: number;
}

/** Filtros de `GET /medical-centers/search/for-my-orders`. */
export class MedicalCenterForOrdersQueryDto extends MedicalCenterOriginQueryDto {
  /** Órdenes del titular; los procedimientos salen de ellas, no de la URL. */
  @ApiProperty({
    type: String,
    description: 'Ids de órdenes de servicio del titular, separados por coma.',
  })
  @Transform(commaSeparated)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MEDICAL_CENTER_MAX_PROCEDURES)
  @IsUUID('all', { each: true })
  serviceRequestIds!: string[];
}

/** Lo que un centro ofrece de un procedimiento pedido. */
export class MedicalCenterOfferDto {
  /** Procedimiento del nomenclador. */
  @ApiProperty({ format: 'uuid' }) procedureConceptId!: string;
  /** Nombre del procedimiento para mostrar. */
  @ApiProperty() procedureDisplay!: string;
  /** Precio publicado por la sede. */
  @ApiProperty() price!: number;
  /** Moneda del precio. */
  @ApiProperty({ format: 'uuid' }) currencyConceptId!: string;
  /** Precio de referencia del nomenclador. */
  @ApiProperty({ nullable: true, type: Number }) referencePrice!: number | null;
  /** Unidad del precio de referencia. */
  @ApiProperty({
    enum: MEDICAL_CENTER_REFERENCE_UNITS,
    nullable: true,
    type: String,
  })
  referenceUnit!: (typeof MEDICAL_CENTER_REFERENCE_UNITS)[number] | null;
  /** Aviso de sobreprecio. Siempre `null` mientras no se fije el margen. */
  @ApiProperty({ nullable: true, type: Boolean })
  overMargin!: boolean | null;
}

/** Una sede en el resultado de la búsqueda. */
export class MedicalCenterItemDto {
  /** Organización dueña de la sede. */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Sede. */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  /** Nombre de la sede. */
  @ApiProperty() name!: string;
  /** Dirección en una línea. */
  @ApiProperty({ nullable: true, type: String }) addressText!: string | null;
  /** Latitud de la sede. */
  @ApiProperty({ nullable: true, type: Number }) latitude!: number | null;
  /** Longitud de la sede. */
  @ApiProperty({ nullable: true, type: Number }) longitude!: number | null;
  /** Kilómetros en línea recta desde `lat`/`lng`; `null` sin origen o sin coordenadas. */
  @ApiProperty({ nullable: true, type: Number }) distanceKm!: number | null;
  /** Ofrece todos los procedimientos pedidos. */
  @ApiProperty() complete!: boolean;
  /** Los pedidos que no ofrece, en el orden pedido. */
  @ApiProperty({ type: [String], format: 'uuid' })
  missingProcedureConceptIds!: string[];
  /** Lo que ofrece de lo pedido, en el orden pedido. */
  @ApiProperty({ type: () => [MedicalCenterOfferDto] })
  offers!: MedicalCenterOfferDto[];
  /** Suma de lo que ofrece de lo pedido; `null` si no hay una única moneda. */
  @ApiProperty({ nullable: true, type: Number }) totalPrice!: number | null;
  /** Solo en `for-my-orders`: el médico de la orden trabaja en esta sede. */
  @ApiPropertyOptional() practitionerWorksHere?: boolean;
  /** Solo en `for-my-orders`: el médico sugirió esta sede. */
  @ApiPropertyOptional() suggestedByPractitioner?: boolean;
}

/** Página de resultados. */
export class MedicalCenterPageDto {
  /** Sedes de esta página, en el orden que decide la API. */
  @ApiProperty({ type: () => [MedicalCenterItemDto] })
  items!: MedicalCenterItemDto[];
  /** Cuántas sedes cumplen el filtro, antes de paginar. */
  @ApiProperty() total!: number;
  /** Tope aplicado. */
  @ApiProperty() limit!: number;
  /** Filas saltadas. */
  @ApiProperty() offset!: number;
}
