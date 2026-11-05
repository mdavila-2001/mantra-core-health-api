import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import {
  WindowError,
  resolveWindow,
} from '../../../common/time/analytics-window';
import { MarketingErrorReason } from '../marketing.error-reasons';
import {
  FACT_MEASURES,
  InsightsFactsRepository,
  type FactMeasure,
  type FactRow,
} from '../repositories/insights-facts.repository';
import {
  INSIGHTS_CHANNELS,
  type InsightsFactsQueryDto,
} from '../dto/insights-query.dto';
import type {
  InsightsCatalogResponseDto,
  InsightsDailyFactDto,
  InsightsFactsResponseDto,
  InsightsMetaDto,
  InsightsMilestoneDto,
} from '../dto/insights-facts.response.dto';

/** Tope de filas de una lectura de hechos: más obliga a acotar campañas o canales. */
export const INSIGHTS_MAX_FACT_ROWS = 5000;

const DAY_MS = 86_400_000;
const CAMPAIGN_STATUSES = ['active', 'ended', 'planned'] as const;
const MILESTONE_KINDS = ['launch', 'viral', 'press', 'offer_change'] as const;

/** Aviso del conjunto sintético: la interfaz lo muestra tal cual junto al dato. */
export const INSIGHTS_DEMO_NOTICE =
  'Datos sintéticos de demostración. No corresponden a campañas ni a usuarios reales de AloVida.';
export const INSIGHTS_LIVE_NOTICE =
  'Datos de las fuentes conectadas de AloVida, hasta el día de corte.';

/**
 * bigint (texto) a número. `null` se conserva: es una medida que la fuente no
 * reporta, y convertirla en 0 afirmaría que se midió y fue cero.
 */
export function toMeasure(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(`Medida fuera del rango entero seguro: ${value}`);
  }
  return parsed;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);

interface DayWindow {
  fromDay: string;
  toDay: string;
  toExclusiveDay: string;
}

/**
 * Ventana de días inclusiva en ambos extremos. `resolveWindow` trabaja con un
 * intervalo semiabierto, así que el fin se corre un día: así `from == to` es un
 * día válido y el máximo de 92 días cuenta días inclusivos (igual que el
 * simulador del front).
 */
export function resolveDayWindow(from: string, to: string): DayWindow {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  try {
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new WindowError('INVALID_DATE', 'Fecha de ventana no válida');
    }
    const fromDay = fromDate.toISOString().slice(0, 10);
    const toDay = toDate.toISOString().slice(0, 10);
    const toExclusiveDay = new Date(Date.parse(toDay) + DAY_MS)
      .toISOString()
      .slice(0, 10);
    resolveWindow({ from: fromDay, to: toExclusiveDay, interval: 'day' });
    return { fromDay, toDay, toExclusiveDay };
  } catch (error) {
    if (error instanceof WindowError) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        error.message,
        { reason: error.reason },
        MarketingErrorReason.INSIGHTS_WINDOW_INVALID,
      );
    }
    throw error;
  }
}

/**
 * Lecturas de hechos de campaña y catálogo de AloVida Insights. Dataset de
 * plataforma: no se filtra por tenant (decisión D-7). Lo que la fuente no
 * reporta (`NULL`) se declara en `meta.notMeasured`, nunca se muestra como 0.
 */
@Injectable()
export class InsightsFactsService {
  constructor(private readonly repo: InsightsFactsRepository) {}

  async meta(
    window: InsightsMetaDto['window'],
    notMeasured: InsightsMetaDto['notMeasured'],
  ): Promise<InsightsMetaDto> {
    const [sources, lastFactDate] = await Promise.all([
      this.repo.dataSources(),
      this.repo.lastFactDate(),
    ]);
    // Basta una fuente sintética para que el conjunto no se presente como real.
    const dataset: InsightsMetaDto['dataset'] =
      sources.datasets !== null &&
      sources.datasets.length > 0 &&
      sources.datasets.every((code) => code === 'live')
        ? 'live'
        : 'demo';
    const cutoff = sources.cutoff ?? lastFactDate ?? todayUtc();
    return {
      dataset,
      asOf: lastFactDate ?? cutoff,
      cutoff,
      window,
      notice: dataset === 'live' ? INSIGHTS_LIVE_NOTICE : INSIGHTS_DEMO_NOTICE,
      notMeasured,
    };
  }

