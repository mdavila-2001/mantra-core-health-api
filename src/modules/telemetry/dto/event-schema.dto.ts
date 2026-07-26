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
  @ApiProperty({ description: 'Nombre del evento de actividad', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  eventName!: string;

  @ApiPropertyOptional({ description: 'Versión del esquema', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;

  @ApiProperty({ description: 'Propósito de tracking asociado (activo)', format: 'uuid' })
  @IsUUID()
  purposeDefinitionId!: string;

  @ApiPropertyOptional({ description: 'Tipo de portal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'JSON Schema de propiedades permitidas' })
  @IsOptional()
  @IsObject()
  propertySchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Patrones de propiedades prohibidas (PHI/free-text)' })
  @IsOptional()
  @IsObject()
  prohibitedPropertyPatternsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Clasificación PII (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  piiClassificationConceptId?: string;

  @ApiPropertyOptional({ description: 'PHI permitido en el esquema', default: false })
  @IsOptional()
  @IsBoolean()
  phiAllowed?: boolean;
}

/** Respuesta de un esquema de evento registrado. */
export class EventSchemaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  eventName!: string;

  @ApiProperty()
  schemaVersion!: number;

  @ApiProperty({ format: 'uuid' })
  purposeDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  createdAt!: Date;
}
