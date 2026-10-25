import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelemetryEventsService } from '../services';
import {
  CaptureActivityEventsDto,
  ActivityEventsResponseDto,
  CreateClientContextDto,
  ClientContextResponseDto,
  RecordWebVitalsDto,
  WebVitalsResponseDto,
  CreateConversionEventDto,
  ConversionEventResponseDto,
  CloseJourneyDto,
  JourneyResponseDto,
} from '../dto';
import { Audited } from '../../../common';

/**
 * Endpoints de ingesta de telemetría (SDK/portal y workers). Capa fina que delega
 * en `TelemetryEventsService`. Protegidos por el guard global (requieren token).
 */
@ApiTags('telemetry-events')
@ApiBearerAuth()
@Controller('telemetry')
export class TelemetryEventsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param events - Valor de events requerido por la operación.
   */
  constructor(private readonly events: TelemetryEventsService) {}

  /** UC-28-07. */
  @Audited({
    action: 'USER_ACTIVITY_EVENTS_CAPTURED',
    entity: 'user_activity_event',
  })
  @Post('activity-events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Capturar evento(s) de actividad consent-aware (batch)',
  })
  captureActivityEvents(
    @Body() dto: CaptureActivityEventsDto,
  ): Promise<ActivityEventsResponseDto> {
    return this.events.captureActivityEvents(dto);
  }

  /** UC-28-08. */
  @Audited({
    action: 'CLIENT_CONTEXT_CAPTURED',
    entity: 'client_context',
    entityId: 'result.id',
  })
  @Post('client-contexts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar contexto de cliente/dispositivo + journey',
  })
  captureClientContext(
    @Body() dto: CreateClientContextDto,
  ): Promise<ClientContextResponseDto> {
    return this.events.captureClientContext(dto);
  }

  /** UC-28-09. */
  @Audited({
    action: 'WEB_VITALS_RECORDED',
    entity: 'web_vital',
  })
  @Post('web-vitals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar métricas Core Web Vitals por ruta (batch)',
  })
  recordWebVitals(
    @Body() dto: RecordWebVitalsDto,
  ): Promise<WebVitalsResponseDto> {
    return this.events.recordWebVitals(dto);
  }

  /** UC-28-11. */
  @Audited({
    action: 'TELEMETRY_CONVERSION_RECORDED',
    entity: 'conversion_event',
    entityId: 'result.id',
  })
  @Post('conversion-events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar evento de conversión con atribución' })
  recordConversion(
    @Body() dto: CreateConversionEventDto,
  ): Promise<ConversionEventResponseDto> {
    return this.events.recordConversion(dto);
  }

  /** UC-28-13. */
  @Audited({
    action: 'SESSION_JOURNEY_CLOSED',
    entity: 'session_journey',
    entityId: 'param:id',
  })
  @Post('session-journeys/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar journey de sesión y consolidar métricas' })
  closeJourney(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseJourneyDto,
  ): Promise<JourneyResponseDto> {
    return this.events.closeJourney(id, dto);
  }
}
