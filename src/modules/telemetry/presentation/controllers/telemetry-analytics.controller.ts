import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrentUser,
  Roles,
  getCurrentTenantId,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { PlatformScopeOptional } from '../../../../common/tenant/platform-scope';
import {
  resolveAnalyticsScope,
  type AnalyticsActorScope,
} from '../../application/analytics-scope';
import { AnalyticsDevicesResponseDto } from '../dto/analytics-devices.dto';
import {
  PORTAL_CODES,
  TelemetryAnalyticsService,
  VITAL_METRICS,
  type PortalCode,
  type VitalMetric,
} from '../../application/services/telemetry-analytics.service';

/** Agregados: quien opera el producto y quien lo gobierna. */
export const ANALYTICS_READ_ROLES = [
  'PLATFORM_ADMIN',
  'SECURITY_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'MARKETING_MANAGER',
  'DPO',
] as const;

/** Timeline de una sesión: dato más cercano al individuo, lista más corta. */
export const ANALYTICS_RAW_ROLES = [
  'PLATFORM_ADMIN',
  'SECURITY_ADMIN',
  'DPO',
] as const;

export class AnalyticsWindowQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: to − 7 días',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: ahora',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: ['hour', 'day'] })
  @IsOptional()
  @IsIn(['hour', 'day'])
  interval?: 'hour' | 'day';

  @ApiPropertyOptional({ enum: PORTAL_CODES })
  @IsOptional()
  @IsIn(PORTAL_CODES)
  portal?: PortalCode;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    description:
      'Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  minSample?: number;
}

/** Ventana y portal de `/devices`: sin `interval`, que no tiene sentido sin serie. */
export class DevicesQueryDto extends PickType(AnalyticsWindowQueryDto, [
  'from',
  'to',
  'portal',
  'minSample',
] as const) {}

export class WebVitalsQueryDto extends AnalyticsWindowQueryDto {
  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Plantilla de ruta, p. ej. /patients/:id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  route?: string;

  @ApiPropertyOptional({
    enum: VITAL_METRICS,
    description: 'Desglose p75 por ruta de esta métrica',
  })
  @IsOptional()
  @IsIn(VITAL_METRICS)
  metric?: VitalMetric;
}

export class SessionsQueryDto extends AnalyticsWindowQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Con tenant en el contexto, el tenant a secas (como siempre); sin él, sólo un
 * rol de plataforma obtiene el alcance plataforma, y cualquier otro 412.
 */
function actorScope(
  user: AuthenticatedUser | undefined,
  minSample?: number,
): string | AnalyticsActorScope {
  return (
    getCurrentTenantId() ??
    resolveAnalyticsScope(user, ANALYTICS_READ_ROLES, minSample)
  );
}

/**
 * Analítica de producto y RUM para el portal administrativo. Sólo lectura, con
 * ventana obligatoria (máx. 92 días) y agregados calculados en el backend.
 * Toda lectura se acota al tenant que resolvió el guard. Las lecturas de
 * AGREGADOS (`overview`, `timeseries`, `web-vitals`,
 * `devices`) llevan `@PlatformScopeOptional()` a nivel de método: un rol de
 * plataforma global sin `X-Tenant-Id` agrega entre organizaciones y los grupos con
 * menos de `minSample` sujetos se suprimen (X-5). Las de nivel individuo
 * (`sessions`, `funnels/:id/report`, `pipeline-health`) siguen exigiendo organización.
 * La ingesta sigue en `/telemetry/*`; esto no la sustituye.
 */
@ApiTags('telemetry-analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
export class TelemetryAnalyticsController {
  constructor(private readonly analytics: TelemetryAnalyticsService) {}

  @Get('overview')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Totales, rutas y eventos principales de la ventana',
  })
  overview(
    @Query() query: AnalyticsWindowQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.analytics.overview(query, actorScope(user, query.minSample));
  }

  @Get('devices')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary:
      'Desglose de dispositivos (tipo, SO, navegador, versión de app); bots aparte; lo no medido se declara',
  })
  @ApiOkResponse({ type: AnalyticsDevicesResponseDto })
  devices(
    @Query() query: DevicesQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.analytics.devices(query, actorScope(user, query.minSample));
  }

  @Get('timeseries')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary: 'Eventos y sesiones por hora o día (UTC), cubos vacíos en 0',
  })
  timeseries(
    @Query() query: AnalyticsWindowQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.analytics.timeseries(query, actorScope(user, query.minSample));
  }

  @Get('web-vitals')
  @Roles(...ANALYTICS_READ_ROLES)
  @PlatformScopeOptional()
  @ApiOperation({
    summary:
      'p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra',
  })
  webVitals(
    @Query() query: WebVitalsQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.analytics.webVitals(query, actorScope(user, query.minSample));
  }

  @Get('funnels')
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({ summary: 'Embudos definidos con sus pasos' })
  listFunnels() {
    return this.analytics.listFunnels();
  }

  @Get('funnels/:funnelId/report')
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor',
  })
  funnelReport(
    @Param('funnelId', ParseUUIDPipe) funnelId: string,
    @Query() query: AnalyticsWindowQueryDto,
  ) {
    return this.analytics.funnelReport(funnelId, query, requireTenantId());
  }

  @Get('pipeline-health')
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara',
  })
  pipelineHealth(@Query() query: AnalyticsWindowQueryDto) {
    return this.analytics.pipelineHealth(query, requireTenantId());
  }

  @Get('sessions')
  @Roles(...ANALYTICS_RAW_ROLES)
  @ApiOperation({
    summary: 'Sesiones de la ventana (sin identificadores de sesión ni sujeto)',
  })
  listSessions(@Query() query: SessionsQueryDto) {
    return this.analytics.listSessions(query, requireTenantId());
  }

  @Get('sessions/:id')
  @Roles(...ANALYTICS_RAW_ROLES)
  @ApiOperation({
    summary:
      'Timeline de una sesión: eventos y nombres de propiedad, sin valores',
  })
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.analytics.getSession(id, requireTenantId());
  }
}
