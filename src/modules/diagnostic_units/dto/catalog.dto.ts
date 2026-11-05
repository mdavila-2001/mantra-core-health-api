import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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

/** Tope de estudios por búsqueda de cobertura: una orden no pide más. */
export const COVERAGE_MAX_STUDIES = 50;

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

  /**
   * Búsqueda por cobertura: los estudios pedidos, por su concepto.
   *
   * Va por `study_concept_id` y no por `studyCode` porque el código de la
   * oferta es el propio de cada centro, mientras que la orden del paciente y la
   * oferta comparten el concepto. Con este parámetro cada centro dice si los
   * ofrece todos, cuáles le faltan y a qué distancia está, y los completos van
   * primero.
   */
  @ApiPropertyOptional({
    type: String,
    description:
      'Conceptos de estudio separados por coma (uuid). Activa la búsqueda por cobertura.',
    example:
      '1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c,2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @Transform(commaSeparated)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(COVERAGE_MAX_STUDIES)
  @IsUUID('all', { each: true })
  studyConceptIds?: string[];

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

  /*
   * Lo que sigue solo viene con `studyConceptIds` (búsqueda por cobertura).
   * Son opcionales en la misma tarjeta, y no una respuesta aparte, para que el
   * contrato del buscador solo crezca: quien ya lo consume no ve nada distinto.
   */

  /** Solo con `studyConceptIds`: ofrece todos los conceptos pedidos. */
  @ApiPropertyOptional({
    description:
      'Solo con `studyConceptIds`: ofrece todos los estudios pedidos',
  })
  complete?: boolean;

  /** Solo con `studyConceptIds`: los pedidos que no ofrece, en el orden pedido. */
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Solo con `studyConceptIds`: los estudios pedidos que no ofrece',
  })
  missingStudyConceptIds?: string[];

  /**
   * Solo con `studyConceptIds`: kilómetros en línea recta desde `lat`/`lng`
   * hasta la sede principal, con un decimal; `null` sin origen o sin
   * coordenadas de la sede.
   */
  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description:
      'Solo con `studyConceptIds`: km en línea recta desde `lat`/`lng` hasta la sede principal',
  })
  distanceKm?: number | null;

  /** Solo con `studyConceptIds`: dirección de la sede principal en una línea. */
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Solo con `studyConceptIds`: dirección de la sede principal',
  })
  addressText?: string | null;

  /** Solo con `studyConceptIds`: latitud de la sede principal. */
  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Solo con `studyConceptIds`: latitud de la sede principal',
  })
  latitude?: number | null;

  /** Solo con `studyConceptIds`: longitud de la sede principal. */
  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Solo con `studyConceptIds`: longitud de la sede principal',
  })
  longitude?: number | null;
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

/**
 * Una tarjeta de la búsqueda por cobertura: la del buscador con los campos de
 * cobertura siempre presentes. Es el tipo que arma el servicio; en el contrato
 * publicado son los opcionales de {@link DiagnosticUnitSearchItemDto}.
 */
export type DiagnosticUnitCoverageItem = DiagnosticUnitSearchItemDto & {
  /** Ofrece todos los conceptos pedidos. */
  complete: boolean;
  /** Los pedidos que no ofrece, en el orden pedido. */
  missingStudyConceptIds: string[];
  /** Km en línea recta hasta la sede principal, o `null`. */
  distanceKm: number | null;
  /** Dirección de la sede principal, o `null`. */
  addressText: string | null;
  /** Latitud de la sede principal, o `null`. */
  latitude: number | null;
  /** Longitud de la sede principal, o `null`. */
  longitude: number | null;
};

/** Página de la búsqueda por cobertura: completos primero, después por distancia. */
export type DiagnosticUnitCoveragePage = Omit<
  SearchDiagnosticUnitsResponseDto,
  'items'
> & {
  /** Los centros de esta página. */
  items: DiagnosticUnitCoverageItem[];
};
