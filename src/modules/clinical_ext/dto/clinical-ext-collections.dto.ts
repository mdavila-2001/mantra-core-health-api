import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de reglas de apoyo a la decisión clínica (V18-09). */
export class CdsRuleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  ruleTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  severityConceptId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  logicJson!: unknown;

  @ApiPropertyOptional({ type: String, nullable: true })
  messageTemplate!: string | null;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  version!: number | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de reglas de apoyo a la decisión clínica. */
export class ListCdsRulesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ruleTypeConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de reglas de apoyo a la decisión clínica. */
export class CdsRulePageDto extends pageResponseOf(
  CdsRuleItemDto,
  'CdsRulePageDto',
) {}

/** Fila de conjuntos de órdenes (V18-05). */
export class OrderSetItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  specialtyConceptId!: string | null;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  conditionConceptId!: string | null;

  @ApiProperty({ type: Number })
  version!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de conjuntos de órdenes. */
export class ListOrderSetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de conjuntos de órdenes. */
export class OrderSetPageDto extends pageResponseOf(
  OrderSetItemDto,
  'OrderSetPageDto',
) {}

/** Fila de esquemas de inmunización (V18-12). */
export class ImmunizationScheduleItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  vaccineConceptId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  recommendedAgeDays!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  doseNumber!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  intervalDays!: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  jurisdictionConceptId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de esquemas de inmunización. */
export class ListImmunizationSchedulesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vaccineConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de esquemas de inmunización. */
export class ImmunizationSchedulePageDto extends pageResponseOf(
  ImmunizationScheduleItemDto,
  'ImmunizationSchedulePageDto',
) {}
