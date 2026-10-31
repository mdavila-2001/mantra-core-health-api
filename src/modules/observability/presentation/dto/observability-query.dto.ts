import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Ventana común de las lecturas. `from`/`to` son ISO-8601; `tz` una zona IANA
 * (se valida en el servicio: una zona o ventana inválida es 422 con `reason`).
 */
export class WindowQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: 00:00 de `to` en la zona `tz`',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: ahora',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    example: 'America/La_Paz',
    default: 'America/La_Paz',
    description:
      'Zona IANA de los cubos; la respuesta la devuelve en `window.timezone`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tz?: string;
}

export class IntervalWindowQueryDto extends WindowQueryDto {
  @ApiPropertyOptional({ enum: ['minute', 'hour', 'day'] })
  @IsOptional()
  @IsIn(['minute', 'hour', 'day'])
  interval?: 'minute' | 'hour' | 'day';
}

export class PageQueryDto extends WindowQueryDto {
  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class TimeseriesQueryDto extends IntervalWindowQueryDto {
  @ApiProperty({
    enum: [
      'requests',
      'errors4xx',
      'errors5xx',
      'latency_p95',
      'latency_p99',
      'sql_ms',
      'sql_slow',
      'error_events',
    ],
  })
  @IsIn([
    'requests',
    'errors4xx',
    'errors5xx',
    'latency_p95',
    'latency_p99',
    'sql_ms',
    'sql_slow',
    'error_events',
  ])
  metric!: string;

  @ApiPropertyOptional({
    enum: ['none', 'module', 'status_class'],
    default: 'none',
  })
  @IsOptional()
  @IsIn(['none', 'module', 'status_class'])
  groupBy?: 'none' | 'module' | 'status_class';
}

export class EndpointsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por `module_code`' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  module?: string;

  @ApiPropertyOptional({
    enum: ['requests', 'failed', 'p95', 'p99', 'errorGroups'],
    default: 'requests',
  })
  @IsOptional()
  @IsIn(['requests', 'failed', 'p95', 'p99', 'errorGroups'])
  sort?: 'requests' | 'failed' | 'p95' | 'p99' | 'errorGroups';
}

export class ErrorGroupsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ['NEW', 'SEEN', 'RESOLVED', 'IGNORED'] })
  @IsOptional()
  @IsIn(['NEW', 'SEEN', 'RESOLVED', 'IGNORED'])
  state?: 'NEW' | 'SEEN' | 'RESOLVED' | 'IGNORED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  module?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @ApiPropertyOptional({ enum: ['api', 'worker', 'web'] })
  @IsOptional()
  @IsIn(['api', 'worker', 'web'])
  source?: 'api' | 'worker' | 'web';

  @ApiPropertyOptional({
    enum: ['last_seen', 'occurrences', 'first_seen'],
    default: 'last_seen',
  })
  @IsOptional()
  @IsIn(['last_seen', 'occurrences', 'first_seen'])
  sort?: 'last_seen' | 'occurrences' | 'first_seen';
}

export class ErrorEventsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestId?: string;
}

export class SqlStatementsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    enum: ['total_ms', 'p95', 'executions', 'slow'],
    default: 'total_ms',
  })
  @IsOptional()
  @IsIn(['total_ms', 'p95', 'executions', 'slow'])
  sort?: 'total_ms' | 'p95' | 'executions' | 'slow';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  module?: string;
}

export class ChangeErrorGroupStateDto {
  @ApiProperty({ enum: ['NEW', 'SEEN', 'RESOLVED', 'IGNORED'] })
  @IsIn(['NEW', 'SEEN', 'RESOLVED', 'IGNORED'])
  state!: 'NEW' | 'SEEN' | 'RESOLVED' | 'IGNORED';

  @ApiPropertyOptional({
    description: 'Motivo; obligatorio (≥ 3 caracteres) al resolver o ignorar',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note?: string;

  @ApiProperty({
    description:
      '`rowVersion` que el cliente leyó; si cambió, 409 CONCURRENCY_CONFLICT',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
