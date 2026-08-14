import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Largo máximo de la nota clínica del tratamiento. */
const NOTE_MAX_LENGTH = 4000;

/** Largo máximo de la precisión del sitio (cara, superficie). */
const SITE_DETAIL_MAX_LENGTH = 200;

/**
 * Cuerpo de `POST /dental-procedures`.
 *
 * ## Qué es lo mínimo
 *
 * Paciente, qué se hizo y quién lo hizo. Todo lo demás es opcional porque un
 * histórico odontológico se carga muchas veces **hacia atrás** —lo que ya se
 * hizo, a veces en otra clínica— y exigir la pieza o el encuentro dejaría fuera
 * justamente el caso que el cliente pidió ver.
 */
export class CreateDentalProcedureDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente tratado' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Qué se hizo. Los códigos sembrados salen de `GET /dental-procedures/catalog`; se admite cualquier concepto válido.',
  })
  @IsUUID()
  procedureCodeConceptId!: string;

  /**
   * Identificador asociado a performer profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Odontólogo que lo realizó. Si se omite se toma el profesional de la sesión.',
  })
  @IsOptional()
  @IsUUID()
  performerProfileId?: string;

  /**
   * Pieza (FDI) o cuadrante tratado.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Pieza dentaria en notación FDI o cuadrante. Tiene que ser uno de los sitios del catálogo.',
  })
  @IsOptional()
  @IsUUID()
  toothSiteConceptId?: string;

  /**
   * Precisión escrita del sitio.
   */
  @ApiPropertyOptional({
    maxLength: SITE_DETAIL_MAX_LENGTH,
    description: 'Cara o superficie tratada, si corresponde',
  })
  @IsOptional()
  @IsString()
  @MaxLength(SITE_DETAIL_MAX_LENGTH)
  siteDetail?: string;

  /**
   * Nota clínica del tratamiento.
   */
  @ApiPropertyOptional({ maxLength: NOTE_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_MAX_LENGTH)
  noteText?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro en el que se realizó, si lo hubo',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Cuándo se realizó.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo se realizó. Si se omite, ahora.',
  })
  @IsOptional()
  @IsISO8601()
  performedAt?: string;
}

/** Sitio tratado tal como sale en la lectura. */
export class DentalSiteDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Pieza o cuadrante.
   */
  @ApiProperty({ format: 'uuid' })
  bodySiteConceptId!: string;

  /**
   * Cara o superficie, si se precisó.
   */
  @ApiPropertyOptional()
  description?: string;
}

/** Un procedimiento odontológico del histórico. */
export class DentalProcedureDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Qué se hizo.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCodeConceptId!: string;

  /**
   * Estado del registro.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Odontólogo que lo realizó, si consta.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  performerProfileId?: string;

  /**
   * Encuentro en el que se realizó, si lo hubo.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Nota clínica.
   */
  @ApiPropertyOptional()
  noteText?: string;

  /**
   * Cuándo se realizó.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  performedAt?: Date;

  /**
   * Cuándo quedó registrado.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  /**
   * Piezas o cuadrantes tratados.
   */
  @ApiProperty({ type: [DentalSiteDto] })
  sites!: DentalSiteDto[];
}

/** Respuesta del alta. */
export class DentalProcedureResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Estado del registro.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Cuándo quedó registrado.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Página del histórico odontológico. */
export class DentalProcedureListDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [DentalProcedureDto] })
  items!: DentalProcedureDto[];

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Procedimientos de la persona, sin paginar' })
  total!: number;
}

/** Filtros del histórico odontológico. */
export class ListDentalProceduresQueryDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Paciente consultado' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

/** Una opción del catálogo odontológico: su identificador y su etiqueta. */
export class DentalCatalogEntryDto {
  /**
   * Identificador del concepto.
   */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /**
   * Código estable del concepto.
   */
  @ApiProperty()
  code!: string;

  /**
   * Etiqueta legible.
   */
  @ApiProperty()
  display!: string;
}

/**
 * Catálogo odontológico: qué se puede registrar y sobre qué pieza.
 *
 * Existe porque sin él la pantalla de alta no tiene forma honesta de llenar sus
 * dos selectores: los identificadores de concepto son UUID derivados del seed y
 * codificarlos en el frontend sería duplicar el seed en otro repositorio.
 */
export class DentalCatalogDto {
  /**
   * Códigos de procedimiento sembrados.
   */
  @ApiProperty({ type: [DentalCatalogEntryDto] })
  procedureCodes!: DentalCatalogEntryDto[];

  /**
   * Las 32 piezas permanentes, en orden FDI.
   */
  @ApiProperty({ type: [DentalCatalogEntryDto] })
  teeth!: DentalCatalogEntryDto[];

  /**
   * Los cuatro cuadrantes.
   */
  @ApiProperty({ type: [DentalCatalogEntryDto] })
  quadrants!: DentalCatalogEntryDto[];
}
