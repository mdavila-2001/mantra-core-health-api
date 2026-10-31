import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AnalyticsWindow } from '../../domain/analytics-window';

/** Celdas de la malla del mapa de calor (fracciones del documento). */
export const HEATMAP_COLUMNS = 20;
export const HEATMAP_ROWS = 20;
/** Máximo de elementos en el ranking: un top, no un volcado. */
const ELEMENT_LIMIT = 20;
/** Nombre del evento de clic que manda el portal (`EVENTOS_UX.clic`). */
export const CLICK_EVENT_NAME = 'clic';

export interface HeatmapScope {
  tenantId: string;
  route: string;
  window: AnalyticsWindow;
  portalConceptId?: string;
  screenSize?: string;
}

export interface HeatmapTotalsRow {
  clicks: number;
  positioned: number;
  keyboard: number;
  repeated: number;
}
export interface HeatmapCellRow {
  col: number;
  row: number;
  clicks: number;
}
export interface HeatmapElementRow {
  target: string;
  clicks: number;
  repeated: number;
}
export interface HeatmapSizeRow {
  screen_size: string;
  clicks: number;
}

/**
 * Lecturas agregadas de clics por pantalla. Una fila por evento `clic` con sus
 * propiedades pivotadas (`x_doc`, `y_doc_px`, `alto_doc_px`, `tamano_pantalla`,
 * `objetivo`, `es_teclado`, `es_clic_repetido`); sólo salen conteos por celda,
 * por elemento y por tamaño: ni sesión, ni sujeto, ni usuario.
 *
 * Tenant, ruta y ventana son parámetros; lo único que se interpola son
 * constantes de este archivo (tamaño de la malla).
 */
@Injectable()
export class TelemetryClickHeatmapRepository {
  constructor(private readonly em: EntityManager) {}

  private sql<T>(query: string, params: unknown[]): Promise<T[]> {
    return this.em.getConnection().execute<T[]>(query, params, 'all');
  }

  /** CTE con un renglón por clic. Sus parámetros van primero en cada consulta. */
  private clicks(scope: HeatmapScope) {
    const params: unknown[] = [
      CLICK_EVENT_NAME,
      scope.route,
      scope.tenantId,
      scope.window.from,
      scope.window.to,
    ];
    let portal = '';
    if (scope.portalConceptId) {
      portal = ' AND e.portal_type_concept_id = ?';
      params.push(scope.portalConceptId);
    }
    const sql = `WITH clicks AS (
      SELECT e.id,
             max(p.value_number) FILTER (WHERE p.property_name = 'x_doc') AS x,
             max(p.value_number) FILTER (WHERE p.property_name = 'y_doc_px') AS y_px,
             max(p.value_number) FILTER (WHERE p.property_name = 'alto_doc_px') AS doc_px,
             max(p.value_string) FILTER (WHERE p.property_name = 'tamano_pantalla') AS screen_size,
             max(p.value_string) FILTER (WHERE p.property_name = 'objetivo') AS target,
             coalesce(bool_or(p.value_boolean) FILTER (WHERE p.property_name = 'es_teclado'), false) AS keyboard,
             coalesce(bool_or(p.value_boolean) FILTER (WHERE p.property_name = 'es_clic_repetido'), false) AS repeated
        FROM telemetry.user_activity_events e
        LEFT JOIN telemetry.user_activity_event_properties p ON p.user_activity_event_id = e.id
       WHERE e.event_name = ? AND e.route_template = ? AND e.tenant_id = ?
         AND e.occurred_at >= ? AND e.occurred_at < ?${portal}
       GROUP BY e.id
    ), positioned AS (
      SELECT * FROM clicks
       WHERE NOT keyboard AND x IS NOT NULL AND y_px IS NOT NULL AND doc_px > 0
    )`;
    return { sql, params };
  }

  /** Predicado de tamaño de pantalla sobre la CTE indicada (`clicks` o `positioned`). */
  private size(scope: HeatmapScope, params: unknown[]) {
    if (!scope.screenSize) return '';
    params.push(scope.screenSize);
    return ' WHERE screen_size = ?';
  }

  async totals(scope: HeatmapScope): Promise<HeatmapTotalsRow> {
    const { sql, params } = this.clicks(scope);
    const where = this.size(scope, params);
    const [row] = await this.sql<HeatmapTotalsRow>(
      `${sql}
       SELECT count(*)::int AS clicks,
              count(*) FILTER (WHERE NOT keyboard AND x IS NOT NULL AND y_px IS NOT NULL AND doc_px > 0)::int AS positioned,
              count(*) FILTER (WHERE keyboard)::int AS keyboard,
              count(*) FILTER (WHERE repeated)::int AS repeated
         FROM clicks${where}`,
      params,
    );
    return row ?? { clicks: 0, positioned: 0, keyboard: 0, repeated: 0 };
  }

  cells(scope: HeatmapScope): Promise<HeatmapCellRow[]> {
    const { sql, params } = this.clicks(scope);
    const where = this.size(scope, params);
    const c = HEATMAP_COLUMNS;
    const r = HEATMAP_ROWS;
    return this.sql<HeatmapCellRow>(
      `${sql}
       SELECT least(floor(least(greatest(x, 0), 1) * ${c}), ${c - 1})::int AS col,
              least(floor(least(greatest(y_px / doc_px, 0), 1) * ${r}), ${r - 1})::int AS row,
              count(*)::int AS clicks
         FROM positioned${where}
        GROUP BY 1, 2
        ORDER BY 2, 1`,
      params,
    );
  }

  elements(scope: HeatmapScope): Promise<HeatmapElementRow[]> {
    const { sql, params } = this.clicks(scope);
    const where = this.size(scope, params);
    return this.sql<HeatmapElementRow>(
      `${sql}
       SELECT target, count(*)::int AS clicks, count(*) FILTER (WHERE repeated)::int AS repeated
         FROM clicks${where ? `${where} AND target IS NOT NULL` : ' WHERE target IS NOT NULL'}
        GROUP BY 1
        ORDER BY 2 DESC, 1
        LIMIT ${ELEMENT_LIMIT}`,
      params,
    );
  }

  /** Reparto por tamaño de pantalla; no se filtra por tamaño (es el desglose). */
  sizes(scope: HeatmapScope): Promise<HeatmapSizeRow[]> {
    const { sql, params } = this.clicks({ ...scope, screenSize: undefined });
    return this.sql<HeatmapSizeRow>(
      `${sql}
       SELECT coalesce(screen_size, 'UNSPECIFIED') AS screen_size, count(*)::int AS clicks
         FROM clicks
        GROUP BY 1
        ORDER BY 2 DESC, 1`,
      params,
    );
  }
}
