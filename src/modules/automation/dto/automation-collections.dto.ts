import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de agentes de automatización (V48-04). */
export class AgentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  agentTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  defaultModelConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  systemServiceComponentId!: string | null;

  @ApiProperty({ format: 'uuid' })
  autonomyLevelConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  actsAsUserId!: string | null;

  @ApiProperty({ type: Number })
  currentVersion!: number;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de agentes de automatización. */
export class ListAgentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de agentes de automatización. */
export class AgentPageDto extends pageResponseOf(
  AgentItemDto,
  'AgentPageDto',
) {}

/** Fila de disparadores de automatización (V48-13). */
export class AutomationTriggerItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  triggerTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  eventType!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  targetResourceType!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  conditionJson!: unknown;

  @ApiPropertyOptional({ type: String, nullable: true })
  scheduleCron!: string | null;

  @ApiProperty({ format: 'uuid' })
  workflowId!: string;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isEnabled!: boolean | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  campaignScheduleId!: string | null;

  @ApiProperty({ format: 'uuid' })
  scheduleSourceConceptId!: string;
}

/** Filtros del listado de disparadores de automatización. */
export class ListTriggersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de disparadores de automatización. */
export class AutomationTriggerPageDto extends pageResponseOf(
  AutomationTriggerItemDto,
  'AutomationTriggerPageDto',
) {}

/** Fila de flujos de automatización (V48-15). */
export class WorkflowItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ format: 'uuid' })
  orchestrationTypeConceptId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  definitionJson!: unknown;

  @ApiProperty({ type: Number })
  currentVersion!: number;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de flujos de automatización. */
export class ListWorkflowsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de flujos de automatización. */
export class WorkflowPageDto extends pageResponseOf(
  WorkflowItemDto,
  'WorkflowPageDto',
) {}
