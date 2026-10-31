import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../../common';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { resolveAnalyticsScope } from '../../application/analytics-scope';
import { TelemetryErrorsAnalyticsService } from '../../application/services/telemetry-errors-analytics.service';
import { ErrorsQueryDto } from '../dto/analytics-errors-query.dto';
import { ANALYTICS_RAW_ROLES, ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';

/**
 * Errores del cliente (H3.S1.M3). Sólo lectura: cada método declara
 * `@PlatformScopeOptional()` por su cuenta (nunca en la clase) para que un rol
 * de plataforma sin `X-Tenant-Id` agregue entre organizaciones con `minSample`.
 */
@ApiTags('telemetry-analytics')
@ApiBearerAuth()
@Controller('admin/analytics/errors')
export class TelemetryErrorsAnalyticsController {
  constructor(private readonly errors: TelemetryErrorsAnalyticsService) {}

  @Get()
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Errores del cliente: totales, por parte, clase, estado HTTP y ruta de API' })
  summary(@Query() query: ErrorsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.errors.errors(query, resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample));
  }

  @Get('fingerprints')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Top de huellas de error con tendencia' })
  fingerprints(@Query() query: ErrorsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.errors.fingerprints(query, resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample));
  }

  @Get('routes-not-found')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Rutas que cayeron en «no encontrada» o sin parte registrada' })
  routesNotFound(@Query() query: ErrorsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.errors.routesNotFound(query, resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample));
  }

  @Get('fingerprints/:fingerprint')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Detalle agregado de una huella; request_id recientes sólo a roles RAW' })
  fingerprint(
    @Param('fingerprint') fingerprint: string,
    @Query() query: ErrorsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const raw = user.roles.some((role) => (ANALYTICS_RAW_ROLES as readonly string[]).includes(role) || role === 'SUPERADMIN');
    return this.errors.fingerprint(
      fingerprint.slice(0, 32),
      query,
      resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample),
      raw,
    );
  }
}
