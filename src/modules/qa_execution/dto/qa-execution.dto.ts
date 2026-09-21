import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SECRET_REF_PATTERN } from '../domain/target-guard';
import { PLAN_STATUSES } from '../domain/plan';

/** Registro del destino de un entorno. Lo decide administración, no quien ejecuta. */
export class UpsertTargetDto {
  @ApiProperty({ enum: ['http', 'https'] })
  @IsIn(['http', 'https'])
  scheme!: 'http' | 'https';

  @ApiProperty({ maxLength: 253, description: 'Host exacto, sin comodines' })
  @IsString()
  @Matches(/^[a-z0-9.-]+$|^\[[0-9a-f:]+\]$/i, { message: 'host no válido' })
  @MaxLength(253)
  host!: string;

  @ApiProperty({ minimum: 1, maximum: 65535 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @ApiProperty({ type: [String], example: ['/api'] })
  @IsString({ each: true })
  @Matches(/^\/[A-Za-z0-9/_\-.]*$/, {
    each: true,
    message: 'prefijo de ruta no válido',
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  allowedPathPrefixes!: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowPrivateNetwork?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowMutations?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre de variable QA_TARGET_*; nunca el valor',
  })
  @IsOptional()
  @Matches(SECRET_REF_PATTERN, { message: 'sólo variables QA_TARGET_*' })
  authSecretRef?: string;

  @ApiPropertyOptional({ default: 'authorization' })
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{1,64}$/)
  authHeaderName?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxRequests?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 600, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  maxDurationSeconds?: number;

  @ApiPropertyOptional({ minimum: 100, maximum: 30000, default: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(30_000)
  requestTimeoutMs?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000, default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  minIntervalMs?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'DISABLED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: 'ACTIVE' | 'DISABLED';
}

export class RequestedLimitsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRequests?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDurationSeconds?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  requestTimeoutMs?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minIntervalMs?: number;
}

export class PlanRequestDto {
  @ApiProperty() @IsUUID() suiteId!: string;
  @ApiProperty() @IsUUID() environmentId!: string;

  @ApiPropertyOptional({
    type: RequestedLimitsDto,
    description: 'El servidor recorta; nunca eleva',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequestedLimitsDto)
  limits?: RequestedLimitsDto;
}

export class ApprovePlanDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiProperty({
    description: 'Hash del plan revisado; si cambió, la aprobación no aplica',
  })
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  planHash!: string;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional({ minimum: 5, maximum: 240, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(240)
  expiresInMinutes?: number;
}

export class ListPlansQueryDto {
  @ApiPropertyOptional({ enum: PLAN_STATUSES })
  @IsOptional()
  @IsIn(PLAN_STATUSES)
  status?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() suiteId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
