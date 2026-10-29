import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { TelemetryGovernanceService } from '../services';
import {
  CreateTrackingPurposeDto,
  TrackingPurposeResponseDto,
  CreateEventSchemaDto,
  EventSchemaResponseDto,
  CreateDisclosureVersionDto,
  DisclosureVersionResponseDto,
  CreateFunnelDto,
  FunnelResponseDto,
} from '../dto';

/**
 * Endpoints de gobernanza de telemetría: propósitos, esquemas, disclosures y
 * funnels. Capa fina que delega en `TelemetryGovernanceService`. Requiere rol de
 * gobernanza de privacidad / analytics.
 */
@ApiTags('telemetry-governance')
@ApiBearerAuth()
@Controller('telemetry')
export class TelemetryGovernanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param governance - Valor de governance requerido por la operación.
   */
  constructor(private readonly governance: TelemetryGovernanceService) {}

  /** UC-28-01. */
  @Audited({
    action: 'TRACKING_PURPOSE_DEFINED',
    entity: 'tracking_purpose_definition',
    entityId: 'result.id',
  })
  @Post('tracking-purposes')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir propósito de tracking y base legal' })
  definePurpose(
    @Body() dto: CreateTrackingPurposeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackingPurposeResponseDto> {
    return this.governance.definePurpose(dto, actor);
  }

  /** UC-28-02. */
  @Audited({
    action: 'ACTIVITY_EVENT_SCHEMA_REGISTERED',
    entity: 'activity_event_schema_definition',
    entityId: 'result.id',
  })
  @Post('event-schemas')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar esquema de evento de actividad (versionado)',
  })
  registerEventSchema(
    @Body() dto: CreateEventSchemaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EventSchemaResponseDto> {
    return this.governance.registerEventSchema(dto, actor);
  }

  /** UC-28-03. */
  @Audited({
    action: 'TRACKING_DISCLOSURE_PUBLISHED',
    entity: 'tracking_disclosure_version',
    entityId: 'result.id',
  })
  @Post('disclosure-versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar versión de disclosure de tracking' })
  publishDisclosure(
    @Body() dto: CreateDisclosureVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DisclosureVersionResponseDto> {
    return this.governance.publishDisclosure(dto, actor);
  }

  /** UC-28-10. */
  @Audited({
    action: 'FUNNEL_DEFINED',
    entity: 'funnel_definition',
    entityId: 'result.id',
  })
  @Post('funnels')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir funnel y sus pasos' })
  defineFunnel(
    @Body() dto: CreateFunnelDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FunnelResponseDto> {
    return this.governance.defineFunnel(dto, actor);
  }
}
