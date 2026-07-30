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
  /**
   * Valor de property name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la propiedad', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  propertyName!: string;

  /**
   * Valor de value type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de valor',
    enum: ['STRING', 'NUMBER', 'BOOLEAN'],
  })
  @IsOptional()
  @IsIn(['STRING', 'NUMBER', 'BOOLEAN'])
  valueType?: 'STRING' | 'NUMBER' | 'BOOLEAN';

  /**
   * Valor de value string mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor string' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  valueString?: string;

  /**
   * Valor de value number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor numérico' })
  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor booleano' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  /**
   * Identificador asociado a data classification concept.
   */
  @ApiPropertyOptional({
    description: 'Clasificación de dato (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataClassificationConceptId?: string;
}

/** Un evento de actividad dentro del batch. */
export class ActivityEventItemDto {
  /**
   * Identificador asociado a event schema definition.
   */
  @ApiProperty({ description: 'Esquema de evento activo', format: 'uuid' })
  @IsUUID()
  eventSchemaDefinitionId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre del evento (override del esquema)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventName?: string;

  /**
   * Valor de event idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clave de idempotencia del evento',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventIdempotencyKey?: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @ApiPropertyOptional({
    description: 'Sujeto de analítica pseudónimo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario (para gate de consentimiento)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a session.
   */
  @ApiPropertyOptional({ description: 'Sesión asociada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  /**
   * Identificador asociado a session journey.
   */
  @ApiPropertyOptional({
    description: 'Journey de sesión existente a enlazar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

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
   * Valor de route template mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Plantilla de ruta (sin ids en claro)',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Instante de ocurrencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({ description: 'Correlation id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ActivityEventPropertyDto],
    description: 'Propiedades permitidas y minimizadas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEventPropertyDto)
  properties?: ActivityEventPropertyDto[];
}

/** Cuerpo de `POST /telemetry/activity-events` (UC-28-07, batch). */
export class CaptureActivityEventsDto {
  /**
   * Valor de events mantenido por la instancia.
   */
  @ApiProperty({
    type: [ActivityEventItemDto],
    description: 'Lote de eventos de actividad',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ActivityEventItemDto)
  events!: ActivityEventItemDto[];
}

/** Respuesta del batch de captura de eventos. */
export class ActivityEventsResponseDto {
  /**
   * Valor de inserted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Eventos insertados (consent-aware)' })
  inserted!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Eventos descartados por falta de consentimiento o reenvío',
  })
  skipped!: number;

  /**
   * Valor de event ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de los eventos insertados' })
  eventIds!: string[];

  /**
   * Identificador asociado a session journey.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Journey de sesión afectado',
  })
  sessionJourneyId?: string;
}
