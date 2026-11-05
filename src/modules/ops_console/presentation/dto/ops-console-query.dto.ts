import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class LimitQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class TrafficWindowQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: 00:00 UTC del día de `to`',
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
}

export class TrafficQueryDto extends TrafficWindowQueryDto {
  @ApiPropertyOptional({ enum: ['hour', 'day'], default: 'hour' })
  @IsOptional()
  @IsIn(['hour', 'day'])
  interval?: 'hour' | 'day';
}

export class TrafficEndpointsQueryDto extends TrafficWindowQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['requests', 'failed', 'p95'],
    default: 'requests',
  })
  @IsOptional()
  @IsIn(['requests', 'failed', 'p95'])
  sort?: 'requests' | 'failed' | 'p95';
}

export class IncidentsQueryDto extends LimitQueryDto {
  @ApiPropertyOptional({
    description: 'Sólo incidentes vivos (abiertos, reconocidos, mitigados)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  open?: boolean;
}
