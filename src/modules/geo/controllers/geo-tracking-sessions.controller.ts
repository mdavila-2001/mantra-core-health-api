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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { GeoTrackingSessionsService } from '../services';
import { StartTrackingSessionDto, TrackingSessionResponseDto } from '../dto';

/**
 * Endpoints sobre `/geo/tracking-sessions`. Capa fina: delega en el servicio.
 */
@ApiTags('geo-tracking-sessions')
@ApiBearerAuth()
@Controller('geo/tracking-sessions')
export class GeoTrackingSessionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: GeoTrackingSessionsService) {}

  /** UC-13-02. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar una sesión de tracking de un sujeto' })
  start(
    @Body() dto: StartTrackingSessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackingSessionResponseDto> {
    return this.service.start(dto, actor);
  }

  /** UC-13-08. */
  @Post(':id/close')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una sesión de tracking' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackingSessionResponseDto> {
    return this.service.close(id, actor);
  }
}
