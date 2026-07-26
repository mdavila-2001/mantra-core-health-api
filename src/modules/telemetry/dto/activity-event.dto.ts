import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Propiedad minimizada de un evento (solo props permitidas por el esquema). */
export class ActivityEventPropertyDto {
  @ApiProperty({ description: 'Nombre de la propiedad', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  propertyName!: string;

  @ApiPropertyOptional({ description: 'Tipo de valor', enum: ['STRING', 'NUMBER', 'BOOLEAN'] })
  @IsOptional()
  @IsIn(['STRING', 'NUMBER', 'BOOLEAN'])
  valueType?: 'STRING' | 'NUMBER' | 'BOOLEAN';

  @ApiPropertyOptional({ description: 'Valor string' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  valueString?: string;

  @ApiPropertyOptional({ description: 'Valor numérico' })
  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @ApiPropertyOptional({ description: 'Valor booleano' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Clasificación de dato (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dataClassificationConceptId?: string;
}

/** Un evento de actividad dentro del batch. */
export class ActivityEventItemDto {
  @ApiProperty({ description: 'Esquema de evento activo', format: 'uuid' })
  @IsUUID()
  eventSchemaDefinitionId!: string;

  @ApiPropertyOptional({ description: 'Nombre del evento (override del esquema)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventName?: string;

  @ApiPropertyOptional({ description: 'Clave de idempotencia del evento', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventIdempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Sujeto de analítica pseudónimo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;

  @ApiPropertyOptional({ description: 'Usuario (para gate de consentimiento)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Sesión asociada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Journey de sesión existente a enlazar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  @ApiPropertyOptional({ description: 'Tenant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Tipo de portal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Plantilla de ruta (sin ids en claro)', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  @ApiPropertyOptional({ description: 'Instante de ocurrencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ description: 'Correlation id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({ type: [ActivityEventPropertyDto], description: 'Propiedades permitidas y minimizadas' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEventPropertyDto)
  properties?: ActivityEventPropertyDto[];
}

/** Cuerpo de `POST /telemetry/activity-events` (UC-28-07, batch). */
export class CaptureActivityEventsDto {
  @ApiProperty({ type: [ActivityEventItemDto], description: 'Lote de eventos de actividad' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ActivityEventItemDto)
  events!: ActivityEventItemDto[];
}

/** Respuesta del batch de captura de eventos. */
export class ActivityEventsResponseDto {
  @ApiProperty({ description: 'Eventos insertados (consent-aware)' })
  inserted!: number;

  @ApiProperty({ description: 'Eventos descartados por falta de consentimiento o reenvío' })
  skipped!: number;

  @ApiProperty({ type: [String], description: 'Ids de los eventos insertados' })
  eventIds!: string[];

  @ApiPropertyOptional({ format: 'uuid', description: 'Journey de sesión afectado' })
  sessionJourneyId?: string;
}
