import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de recorridos de marketing (V50-02). */
export class JourneyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  entryTriggerConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  entrySegmentId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  goalMetricConceptId!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  definitionJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de recorridos de marketing. */
export class ListJourneysQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de recorridos de marketing. */
export class JourneyPageDto extends pageResponseOf(
  JourneyItemDto,
  'JourneyPageDto',
) {}

/** Fila de segmentos de marketing (V50-04). */
export class MarketingSegmentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  segmentTypeConceptId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  definitionJson!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sourceReadModelId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  estimatedSize!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastRefreshedAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de segmentos de marketing. */
export class ListSegmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stateConceptId?: string;
}

/** Página de segmentos de marketing. */
export class MarketingSegmentPageDto extends pageResponseOf(
  MarketingSegmentItemDto,
  'MarketingSegmentPageDto',
) {}

/** Fila de campañas de marketing (V50-06). */
export class MarketingCampaignItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  campaignTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  objectiveConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  channelConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  segmentId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  budgetAmount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  adCampaignRefId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  promotionId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  governanceScopeConceptId!: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  requiresExplicitPublish!: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  publishedVersion!: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  publishedByUserId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  cancellationReason!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  cancelledAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  cancelledByUserId!: string | null;
}

/** Filtros del listado de campañas de marketing. */
export class ListCampaignsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de campañas de marketing. */
export class MarketingCampaignPageDto extends pageResponseOf(
  MarketingCampaignItemDto,
  'MarketingCampaignPageDto',
) {}
