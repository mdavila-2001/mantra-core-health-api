import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DiagnosticUnitDirectoryItemDto } from './directory-read.dto';

/** Tipo de centro que el buscador entiende. */
export type DiagnosticUnitKind = 'LABORATORY' | 'IMAGING';
export const DIAGNOSTIC_UNIT_KINDS: readonly DiagnosticUnitKind[] = [
  'LABORATORY',
  'IMAGING',
];

/** Tope de filas por página del buscador. */
export const CATALOG_MAX_LIMIT = 100;

/**
 * Filtros de `GET /diagnostic-units/search`.
 *
 * Son los que la especificación enumera —ubicación, tipo de estudio,
 * disponibilidad, precio, convenio, aseguradora y calificación— con una sola
 * diferencia deliberada: la **ubicación se filtra por organización**
 * (`tenantId`) y no por ciudad. La dirección de un sitio vive en el módulo de
 * consultorios y este módulo sólo guarda su identificador; filtrar por un texto
 * de ciudad sería inventar el dato. La ficha del centro (`GET /diagnostic-units/{id}`)
 * sí resuelve la sede completa, que es donde la dirección hace falta de verdad.
 */
export class SearchDiagnosticUnitsQueryDto {
  /** Texto libre sobre el nombre y el código del centro. */
  @ApiPropertyOptional({ description: 'Texto a buscar en nombre o código' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  /**
   * Organización propietaria.
   *
   * Opcional a propósito: quien busca dónde hacerse un análisis no busca dentro
   * de la organización con la que tiene sesión abierta, busca en la ciudad.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /** Laboratorio o imagenología. */
  @ApiPropertyOptional({ enum: DIAGNOSTIC_UNIT_KINDS })
  @IsOptional()
  @IsIn(DIAGNOSTIC_UNIT_KINDS as readonly string[])
  kind?: DiagnosticUnitKind;

  /** Sólo centros que ofrezcan este estudio. */
  @ApiPropertyOptional({ description: 'Código del estudio buscado' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  studyCode?: string;

  /** Sólo centros con convenio vigente con esta aseguradora. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  insurerTenantId?: string;

  /** Sólo centros que toman muestras a domicilio. */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBooleanString()
  homeCollection?: string;

  /** Sólo centros que atienden sin turno. */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBooleanString()
  walkIn?: string;

  /** Sólo centros que aceptan órdenes de otras instituciones. */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBooleanString()
  acceptsExternalOrders?: string;

  /** Precio máximo publicado, en la tarifa pública del centro. */
  @ApiPropertyOptional({ description: 'Tope del importe publicado' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  /** Calificación pública mínima. */
  @ApiPropertyOptional({ description: 'Nota mínima (0 a 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  /** Tope de filas. */
  @ApiPropertyOptional({ default: 20, maximum: CATALOG_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CATALOG_MAX_LIMIT)
  limit?: number;

  /** Filas a saltar. */
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Una tarjeta del buscador.
 *
 * Extiende la del directorio en vez de repetirla: es la misma tarjeta con las
 * dos cosas que sólo el buscador necesita —de qué organización es y cómo la
 * califican— y así las dos listas se ven igual en pantalla.
 */
export class DiagnosticUnitSearchItemDto extends DiagnosticUnitDirectoryItemDto {
  /** Organización propietaria del centro. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /** Calificación media publicada, o `null` si todavía no tiene reseñas. */
  @ApiPropertyOptional({ nullable: true })
  rating!: number | null;

  /** Cuántas reseñas publicadas sostienen la nota. */
  @ApiProperty()
  ratingCount!: number;

  /** Menor importe publicado en su tarifa pública, o `null` si no publica una. */
  @ApiPropertyOptional({ nullable: true })
  minAmount!: number | null;

  /**
   * Moneda de {@link minAmount} (código del concepto, p. ej. `USD`), o `null`
   * si el centro no publica una tarifa. El buscador antes devolvía el importe
   * sin moneda y la pantalla lo mostraba literal (CL-45, CL-51).
   */
  @ApiPropertyOptional({ nullable: true })
  minAmountCurrency!: string | null;

  /**
   * Ciudades donde el centro tiene una sede activa, sin duplicados.
   *
   * Sale de `common.addresses.city` a través de la sede de `practice`, no de
   * un texto propio del directorio: es la misma dirección que ya resuelve la
   * ficha del centro. Una sede sin dirección o sin ciudad cargada no aporta
   * ninguna entrada — no es que el centro no tenga ciudad, es que no se
   * conoce, y la lista no inventa una para no dejarla vacía.
   */
  @ApiProperty({ type: [String] })
  cities!: string[];
}

/** Página del buscador de centros. */
export class SearchDiagnosticUnitsResponseDto {
  /** Los centros de esta página. */
  @ApiProperty({ type: DiagnosticUnitSearchItemDto, isArray: true })
  items!: DiagnosticUnitSearchItemDto[];

  /** Cuántos casan con el filtro en total. */
  @ApiProperty()
  total!: number;

  /** Tope aplicado. */
  @ApiProperty()
  limit!: number;

  /** Filas saltadas. */
  @ApiProperty()
  offset!: number;
}
