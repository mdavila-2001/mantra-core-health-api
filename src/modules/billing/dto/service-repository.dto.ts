import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

/** Importe con hasta dos decimales y sin signo (mismo criterio que el alta). */
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
/** Mensaje del patrón de importe, en el idioma del producto. */
const PRICE_PATTERN_MESSAGE =
  'El precio debe ser un número positivo con hasta dos decimales';

/** Tope de servicios por importación: lo que cabe en una selección de pantalla. */
export const SERVICE_IMPORT_MAX_ITEMS = 50;

/** De qué fuente viene un servicio del repositorio. */
export class ServiceRepositorySourceDto {
  /** Código del sistema de códigos (`cups`, `fonasa-mle-2026`, …). */
  @ApiProperty({ example: 'cups' })
  codeSystem!: string;

  /** Nombre legible del sistema de códigos. */
  @ApiProperty({
    example: 'CUPS — Clasificación Única de Procedimientos en Salud',
  })
  name!: string;

  /** Organismo o fuente que lo publica, cuando está registrado. */
  @ApiPropertyOptional({ nullable: true, type: String })
  publisher!: string | null;
}

/** Una especialidad que atiende el servicio, según la fuente. */
export class ServiceRepositorySpecialtyDto {
  /** Concepto de la especialidad (`VS_MEDICAL_SPECIALTY`). */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Código del modelo, p. ej. `CARDIOLOGIA`. */
  @ApiProperty({ example: 'CARDIOLOGIA' })
  code!: string;

  /** Nombre visible. */
  @ApiProperty({ example: 'Cardiología' })
  display!: string;
}

/** Un servicio del repositorio de referencia, listo para importar. */
export class ServiceRepositoryItemDto {
  /** Concepto del servicio: es lo que se manda al importar. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Código en su fuente. */
  @ApiProperty()
  code!: string;

  /** Nombre en castellano, tal cual lo publica la fuente. */
  @ApiProperty()
  display!: string;

  /** Fuente del servicio. */
  @ApiProperty({ type: ServiceRepositorySourceDto })
  source!: ServiceRepositorySourceDto;

  /** Especialidades que lo atienden (puede estar vacía: no toda fuente lo dice). */
  @ApiProperty({ type: [ServiceRepositorySpecialtyDto] })
  specialties!: ServiceRepositorySpecialtyDto[];

  /** Precio de referencia de la fuente, si publica uno. No es un precio del profesional. */
  @ApiPropertyOptional({ nullable: true, type: String })
  referencePrice!: string | null;

  /** Unidad del precio de referencia (`UMA`, `CLP`…), sin convertir. */
  @ApiPropertyOptional({ nullable: true, type: String })
  priceUnit!: string | null;

  /**
   * Si se pidió con `practiceId`: el servicio del catálogo de esa práctica que
   * ya lo importó. `null` = todavía no está en su catálogo.
   */
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  importedServiceCatalogId!: string | null;
}

/** Respuesta de `GET /billing/service-catalog/repository`. */
export class ServiceRepositorySearchResponseDto {
  /** Servicios de esta página, los más parecidos a la búsqueda primero. */
  @ApiProperty({ type: [ServiceRepositoryItemDto] })
  items!: ServiceRepositoryItemDto[];

  /** Cursor opaco de la página siguiente, o `null`. */
  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}

/** Un valor de faceta con su recuento. */
export class ServiceRepositoryFacetDto {
  /** Identificador del filtro: código del sistema, o id del concepto de la especialidad. */
  @ApiProperty()
  key!: string;

  /** Código legible (`CARDIOLOGIA`, `cups`). */
  @ApiProperty()
  code!: string;

  /** Nombre visible. */
  @ApiProperty()
  display!: string;

  /** Servicios del repositorio con ese valor. */
  @ApiProperty()
  count!: number;
}

/** Respuesta de `GET /billing/service-catalog/repository/facets`. */
export class ServiceRepositoryFacetsResponseDto {
  /** Total de servicios importables. */
  @ApiProperty()
  total!: number;

  /** Fuentes, con su recuento. */
  @ApiProperty({ type: [ServiceRepositoryFacetDto] })
  sources!: ServiceRepositoryFacetDto[];

  /** Especialidades, con su recuento. */
  @ApiProperty({ type: [ServiceRepositoryFacetDto] })
  specialties!: ServiceRepositoryFacetDto[];
}

/** Un servicio a importar, con el precio que pone el profesional. */
export class ImportServiceItemDto {
  /** Concepto del repositorio a importar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  conceptId!: string;

  /** Precio propio del profesional. */
  @ApiProperty({ example: '250.00' })
  @IsNumberString()
  @Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })
  defaultPrice!: string;

  /** Moneda (concepto); por defecto la del alta normal. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/** Cuerpo de `POST /billing/service-catalog/import`. */
export class ImportServicesDto {
  /** Práctica cuyo catálogo recibe los servicios. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /** Servicios a importar. */
  @ApiProperty({ type: [ImportServiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SERVICE_IMPORT_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ImportServiceItemDto)
  items!: ImportServiceItemDto[];
}

/** Resultado de un servicio importado. */
export class ImportServiceResultDto {
  /** Concepto pedido. */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** `CREATED` si nació ahora; `ALREADY_IMPORTED` si la práctica ya lo tenía. */
  @ApiProperty({ enum: ['CREATED', 'ALREADY_IMPORTED'] })
  outcome!: 'CREATED' | 'ALREADY_IMPORTED';

  /** Servicio del catálogo de la práctica. */
  @ApiProperty({ format: 'uuid' })
  serviceCatalogId!: string;
}

/** Respuesta de `POST /billing/service-catalog/import`. */
export class ImportServicesResponseDto {
  /** Un resultado por servicio pedido, en el mismo orden. */
  @ApiProperty({ type: [ImportServiceResultDto] })
  items!: ImportServiceResultDto[];
}
