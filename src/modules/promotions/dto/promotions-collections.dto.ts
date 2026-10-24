import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de promociones (V51-08). */
export class PromotionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  promotionTypeConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  campaignRefId!: string | null;

  @ApiProperty({ type: Number })
  priority!: number;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  stackable!: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  budgetAmount!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  totalRedemptionLimit!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  perUserLimit!: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de promociones. */
export class ListPromotionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de promociones. */
export class PromotionPageDto extends pageResponseOf(
  PromotionItemDto,
  'PromotionPageDto',
) {}
