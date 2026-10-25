import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotAudited, Public, Roles, TenantAgnostic } from '../../../common';
import { ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';
import {
  TelemetryOnboardingAnalyticsService,
  type OnboardingEventPayload,
} from '../services/telemetry-onboarding-analytics.service';

export class IngestOnboardingEventsDto {
  readonly events!: readonly OnboardingEventPayload[];
}

@ApiTags('telemetry-onboarding-analytics')
@Controller()
export class TelemetryOnboardingAnalyticsController {
  constructor(private readonly service: TelemetryOnboardingAnalyticsService) {}

  @NotAudited(
    'Pública y sin actor (audit_log.user_id es NOT NULL); los eventos del embudo de alta se acumulan sólo en la memoria del proceso, sin fila en Postgres.',
  )
  @Post('telemetry/onboarding-events')
  @Public()
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Captura eventos de telemetría de alta y avance en formularios de registro',
  })
  recordEvents(@Body() dto: IngestOnboardingEventsDto): { ok: boolean } {
    return this.service.recordEvents(dto.events ?? []);
  }

  @Get('admin/analytics/onboarding/funnel')
  @ApiBearerAuth()
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Reporte de embudo y deserción paso a paso para formularios de alta',
  })
  getFunnelReport(
    @Query('formType') formType = 'patient',
    @Query('range') range = '7d',
  ) {
    return this.service.getFunnelReport(formType, range);
  }

  @Get('admin/analytics/onboarding/heatmap')
  @ApiBearerAuth()
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Mapa de calor por campo y nivel de fricción para formularios de alta',
  })
  getHeatmapReport(
    @Query('formType') formType = 'patient',
    @Query('metric')
    metric: 'interactions' | 'errors' | 'abandonment' = 'errors',
    @Query('range') range = '7d',
  ) {
    return this.service.getHeatmapReport(formType, metric, range);
  }
}
