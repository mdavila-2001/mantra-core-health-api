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
import { PractitionerAccessRequestsService } from '../services';
import {
  DecidePractitionerAccessRequestDto,
  PractitionerAccessRequestResponseDto,
  RequestPractitionerAccessDto,
} from '../dto';

/**
 * FT-07-R05/R06/R07 — el vínculo médico-paciente por consentimiento.
 * Capa fina: valida y delega en `PractitionerAccessRequestsService`.
 */
@ApiTags('consent-practitioner-access')
@ApiBearerAuth()
@Controller('consent/practitioner-access-requests')
export class PractitionerAccessRequestsController {
  constructor(private readonly service: PractitionerAccessRequestsService) {}

  /** FT-07-R05: el profesional pide acceso tras encontrar al paciente. */
  @Post()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Pedir acceso al expediente de un paciente encontrado en la búsqueda',
  })
  request(
    @Body() dto: RequestPractitionerAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto> {
    return this.service.request(dto, actor);
  }

  /** FT-07-R06: lo que el paciente logueado tiene pendiente de decidir. */
  @Get('mine')
  @Roles('PATIENT')
  @ApiOperation({
    summary: 'Mis solicitudes de vínculo pendientes de decisión',
  })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto[]> {
    return this.service.listMineAsPatient(actor);
  }

  /** FT-07-R05/R06/R07: el paciente decide, eligiendo qué áreas autoriza. */
  @Post(':id/decision')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Aceptar (con las especialidades autorizadas) o rechazar la solicitud',
  })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecidePractitionerAccessRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerAccessRequestResponseDto> {
    return this.service.decide(id, dto, actor);
  }
}
