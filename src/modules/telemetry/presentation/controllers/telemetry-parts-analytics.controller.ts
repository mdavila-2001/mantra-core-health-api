import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../../common';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import { resolveAnalyticsScope } from '../../application/analytics-scope';
import { TelemetryPartsAnalyticsService } from '../../application/services/telemetry-parts-analytics.service';
import { PartsQueryDto } from '../dto/analytics-errors-query.dto';
import { ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';

/** Uso por parte de la app. `@PlatformScopeOptional()` por método, nunca en la clase. */
@ApiTags('telemetry-analytics')
@ApiBearerAuth()
@Controller('admin/analytics/parts')
export class TelemetryPartsAnalyticsController {
  constructor(private readonly parts: TelemetryPartsAnalyticsService) {}

  @Get()
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Árbol de partes con su uso, errores y vitales; lo que no casa va a unmapped' })
  list(@Query() query: PartsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.parts.parts(query, resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample));
  }

  @Get(':routeCode')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({ summary: 'Detalle de una parte: serie, acciones clave, vitales y errores' })
  detail(
    @Param('routeCode') routeCode: string,
    @Query() query: PartsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.parts.part(routeCode.slice(0, 100), query, resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, query.minSample));
  }
}
