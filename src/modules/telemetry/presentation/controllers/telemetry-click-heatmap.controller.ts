import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { resolveAnalyticsScope } from '../../application/analytics-scope';
import { TelemetryClickHeatmapService } from '../../application/services/telemetry-click-heatmap.service';
import { ClickHeatmapQueryDto } from '../dto/click-heatmap.dto';
import { ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';

/**
 * CONTRATO — `GET /admin/analytics/heatmap?route&from&to[&portal][&screenSize]` (H2.S1.M3).
 * Solo lectura; roles `ANALYTICS_READ_ROLES`; acotado al tenant activo. Un rol de
 * plataforma global sin `X-Tenant-Id` (`@PlatformScopeOptional()` por método)
 * agrega entre organizaciones y suprime celdas/elementos con menos de `minSample`
 * personas (`notMeasured`). `metric=clicks|rage|dead|scroll`; `scroll` devuelve
 * `scroll.buckets` y ninguna celda.
 * Detalle: `mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H2-dinero-y-heatmap.md`.
 *
 * ```
 * 200 {
 *   route: string,
 *   window: { from, to, timezone: 'UTC', portal: 'WEB'|'MOBILE'|null, screenSize: 'movil'|'tableta'|'escritorio'|null },
 *   grid: { columns: 20, rows: 20 },
 *   totals: { clicks, positioned, keyboard, withoutPosition, repeated },   // positioned = con coordenadas y no de teclado
 *   cells: [{ column, row, x, y, clicks, share }],   // sólo celdas con clics; x,y = centro en 0–1; share = clicks/positioned (null si positioned=0)
 *   byElement: [{ target: string, clicks, repeated }],      // top 20 por selector que manda el cliente
 *   byScreenSize: [{ screenSize: 'movil'|'tableta'|'escritorio'|'UNSPECIFIED', clicks }],  // no se filtra por screenSize
 *   notMeasured: [{ metric: string, reason: string }]
 * }
 * 400 route ausente/vacía, from/to no ISO, parámetro no declarado · 401 · 403 ROLE_INSUFFICIENT
 * 422 TENANT_REQUIRED · 422 VALIDATION_FAILED details.reason ∈ EMPTY_WINDOW | WINDOW_TOO_LARGE | INVALID_DATE
 * ```
 *
 * Las coordenadas existen sólo si el esquema del evento declara `x_doc`,
 * `y_doc_px` y `alto_doc_px`; si no, los conteos por elemento/tamaño siguen
 * saliendo y `notMeasured` lo dice. Sin sesión, sujeto ni usuario en la salida.
 */
@ApiTags('telemetry-analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
export class TelemetryClickHeatmapController {
  constructor(private readonly heatmap: TelemetryClickHeatmapService) {}

  @Get('heatmap')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary:
      'Mapa de calor de clics de una pantalla: celdas normalizadas, elementos y tamaño; lo no medido se declara',
  })
  getHeatmap(
    @Query() query: ClickHeatmapQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.heatmap.heatmap(
      query,
      getCurrentTenantId() ??
        resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample),
    );
  }
}