  async catalog(): Promise<InsightsCatalogResponseDto> {
    const [campaigns, channelRows, milestones] = await Promise.all([
      this.repo.campaigns(),
      this.repo.campaignChannels(),
      this.repo.milestones(),
    ]);

    const channelsOf = new Map<string, string[]>();
    for (const row of channelRows) {
      channelsOf.set(row.campaign_code, [
        ...(channelsOf.get(row.campaign_code) ?? []),
        row.channel_code,
      ]);
    }
    const byChannelOrder = (a: string, b: string) =>
      INSIGHTS_CHANNELS.indexOf(a as never) -
      INSIGHTS_CHANNELS.indexOf(b as never);

    const mappedCampaigns = campaigns.map((row) => {
      const status = CAMPAIGN_STATUSES.find((s) => s === row.status_code);
      if (!status) {
        throw new Error(
          `Estado de campaña desconocido para ${row.code}: ${row.status_code ?? 'sin concepto'}`,
        );
      }
      const targets = Object.fromEntries(
        Object.entries(
          (row.targets_json as Record<string, unknown> | null) ?? {},
        ).filter(([, value]) => typeof value === 'number'),
      ) as Record<string, number>;
      return {
        id: row.code,
        name: row.name,
        objective: row.objective_text ?? '',
        audience: row.audience_text ?? '',
        startDate: row.start_on,
        endDate: row.end_on,
        budgetCents: toMeasure(row.budget_cents),
        status,
        revenuePerConversionCents: toMeasure(row.revenue_per_conversion_cents),
        targets,
        channels: [...(channelsOf.get(row.code) ?? [])].sort(byChannelOrder),
      };
    });

    const mappedMilestones: InsightsMilestoneDto[] = [];
    let unknownKinds = 0;
    for (const row of milestones) {
      const kind = MILESTONE_KINDS.find((k) => k === row.kind_code);
      if (!kind) {
        unknownKinds += 1;
        continue;
      }
      mappedMilestones.push({
        date: row.occurred_on,
        label: row.label,
        campaignId: row.campaign_code,
        kind,
      });
    }

    const notMeasured =
      unknownKinds > 0
        ? [
            {
              metric: 'milestones',
              reason: `${unknownKinds} hito(s) con un tipo que Insights no reconoce se omitieron.`,
            },
          ]
        : [];
    return {
      data: { campaigns: mappedCampaigns, milestones: mappedMilestones },
      meta: await this.meta(null, notMeasured),
    };
  }

  async campaignFacts(
    query: InsightsFactsQueryDto,
  ): Promise<InsightsFactsResponseDto> {
    const window = resolveDayWindow(query.from, query.to);
    const rows = await this.repo.facts({
      fromDay: window.fromDay,
      toExclusiveDay: window.toExclusiveDay,
      campaignCodes: query.campaignIds ?? [],
      channels: query.channels ?? [],
      limit: INSIGHTS_MAX_FACT_ROWS + 1,
    });
    if (rows.length > INSIGHTS_MAX_FACT_ROWS) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        `La consulta devolvería más de ${INSIGHTS_MAX_FACT_ROWS} filas: acote campañas, canales o fechas.`,
        { limit: INSIGHTS_MAX_FACT_ROWS },
        MarketingErrorReason.INSIGHTS_FACTS_LIMIT_EXCEEDED,
      );
    }
    return {
      data: rows.map(toDailyFact),
      meta: await this.meta(
        { from: window.fromDay, to: window.toDay },
        notMeasuredOf(rows),
      ),
    };
  }
}

function toDailyFact(row: FactRow): InsightsDailyFactDto {
  const measures = Object.fromEntries(
    FACT_MEASURES.map(([key]) => [key, toMeasure(row[key])]),
  ) as Record<FactMeasure, number | null>;
  return {
    date: row.fact_date,
    campaignId: row.campaign_code,
    channel: row.channel_code,
    ...measures,
  };
}

/**
 * Medidas que la fuente no reporta: una entrada por medida, con los canales en
 * los que TODAS las filas de la ventana vienen sin dato. Una medida con dato en
 * algunas filas y sin él en otras de un mismo canal se declara como parcial.
 */
export function notMeasuredOf(
  rows: readonly FactRow[],
): InsightsMetaDto['notMeasured'] {
  const out: InsightsMetaDto['notMeasured'] = [];
  for (const [key] of FACT_MEASURES) {
    const byChannel = new Map<string, { nulls: number; total: number }>();
    for (const row of rows) {
      const entry = byChannel.get(row.channel_code) ?? { nulls: 0, total: 0 };
      entry.total += 1;
      if (row[key] === null) entry.nulls += 1;
      byChannel.set(row.channel_code, entry);
    }
    const none = [...byChannel]
      .filter(([, e]) => e.nulls === e.total)
      .map(([channel]) => channel);
    const some = [...byChannel]
      .filter(([, e]) => e.nulls > 0 && e.nulls < e.total)
      .map(([channel]) => channel);
    if (none.length > 0) {
      out.push({
        metric: key,
        reason: `La fuente no reporta esta medida en: ${none.sort().join(', ')}.`,
      });
    }
    if (some.length > 0) {
      out.push({
        metric: key,
        reason: `Faltan datos de esta medida en algunos días de: ${some.sort().join(', ')}.`,
      });
    }
  }
  return out;
}
