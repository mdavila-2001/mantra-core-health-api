import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CLIENT_ERROR_CLASSES, type ClientErrorClass } from '../../telemetry.concepts';

/** Ventana, portal y `minSample` (sólo puede subir el umbral de plataforma). */
export class AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'Por defecto: to − 7 días. Máximo 92 días.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time', description: 'Por defecto: ahora' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: ['hour', 'day'] })
  @IsOptional()
  @IsIn(['hour', 'day'])
  interval?: 'hour' | 'day';

  @ApiPropertyOptional({ enum: ['WEB', 'MOBILE'] })
  @IsOptional()
  @IsIn(['WEB', 'MOBILE'])
  portal?: 'WEB' | 'MOBILE';

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    description: 'Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  minSample?: number;
}

export class ErrorsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ description: 'route_code de la parte (ver GET /admin/analytics/parts)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  routeCode?: string;

  @ApiPropertyOptional({ enum: CLIENT_ERROR_CLASSES })
  @IsOptional()
  @IsIn(CLIENT_ERROR_CLASSES)
  class?: ClientErrorClass;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PartsQueryDto extends AnalyticsBaseQueryDto {
  @ApiPropertyOptional({ enum: ['previous'], description: 'Añade el periodo anterior de la misma duración.' })
  @IsOptional()
  @IsIn(['previous'])
  compare?: 'previous';
}
