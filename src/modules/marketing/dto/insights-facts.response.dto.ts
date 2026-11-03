import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

/** De dónde sale el dato y hasta cuándo es cierto. Viaja en toda respuesta. */
@ApiSchema({ name: 'MarketingInsightsNotMeasuredDto' })
export class InsightsNotMeasuredDto {
  @ApiProperty({ example: 'videoViews' })
  metric!: string;

  @ApiProperty()
  reason!: string;
}

@ApiSchema({ name: 'MarketingInsightsWindowDto' })
export class InsightsWindowDto {
  @ApiProperty({ example: '2026-10-01' })
  from!: string;

  @ApiProperty({ example: '2026-10-29' })
  to!: string;
}

@ApiSchema({ name: 'MarketingInsightsMetaDto' })
export class InsightsMetaDto {
  @ApiProperty({
    enum: ['demo', 'live'],
    description: '`demo` mientras alguna fuente sea sintética.',
  })
  dataset!: 'demo' | 'live';

  @ApiProperty({ description: 'Último día con hechos reales (YYYY-MM-DD)' })
  asOf!: string;

  @ApiProperty({ description: 'Día de corte del conjunto de datos' })
  cutoff!: string;

  @ApiProperty({ type: InsightsWindowDto, nullable: true })
  window!: InsightsWindowDto | null;

  @ApiProperty({ description: 'Texto que la interfaz muestra junto al dato' })
  notice!: string;

  @ApiProperty({
    type: InsightsNotMeasuredDto,
    isArray: true,
    description: 'Lo que no se mide: se declara, no se muestra como 0',
  })
  notMeasured!: InsightsNotMeasuredDto[];
}

@ApiSchema({ name: 'MarketingInsightsCampaignDto' })
export class InsightsCampaignDto {
  @ApiProperty({ example: 'c1', description: 'Código estable de la campaña' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  objective!: string;

  @ApiProperty()
  audience!: string;

  @ApiProperty({ example: '2026-10-01' })
  startDate!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  endDate!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  budgetCents!: number | null;

  @ApiProperty({ enum: ['active', 'ended', 'planned'] })
  status!: 'active' | 'ended' | 'planned';

  @ApiPropertyOptional({ type: Number, nullable: true })
  revenuePerConversionCents!: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Objetivos propios por métrica',
  })
  targets!: Record<string, number>;

  @ApiProperty({
    enum: [
      'instagram',
      'facebook',
      'tiktok',
      'youtube',
      'google',
      'web',
      'app',
      'email',
    ],
    isArray: true,
    description: 'Canales con creativos de la campaña',
  })
  channels!: string[];
}

@ApiSchema({ name: 'MarketingInsightsMilestoneDto' })
export class InsightsMilestoneDto {
  @ApiProperty({ example: '2026-10-09' })
  date!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  campaignId!: string | null;

  @ApiProperty({ enum: ['launch', 'viral', 'press', 'offer_change'] })
  kind!: 'launch' | 'viral' | 'press' | 'offer_change';
}

@ApiSchema({ name: 'MarketingInsightsCatalogDto' })
export class InsightsCatalogDto {
  @ApiProperty({ type: InsightsCampaignDto, isArray: true })
  campaigns!: InsightsCampaignDto[];

  @ApiProperty({ type: InsightsMilestoneDto, isArray: true })
  milestones!: InsightsMilestoneDto[];
}

@ApiSchema({ name: 'MarketingInsightsCatalogResponseDto' })
export class InsightsCatalogResponseDto {
  @ApiProperty({ type: InsightsCatalogDto })
  data!: InsightsCatalogDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

/**
 * Un día de una campaña en un canal. Importes en centavos. Una medida `null`
 * es una medida que la fuente no reporta: no equivale a 0.
 */
@ApiSchema({ name: 'MarketingInsightsDailyFactDto' })
export class InsightsDailyFactDto {
  @ApiProperty({ example: '2026-10-01' })
  date!: string;

  @ApiProperty({ example: 'c1' })
  campaignId!: string;

  @ApiProperty()
  channel!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  impressions!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  reach!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  engagements!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  clicks!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  videoViews!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  watchSeconds!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  visits!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  leads!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  registrations!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  activations!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  firstUses!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  conversions!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  spendCents!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  revenueCents!: number | null;
}

@ApiSchema({ name: 'MarketingInsightsFactsResponseDto' })
export class InsightsFactsResponseDto {
  @ApiProperty({ type: InsightsDailyFactDto, isArray: true })
  data!: InsightsDailyFactDto[];

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}
