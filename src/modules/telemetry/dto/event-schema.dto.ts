import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /telemetry/event-schemas` (UC-28-02). */
export class CreateEventSchemaDto {
  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre del evento de actividad',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  eventName!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión del esquema', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;

  /**
   * Identificador asociado a purpose definition.
   */
  @ApiProperty({
    description: 'Propósito de tracking asociado (activo)',
    format: 'uuid',
  })
  @IsUUID()
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de portal (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  /**
   * Valor de property schema json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'JSON Schema de propiedades permitidas' })
  @IsOptional()
  @IsObject()
  propertySchemaJson?: Record<string, unknown>;

  /**
   * Valor de prohibited property patterns json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Patrones de propiedades prohibidas (PHI/free-text)',
  })
  @IsOptional()
  @IsObject()
  prohibitedPropertyPatternsJson?: Record<string, unknown>;

  /**
   * Identificador asociado a pii classification concept.
   */
  @ApiPropertyOptional({
    description: 'Clasificación PII (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  piiClassificationConceptId?: string;

  /**
   * Valor de phi allowed mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'PHI permitido en el esquema',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  phiAllowed?: boolean;
}

/** Respuesta de un esquema de evento registrado. */
export class EventSchemaResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiProperty()
  eventName!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiProperty()
  schemaVersion!: number;

  /**
   * Identificador asociado a purpose definition.
   */
  @ApiProperty({ format: 'uuid' })
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
