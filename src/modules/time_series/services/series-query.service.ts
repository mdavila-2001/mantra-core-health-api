import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../common';
import { TimescaleRepository } from '../repositories';
import {
  DOWNSAMPLING_THRESHOLD_SECONDS,
  MAX_QUERY_POINTS,
  type RollupName,
  type TimeseriesTable,
} from '../constants';
import { QuerySeriesRangeDto, QuerySeriesRangeResponseDto } from '../dto';

/**
 * Columna numérica que agrega cada serie. Sin este mapa habría que aceptar el
 * nombre de columna por la petición, y ese nombre acabaría en la sentencia.
 *
 * `null` significa que la serie no tiene ninguna magnitud que promediar —sólo
 * registra que algo ocurrió—, así que su única consulta sensata es contar.
 */
const VALUE_COLUMN: Record<TimeseriesTable, string | null> = {
  ads_delivery_event_series: 'value',
  ai_runtime_metric_series: 'metric_value',
  application_tracking_series: null,
  audit_access_metric_series: 'count',
  device_raw_reading_series: 'numeric_value',
  ingestion_pipeline_metric_series: 'metric_value',
  lab_analyzer_event_series: 'numeric_value',
  location_ping_series: 'accuracy_m',
  normalized_vital_series: 'numeric_value',
  payment_gateway_metric_series: 'metric_value',
  service_sli_series: 'value',
  telemetry_event_series: 'duration_ms',
};

/**
 * Rollup que puede servir a cada serie cuando el bucket pedido es lo bastante
 * ancho. Las demás series no tienen agregado continuo y siempre se leen crudas.
 */
const ROLLUP_FOR: Partial<
  Record<TimeseriesTable, { hourly: RollupName; daily: RollupName }>
> = {
  service_sli_series: {
    hourly: 'continuous_sli_hourly',
    daily: 'continuous_sli_daily',
  },
  audit_access_metric_series: {
    hourly: 'continuous_audit_daily',
    daily: 'continuous_audit_daily',
  },
};

const SECONDS_PER_DAY = 86_400;

/** Convierte `5 minutes`, `1 hour`, `7 days`… a segundos. */
export function intervalToSeconds(interval: string): number {
  const match = /^\s*(\d+)\s*(second|minute|hour|day|week)s?\s*$/i.exec(
    interval,
  );
  if (!match) {
    throw new PreconditionFailedException(
      'El bucket tiene que expresarse como `<n> <unidad>`, p. ej. `5 minutes`.',
      { bucket: interval },
    );
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const seconds: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: SECONDS_PER_DAY,
    week: SECONDS_PER_DAY * 7,
  };
  return amount * seconds[unit];
}

/**
 * Consulta de rango con downsampling (UC-58-09).
 *
 * La decisión que define este caso de uso es de dónde sale el dato: pedir un mes
 * con bucket diario contra el crudo recorrería decenas de millones de filas para
 * devolver treinta puntos. Cuando el bucket es lo bastante ancho y existe un
 * agregado continuo para esa serie, se sirve desde ahí.
 */
@Injectable()
export class SeriesQueryService {
  constructor(
    private readonly em: EntityManager,
    private readonly timescaleRepo: TimescaleRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeriesQueryService.name);
  }

  async queryRange(
    seriesId: string,
    query: QuerySeriesRangeDto,
  ): Promise<QuerySeriesRangeResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from >= to) {
      throw new PreconditionFailedException(
        'El rango tiene que empezar antes de terminar.',
        { from: query.from, to: query.to },
      );
    }

    const bucketSeconds = intervalToSeconds(query.bucket);
    const dataset = query.dataset as TimeseriesTable;
    const limit = Math.min(query.limit ?? 1000, MAX_QUERY_POINTS);
    const agg = query.agg ?? 'avg';

    // Pedir una media de una serie que sólo registra ocurrencias devolvería un
    // número sin significado; es mejor decirlo que inventarlo.
    if (VALUE_COLUMN[dataset] === null && agg !== 'count') {
      throw new PreconditionFailedException(
        'Esta serie no tiene magnitud que agregar; sólo admite `count`.',
        { dataset, agg },
      );
    }

    // El `+ 1` es lo que permite saber si hay más datos sin hacer una segunda
    // consulta de conteo: si vuelve una fila de más, la respuesta está recortada.
    const fetchLimit = limit + 1;

    const rollup = this.pickRollup(dataset, bucketSeconds);

    return this.em.transactional(async (tx) => {
      const rows = rollup
        ? await this.timescaleRepo.queryRollupRange(tx, rollup, {
            tenantId: query.tenantId,
            from,
            to,
            limit: fetchLimit,
          })
        : await this.timescaleRepo.queryRawRange(
            tx,
            dataset,
            VALUE_COLUMN[dataset],
            agg,
            {
              tenantId: query.tenantId,
              seriesId,
              from,
              to,
              bucket: query.bucket,
              limit: fetchLimit,
            },
          );

      const truncated = rows.length > limit;
      const points = rows.slice(0, limit).map((row) => ({
        bucket: row.bucket,
        value: row.value === null ? null : Number(row.value),
        samples: Number(row.samples),
      }));

      this.logger.info(
        {
          operation: 'ts.query.range',
          seriesId,
          dataset,
          source: rollup ?? 'raw',
          points: points.length,
          truncated,
        },
        'Rango de serie consultado',
      );

      return { seriesId, source: rollup ?? 'raw', points, truncated };
    });
  }

  /**
   * Elige el agregado continuo que puede servir la consulta.
   *
   * Sólo se usa si el bucket pedido es **múltiplo exacto** del bucket del
   * agregado: pedir 90 minutos contra un agregado horario daría buckets que no
   * cuadran con los materializados, y el resultado no sería el que pidió el
   * llamante sino uno parecido.
   */
  private pickRollup(
    dataset: TimeseriesTable,
    bucketSeconds: number,
  ): RollupName | null {
    if (bucketSeconds < DOWNSAMPLING_THRESHOLD_SECONDS) return null;

    const candidates = ROLLUP_FOR[dataset];
    if (!candidates) return null;

    if (bucketSeconds % SECONDS_PER_DAY === 0) return candidates.daily;
    if (bucketSeconds % DOWNSAMPLING_THRESHOLD_SECONDS === 0)
      return candidates.hourly;
    return null;
  }
}
