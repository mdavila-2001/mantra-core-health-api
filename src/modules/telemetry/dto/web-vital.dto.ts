import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { WEB_VITAL_METRIC_CODES } from '../telemetry.concepts';

/** Una métrica Core Web Vital dentro del batch. */
export class WebVitalItemDto {
  /**
   * Valor de metric mantenido por la instancia.
   */
  @ApiProperty({ description: 'Métrica CWV', enum: WEB_VITAL_METRIC_CODES })
  @IsIn(WEB_VITAL_METRIC_CODES)
  metric!: string;

  /**
   * Valor de metric value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor de la métrica (>= 0)' })
  @IsNumber()
  @Min(0)
  metricValue!: number;

  /**
   * Valor de rating mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rating',
    enum: ['GOOD', 'NEEDS_IMPROVEMENT', 'POOR'],
  })
  @IsOptional()
  @IsIn(['GOOD', 'NEEDS_IMPROVEMENT', 'POOR'])
  rating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';

  /**
   * Valor de route template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plantilla de ruta', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

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
   * Identificador asociado a user activity event.
   */
  @ApiPropertyOptional({
    description: 'Evento de actividad relacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userActivityEventId?: string;

  /**
   * Identificador asociado a client context.
   */
  @ApiPropertyOptional({ description: 'Contexto de cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientContextId?: string;

  /**
   * Identificador asociado a session journey.
   */
  @ApiPropertyOptional({ description: 'Journey de sesión', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @ApiPropertyOptional({ description: 'Sujeto de analítica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;
}

/** Cuerpo de `POST /telemetry/web-vitals` (UC-28-09, batch). */
export class RecordWebVitalsDto {
  /**
   * Valor de metrics mantenido por la instancia.
   */
  @ApiProperty({ type: [WebVitalItemDto], description: 'Lote de métricas CWV' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => WebVitalItemDto)
  metrics!: WebVitalItemDto[];
}

/** Respuesta del batch de Web Vitals. */
export class WebVitalsResponseDto {
  /**
   * Valor de inserted mantenido por la instancia.
   */
  @ApiProperty()
  inserted!: number;

  /**
   * Valor de ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] })
  ids!: string[];
}
