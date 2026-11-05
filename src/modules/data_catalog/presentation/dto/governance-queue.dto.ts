import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';
import { PaginacionQueryDto } from './portal-query.dto';

const SCHEMA = /^[A-Za-z0-9_]{1,63}$/;

export const REVIEW_QUEUE_KINDS = ['OBJECT', 'COLUMN'] as const;
export type ReviewQueueKind = (typeof REVIEW_QUEUE_KINDS)[number];

export const JOB_TYPES = [
  'CATALOG_SCAN',
  'CLASSIFICATION',
  'RETENTION',
] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Filtros de `GET /admin/governance/review-queue`. */
export class ReviewQueueQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ enum: REVIEW_QUEUE_KINDS })
  @IsOptional()
  @IsIn(REVIEW_QUEUE_KINDS)
  kind?: ReviewQueueKind;

  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(SCHEMA)
  schema?: string;
}

/** Filtros de `GET /admin/governance/jobs`. */
export class JobsQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ enum: JOB_TYPES })
  @IsOptional()
  @IsIn(JOB_TYPES)
  type?: JobType;

  @ApiPropertyOptional({
    description:
      'Estado normalizado: QUEUED, RUNNING, SUCCEEDED, FAILED o CANCELLED',
    enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Desde (ISO 8601, incluido). Sin rango, los últimos 30 días',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (ISO 8601, excluido)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
