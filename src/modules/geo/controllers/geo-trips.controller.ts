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
import { GeoTripsService } from '../services';
import { StartTripDto, CloseTripDto, TripResponseDto } from '../dto';

/**
 * Endpoints sobre `/geo/trips`: iniciar y cerrar viajes. Capa fina: delega.
 */
@ApiTags('geo-trips')
@ApiBearerAuth()
@Controller('geo/trips')
export class GeoTripsController {
  constructor(private readonly service: GeoTripsService) {}

  /** UC-13-06. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar un viaje (trip)' })
  start(
    @Body() dto: StartTripDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TripResponseDto> {
    return this.service.start(dto, actor);
  }

  /** UC-13-07. */
  @Post(':id/close')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar un viaje con distancia/duración' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseTripDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TripResponseDto> {
    return this.service.close(id, dto, actor);
  }
}
