import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de instancias de flujo de trabajo (V32-05). */
export class WorkflowInstanceItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  workflowCode!: string;

  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  currentStateConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  currentStepCode!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  contextJson!: unknown;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de instancias de flujo de trabajo. */
export class ListInstancesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de instancias de flujo de trabajo. */
export class WorkflowInstancePageDto extends pageResponseOf(
  WorkflowInstanceItemDto,
  'WorkflowInstancePageDto',
) {}
