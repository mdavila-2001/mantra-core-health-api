import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  constructor(private readonly service: GeoGeofencesService) {}

  /** UC-13-04. */
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
  @Post('geofence-events')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un evento de entrada/salida de geofence' })
  recordEvent(
    @Body() dto: RecordGeofenceEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GeofenceEventResponseDto> {
    return this.service.recordEvent(dto, actor);
  }
}
