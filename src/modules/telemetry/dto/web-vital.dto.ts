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
  @ApiProperty({ description: 'Métrica CWV', enum: WEB_VITAL_METRIC_CODES })
  @IsIn(WEB_VITAL_METRIC_CODES as unknown as string[])
  metric!: string;

  @ApiProperty({ description: 'Valor de la métrica (>= 0)' })
  @IsNumber()
  @Min(0)
  metricValue!: number;

  @ApiPropertyOptional({ description: 'Rating', enum: ['GOOD', 'NEEDS_IMPROVEMENT', 'POOR'] })
  @IsOptional()
  @IsIn(['GOOD', 'NEEDS_IMPROVEMENT', 'POOR'])
  rating?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';

  @ApiPropertyOptional({ description: 'Plantilla de ruta', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  @ApiPropertyOptional({ description: 'Tipo de portal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Evento de actividad relacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userActivityEventId?: string;

  @ApiPropertyOptional({ description: 'Contexto de cliente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientContextId?: string;

  @ApiPropertyOptional({ description: 'Journey de sesión', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  @ApiPropertyOptional({ description: 'Sujeto de analítica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;
}

/** Cuerpo de `POST /telemetry/web-vitals` (UC-28-09, batch). */
export class RecordWebVitalsDto {
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
  @ApiProperty()
  inserted!: number;

  @ApiProperty({ type: [String] })
  ids!: string[];
}
