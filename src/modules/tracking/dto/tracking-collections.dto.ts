import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de envíos (V37-01). */
export class ShipmentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  trackableSubjectId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  carrierId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ type: String })
  shipmentNumber!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  originAddressId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  destinationAddressId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignedCourierUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  trackedSubjectId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dispatchedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  estimatedArrivalAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deliveredAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  distanceM!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  temperatureControlled!: boolean | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de envíos. */
export class ListShipmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de envíos. */
export class ShipmentPageDto extends pageResponseOf(
  ShipmentItemDto,
  'ShipmentPageDto',
) {}

/** Fila de definiciones de hito (V37-06). */
export class MilestoneDefinitionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  milestoneStatusConceptId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  ordinal!: number | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  isTerminal!: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  slaMinutes!: number | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de definiciones de hito. */
export class ListMilestoneDefinitionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de definiciones de hito. */
export class MilestoneDefinitionPageDto extends pageResponseOf(
  MilestoneDefinitionItemDto,
  'MilestoneDefinitionPageDto',
) {}

/** Fila de sujetos rastreables (V37-07). */
export class TrackableSubjectItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  @ApiProperty({ type: String })
  subjectRefType!: string;

  @ApiProperty({ format: 'uuid' })
  subjectRefId!: string;

  @ApiProperty({ type: String })
  trackingNumber!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentStatusConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentMilestoneId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  priorityConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  openedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de sujetos rastreables. */
export class ListTrackableSubjectsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de sujetos rastreables. */
export class TrackableSubjectPageDto extends pageResponseOf(
  TrackableSubjectItemDto,
  'TrackableSubjectPageDto',
) {}
