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
import type { AnalyticsActorScope } from '../analytics-scope';

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

  private scope(
    query: ClickHeatmapQueryDto,
    actor: string | AnalyticsActorScope,
  ): HeatmapScope {
    const tenantId = typeof actor === 'string' ? actor : actor.tenantId;
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

  async heatmap(query: ClickHeatmapQueryDto, tenantId: string | AnalyticsActorScope) {
    const scope = this.scope(query, tenantId);
    const metric = query.metric ?? 'clicks';
    const platformMin =
      typeof tenantId === 'string' || tenantId.tenantId !== undefined
        ? undefined
        : tenantId.minSample;
    const small = (subjects: number | undefined) =>
      platformMin !== undefined && (subjects ?? 0) < platformMin;
    const [rawTotals, rawCells, rawElements, sizes, rawScroll, views] = await Promise.all([
      this.repo.totals(scope),
      this.repo.cells(scope),
      this.repo.elements(scope),
      this.repo.sizes(scope),
      this.repo.scroll(scope),
      this.repo.views(scope),
    ]);
    // Alcance plataforma: si la ruta entera tiene menos de `minSample` personas
    // no sale nada; si no, se suprimen las celdas y los elementos pequeños.
    const hidden = small(rawTotals.subjects) && rawTotals.clicks > 0;
    const totals = rawTotals;
    const cells = hidden ? [] : rawCells.filter((c) => !small(c.subjects));
    const elements = hidden ? [] : rawElements.filter((e) => !small(e.subjects));
    const suppressedCells = rawCells.length - cells.length;
    const suppressedElements = rawElements.length - elements.length;
    const scroll = small(rawScroll.subjects) && rawScroll.pages > 0 ? null : rawScroll;
    const value = (c: { clicks: number; rage?: number; dead?: number }) =>
      metric === 'rage' ? (c.rage ?? 0) : metric === 'dead' ? (c.dead ?? 0) : c.clicks;
    const shown =
      metric === 'scroll'
        ? []
        : cells.filter((c) => metric === 'clicks' || value(c) > 0);
    const shownTotal = shown.reduce((a, c) => a + value(c), 0);
    const withoutPosition = Math.max(
      0,
      totals.clicks - totals.positioned - totals.keyboard,
    );

    const notMeasured: Array<{ metric: string; reason: string }> = [
      ...(hidden
        ? [
            {
              metric: 'minSample',
              reason: `Menos de ${platformMin} personas distintas hicieron clic en esta ruta: alcance plataforma (agregado entre organizaciones), todo se suprime.`,
            },
          ]
        : suppressedCells + suppressedElements > 0
          ? [
              {
                metric: 'minSample',
                reason: `${suppressedCells} celda(s) y ${suppressedElements} elemento(s) con menos de ${platformMin} personas se suprimieron (alcance plataforma).`,
              },
            ]
          : []),
      ...(scroll === null
        ? [
            {
              metric: 'scroll',
              reason: `Menos de ${platformMin} personas con abandono de página registrado: la profundidad de scroll se suprime (alcance plataforma).`,
            },
          ]
        : rawScroll.pages > rawScroll.measured
          ? [
              {
                metric: 'scrollDepthWithoutValue',
                reason: `${rawScroll.pages - rawScroll.measured} página(s) abandonada(s) llegaron sin profundidad_max.`,
              },
            ]
          : []),
      {
        metric: 'deadClicks',
        reason:
          'es_clic_muerto lo marca el portal (sin navegación, petición ni cambio del DOM en 1 s); un clic anterior a esa captura no lo trae y cuenta como no muerto.',
      },
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
      metric,
      scope:
        platformMin !== undefined || (typeof tenantId !== 'string' && tenantId.tenantId === undefined)
          ? { level: 'platform', tenantId: null, minSample: platformMin ?? null }
          : { level: 'tenant', tenantId: scope.tenantId ?? null, minSample: null },
      views,
      totals: hidden
        ? {
            clicks: null,
            positioned: null,
            keyboard: null,
            withoutPosition: null,
            repeated: null,
            dead: null,
          }
        : {
            clicks: totals.clicks,
            positioned: totals.positioned,
            keyboard: totals.keyboard,
            withoutPosition,
            repeated: totals.repeated,
            dead: totals.dead,
          },
      cells: shown.map((cell) => ({
        column: cell.col,
        row: cell.row,
        x: center(cell.col, HEATMAP_COLUMNS),
        y: center(cell.row, HEATMAP_ROWS),
        clicks: cell.clicks,
        rage: cell.rage ?? 0,
        dead: cell.dead ?? 0,
        value: value(cell),
        share:
          metric === 'clicks'
            ? ratio(cell.clicks, totals.positioned)
            : ratio(value(cell), shownTotal),
      })),
      byElement: elements.map((element) => ({
        target: element.target,
        clicks: element.clicks,
        repeated: element.repeated,
        dead: element.dead ?? 0,
      })),
      scroll: scroll
        ? {
            pages: scroll.pages,
            measured: scroll.measured,
            buckets: scroll.reached.map((reached, i) => ({
              depth: (i + 1) / 10,
              pagesReached: reached,
              share: ratio(reached, scroll.measured),
            })),
          }
        : null,
      byScreenSize: sizes.map((size) => ({
        screenSize: size.screen_size,
        clicks: size.clicks,
      })),
      notMeasured,
    };
  }
}
