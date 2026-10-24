import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de agendas de QA (V36-07). */
export class TestScheduleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  suiteId!: string;

  @ApiProperty({ format: 'uuid' })
  environmentId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  cronExpression!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  timezone!: string | null;

  @ApiProperty({ format: 'uuid' })
  triggerConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  concurrencyPolicyConceptId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isEnabled!: boolean | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  lastRunId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastRunAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  nextRunAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  notifyChannelConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de agendas de QA. */
export class ListSchedulesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de agendas de QA. */
export class TestSchedulePageDto extends pageResponseOf(
  TestScheduleItemDto,
  'TestSchedulePageDto',
) {}
