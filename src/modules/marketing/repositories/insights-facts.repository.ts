import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

/**
 * Medidas diarias de campaña: nombre del contrato (camelCase) y columna.
 * Son literales internos, nunca entrada del usuario: lo único que se interpola
 * en el SQL.
 */
export const FACT_MEASURES = [
  ['impressions', 'impressions'],
  ['reach', 'reach'],
  ['engagements', 'engagements'],
  ['clicks', 'clicks'],
  ['videoViews', 'video_views'],
  ['watchSeconds', 'watch_seconds'],
  ['visits', 'visits'],
  ['leads', 'leads'],
  ['registrations', 'registrations'],
  ['activations', 'activations'],
  ['firstUses', 'first_uses'],
  ['conversions', 'conversions'],
  ['spendCents', 'spend_cents'],
  ['revenueCents', 'revenue_cents'],
] as const;
export type FactMeasure = (typeof FACT_MEASURES)[number][0];

export interface CampaignRow {
  code: string;
  name: string;
  objective_text: string | null;
  audience_text: string | null;
  start_on: string;
  end_on: string | null;
  budget_cents: string | null;
  revenue_per_conversion_cents: string | null;
  targets_json: unknown;
  status_code: string | null;
}

export interface CampaignChannelRow {
  campaign_code: string;
  channel_code: string;
}

export interface MilestoneRow {
  occurred_on: string;
  label: string;
  campaign_code: string | null;
  kind_code: string;
}

export interface DataSourcesRow {
  datasets: string[] | null;
  cutoff: string | null;
}

/** Fila agregada por día, campaña y canal; las medidas llegan como bigint en texto. */
export type FactRow = {
  fact_date: string;
  campaign_code: string;
  channel_code: string;
} & Record<FactMeasure, string | null>;

export interface FactsFilter {
  /** Primer día (inclusive), `YYYY-MM-DD`. */
  fromDay: string;
  /** Día siguiente al último (exclusivo), `YYYY-MM-DD`. */
  toExclusiveDay: string;
  campaignCodes: readonly string[];
  channels: readonly string[];
  /** Máximo de filas a devolver. */
  limit: number;
}

const placeholders = (values: readonly unknown[]) =>
  values.map(() => '?').join(', ');

/**
 * Lecturas de AloVida Insights sobre `marketing.insights_*`. SQL crudo con
 * parámetros: son agregados por ventana y no pasan por el tenant porque las
 * tablas son del dataset de plataforma (sin `tenant_id`, decisión D-7).
 */
@Injectable()
export class InsightsFactsRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  /** Campañas con el código de su estado (value set `vs_insights_campaign_status`). */
  campaigns(): Promise<CampaignRow[]> {
    return this.sql<CampaignRow>(
      `SELECT c.code, c.name, c.objective_text, c.audience_text,
              c.start_on::text AS start_on, c.end_on::text AS end_on,
              c.budget_cents, c.revenue_per_conversion_cents, c.targets_json,
              lower(st.code) AS status_code
         FROM marketing.insights_campaigns c
         LEFT JOIN terminology.catalog_concepts st ON st.id = c.status_concept_id
        ORDER BY c.code`,
    );
  }

  /** Canales de cada campaña, derivados de sus creativos. */
  campaignChannels(): Promise<CampaignChannelRow[]> {
    return this.sql<CampaignChannelRow>(
      `SELECT DISTINCT c.code AS campaign_code, cr.channel_code
         FROM marketing.insights_creatives cr
         JOIN marketing.insights_campaigns c ON c.id = cr.campaign_id
        ORDER BY c.code, cr.channel_code`,
    );
  }

  milestones(): Promise<MilestoneRow[]> {
    return this.sql<MilestoneRow>(
      `SELECT m.occurred_on::text AS occurred_on, m.label,
              c.code AS campaign_code, m.kind_code
         FROM marketing.insights_milestones m
         LEFT JOIN marketing.insights_campaigns c ON c.id = m.campaign_id
        ORDER BY m.occurred_on, m.label`,
    );
  }

  /** Conjuntos de datos declarados por las fuentes y el último ingreso recibido. */
  async dataSources(): Promise<DataSourcesRow> {
    const rows = await this.sql<DataSourcesRow>(
      `SELECT array_agg(DISTINCT dataset_code) AS datasets,
              (max(last_received_at) AT TIME ZONE 'UTC')::date::text AS cutoff
         FROM marketing.insights_data_sources`,
    );
    return rows[0] ?? { datasets: null, cutoff: null };
  }

  /** Último día con hechos diarios de campaña (`null` si la tabla está vacía). */
  async lastFactDate(): Promise<string | null> {
    const rows = await this.sql<{ as_of: string | null }>(
      `SELECT max(fact_date)::text AS as_of
         FROM marketing.insights_campaign_daily_facts`,
    );
    return rows[0]?.as_of ?? null;
  }

  /**
   * Hechos por día, campaña y canal. Suma los creativos de cada celda; una
   * medida es `NULL` solo si ninguno de ellos la reporta (SUM ignora NULL).
   */
  facts(filter: FactsFilter): Promise<FactRow[]> {
    const params: unknown[] = [filter.fromDay, filter.toExclusiveDay];
    let extra = '';
    if (filter.campaignCodes.length > 0) {
      extra += ` AND c.code IN (${placeholders(filter.campaignCodes)})`;
      params.push(...filter.campaignCodes);
    }
    if (filter.channels.length > 0) {
      extra += ` AND f.channel_code IN (${placeholders(filter.channels)})`;
      params.push(...filter.channels);
    }
    params.push(filter.limit);
    const sums = FACT_MEASURES.map(
      ([key, column]) => `sum(f.${column}) AS "${key}"`,
    ).join(', ');
    return this.sql<FactRow>(
      `SELECT f.fact_date::text AS fact_date, c.code AS campaign_code,
              f.channel_code, ${sums}
         FROM marketing.insights_campaign_daily_facts f
         JOIN marketing.insights_campaigns c ON c.id = f.campaign_id
        WHERE f.fact_date >= ?::date AND f.fact_date < ?::date${extra}
        GROUP BY f.fact_date, c.code, f.channel_code
        ORDER BY f.fact_date, c.code, f.channel_code
        LIMIT ?`,
      params,
    );
  }
}
