import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { GeoGeofencesService } from '../services';
import {
  CreateGeofenceDto,
  GeofenceResponseDto,
  RecordGeofenceEventDto,
  GeofenceEventResponseDto,
} from '../dto';

/**
 * Endpoints de geofences: definición (`/geo/geofences`) y eventos de cruce
 * (`/geo/geofence-events`, emitidos por el worker). Capa fina: delega.
 */
@ApiTags('geo-geofences')
@ApiBearerAuth()
@Controller('geo')
export class GeoGeofencesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: GeoGeofencesService) {}

  /** UC-13-04. */
  @Audited({
    action: 'GEOFENCE_DEFINED',
    entity: 'geofence',
    entityId: 'result.id',
  })
  @Post('geofences')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir y activar un geofence (circle o polygon)' })
  define(
    @Body() dto: CreateGeofenceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GeofenceResponseDto> {
    return this.service.define(dto, actor);
  }

  /** UC-13-05. */
  @Audited({
    action: 'GEOFENCE_EVENT_RECORDED',
    entity: 'geofence_event',
    entityId: 'result.id',
  })
  @Post('geofence-events')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un evento de entrada/salida de geofence',
  })
  recordEvent(
    @Body() dto: RecordGeofenceEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GeofenceEventResponseDto> {
    return this.service.recordEvent(dto, actor);
  }
}
