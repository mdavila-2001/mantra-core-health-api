import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../../common';
import { PractitionerAdmissionsReadService } from '../../application/services/practitioner-admissions-read.service';
import { PractitionerAdmissionsService } from '../../application/services/practitioner-admissions.service';
import { OwnAdmissionDto } from '../dto/admissions.dto';
import { RequestIdParam } from './admissions.controller';

/**
 * La verificación del propio médico: ve su estado y qué falta, reenvía o retira.
 *
 * Todas las rutas son `me`: el sujeto sale de la sesión, nunca del cuerpo ni de
 * la URL, así que nadie lee ni mueve la admisión de otro. **Sin `@Roles`**, como
 * el resto de las rutas `me` del módulo; el filtro real es tener perfil
 * profesional.
 */
@ApiTags('profiles-practitioner-admission')
@ApiBearerAuth()
@Controller('profiles/practitioners/me/admission')
export class OwnAdmissionController {
  constructor(
    private readonly reads: PractitionerAdmissionsReadService,
    private readonly admissions: PractitionerAdmissionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de mi verificación',
    description: 'Estados, qué falta y los mensajes dirigidos al médico. Nada del personal.',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  get(@CurrentUser() actor: AuthenticatedUser): Promise<OwnAdmissionDto> {
    return this.reads.own(actor);
  }

  @Post('resubmit')
  @HttpCode(HttpStatus.OK)
  @Audited({ action: 'ADMISSION_RESUBMITTED', entity: 'practitioner_admission' })
  @ApiOperation({
    summary: 'Reenviar mi solicitud',
    description: 'Sólo desde INFORMACION_REQUERIDA, RECHAZADA, EXPIRADA o ABANDONADA, con tope de reenvíos.',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  resubmit(
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<OwnAdmissionDto> {
    return this.admissions.resubmit(actor, requestId);
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @Audited({ action: 'ADMISSION_WITHDRAWN', entity: 'practitioner_admission' })
  @ApiOperation({ summary: 'Retirar mi solicitud (ENVIADA o INFORMACION_REQUERIDA)' })
  @ApiOkResponse({ type: OwnAdmissionDto })
  withdraw(
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<OwnAdmissionDto> {
    return this.admissions.withdraw(actor, requestId);
  }
}
