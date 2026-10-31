import { HttpStatus, Injectable } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../../common';
import {
  WindowError,
  resolveWindow,
  type AnalyticsWindow,
} from '../../domain/analytics-window';
import {
  HEATMAP_COLUMNS,
  HEATMAP_ROWS,
  TelemetryClickHeatmapRepository,
  type HeatmapScope,
} from '../../infrastructure/repositories/telemetry-click-heatmap.repository';
import { TELE } from '../../telemetry.concepts';
import type { ClickHeatmapQueryDto } from '../../presentation/dto/click-heatmap.dto';

/** 4 decimales: suficiente para una fracción de celda y sin ruido de coma flotante. */
const ratio = (num: number, den: number) =>
  den === 0 ? null : Math.round((num / den) * 10_000) / 10_000;
/** Centro de la celda en 0–1, redondeado a 4 decimales. */
const center = (index: number, size: number) =>
  Math.round(((index + 0.5) / size) * 10_000) / 10_000;

/**
 * Mapa de calor de clics de UNA pantalla, calculado en la base con los eventos
 * `clic` que captura el portal. Declara lo que no mide: un clic sin
 * coordenadas (de teclado, o enviado cuando el esquema del evento no admitía
 * las propiedades) se cuenta pero no se pinta, y la altura relativa depende de
 * la altura del documento al momento del clic.
 */
@Injectable()
export class TelemetryClickHeatmapService {
  constructor(private readonly repo: TelemetryClickHeatmapRepository) {}

  private scope(query: ClickHeatmapQueryDto, tenantId: string): HeatmapScope {
    let window: AnalyticsWindow;
    try {
      window = resolveWindow({ from: query.from, to: query.to });
    } catch (error) {
      if (error instanceof WindowError) {
        throw new DomainException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.VALIDATION_FAILED,
          error.message,
          { reason: error.reason },
        );
      }
      throw error;
    }
    return {
      tenantId,
      route: query.route,
      window,
      portalConceptId: query.portal
        ? query.portal === 'WEB'
          ? TELE.PORTAL_WEB
          : TELE.PORTAL_MOBILE
        : undefined,
      screenSize: query.screenSize,
    };
  }

  async heatmap(query: ClickHeatmapQueryDto, tenantId: string) {
    const scope = this.scope(query, tenantId);
    const [totals, cells, elements, sizes] = await Promise.all([
      this.repo.totals(scope),
      this.repo.cells(scope),
      this.repo.elements(scope),
      this.repo.sizes(scope),
    ]);
    const withoutPosition = Math.max(
      0,
      totals.clicks - totals.positioned - totals.keyboard,
    );

    const notMeasured: Array<{ metric: string; reason: string }> = [
      {
        metric: 'keyboardClicks',
        reason:
          'Una activación por teclado llega sin coordenadas reales: se cuenta en totals.keyboard pero no se pinta (pintarla sería un punto caliente falso en la esquina).',
      },
      {
        metric: 'verticalPosition',
        reason:
          'La posición vertical es y_doc_px / alto_doc_px con la altura del documento al momento del clic: en páginas que crecen al cargar contenido la fila se desplaza. No es una posición de viewport.',
      },
    ];
    if (totals.clicks === 0) {
      notMeasured.push({
        metric: 'clicks',
        reason:
          'No hay eventos «clic» de esta ruta en la ventana: o nadie la usó, o el portal no capturó (sin consentimiento de tracking, sin sesión autenticada o sin el esquema de evento configurado). No se distingue desde aquí.',
      });
    } else if (totals.positioned === 0 && totals.keyboard < totals.clicks) {
      notMeasured.push({
        metric: 'coordinates',
        reason:
          'Hay clics pero ninguno con coordenadas (x_doc, y_doc_px, alto_doc_px): el esquema del evento debe declararlas en propertySchemaJson para que se persistan. Solo se informan conteos por elemento y tamaño.',
      });
    } else if (withoutPosition > 0) {
      notMeasured.push({
        metric: 'clicksWithoutCoordinates',
        reason: `${withoutPosition} clic(s) no de teclado llegaron sin coordenadas completas; cuentan en totals.clicks pero no se pintan.`,
      });
    }

    return {
      route: query.route,
      window: {
        from: scope.window.from.toISOString(),
        to: scope.window.to.toISOString(),
        timezone: scope.window.timezone,
        portal: query.portal ?? null,
        screenSize: query.screenSize ?? null,
      },
      grid: { columns: HEATMAP_COLUMNS, rows: HEATMAP_ROWS },
      totals: {
        clicks: totals.clicks,
        positioned: totals.positioned,
        keyboard: totals.keyboard,
        withoutPosition,
        repeated: totals.repeated,
      },
      cells: cells.map((cell) => ({
        column: cell.col,
        row: cell.row,
        x: center(cell.col, HEATMAP_COLUMNS),
        y: center(cell.row, HEATMAP_ROWS),
        clicks: cell.clicks,
        share: ratio(cell.clicks, totals.positioned),
      })),
      byElement: elements.map((element) => ({
        target: element.target,
        clicks: element.clicks,
        repeated: element.repeated,
      })),
      byScreenSize: sizes.map((size) => ({
        screenSize: size.screen_size,
        clicks: size.clicks,
      })),
      notMeasured,
    };
  }
}
