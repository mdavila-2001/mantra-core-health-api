import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de trabajos encolados (V35-04). */
export class QueuedJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  queueId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  jobType!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  dedupeKey!: string | null;

  @ApiProperty({ type: Number })
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  availableAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: Date | null;

  @ApiProperty({ type: Number })
  attempts!: number;

  @ApiProperty({ type: Number })
  maxAttempts!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  lockedBy!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lockExpiresAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de trabajos encolados. */
export class ListJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  queueId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de trabajos encolados. */
export class QueuedJobPageDto extends pageResponseOf(
  QueuedJobItemDto,
  'QueuedJobPageDto',
) {}
