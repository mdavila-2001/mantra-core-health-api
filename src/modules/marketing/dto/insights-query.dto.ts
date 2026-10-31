import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  Matches,
} from 'class-validator';

/** Canales conectados de Insights (espejo de `CHANNELS` del front). */
export const INSIGHTS_CHANNELS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'google',
  'web',
  'app',
  'email',
] as const;
export type InsightsChannel = (typeof INSIGHTS_CHANNELS)[number];

/** Máximo de valores en un filtro de lista: más es una consulta mal formada. */
export const INSIGHTS_MAX_FILTER_VALUES = 20;

/**
 * Convierte `?campaignIds=c1,c2` y `?campaignIds=c1&campaignIds=c2` en una sola
 * lista sin vacíos ni repetidos. Lo que no es texto pasa tal cual para que el
 * validador lo rechace.
 */
const asList = ({ value }: { value: unknown }): unknown => {
  const parts = Array.isArray(value) ? value : [value];
  if (!parts.every((part) => typeof part === 'string')) return value;
  return [
    ...new Set(
      parts
        .flatMap((part) => part.split(','))
        .map((part) => part.trim())
        .filter((part) => part.length > 0),
    ),
  ];
};

/** Query de `GET /marketing/insights/campaign-facts`. */
@ApiSchema({ name: 'MarketingInsightsFactsQueryDto' })
export class InsightsFactsQueryDto {
  /** Primer día de la ventana (inclusive). Si trae hora, cuenta el día UTC. */
  @ApiProperty({ example: '2026-10-01', description: 'Primer día (inclusive)' })
  @IsISO8601()
  from!: string;

  /** Último día de la ventana (inclusive). */
  @ApiProperty({ example: '2026-10-29', description: 'Último día (inclusive)' })
  @IsISO8601()
  to!: string;

  /** Códigos de campaña (`c1`…), separados por comas. */
  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description: 'Códigos de campaña (lista separada por comas)',
  })
  @IsOptional()
  @Transform(asList)
  @IsArray()
  @ArrayMaxSize(INSIGHTS_MAX_FILTER_VALUES)
  @Matches(/^[A-Za-z0-9_-]{1,40}$/, { each: true })
  campaignIds?: string[];

  /** Canales, separados por comas. */
  @ApiPropertyOptional({
    enum: INSIGHTS_CHANNELS,
    isArray: true,
    description: 'Canales (lista separada por comas)',
  })
  @IsOptional()
  @Transform(asList)
  @IsArray()
  @ArrayMaxSize(INSIGHTS_MAX_FILTER_VALUES)
  @IsIn(INSIGHTS_CHANNELS, { each: true })
  channels?: InsightsChannel[];
}
