import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { GeoTrackedSubjectsService } from '../services';
import {
  CreateTrackedSubjectDto,
  TrackedSubjectResponseDto,
  IngestPingsDto,
  IngestPingsResultDto,
  LastPositionResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints sobre `/geo/tracked-subjects`. Capa fina: valida parámetros y delega
 * en el servicio de dominio.
 */
@ApiTags('geo-tracked-subjects')
@ApiBearerAuth()
@Controller('geo/tracked-subjects')
export class GeoTrackedSubjectsController {
  constructor(private readonly service: GeoTrackedSubjectsService) {}

  /** UC-13-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta de sujeto rastreado con consentimiento de ubicación',
  })
  enroll(
    @Body() dto: CreateTrackedSubjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TrackedSubjectResponseDto> {
    return this.service.enroll(dto, actor);
  }

  /** UC-13-03. */
  @Post(':id/pings')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingerir un batch de pings de ubicación de alta frecuencia',
  })
  ingestPings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IngestPingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IngestPingsResultDto> {
    return this.service.ingestPings(id, dto, actor);
  }

  /** UC-13-09. */
  @Get(':id/last-position')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Consultar la última posición conocida del sujeto' })
  lastPosition(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LastPositionResponseDto> {
    return this.service.lastPosition(id);
  }

  /** UC-13-10. */
  @Post(':id/revoke-consent')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar consentimiento de ubicación y pausar el rastreo',
  })
  revokeConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.revokeConsent(id, actor);
  }
}
